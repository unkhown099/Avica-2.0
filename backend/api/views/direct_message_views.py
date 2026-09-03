from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from api.models import DirectMessage, Customer, Staff, QueueEntry
from api.serializers.direct_message_serializer import DirectMessageSerializer
from better_profanity import profanity

profanity.load_censor_words()

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def direct_messages_view(request, partner_id=None):
    user = request.user
    
    is_customer = hasattr(user, 'customer_profile')
    is_staff_user = hasattr(user, 'staff_profile') and (
        user.staff_profile.role in ['Employee', 'Staff', 'Branch Manager', 'Admin', 'super_admin', 'Business Owner']
        or user.is_staff or user.is_superuser
    )
    
    if not (is_customer or is_staff_user):
        return Response({"error": "Only authenticated customers and staff members can use messenger."}, status=status.HTTP_403_FORBIDDEN)
        
    if request.method == "GET":
        if is_customer:
            messages = DirectMessage.objects.filter(
                customer=user.customer_profile,
                employee_id=partner_id
            ).order_by("created_at")
        else:
            messages = DirectMessage.objects.filter(
                employee=user.staff_profile,
                customer_id=partner_id
            ).order_by("created_at")
                
        serializer = DirectMessageSerializer(messages, many=True)
        return Response(serializer.data)
        
    elif request.method == "POST":
        message_text = request.data.get("message", "").strip()
        
        # VALIDATION
        if not message_text:
            return Response({"error": "Message cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
            
        if len(message_text) > 2000:
            return Response({"error": "Message is too long (max 2000 characters)."}, status=status.HTTP_400_BAD_REQUEST)
            
        if profanity.contains_profanity(message_text):
            return Response({"error": "Please maintain professional language. Your message contains profanity."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not partner_id:
            return Response({"error": "partner_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        if is_customer:
            try:
                employee = Staff.objects.get(id=partner_id)
            except Staff.DoesNotExist:
                return Response({"error": "Staff member not found."}, status=status.HTTP_404_NOT_FOUND)
                
            msg = DirectMessage.objects.create(
                customer=user.customer_profile,
                employee=employee,
                sender_type="customer",
                message=message_text
            )
        else:
            try:
                customer = Customer.objects.get(id=partner_id)
            except Customer.DoesNotExist:
                return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)
                
            msg = DirectMessage.objects.create(
                customer=customer,
                employee=user.staff_profile,
                sender_type="employee",
                message=message_text
            )
            
        serializer = DirectMessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def direct_message_contacts_view(request):
    user = request.user
    is_customer = hasattr(user, 'customer_profile')
    is_staff_user = hasattr(user, 'staff_profile') and (
        user.staff_profile.role in ['Employee', 'Staff', 'Branch Manager', 'Admin', 'super_admin', 'Business Owner']
        or user.is_staff or user.is_superuser
    )
    
    if not (is_customer or is_staff_user):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
    contacts = []
    
    if is_customer:
        customer_prof = user.customer_profile
        # 1. Employees they have message history with
        messaged_emp_ids = set(DirectMessage.objects.filter(customer=customer_prof).values_list('employee_id', flat=True))
        
        # 2. Employees from ALL their queue entries (past or present)
        handled_emps = QueueEntry.objects.filter(
            customer_user=user, 
            assigned_employee__isnull=False
        ).values_list('assigned_employee_id', flat=True)
        messaged_emp_ids.update(handled_emps)
        
        # Also include all active branch staff so customer can message them
        all_active_staff = Staff.objects.filter(status="Active").values_list('id', flat=True)
        messaged_emp_ids.update(all_active_staff)
        
        employees = Staff.objects.filter(id__in=[e for e in messaged_emp_ids if e])
        
        for emp in employees:
            contacts.append({
                "id": emp.id,
                "name": f"{emp.first_name} {emp.last_name}",
                "role": emp.role,
                "type": "employee"
            })
            
    elif is_staff_user:
        emp_prof = user.staff_profile
        # 1. Customers they have message history with
        messaged_cust_ids = set(DirectMessage.objects.filter(employee=emp_prof).values_list('customer_id', flat=True))
        
        # 2. Customers for ALL queue entries they handled
        handled_custs = QueueEntry.objects.filter(
            assigned_employee=emp_prof,
            customer_user__isnull=False
        ).values_list('customer_user__customer_profile__id', flat=True)
        messaged_cust_ids.update(handled_custs)
        
        # Also include customers with active bookings at their branch
        if emp_prof.branch_id:
            branch_custs = Booking.objects.filter(
                branch_id=emp_prof.branch_id,
                user__customer_profile__isnull=False
            ).values_list('user__customer_profile__id', flat=True)
            messaged_cust_ids.update(branch_custs)
            
        # Fallback to all customers if empty
        if not messaged_cust_ids:
            messaged_cust_ids = set(Customer.objects.values_list('id', flat=True)[:20])
            
        customers = Customer.objects.filter(id__in=[c for c in messaged_cust_ids if c])
        
        for cust in customers:
            contacts.append({
                "id": cust.id,
                "name": f"{cust.first_name} {cust.last_name}",
                "role": "Customer",
                "type": "customer"
            })
            
    return Response(contacts)
