from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django.db.models import Q
import re
from api.models import Customer, CustomerSetting, CustomerVehicle, Booking, QueueEntry, Branch
from api.serializers.customer_serializer import CustomerSerializer, CustomerVehicleSerializer


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
        try:
            requester_staff = getattr(request.user, "staff_profile", None)
            is_superuser = getattr(request.user, "is_superuser", False) or getattr(request.user, "is_staff", False)
            staff_role = requester_staff.role if requester_staff else ""
            normalized_role = staff_role.lower().replace(" ", "_")

            customers = Customer.objects.select_related("user").all()

            # Non-admin/global staff only see customers in their branch.
            if not is_superuser and normalized_role not in ("admin", "business_owner", "super_admin"):
                branch_id = getattr(requester_staff, "branch_id", None)
                branch_name = getattr(requester_staff, "branch_name", "") or ""
                branch_obj = requester_staff.branch if (requester_staff and requester_staff.branch) else None
                if not branch_obj and branch_id:
                    branch_obj = Branch.objects.filter(id=branch_id).first()
                if not branch_obj and branch_name:
                    branch_obj = Branch.objects.filter(name__iexact=branch_name).first()

                if branch_obj:
                    booking_user_ids = Booking.objects.filter(
                        branch=branch_obj
                    ).values_list("user_id", flat=True).distinct()
                    walkin_user_ids = QueueEntry.objects.filter(
                        Q(branch=branch_obj) | Q(branch_name__iexact=branch_obj.name)
                    ).values_list("customer_user_id", flat=True).distinct()
                    combined_ids = set(list(booking_user_ids) + [uid for uid in walkin_user_ids if uid])
                    customers = customers.filter(user_id__in=combined_ids)
                else:
                    customers = customers.none()

            # Filtering options (by service availed, date, branch)
            service_filter = request.query_params.get("service")
            branch_filter = request.query_params.get("branch")
            date_filter = request.query_params.get("date")
            date_from = request.query_params.get("date_from")
            date_to = request.query_params.get("date_to")

            booking_filters = Q()
            if service_filter and service_filter != "All Services":
                booking_filters &= Q(service__icontains=service_filter)
            if branch_filter and branch_filter not in ("All Branches", "all", ""):
                if str(branch_filter).isdigit():
                    booking_filters &= Q(branch_id=int(branch_filter))
                else:
                    booking_filters &= Q(branch__name__iexact=branch_filter)
            if date_filter:
                booking_filters &= Q(date=date_filter)
            if date_from:
                booking_filters &= Q(date__gte=date_from)
            if date_to:
                booking_filters &= Q(date__lte=date_to)

            if booking_filters:
                matched_user_ids = Booking.objects.filter(booking_filters).values_list("user_id", flat=True).distinct()
                customers = customers.filter(user_id__in=matched_user_ids)

            serializer = CustomerSerializer(customers, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response([], status=200)


# Current user's profile view
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
                "vehicles": [],
            })

    def put(self, request):
        try:
            customer, _ = Customer.objects.get_or_create(
                user=request.user,
                defaults={
                    "first_name": getattr(request.user, "email", "User").split("@")[0],
                    "last_name": "Customer",
                },
            )

            # Sync primary vehicle if vehicle fields were submitted
            car_make = (request.data.get("car_make") or "").strip()
            car_model = (request.data.get("car_model") or "").strip()
            car_year = (request.data.get("car_year") or "").strip()
            car_color = (request.data.get("car_color") or "").strip()
            car_plate = (request.data.get("car_plate") or "").strip().upper()

            if car_make or car_plate:
                primary_veh = customer.vehicles.filter(is_primary=True).first() or customer.vehicles.first()
                if primary_veh:
                    if car_make:
                        primary_veh.make = car_make
                    if car_model:
                        primary_veh.model = car_model
                    if car_year:
                        primary_veh.year = car_year
                    if car_color:
                        primary_veh.color = car_color
                    if car_plate:
                        primary_veh.plate_number = car_plate
                    primary_veh.save()
                else:
                    CustomerVehicle.objects.create(
                        customer=customer,
                        user=request.user,
                        make=car_make or "Vehicle",
                        model=car_model or "Model",
                        year=car_year,
                        color=car_color,
                        plate_number=car_plate or "TBA",
                        is_primary=True,
                    )

            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=400
            )


class CustomerVehicleListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_customer(self, user):
        customer, _ = Customer.objects.get_or_create(
            user=user,
            defaults={
                "first_name": getattr(user, "email", "User").split("@")[0],
                "last_name": "Customer",
            },
        )
        return customer

    def get(self, request):
        customer = self._get_customer(request.user)
        vehicles = customer.vehicles.all().order_by("-is_primary", "-created_at")
        serializer = CustomerVehicleSerializer(vehicles, many=True)
        return Response(serializer.data)

    def post(self, request):
        customer = self._get_customer(request.user)
        data = request.data or {}

        make = (data.get("make") or data.get("car_make") or "").strip()
        model = (data.get("model") or data.get("car_model") or "").strip()
        plate_number = (data.get("plate_number") or data.get("car_plate") or "").strip().upper()
        year = str(data.get("year") or data.get("car_year") or "").strip()
        color = (data.get("color") or data.get("car_color") or "").strip()
        vehicle_size = (data.get("vehicle_size") or "small").strip()
        is_primary = bool(data.get("is_primary", False))

        if not make or not model:
            return Response({"error": "Vehicle make and model are required."}, status=400)
        if not plate_number:
            return Response({"error": "Plate number is required."}, status=400)

        # If this is the customer's first vehicle or is_primary is requested
        if is_primary or not customer.vehicles.exists():
            customer.vehicles.update(is_primary=False)
            is_primary = True

        vehicle = CustomerVehicle.objects.create(
            customer=customer,
            user=request.user,
            make=make,
            model=model,
            year=year,
            color=color,
            plate_number=plate_number,
            vehicle_size=vehicle_size,
            is_primary=is_primary,
        )

        return Response(CustomerVehicleSerializer(vehicle).data, status=201)


class CustomerVehicleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_vehicle(self, request, pk):
        try:
            customer = Customer.objects.get(user=request.user)
            return CustomerVehicle.objects.get(id=pk, customer=customer), customer
        except (Customer.DoesNotExist, CustomerVehicle.DoesNotExist):
            return None, None

    def put(self, request, pk):
        vehicle, customer = self._get_vehicle(request, pk)
        if not vehicle or not customer:
            return Response({"error": "Vehicle not found."}, status=404)

        data = request.data or {}
        if "make" in data or "car_make" in data:
            vehicle.make = (data.get("make") or data.get("car_make") or vehicle.make).strip()
        if "model" in data or "car_model" in data:
            vehicle.model = (data.get("model") or data.get("car_model") or vehicle.model).strip()
        if "year" in data or "car_year" in data:
            vehicle.year = str(data.get("year") if "year" in data else data.get("car_year", vehicle.year)).strip()
        if "color" in data or "car_color" in data:
            vehicle.color = (data.get("color") if "color" in data else data.get("car_color", vehicle.color)).strip()
        if "plate_number" in data or "car_plate" in data:
            vehicle.plate_number = (data.get("plate_number") or data.get("car_plate") or vehicle.plate_number).strip().upper()
        if "vehicle_size" in data:
            vehicle.vehicle_size = (data.get("vehicle_size") or vehicle.vehicle_size).strip()

        if data.get("is_primary"):
            customer.vehicles.exclude(id=vehicle.id).update(is_primary=False)
            vehicle.is_primary = True

        vehicle.save()
        return Response(CustomerVehicleSerializer(vehicle).data)

    patch = put

    def delete(self, request, pk):
        vehicle, customer = self._get_vehicle(request, pk)
        if not vehicle or not customer:
            return Response({"error": "Vehicle not found."}, status=404)

        was_primary = vehicle.is_primary
        vehicle.delete()

        # If the deleted vehicle was primary, make the first remaining vehicle primary
        if was_primary:
            first_remaining = customer.vehicles.first()
            if first_remaining:
                first_remaining.is_primary = True
                first_remaining.save()

        return Response({"message": "Vehicle deleted successfully.", "id": pk})


class CustomerVehicleSetPrimaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            customer = Customer.objects.get(user=request.user)
            vehicle = CustomerVehicle.objects.get(id=pk, customer=customer)
        except (Customer.DoesNotExist, CustomerVehicle.DoesNotExist):
            return Response({"error": "Vehicle not found."}, status=404)

        customer.vehicles.exclude(id=vehicle.id).update(is_primary=False)
        vehicle.is_primary = True
        vehicle.save()

        return Response(CustomerVehicleSerializer(vehicle).data)




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
