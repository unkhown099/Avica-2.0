from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from ..models import Service, ServiceCategory, Branch, Staff, QueueEntry, Booking
from ..serializers.service_serializer import ServiceSerializer
from ..serializers.service_category_serializer import ServiceCategorySerializer
from ..permissions import IsAdminOrBusinessOwner


def _is_catalog_admin(user):
    """Helper to check if user has global service catalog management authority."""
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_superuser", False):
        return True
    try:
        return user.staff_profile.role in {"Admin", "Business Owner", "super_admin", "Super Admin"}
    except AttributeError:
        return False


class ServiceCategoryListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdminOrBusinessOwner()]

    def get(self, request):
        qs = ServiceCategory.objects.filter(is_active=True).order_by("name")
        serializer = ServiceCategorySerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ServiceCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdminOrBusinessOwner()]

    def get(self, request):
        category = request.query_params.get("category")
        branch_param = request.query_params.get("branch")
        search   = request.query_params.get("search")

        qs = Service.objects.prefetch_related("branches").all()

        # Non-admins only see active services
        if not _is_catalog_admin(request.user):
            qs = qs.filter(is_active=True)

        if category:
            qs = qs.filter(category=category)

        if branch_param and branch_param.strip() not in {"", "All Branches", "all"}:
            branch_str = branch_param.strip()
            if branch_str.isdigit():
                branch_id = int(branch_str)
                if not Branch.objects.filter(id=branch_id).exists():
                    return Response(
                        {"detail": f"Branch with id {branch_id} does not exist."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                qs = qs.filter(branches__id=branch_id)
            else:
                qs = qs.filter(branches__name__iexact=branch_str)

        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        serializer = ServiceSerializer(qs.distinct(), many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ServiceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ("GET", "PATCH"):
            return [IsAuthenticated()]
        return [IsAdminOrBusinessOwner()]

    def get_object(self, pk):
        try:
            return Service.objects.prefetch_related("branches").get(pk=pk)
        except Service.DoesNotExist:
            return None

    def get(self, request, pk):
        service = self.get_object(pk)
        if not service:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        # Non-admins cannot inspect inactive services
        if not service.is_active and not _is_catalog_admin(request.user):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ServiceSerializer(service).data)

    def patch(self, request, pk):
        service = self.get_object(pk)
        if not service:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_admin = _is_catalog_admin(user)

        # Look up role and branch from Staff profile
        staff = getattr(user, "staff_profile", None)
        user_role = getattr(staff, "role", None)
        is_manager = user_role == "Branch Manager"

        # Managers may only update branch availability for their own assigned branch
        if is_manager and not is_admin:
            if not staff or not staff.branch:
                return Response(
                    {"detail": "Branch Manager has no assigned branch."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Reject any fields other than branch_ids
            disallowed_fields = [k for k in request.data.keys() if k != "branch_ids"]
            if disallowed_fields:
                return Response(
                    {"detail": "Branch Managers may only update branch availability."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            branch_ids = request.data.get("branch_ids")
            if branch_ids is None or not isinstance(branch_ids, list):
                return Response(
                    {"detail": "branch_ids must be a list of integers."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                submitted_ids = set(int(b) for b in branch_ids)
            except (ValueError, TypeError):
                return Response(
                    {"detail": "All branch IDs must be valid integers."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            mgr_branch_id = staff.branch.id
            current_ids = set(service.branches.values_list("id", flat=True))

            # Branch isolation check: changes to any branch other than manager's are forbidden
            if (current_ids - {mgr_branch_id}) != (submitted_ids - {mgr_branch_id}):
                return Response(
                    {"detail": "Branch Managers can only modify availability for their assigned branch."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Apply availability toggle
            if mgr_branch_id in submitted_ids:
                service.branches.add(staff.branch)
            else:
                service.branches.remove(staff.branch)

            return Response(ServiceSerializer(service).data)

        # Non-admins cannot patch anything
        if not is_admin:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ServiceSerializer(service, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        service = self.get_object(pk)
        if not service:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        service.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class Top10ServicesView(APIView):
    """
    Returns the Top 10 most demanded services based on actual completed and paid transactions.
    Supports filtering by branch (numeric branch ID) and period (all, month, year).
    Excludes cancelled bookings and unpaid requests.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        branch_param = request.query_params.get("branch")
        period = (request.query_params.get("period") or "all").strip().lower()

        qs = QueueEntry.objects.filter(status="done", payment_status="paid")

        # Defensive branch validation
        if branch_param and branch_param.strip() not in {"", "All Branches", "all"}:
            branch_str = branch_param.strip()
            if branch_str.isdigit():
                branch_id = int(branch_str)
                if not Branch.objects.filter(id=branch_id).exists():
                    return Response(
                        {"detail": f"Branch with id {branch_id} does not exist."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                qs = qs.filter(Q(branch_id=branch_id) | Q(booking__branch_id=branch_id))
            else:
                qs = qs.filter(Q(branch__name__iexact=branch_str) | Q(booking__branch__name__iexact=branch_str))

        if period == "month":
            start_date = timezone.now().date().replace(day=1)
            qs = qs.filter(completed_at__date__gte=start_date)
        elif period == "year":
            start_date = timezone.now().date().replace(month=1, day=1)
            qs = qs.filter(completed_at__date__gte=start_date)

        ranked_data = (
            qs.exclude(service__isnull=True)
            .exclude(service="")
            .values("service")
            .annotate(
                completed_count=Count("id"),
                total_revenue=Sum("price"),
                avg_rating=Avg("rating_score"),
            )
            .order_by("-completed_count", "-total_revenue")[:10]
        )

        results = []
        for index, item in enumerate(ranked_data, start=1):
            service_name = item["service"]
            service_obj = Service.objects.prefetch_related("branches").filter(is_active=True, name__iexact=service_name).first()
            if not service_obj:
                service_obj = Service.objects.prefetch_related("branches").filter(is_active=True, name__icontains=service_name).first()

            if service_obj:
                serialized = ServiceSerializer(service_obj).data
            else:
                serialized = {
                    "id": None,
                    "name": service_name,
                    "category": "General",
                    "price_display": f"₱{float(item['total_revenue'] or 0):,}",
                    "price": float(item["total_revenue"] or 0),
                    "duration": "—",
                    "features": [],
                    "image": None,
                }

            results.append({
                "rank": index,
                "service": serialized,
                "completed_count": item["completed_count"],
                "total_revenue": float(item["total_revenue"] or 0),
                "avg_rating": round(float(item["avg_rating"]), 1) if item["avg_rating"] else None,
                "metric": "actual_completed_transactions",
            })

        return Response({
            "period": period,
            "total_ranked": len(results),
            "metric_description": "Ranked by completed and paid service transaction frequency, excluding cancelled bookings",
            "results": results,
        })


class RecommendedServicesView(APIView):
    """
    Returns personalized and data-driven recommended services.
    Uses actual customer history, vehicle profile, and catalog demand.
    Explicitly declares rule-based vs AI methodology.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        branch_param = request.query_params.get("branch")

        catalog_qs = Service.objects.prefetch_related("branches").filter(is_active=True)
        if branch_param and branch_param.strip() not in {"", "All Branches", "all"}:
            branch_str = branch_param.strip()
            if branch_str.isdigit():
                catalog_qs = catalog_qs.filter(branches__id=int(branch_str))
            else:
                catalog_qs = catalog_qs.filter(branches__name__iexact=branch_str)

        all_services = list(catalog_qs)
        if not all_services:
            return Response({
                "is_ai_generated": False,
                "methodology": "Catalog unavailable",
                "recommendations": [],
            })

        user_history = QueueEntry.objects.filter(
            Q(booking__user=user) | Q(customer_user=user),
            status="done",
            payment_status="paid",
        ).order_by("-completed_at")

        history_service_names = set(user_history.values_list("service", flat=True))
        last_service_entry = user_history.first()

        recommendations = []
        seen_service_ids = set()

        # Rule 1: Vehicle Profile / Condition matching
        user_vehicles = Booking.objects.filter(user=user).exclude(vehicle="").values_list("vehicle", flat=True).distinct()
        if user_vehicles:
            recent_vehicle = user_vehicles[0]
            coating_or_detail = [s for s in all_services if "wax" in s.name.lower() or "detail" in s.name.lower() or "coating" in s.name.lower()]
            for s in coating_or_detail:
                if s.id not in seen_service_ids:
                    seen_service_ids.add(s.id)
                    recommendations.append({
                        "service": ServiceSerializer(s).data,
                        "basis": f"Recommended for your registered vehicle ({recent_vehicle}) to protect finish and prolong showroom gloss",
                        "badge": "Vehicle Care",
                        "priority": "high",
                    })
                    break

        # Rule 2: Routine Maintenance Recency
        if last_service_entry and last_service_entry.completed_at:
            days_since = (timezone.now() - last_service_entry.completed_at).days
            if days_since >= 30:
                wash_or_maintenance = [s for s in all_services if s.category in ["Maintenance", "Diagnostic"] or "wash" in s.name.lower()]
                for s in wash_or_maintenance:
                    if s.id not in seen_service_ids:
                        seen_service_ids.add(s.id)
                        recommendations.append({
                            "service": ServiceSerializer(s).data,
                            "basis": f"Routine Maintenance: It has been {days_since} days since your last completed service ({last_service_entry.service})",
                            "badge": "Routine Checkup",
                            "priority": "high",
                        })
                        break

        # Rule 3: Complementary Service discovery
        history_categories = set(
            Service.objects.filter(name__in=history_service_names).values_list("category", flat=True)
        )
        untried_services = [s for s in all_services if s.category not in history_categories and s.id not in seen_service_ids]
        for s in untried_services[:2]:
            seen_service_ids.add(s.id)
            recommendations.append({
                "service": ServiceSerializer(s).data,
                "basis": f"Explore our {s.category} catalog to complement your standard vehicle routine",
                "badge": "Service Discovery",
                "priority": "medium",
            })

        # Rule 4: High-demand / Popular services fallback
        if len(recommendations) < 3:
            top_names = list(
                QueueEntry.objects.filter(status="done", payment_status="paid")
                .values("service")
                .annotate(cnt=Count("id"))
                .order_by("-cnt")
                .values_list("service", flat=True)[:5]
            )
            for name in top_names:
                matching_s = next((s for s in all_services if s.name.lower() == name.lower() and s.id not in seen_service_ids), None)
                if matching_s:
                    seen_service_ids.add(matching_s.id)
                    recommendations.append({
                        "service": ServiceSerializer(matching_s).data,
                        "basis": "Most requested by customers this season with proven customer satisfaction",
                        "badge": "Popular Choice",
                        "priority": "recommended",
                    })
                    if len(recommendations) >= 4:
                        break

        # Rule 5: Fallback to remaining catalog services
        if len(recommendations) < 3:
            for s in all_services:
                if s.id not in seen_service_ids:
                    seen_service_ids.add(s.id)
                    recommendations.append({
                        "service": ServiceSerializer(s).data,
                        "basis": f"Featured {s.category} service tailored for overall vehicle performance",
                        "badge": "Featured",
                        "priority": "recommended",
                    })
                    if len(recommendations) >= 3:
                        break

        return Response({
            "is_ai_generated": False,
            "methodology": "Data-driven rule engine analyzing customer service history, vehicle profile, and actual transaction frequency",
            "total_recommendations": len(recommendations),
            "recommendations": recommendations,
        })