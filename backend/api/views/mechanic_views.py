# api/views/mechanic_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from api.models import Staff, QueueEntry, Booking, InventoryItem, RestockRequest, InventoryTransaction
from api.serializers.mechanic_serializers import *
from api.permissions import IsMechanicPermission  # You'll need to create this


class MechanicDashboardView(APIView):
    """
    Dashboard view for mechanics showing:
    - Today's assigned jobs
    - Active job details
    - Weekly statistics
    - Notifications
    """
    permission_classes = [IsAuthenticated, IsMechanicPermission]
    
    def get(self, request):
        # Get mechanic profile
        mechanic = Staff.objects.filter(user=request.user, role='Employee').first()
        
        if not mechanic:
            return Response(
                {'error': 'User is not a mechanic'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        today = timezone.now().date()
        today_start = timezone.make_aware(
            timezone.datetime.combine(today, timezone.datetime.min.time())
        )
        today_end = timezone.make_aware(
            timezone.datetime.combine(today, timezone.datetime.max.time())
        )
        
        # Today's jobs
        today_jobs = QueueEntry.objects.filter(
            assigned_employee=mechanic,
            queued_at__date=today
        )
        
        # Active job
        active_job = QueueEntry.objects.filter(
            assigned_employee=mechanic,
            status='in_service'
        ).first()
        
        # This week's stats
        week_start = today - timedelta(days=today.weekday())
        week_jobs = QueueEntry.objects.filter(
            assigned_employee=mechanic,
            completed_at__gte=week_start,
            status='done'
        )
        
        # Performance metrics (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        completed_jobs = QueueEntry.objects.filter(
            assigned_employee=mechanic,
            status='done',
            completed_at__gte=thirty_days_ago
        )
        
        # Calculate average completion time
        avg_completion_time = None
        completed_with_times = completed_jobs.exclude(
            service_started_at__isnull=True
        ).exclude(
            completed_at__isnull=True
        )
        
        if completed_with_times.exists():
            total_time = sum(
                (job.completed_at - job.service_started_at).total_seconds() / 3600
                for job in completed_with_times
            )
            avg_completion_time = round(total_time / completed_with_times.count(), 1)
        
        # Customer ratings for mechanic's jobs
        ratings = Rating.objects.filter(
            booking__queue_entry__assigned_employee=mechanic,
            created_at__gte=thirty_days_ago
        )
        
        avg_rating = ratings.aggregate(Avg('score'))['score__avg']
        
        stats = {
            'today_jobs': {
                'total': today_jobs.count(),
                'completed': today_jobs.filter(status='done').count(),
                'in_progress': today_jobs.filter(status='in_service').count(),
                'pending': today_jobs.filter(status='waiting').count()
            },
            'active_job': MechanicJobSerializer(active_job).data if active_job else None,
            'week_stats': {
                'completed': week_jobs.count(),
                'total_revenue': week_jobs.aggregate(Sum('price'))['price__sum'] or 0
            },
            'performance_metrics': {
                'avg_completion_time_hours': avg_completion_time,
                'avg_rating': round(avg_rating, 1) if avg_rating else None,
                'total_jobs_30d': completed_jobs.count(),
                'total_revenue_30d': completed_jobs.aggregate(Sum('price'))['price__sum'] or 0
            }
        }
        
        # Generate notifications
        notifications = self._get_notifications(mechanic, today_jobs, active_job)
        
        return Response({
            'mechanic': MechanicProfileSerializer(mechanic).data,
            'stats': MechanicDashboardStatsSerializer(stats).data,
            'today_schedule': MechanicJobSerializer(today_jobs, many=True).data,
            'notifications': MechanicNotificationSerializer(notifications, many=True).data
        })
    
    def _get_notifications(self, mechanic, today_jobs, active_job):
        """Generate relevant notifications for mechanic"""
        notifications = []
        
        # Check for overdue jobs
        overdue_jobs = today_jobs.filter(
            status='waiting',
            queued_at__lt=timezone.now() - timedelta(hours=1)
        )
        
        if overdue_jobs.exists():
            notifications.append({
                'title': 'Overdue Jobs',
                'message': f'You have {overdue_jobs.count()} job(s) waiting for over an hour',
                'type': 'warning',
                'created_at': timezone.now(),
                'read': False
            })
        
        # Check active job duration
        if active_job and active_job.service_started_at:
            elapsed = timezone.now() - active_job.service_started_at
            if elapsed > timedelta(hours=2):
                notifications.append({
                    'title': 'Job Taking Longer',
                    'message': f'{active_job.service} is taking longer than expected',
                    'type': 'warning',
                    'created_at': timezone.now(),
                    'read': False
                })
        
        # Check for new assignments
        new_jobs = today_jobs.filter(
            status='waiting',
            queued_at__gte=timezone.now() - timedelta(hours=1)
        )
        
        if new_jobs.exists():
            notifications.append({
                'title': 'New Jobs Assigned',
                'message': f'You have {new_jobs.count()} new job(s) waiting',
                'type': 'info',
                'created_at': timezone.now(),
                'read': False
            })
        
        return notifications


class MechanicJobsView(APIView):
    """
    View for mechanics to see their assigned jobs
    Supports filtering by status
    """
    permission_classes = [IsAuthenticated, IsMechanicPermission]
    
    def get(self, request):
        mechanic = Staff.objects.filter(user=request.user, role='Employee').first()
        
        if not mechanic:
            return Response(
                {'error': 'User is not a mechanic'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get query parameters
        status_filter = request.query_params.get('status')
        date_filter = request.query_params.get('date')
        
        # Base queryset
        jobs = QueueEntry.objects.filter(assigned_employee=mechanic)
        
        # Apply filters
        if status_filter:
            jobs = jobs.filter(status=status_filter)
        
        if date_filter:
            try:
                filter_date = timezone.datetime.strptime(date_filter, '%Y-%m-%d').date()
                jobs = jobs.filter(queued_at__date=filter_date)
            except ValueError:
                pass
        
        # Order by position and queued time
        jobs = jobs.order_by('position', 'queued_at')
        
        serializer = MechanicJobSerializer(jobs, many=True)
        return Response({
            'count': jobs.count(),
            'results': serializer.data
        })


class MechanicJobDetailView(APIView):
    """
    Detailed view for a specific job assigned to the mechanic
    """
    permission_classes = [IsAuthenticated, IsMechanicPermission]
    
    def get(self, request, pk):
        mechanic = Staff.objects.filter(user=request.user, role='Employee').first()
        
        if not mechanic:
            return Response(
                {'error': 'User is not a mechanic'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            job = QueueEntry.objects.get(
                id=pk,
                assigned_employee=mechanic
            )
        except QueueEntry.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = MechanicJobDetailSerializer(job)
        return Response(serializer.data)


class MechanicJobActionView(APIView):
    """
    Handle actions on jobs: start, complete, pause, resume
    """
    permission_classes = [IsAuthenticated, IsMechanicPermission]
    
    def post(self, request, pk):
        mechanic = Staff.objects.filter(user=request.user, role='Employee').first()
        
        if not mechanic:
            return Response(
                {'error': 'User is not a mechanic'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            job = QueueEntry.objects.get(
                id=pk,
                assigned_employee=mechanic
            )
        except QueueEntry.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = MechanicJobActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        
        try:
            if action == 'start':
                result = self._start_job(job, notes)
            elif action == 'complete':
                result = self._complete_job(job, notes, request)
            elif action == 'pause':
                result = self._pause_job(job, notes)
            elif action == 'resume':
                result = self._resume_job(job, notes)
            else:
                return Response(
                    {'error': 'Invalid action'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response(result)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _start_job(self, job, notes):
        """Start a job"""
        if job.status != 'waiting':
            raise Exception('Job is not in waiting status')
        
        job.status = 'in_service'
        job.service_started_at = timezone.now()
        job.save()
        
        # Update booking if exists
        if job.booking:
            job.booking.status = 'in_progress'
            job.booking.save()
        
        return {
            'message': 'Job started successfully',
            'job_id': job.id,
            'status': job.status
        }
    
    def _complete_job(self, job, notes, request):
        """Complete a job"""
        if job.status != 'in_service':
            raise Exception('Job is not in service')
        
        job.status = 'done'
        job.completed_at = timezone.now()
        
        # Add completion notes if provided
        if notes:
            job.notes = (job.notes + '\n\n' + notes) if job.notes else notes
        
        job.save()
        
        # Update booking
        if job.booking:
            job.booking.status = 'done'
            job.booking.save()
        
        return {
            'message': 'Job completed successfully',
            'job_id': job.id,
            'status': job.status
        }
    
    def _pause_job(self, job, notes):
        """Pause a job (optional feature)"""
        # You might want to add a paused status
        # For now, just return success
        return {
            'message': 'Job paused',
            'job_id': job.id
        }
    
    def _resume_job(self, job, notes):
        """Resume a paused job"""
        # You might want to add a paused status
        return {
            'message': 'Job resumed',
            'job_id': job.id
        }


class MechanicPartsRequestView(APIView):
    """
    Allow mechanics to request parts for a job
    """
    permission_classes = [IsAuthenticated, IsMechanicPermission]
    
    def post(self, request, job_id):
        mechanic = Staff.objects.filter(user=request.user, role='Employee').first()
        
        if not mechanic:
            return Response(
                {'error': 'User is not a mechanic'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verify job belongs to mechanic
        try:
            job = QueueEntry.objects.get(id=job_id, assigned_employee=mechanic)
        except QueueEntry.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = PartRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        part_id = serializer.validated_data['inventory_item_id']
        quantity = serializer.validated_data['quantity']
        notes = serializer.validated_data.get('notes', '')
        
        try:
            inventory_item = InventoryItem.objects.get(
                id=part_id,
                branch=mechanic.branch,
                is_active=True
            )
        except InventoryItem.DoesNotExist:
            return Response(
                {'error': 'Part not found in your branch inventory'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if enough stock
        if inventory_item.quantity < quantity:
            return Response(
                {'error': f'Insufficient stock. Available: {inventory_item.quantity}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create restock request (or part request)
        restock_request = RestockRequest.objects.create(
            inventory_item=inventory_item,
            branch=mechanic.branch,
            requested_by=mechanic,
            quantity_requested=quantity,
            notes=f"Job #{job.id}: {notes}" if notes else f"Job #{job.id}"
        )
        
        # For immediate approval by manager? Or create a separate part request system?
        
        return Response({
            'message': 'Parts request submitted successfully',
            'request_id': restock_request.id,
            'part': {
                'name': inventory_item.name,
                'quantity': quantity
            }
        })


class MechanicJobReportView(APIView):
    """
    Submit detailed job completion report
    """
    permission_classes = [IsAuthenticated, IsMechanicPermission]
    
    def post(self, request, pk):
        mechanic = Staff.objects.filter(user=request.user, role='Employee').first()
        
        if not mechanic:
            return Response(
                {'error': 'User is not a mechanic'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            job = QueueEntry.objects.get(id=pk, assigned_employee=mechanic)
        except QueueEntry.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Job must be completed to submit report
        if job.status != 'done':
            return Response(
                {'error': 'Job must be completed before submitting report'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = JobReportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Add report data to job notes
        report = serializer.validated_data
        report_text = f"""
        === JOB COMPLETION REPORT ===
        Work Performed: {report['work_performed']}
        Labor Hours: {report['labor_hours']}
        Parts Used: {', '.join([f"{p['name']} x{p['quantity']}" for p in report['parts_used']])}
        Additional Notes: {report.get('additional_notes', 'N/A')}
        """
        
        job.notes = (job.notes + '\n\n' + report_text) if job.notes else report_text
        job.save()
        
        # Process parts used - deduct from inventory
        for part in report['parts_used']:
            try:
                inventory_item = InventoryItem.objects.get(
                    id=part['inventory_item_id'],
                    branch=mechanic.branch
                )
                
                old_quantity = inventory_item.quantity
                inventory_item.quantity -= part['quantity']
                inventory_item.save()
                
                # Log transaction
                InventoryTransaction.objects.create(
                    inventory_item=inventory_item,
                    action_type='update',
                    quantity_before=old_quantity,
                    quantity_after=inventory_item.quantity,
                    quantity_changed=-part['quantity'],
                    branch_name=mechanic.branch.name if mechanic.branch else '',
                    performed_by=mechanic,
                    notes=f"Used in job #{job.id}: {part.get('notes', '')}"
                )
                
            except InventoryItem.DoesNotExist:
                # Log error but continue
                pass
        
        return Response({
            'message': 'Job report submitted successfully',
            'job_id': job.id
        })


class MechanicAvailabilityView(APIView):
    """
    Update mechanic's availability status
    """
    permission_classes = [IsAuthenticated, IsMechanicPermission]
    
    def post(self, request):
        mechanic = Staff.objects.filter(user=request.user, role='Employee').first()
        
        if not mechanic:
            return Response(
                {'error': 'User is not a mechanic'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        status_value = request.data.get('status')
        if not status_value:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = ['Active', 'On Break', 'Off Duty']
        if status_value not in valid_statuses:
            return Response(
                {'error': f'Status must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mechanic.status = status_value
        mechanic.save()
        
        return Response({
            'message': 'Availability status updated',
            'status': mechanic.status
        })
    
# Add these new views to your existing api/views/mechanic_views.py

class MechanicScheduleWeekView(APIView):
    """
    Get weekly schedule for the mechanic
    """
    permission_classes = [IsAuthenticated, IsMechanicPermission]
    
    def get(self, request):
        mechanic = Staff.objects.filter(user=request.user, role='Employee').first()
        
        if not mechanic:
            return Response(
                {'error': 'User is not a mechanic'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get current date or date from query param
        date_str = request.query_params.get('date')
        if date_str:
            try:
                current_date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                current_date = timezone.now().date()
        else:
            current_date = timezone.now().date()
        
        # Get the start of the week (Monday)
        start_of_week = current_date - timedelta(days=current_date.weekday())
        
        # Generate weekly schedule for 7 days
        weekly_schedule = []
        for i in range(7):
            day_date = start_of_week + timedelta(days=i)
            
            # Get jobs for this day
            day_jobs = QueueEntry.objects.filter(
                assigned_employee=mechanic,
                queued_at__date=day_date,
                status__in=['waiting', 'in_service', 'done']
            )
            
            # Calculate working hours based on jobs
            working_hours = self._calculate_working_hours(day_jobs)
            
            weekly_schedule.append({
                'day': day_date.strftime('%A'),
                'date': day_date.strftime('%b %d'),
                'jobs': day_jobs.count(),
                'hours': working_hours,
                'jobs_list': MechanicJobSerializer(day_jobs, many=True).data
            })
        
        return Response({
            'weekly_schedule': weekly_schedule,
            'current_week_start': start_of_week.strftime('%Y-%m-%d'),
            'current_week_end': (start_of_week + timedelta(days=6)).strftime('%Y-%m-%d')
        })
    
    def _calculate_working_hours(self, jobs):
        """Calculate working hours based on jobs"""
        if not jobs.exists():
            return "Day Off"
        
        # Get earliest start time
        earliest_start = min([j.queued_at for j in jobs if j.queued_at], default=None)
        # Get latest end time
        latest_end = max([j.completed_at for j in jobs if j.completed_at], default=None)
        
        if earliest_start and latest_end:
            start_time = earliest_start.strftime('%I:%M %p')
            end_time = latest_end.strftime('%I:%M %p')
            return f"{start_time} - {end_time}"
        elif earliest_start:
            return f"Starts at {earliest_start.strftime('%I:%M %p')}"
        
        return "Flexible Hours"


class MechanicScheduleDayView(APIView):
    """
    Get daily schedule for a specific date
    """
    permission_classes = [IsAuthenticated, IsMechanicPermission]
    
    def get(self, request):
        mechanic = Staff.objects.filter(user=request.user, role='Employee').first()
        
        if not mechanic:
            return Response(
                {'error': 'User is not a mechanic'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get date from query param
        date_str = request.query_params.get('date')
        if date_str:
            try:
                target_date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            target_date = timezone.now().date()
        
        # Get jobs for the selected date
        jobs = QueueEntry.objects.filter(
            assigned_employee=mechanic,
            queued_at__date=target_date
        ).order_by('queued_at')
        
        # Build daily schedule
        daily_schedule = []
        
        # Add jobs
        for job in jobs:
            daily_schedule.append({
                'id': job.id,
                'time': job.queued_at.strftime('%I:%M %p'),
                'customer_name': job.customer_name,
                'vehicle': job.vehicle,
                'plate_number': job.plate_number,
                'service': job.service,
                'duration': self._calculate_duration(job),
                'status': job.status,
                'notes': job.notes,
                'price': job.price,
                'payment_status': job.payment_status
            })
        
        # Add break times (if needed)
        break_times = self._get_break_times(jobs, target_date)
        daily_schedule.extend(break_times)
        
        # Sort by time
        daily_schedule.sort(key=lambda x: x['time'])
        
        return Response({
            'daily_schedule': daily_schedule,
            'date': target_date.strftime('%Y-%m-%d'),
            'total_jobs': jobs.count(),
            'completed_jobs': jobs.filter(status='done').count(),
            'pending_jobs': jobs.filter(status='waiting').count(),
            'in_progress': jobs.filter(status='in_service').count()
        })
    
    def _calculate_duration(self, job):
        """Calculate job duration"""
        if job.service_started_at and job.completed_at:
            duration = job.completed_at - job.service_started_at
            hours = duration.total_seconds() / 3600
            if hours < 1:
                minutes = int(duration.total_seconds() / 60)
                return f"{minutes} mins"
            elif hours == 1:
                return "1 hour"
            else:
                return f"{hours:.1f} hours"
        return "Not started"
    
    def _get_break_times(self, jobs, date):
        """Get break times based on schedule"""
        breaks = []
        
        # Check for lunch break if jobs span lunch time
        lunch_start = timezone.datetime.combine(date, timezone.datetime.strptime('12:00', '%H:%M').time())
        lunch_end = timezone.datetime.combine(date, timezone.datetime.strptime('13:00', '%H:%M').time())
        
        has_job_during_lunch = jobs.filter(
            queued_at__time__range=('12:00', '13:00')
        ).exists()
        
        if not has_job_during_lunch:
            breaks.append({
                'id': 'lunch_break',
                'time': '12:00 PM',
                'customer_name': None,
                'vehicle': None,
                'plate_number': None,
                'service': 'Lunch Break',
                'duration': '1 hour',
                'status': 'break',
                'notes': 'Scheduled lunch break',
                'price': 0,
                'payment_status': None
            })
        
        return breaks


class MechanicCalendarView(APIView):
    """
    Get calendar data for the month
    """
    permission_classes = [IsAuthenticated, IsMechanicPermission]
    
    def get(self, request):
        mechanic = Staff.objects.filter(user=request.user, role='Employee').first()
        
        if not mechanic:
            return Response(
                {'error': 'User is not a mechanic'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get month and year from query params
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))
        
        # Get first day of month
        first_day = timezone.datetime(year, month, 1).date()
        
        # Get last day of month
        if month == 12:
            last_day = timezone.datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            last_day = timezone.datetime(year, month + 1, 1).date() - timedelta(days=1)
        
        # Get all jobs for the mechanic in this month
        jobs_in_month = QueueEntry.objects.filter(
            assigned_employee=mechanic,
            queued_at__date__gte=first_day,
            queued_at__date__lte=last_day
        )
        
        # Get dates with jobs
        dates_with_jobs = jobs_in_month.values_list('queued_at__date', flat=True).distinct()
        
        # Build calendar days
        calendar_days = []
        current_date = first_day
        
        # Add padding for days before month starts
        start_weekday = first_day.weekday()
        for _ in range(start_weekday):
            calendar_days.append({'day': None, 'date': None, 'hasJobs': False})
        
        # Add days of the month
        while current_date <= last_day:
            has_jobs = current_date in dates_with_jobs
            calendar_days.append({
                'day': current_date.day,
                'date': current_date.strftime('%Y-%m-%d'),
                'hasJobs': has_jobs,
                'job_count': jobs_in_month.filter(queued_at__date=current_date).count()
            })
            current_date += timedelta(days=1)
        
        return Response({
            'calendar_days': calendar_days,
            'current_month': first_day.strftime('%B %Y'),
            'year': year,
            'month': month,
            'available_dates': [d.strftime('%Y-%m-%d') for d in dates_with_jobs]
        })