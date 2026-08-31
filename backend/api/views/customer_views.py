from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django.db.models import Q
import re
from ..models import Customer
from ..models import CustomerSetting
from ..models import Booking
from ..models import QueueEntry
from ..serializers.customer_serializer import CustomerSerializer


DEFAULT_NOTIFICATIONS = {
    "bookingConfirmation": True,
    "bookingReminders": True,
    "promotions": False,
    "serviceUpdates": True,
    "newsletter": False,
}

DEFAULT_PRIVACY = {
    "shareData": False,
    "analytics": True,
}


class AdminCustomerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requester_staff = getattr(request.user, "staff_profile", None)
        is_superuser = getattr(request.user, "is_superuser", False) or getattr(request.user, "is_staff", False)
        staff_role = requester_staff.role if requester_staff else ""
        normalized_role = staff_role.lower().replace(" ", "_")

        customers = Customer.objects.select_related("user").all()

        # Non-admin/global staff only see customers in their branch.
        if not is_superuser and normalized_role not in ("admin", "business_owner", "super_admin"):
            if requester_staff and requester_staff.branch_id:
                customer_user_ids = Booking.objects.filter(
                    branch_id=requester_staff.branch_id
                ).values_list("user_id", flat=True).distinct()
                customers = customers.filter(user_id__in=customer_user_ids)
            else:
                customers = customers.none()

        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)


# Add this new view for the current user's profile
class CurrentCustomerProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            customer = Customer.objects.get(user=request.user)
            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
        except Customer.DoesNotExist:
            return Response({
                "address": "",
                "car_make": "",
                "car_model": "",
                "car_year": "",
                "car_color": "",
                "car_plate": "",
            })

    def put(self, request):
        try:
            customer, created = Customer.objects.get_or_create(user=request.user)
            
            # Update fields
            customer.address = request.data.get("address", customer.address)
            customer.car_make = request.data.get("car_make", customer.car_make)
            customer.car_model = request.data.get("car_model", customer.car_model)
            customer.car_year = request.data.get("car_year", customer.car_year)
            customer.car_color = request.data.get("car_color", customer.car_color)
            customer.car_plate = request.data.get("car_plate", customer.car_plate)
            customer.save()
            
            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=400
            )


class CustomerSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def _customer(self, request):
        try:
            return Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            return None

    def get(self, request):
        customer = self._customer(request)
        if not customer:
            return Response({"detail": "Customer profile not found."}, status=404)

        setting, _ = CustomerSetting.objects.get_or_create(customer=customer)
        notifications = {**DEFAULT_NOTIFICATIONS, **(setting.notifications or {})}
        privacy = {**DEFAULT_PRIVACY, **(setting.privacy or {})}

        return Response(
            {
                "notifications": notifications,
                "privacy": privacy,
                "updated_at": setting.updated_at,
            }
        )

    def put(self, request):
        customer = self._customer(request)
        if not customer:
            return Response({"detail": "Customer profile not found."}, status=404)

        notifications = request.data.get("notifications", DEFAULT_NOTIFICATIONS)
        privacy = request.data.get("privacy", DEFAULT_PRIVACY)

        if not isinstance(notifications, dict):
            return Response({"detail": "notifications must be an object."}, status=400)
        if not isinstance(privacy, dict):
            return Response({"detail": "privacy must be an object."}, status=400)

        clean_notifications = {
            key: bool(notifications.get(key, default_value))
            for key, default_value in DEFAULT_NOTIFICATIONS.items()
        }
        clean_privacy = {
            key: bool(privacy.get(key, default_value))
            for key, default_value in DEFAULT_PRIVACY.items()
        }

        setting, _ = CustomerSetting.objects.get_or_create(customer=customer)
        setting.notifications = clean_notifications
        setting.privacy = clean_privacy
        setting.save(update_fields=["notifications", "privacy", "updated_at"])

        return Response(
            {
                "message": "Settings saved successfully.",
                "notifications": clean_notifications,
                "privacy": clean_privacy,
                "updated_at": setting.updated_at,
            }
        )


class ManagerCustomerHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, customer_id):
        requester_staff = getattr(request.user, "staff_profile", None)
        if not requester_staff:
            return Response({"detail": "Staff access required."}, status=403)

        if requester_staff.role not in ("Admin", "Business Owner", "Branch Manager"):
            return Response({"detail": "Only Admin, Business Owner, or Branch Manager can view customer history."}, status=403)

        try:
            customer = Customer.objects.select_related("user").get(pk=customer_id)
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found."}, status=404)

        entries = QueueEntry.objects.filter(
            Q(booking__user=customer.user) | Q(customer_user=customer.user)
        ).select_related("assigned_employee", "booking", "booking__branch", "branch")

        # Branch manager only sees transactions processed within their branch.
        if requester_staff.role == "Branch Manager":
            if requester_staff.branch_id:
                entries = entries.filter(branch_id=requester_staff.branch_id)
            else:
                entries = entries.none()

        entries = entries.order_by("-completed_at", "-queued_at")

        services = []
        products = []
        total_service_amount = 0.0
        total_product_amount = 0.0

        for entry in entries:
            amount = float(entry.price or 0)
            transaction_type = "appointment" if entry.source == "booking" else "walk_in"

            if entry.assigned_employee:
                employee_name = f"{entry.assigned_employee.first_name} {entry.assigned_employee.last_name}".strip()
            else:
                employee_name = "Unassigned"

            branch_name = ""
            if entry.branch:
                branch_name = entry.branch.name
            elif entry.booking and entry.booking.branch:
                branch_name = entry.booking.branch.name
            elif entry.branch_name:
                branch_name = entry.branch_name

            service_row = {
                "queue_entry_id": entry.id,
                "date": (entry.completed_at or entry.queued_at).isoformat() if (entry.completed_at or entry.queued_at) else None,
                "service": entry.service or "—",
                "amount": amount,
                "status": entry.status,
                "payment_status": entry.payment_status,
                "payment_method": entry.payment_method,
                "transaction_type": transaction_type,
                "branch": branch_name,
                "vehicle": entry.vehicle or "",
                "plate_number": entry.plate_number or "",
                "employee": employee_name,
            }
            services.append(service_row)
            total_service_amount += amount

            note_lines = (entry.notes or "").splitlines()
            for raw_line in note_lines:
                line = raw_line.strip()
                if not line.startswith("[Products Added]") and not line.startswith("[Required Products]"):
                    continue

                tag, _, payload = line.partition("]")
                source_label = tag.replace("[", "").strip() or "Products"
                payload = payload.strip()

                product_amount = 0.0
                amount_match = re.search(r"\(\+([0-9]+(?:\.[0-9]+)?)\)\s*$", payload)
                if amount_match:
                    product_amount = float(amount_match.group(1))
                    payload = payload[:amount_match.start()].strip()

                parsed_items = []
                for token in [t.strip() for t in payload.split(",") if t.strip()]:
                    token_match = re.match(r"(.+?)\s*x(\d+)$", token, flags=re.IGNORECASE)
                    if token_match:
                        parsed_items.append({
                            "name": token_match.group(1).strip(),
                            "quantity": int(token_match.group(2)),
                        })
                    else:
                        parsed_items.append({
                            "name": token,
                            "quantity": 1,
                        })

                products.append(
                    {
                        "queue_entry_id": entry.id,
                        "date": (entry.completed_at or entry.queued_at).isoformat() if (entry.completed_at or entry.queued_at) else None,
                        "transaction_type": transaction_type,
                        "branch": branch_name,
                        "source": source_label,
                        "items": parsed_items,
                        "amount": product_amount,
                    }
                )
                total_product_amount += product_amount

        return Response(
            {
                "customer": {
                    "id": customer.id,
                    "name": f"{customer.first_name} {customer.last_name}".strip(),
                    "email": customer.user.email if customer.user else "",
                    "phone": customer.phone or "",
                },
                "summary": {
                    "total_services": len(services),
                    "total_product_purchases": len(products),
                    "total_service_amount": total_service_amount,
                    "total_product_amount": total_product_amount,
                    "total_transactions": len(services) + len(products),
                },
                "services": services,
                "products": products,
            }
        )
