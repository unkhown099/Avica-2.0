from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
import json
from datetime import timedelta
from decimal import Decimal

from api.models import (
    Branch, PaymentTransaction, QueueEntry, Staff, User, Service,
    ServiceCategory, Customer, Booking, InventoryItem, RestockRequest,
    InventoryTransaction, Notification, Rating
)
from api.serializers.service_serializer import ServiceSerializer
from api.serializers.business_owner_serializers import OwnerServiceSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class CarRecognitionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # The analyze-vehicle endpoint requires authentication
        self.user = User.objects.create_user(email="vehicletest@test.com", password="testpass123")
        self.client.force_authenticate(user=self.user)

    @patch('api.views.vehicle_views.analyze_vehicle_image')
    def test_car_recognition_success(self, mock_analyze):
        # Mock the AI service response
        mock_analyze.return_value = {
            'success': True,
            'make': 'Toyota',
            'model': 'Fortuner',
            'year': '2023',
            'color': 'White',
            'is_demo': False,
        }

        # Create a mock image — view expects 'image' field (multipart)
        image_content = b"fake image content"
        car_image = SimpleUploadedFile("car.jpg", image_content, content_type="image/jpeg")

        response = self.client.post('/api/analyze-vehicle/', {'image': car_image}, format='multipart')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['make'], 'Toyota')
        self.assertEqual(response.data['model'], 'Fortuner')
        self.assertFalse(response.data.get('is_demo', True))

    def test_car_recognition_no_image(self):
        response = self.client.post('/api/analyze-vehicle/', {}, format='multipart')
        # Endpoint returns 400 when no image is provided
        self.assertEqual(response.status_code, 400)

class ReportAnalyticsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="admin@test.com", password="testpass123")
        self.branch = Branch.objects.create(
            name="Main Branch",
            address="Main Address",
            hours="9AM-6PM",
        )
        self.staff = Staff.objects.create(
            user=self.user,
            first_name="Admin",
            last_name="User",
            phone="09123456789",
            role="Admin",
            branch=self.branch,
        )
        self.client.force_authenticate(user=self.user)
        self.endpoint = "/api/reports/generate/"

    def _create_queue_entry(self, paid_amount=0):
        now = timezone.now()
        return QueueEntry.objects.create(
            customer_name="Walk-in Customer",
            service="Basic Wash",
            source="walk_in",
            status="done",
            branch=self.branch,
            branch_name=self.branch.name,
            position=1,
            queued_at=now,
            completed_at=now,
            price=paid_amount,
            payment_status="paid" if paid_amount > 0 else "unpaid",
        )

    def _create_payment(self, amount, tx_type, paid_at=None, queue_entry=None):
        PaymentTransaction.objects.create(
            staff=self.staff,
            branch=self.branch,
            queue_entry=queue_entry,
            transaction_type=tx_type,
            description=f"{tx_type} sale",
            amount=amount,
            paid_at=paid_at or timezone.now(),
        )

    def test_report_includes_product_only_sales_in_revenue(self):
        queue_entry = self._create_queue_entry(paid_amount=100)
        self._create_payment(100, "appointment", queue_entry=queue_entry)
        self._create_payment(50, "product")

        response = self.client.post(
            self.endpoint,
            {
                "report_type": "dashboard_summary",
                "period_type": "monthly",
                "scope_type": "global",
                "filters": {"reconciliation_threshold": 100000},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        summary = response.data.get("summary", {})
        self.assertEqual(summary.get("kpi", {}).get("total_revenue"), 150.0)
        self.assertEqual(summary.get("revenue_split", {}).get("products"), 50.0)

    def test_report_respects_monthly_period_filter(self):
        now = timezone.now()
        old_date = now - timedelta(days=40)

        self._create_payment(200, "service", paid_at=now)
        self._create_payment(300, "service", paid_at=old_date)

        response = self.client.post(
            self.endpoint,
            {
                "report_type": "dashboard_summary",
                "period_type": "monthly",
                "scope_type": "global",
                "filters": {"reconciliation_threshold": 100000},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        total_revenue = response.data.get("summary", {}).get("kpi", {}).get("total_revenue")
        self.assertEqual(total_revenue, 200.0)


class ServicePermissionAndBranchIsolationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create branches
        self.branch1 = Branch.objects.create(name="Downtown Branch", address="1st Ave", hours="9AM-6PM")
        self.branch2 = Branch.objects.create(name="Uptown Branch", address="2nd Ave", hours="9AM-6PM")

        # Create Admin user (Staff.role="Admin", is_staff=False)
        self.admin_user = User.objects.create_user(email="admin_role@test.com", password="password123")
        self.admin_staff = Staff.objects.create(
            user=self.admin_user, first_name="Admin", last_name="Role", phone="123", role="Admin", branch=self.branch1
        )

        # Create Business Owner user (Staff.role="Business Owner", is_staff=False)
        self.owner_user = User.objects.create_user(email="owner_role@test.com", password="password123")
        self.owner_staff = Staff.objects.create(
            user=self.owner_user, first_name="Owner", last_name="Role", phone="124", role="Business Owner"
        )

        # Create Branch Manager for Branch 1
        self.mgr_user = User.objects.create_user(email="mgr1@test.com", password="password123")
        self.mgr_staff = Staff.objects.create(
            user=self.mgr_user, first_name="Manager", last_name="One", phone="125", role="Branch Manager", branch=self.branch1
        )

        # Create Customer user
        self.customer_user = User.objects.create_user(email="customer@test.com", password="password123")

        # Create category & service
        self.category = ServiceCategory.objects.create(name="Wash")
        self.service = Service.objects.create(
            name="Deluxe Wash",
            category="Wash",
            price=300.00,
            duration="45 mins",
            is_active=True,
        )
        self.service.branches.add(self.branch1)

    def test_unauthenticated_cannot_access_services(self):
        res = self.client.get("/services/")
        self.assertEqual(res.status_code, 401)

    def test_customer_cannot_create_service(self):
        self.client.force_authenticate(user=self.customer_user)
        res = self.client.post("/services/", {"name": "Wax", "category": "Wash", "price": 500})
        self.assertEqual(res.status_code, 403)

    def test_branch_manager_cannot_create_service(self):
        self.client.force_authenticate(user=self.mgr_user)
        res = self.client.post("/services/", {"name": "Wax", "category": "Wash", "price": 500})
        self.assertEqual(res.status_code, 403)

    def test_admin_can_create_service(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post("/services/", {"name": "Wax", "category": "Wash", "price": 500})
        self.assertEqual(res.status_code, 201)

    def test_business_owner_can_create_service(self):
        self.client.force_authenticate(user=self.owner_user)
        res = self.client.post("/services/", {"name": "Engine Clean", "category": "Wash", "price": 800})
        self.assertEqual(res.status_code, 201)

    def test_branch_manager_cannot_modify_service_fields(self):
        self.client.force_authenticate(user=self.mgr_user)
        res = self.client.patch(f"/services/{self.service.id}/", {"name": "Hacked Name"})
        self.assertEqual(res.status_code, 403)

    def test_branch_manager_can_toggle_own_branch(self):
        self.client.force_authenticate(user=self.mgr_user)
        # Remove Branch 1
        res = self.client.patch(f"/services/{self.service.id}/", {"branch_ids": []}, format="json")
        self.assertEqual(res.status_code, 200)
        self.service.refresh_from_db()
        self.assertNotIn(self.branch1, self.service.branches.all())

        # Re-add Branch 1
        res = self.client.patch(f"/services/{self.service.id}/", {"branch_ids": [self.branch1.id]}, format="json")
        self.assertEqual(res.status_code, 200)
        self.service.refresh_from_db()
        self.assertIn(self.branch1, self.service.branches.all())

    def test_branch_manager_cannot_alter_other_branch(self):
        self.client.force_authenticate(user=self.mgr_user)
        # Service currently only has branch1. Attempt to add branch2
        res = self.client.patch(
            f"/services/{self.service.id}/",
            {"branch_ids": [self.branch1.id, self.branch2.id]},
            format="json"
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_can_update_full_service(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.patch(
            f"/services/{self.service.id}/",
            {"price": 400.00, "name": "Super Deluxe Wash"},
            format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.service.refresh_from_db()
        self.assertEqual(float(self.service.price), 400.00)
        self.assertEqual(self.service.name, "Super Deluxe Wash")

    def test_branch_filter_valid_numeric_and_invalid(self):
        self.client.force_authenticate(user=self.customer_user)
        # Valid branch
        res = self.client.get(f"/services/?branch={self.branch1.id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

        # Invalid non-existent branch
        res = self.client.get("/services/?branch=99999")
        self.assertEqual(res.status_code, 400)


class OwnerServiceBranchFilterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch1 = Branch.objects.create(name="Downtown Branch", address="1st Ave", hours="9AM-6PM")
        self.owner_user = User.objects.create_user(email="owner_test@test.com", password="password123")
        self.owner_staff = Staff.objects.create(
            user=self.owner_user, first_name="Owner", last_name="Test", phone="123", role="Business Owner"
        )
        self.client.force_authenticate(user=self.owner_user)

        self.service = Service.objects.create(
            name="Deluxe Wash",
            category="Wash",
            price=300.00,
            duration="45 mins",
            is_active=True,
        )
        self.service.branches.add(self.branch1)

    def test_owner_services_valid_branch_id(self):
        res = self.client.get(f"/owner/services/?branch={self.branch1.id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

    def test_owner_services_invalid_non_numeric_branch(self):
        res = self.client.get("/owner/services/?branch=Downtown+Branch")
        self.assertEqual(res.status_code, 400)
        self.assertIn("detail", res.data)

    def test_owner_services_non_existent_branch_id(self):
        res = self.client.get("/owner/services/?branch=99999")
        self.assertEqual(res.status_code, 400)
        self.assertIn("detail", res.data)

    def test_owner_services_negative_branch_id(self):
        res = self.client.get("/owner/services/?branch=-1")
        self.assertEqual(res.status_code, 400)


class TokenRefreshEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="jwt_user@test.com", password="password123")

    def test_canonical_token_refresh_success(self):
        refresh = RefreshToken.for_user(self.user)
        res = self.client.post("/token/refresh/", {"refresh": str(refresh)}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)

    def test_canonical_token_refresh_invalid_token(self):
        res = self.client.post("/token/refresh/", {"refresh": "invalid_refresh_token"}, format="json")
        self.assertEqual(res.status_code, 401)


class SuperAdminAndRoleBoundaryOwnerTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Super Admin with staff profile
        self.superadmin_user = User.objects.create_user(email="sa@test.com", password="password123")
        self.superadmin_staff = Staff.objects.create(
            user=self.superadmin_user, first_name="Super", last_name="Admin", phone="999", role="super_admin"
        )

        # Superuser without staff profile
        self.superuser = User.objects.create_superuser(email="root@test.com", password="password123")

        # Branch Manager
        self.branch = Branch.objects.create(name="Central", address="Center", hours="9-5")
        self.mgr_user = User.objects.create_user(email="mgr@test.com", password="password123")
        self.mgr_staff = Staff.objects.create(
            user=self.mgr_user, first_name="Mgr", last_name="Central", phone="888", role="Branch Manager", branch=self.branch
        )

        # Cashier / Staff
        self.cashier_user = User.objects.create_user(email="cashier@test.com", password="password123")
        self.cashier_staff = Staff.objects.create(
            user=self.cashier_user, first_name="Cashier", last_name="Central", phone="777", role="Staff", branch=self.branch
        )

        # Customer
        self.customer_user = User.objects.create_user(email="cust@test.com", password="password123")

    def test_superadmin_can_access_owner_stats(self):
        self.client.force_authenticate(user=self.superadmin_user)
        res = self.client.get("/owner/dashboard/stats/")
        self.assertEqual(res.status_code, 200)

    def test_superadmin_can_access_owner_services(self):
        self.client.force_authenticate(user=self.superadmin_user)
        res = self.client.get("/owner/services/")
        self.assertEqual(res.status_code, 200)

    def test_superuser_can_access_owner_stats(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.get("/owner/dashboard/stats/")
        self.assertEqual(res.status_code, 200)

    def test_branch_manager_forbidden_from_owner_stats(self):
        self.client.force_authenticate(user=self.mgr_user)
        res = self.client.get("/owner/dashboard/stats/")
        self.assertEqual(res.status_code, 403)

    def test_cashier_forbidden_from_owner_stats(self):
        self.client.force_authenticate(user=self.cashier_user)
        res = self.client.get("/owner/dashboard/stats/")
        self.assertEqual(res.status_code, 403)

    def test_customer_forbidden_from_owner_stats(self):
        self.client.force_authenticate(user=self.customer_user)
        res = self.client.get("/owner/dashboard/stats/")
        self.assertEqual(res.status_code, 403)

    def test_unauthenticated_unauthorized_from_owner_stats(self):
        res = self.client.get("/owner/dashboard/stats/")
        self.assertEqual(res.status_code, 401)


class ServiceFeaturesExtractionTests(TestCase):
    def test_service_serializer_features_extraction(self):
        desc = (
            "Complete exterior hand wash.\n"
            "• Foam cannon pre-soak\n"
            "- Wheel and tire scrub\n"
            "* Hand dry with microfiber towel\n"
            "– Tire shine application"
        )
        service = Service.objects.create(
            name="Deluxe Hand Wash",
            category="Wash",
            price=350.00,
            description=desc,
        )
        data = ServiceSerializer(service).data
        self.assertIn("features", data)
        self.assertEqual(len(data["features"]), 5)
        self.assertIn("Complete exterior hand wash.", data["features"])
        self.assertIn("Foam cannon pre-soak", data["features"])
        self.assertIn("Wheel and tire scrub", data["features"])
        self.assertIn("Hand dry with microfiber towel", data["features"])
        self.assertIn("Tire shine application", data["features"])

    def test_service_serializer_features_empty_when_no_description(self):
        service = Service.objects.create(name="Quick Rinse", category="Wash", price=150.00, description="")
        data = ServiceSerializer(service).data
        self.assertEqual(data["features"], [])

    def test_owner_service_serializer_features_extraction(self):
        service = Service.objects.create(
            name="Engine Detail",
            category="Detailing",
            price=800.00,
            description="• High pressure steam\n• Degreasing compound",
        )
        data = OwnerServiceSerializer(service).data
        self.assertIn("features", data)
        self.assertEqual(data["features"], ["High pressure steam", "Degreasing compound"])


class Top10ServicesEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="top10_test@test.com", password="password123")
        self.client.force_authenticate(user=self.user)

        self.branch1 = Branch.objects.create(name="North Branch", address="North Road", hours="8AM-5PM")
        self.branch2 = Branch.objects.create(name="South Branch", address="South Road", hours="8AM-5PM")

        self.service1 = Service.objects.create(name="Basic Wash", category="Wash", price=200.00, is_active=True)
        self.service2 = Service.objects.create(name="Ceramic Coating", category="Detailing", price=2500.00, is_active=True)
        self.service3 = Service.objects.create(name="Underwash", category="Wash", price=300.00, is_active=True)
        self.service1.branches.add(self.branch1)
        self.service2.branches.add(self.branch1)
        self.service3.branches.add(self.branch2)

        now = timezone.now()
        # Service 1 has 3 completed paid queue entries
        for i in range(3):
            QueueEntry.objects.create(
                customer_name=f"Customer 1-{i}",
                service=self.service1.name,
                source="walk_in",
                status="done",
                payment_status="paid",
                branch=self.branch1,
                position=i + 1,
                price=200.00,
                completed_at=now - timedelta(days=2),
            )

        # Service 2 has 1 completed paid queue entry
        QueueEntry.objects.create(
            customer_name="Customer 2-0",
            service=self.service2.name,
            source="walk_in",
            status="done",
            payment_status="paid",
            branch=self.branch1,
            position=4,
            price=2500.00,
            completed_at=now - timedelta(days=5),
        )

        # Cancelled or unpaid entries should NOT be counted
        QueueEntry.objects.create(
            customer_name="Cancelled Customer",
            service=self.service3.name,
            source="walk_in",
            status="cancelled",
            payment_status="unpaid",
            branch=self.branch2,
            position=5,
            price=300.00,
            completed_at=now,
        )

    def test_top10_unauthenticated_returns_401(self):
        client = APIClient()
        res = client.get("/api/services/top-10/")
        self.assertEqual(res.status_code, 401)

    def test_top10_ranks_by_completed_paid_transactions(self):
        res = self.client.get("/api/services/top-10/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("results", res.data)
        results = res.data["results"]
        self.assertGreaterEqual(len(results), 2)
        # Service 1 has 3 completions -> Rank 1
        self.assertEqual(results[0]["rank"], 1)
        self.assertEqual(results[0]["service"]["name"], self.service1.name)
        self.assertEqual(results[0]["completed_count"], 3)
        # Service 2 has 1 completion -> Rank 2
        self.assertEqual(results[1]["rank"], 2)
        self.assertEqual(results[1]["service"]["name"], self.service2.name)
        self.assertEqual(results[1]["completed_count"], 1)

    def test_top10_period_filter(self):
        res = self.client.get("/api/services/top-10/?period=month")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["period"], "month")

    def test_top10_branch_filter_valid_numeric(self):
        res = self.client.get(f"/api/services/top-10/?branch={self.branch1.id}")
        self.assertEqual(res.status_code, 200)
        results = res.data["results"]
        for r in results:
            self.assertIn(r["service"]["name"], [self.service1.name, self.service2.name])

    def test_top10_branch_filter_invalid_returns_400(self):
        res = self.client.get("/api/services/top-10/?branch=99999")
        self.assertEqual(res.status_code, 400)


class RecommendedServicesEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="customer_rec@test.com", password="password123")
        self.customer = Customer.objects.create(user=self.user, first_name="Rec", last_name="Customer")
        self.branch = Branch.objects.create(name="Rec Branch", address="Rec St", hours="9-5")

        self.service_wash = Service.objects.create(
            name="Regular Maintenance Wash", category="Maintenance", price=300.00, is_active=True
        )
        self.service_wax = Service.objects.create(
            name="Polymer Wax Protection", category="Cosmetic", price=750.00, is_active=True
        )
        self.service_wash.branches.add(self.branch)
        self.service_wax.branches.add(self.branch)

    def test_recommendations_requires_authentication(self):
        res = self.client.get("/api/services/recommendations/")
        self.assertEqual(res.status_code, 401)

    def test_recommendations_transparency_and_structure(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/services/recommendations/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("is_ai_generated", res.data)
        self.assertFalse(res.data["is_ai_generated"])
        self.assertIn("methodology", res.data)
        self.assertIn("recommendations", res.data)
        self.assertIsInstance(res.data["recommendations"], list)

    def test_recommendations_prioritizes_routine_maintenance_recency(self):
        # Create a service completed 40 days ago (> 30 days)
        past_date = timezone.now() - timedelta(days=40)
        QueueEntry.objects.create(
            customer_user=self.user,
            customer_name="Rec Customer",
            service=self.service_wash.name,
            source="walk_in",
            status="done",
            payment_status="paid",
            branch=self.branch,
            position=1,
            price=300.00,
            completed_at=past_date,
        )

        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/services/recommendations/")
        self.assertEqual(res.status_code, 200)
        recs = res.data["recommendations"]
        self.assertGreaterEqual(len(recs), 1)
        self.assertIn("basis", recs[0])
        self.assertIn("badge", recs[0])


class CustomerHistoryFilterAndPaginationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(email="cust1_hist@test.com", password="password123")
        self.user2 = User.objects.create_user(email="cust2_hist@test.com", password="password123")

        self.branch1 = Branch.objects.create(name="East Branch", address="East Road", hours="9-5")
        self.branch2 = Branch.objects.create(name="West Branch", address="West Road", hours="9-5")

        now = timezone.now()
        # Create 5 completed entries for user 1
        for i in range(5):
            QueueEntry.objects.create(
                customer_user=self.user1,
                customer_name="Cust One",
                service=f"Service {i + 1}",
                vehicle=f"Vehicle Model {i + 1}",
                plate_number=f"ABC-10{i}",
                source="walk_in",
                status="done",
                payment_status="paid",
                branch=self.branch1 if i % 2 == 0 else self.branch2,
                position=i + 1,
                price=500.00 + (i * 100),
                completed_at=now - timedelta(days=i * 2),
            )

        # Create 1 entry for user 2
        QueueEntry.objects.create(
            customer_user=self.user2,
            customer_name="Cust Two",
            service="Secret Detailing",
            vehicle="Confidential Car",
            plate_number="XYZ-999",
            source="walk_in",
            status="done",
            payment_status="paid",
            branch=self.branch2,
            position=1,
            price=9999.00,
            completed_at=now,
        )

    def test_history_requires_authentication(self):
        res = self.client.get("/api/customer/history/")
        self.assertEqual(res.status_code, 401)

    def test_history_customer_isolation(self):
        self.client.force_authenticate(user=self.user1)
        res = self.client.get("/api/customer/history/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["total_services"], 5)
        # Must not see user2's service
        services = [h["service"] for h in res.data["history"]]
        self.assertNotIn("Secret Detailing", services)

    def test_history_search_filter(self):
        self.client.force_authenticate(user=self.user1)
        # Search by plate number
        res = self.client.get("/api/customer/history/?search=ABC-100")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["history"]), 1)
        self.assertEqual(res.data["history"][0]["plate_number"], "ABC-100")

    def test_history_date_range_filter(self):
        self.client.force_authenticate(user=self.user1)
        today = timezone.now().date().isoformat()
        yesterday = (timezone.now() - timedelta(days=1)).date().isoformat()
        res = self.client.get(f"/api/customer/history/?start_date={yesterday}&end_date={today}")
        self.assertEqual(res.status_code, 200)

        # Invalid date format returns 400
        res_bad = self.client.get("/api/customer/history/?start_date=invalid-date")
        self.assertEqual(res_bad.status_code, 400)

    def test_history_branch_filter(self):
        self.client.force_authenticate(user=self.user1)
        res = self.client.get(f"/api/customer/history/?branch={self.branch1.id}")
        self.assertEqual(res.status_code, 200)
        for item in res.data["history"]:
            self.assertEqual(item["branch"], self.branch1.name)

    def test_history_pagination(self):
        self.client.force_authenticate(user=self.user1)
        res = self.client.get("/api/customer/history/?page=1&page_size=2")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["history"]), 2)
        self.assertEqual(res.data["page"], 1)
        self.assertEqual(res.data["total_pages"], 3)
        self.assertTrue(res.data["has_next"])
        self.assertFalse(res.data["has_previous"])

        # Page 2
        res_page2 = self.client.get("/api/customer/history/?page=2&page_size=2")
        self.assertEqual(res_page2.status_code, 200)
        self.assertEqual(len(res_page2.data["history"]), 2)
        self.assertTrue(res_page2.data["has_previous"])


class Phase2ManageBookingsAndScheduleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch1 = Branch.objects.create(name="North Branch", address="North Road", hours="9-5")
        self.branch2 = Branch.objects.create(name="South Branch", address="South Road", hours="9-5")

        # Users & Staff Profiles
        self.super_admin_user = User.objects.create_user(email="super_p2@test.com", password="password123")
        Staff.objects.create(user=self.super_admin_user, role="super_admin", first_name="Super", last_name="Admin")

        self.admin_user = User.objects.create_user(email="admin_p2@test.com", password="password123")
        Staff.objects.create(user=self.admin_user, role="Admin", first_name="Main", last_name="Admin")

        self.owner_user = User.objects.create_user(email="owner_p2@test.com", password="password123")
        Staff.objects.create(user=self.owner_user, role="Business Owner", first_name="Biz", last_name="Owner")

        self.manager1_user = User.objects.create_user(email="mgr1_p2@test.com", password="password123")
        Staff.objects.create(user=self.manager1_user, role="Branch Manager", branch=self.branch1, first_name="Mgr", last_name="One")

        self.manager2_user = User.objects.create_user(email="mgr2_p2@test.com", password="password123")
        Staff.objects.create(user=self.manager2_user, role="Branch Manager", branch=self.branch2, first_name="Mgr", last_name="Two")

        self.employee1_user = User.objects.create_user(email="emp1_p2@test.com", password="password123")
        self.employee1 = Staff.objects.create(user=self.employee1_user, role="Employee", branch=self.branch1, first_name="John", last_name="Tech")

        self.customer_user = User.objects.create_user(email="customer_p2@test.com", password="password123")
        self.customer = Customer.objects.create(user=self.customer_user, first_name="Jane", last_name="Doe", phone="09123456789")

        today = timezone.localtime().date()
        self.booking1 = Booking.objects.create(
            user=self.customer_user,
            branch=self.branch1,
            service="Basic Car Wash",
            vehicle="Toyota Vios",
            vehicle_size="small",
            plate_number="XYZ-123",
            date=today,
            time="10:00",
            status="pending",
        )
        self.booking2 = Booking.objects.create(
            user=self.customer_user,
            branch=self.branch2,
            service="Premium Detailing",
            vehicle="Honda Civic",
            vehicle_size="medium",
            plate_number="ABC-456",
            date=today - timedelta(days=5),
            time="14:00",
            status="pending",
        )
        self.booking3 = Booking.objects.create(
            user=self.customer_user,
            branch=self.branch1,
            service="Ceramic Coating",
            vehicle="Ford Everest",
            vehicle_size="large",
            plate_number="LMN-789",
            date=today - timedelta(days=20),
            time="09:00",
            status="pending",
        )

    def test_staff_booking_list_branch_isolation_for_manager(self):
        self.client.force_authenticate(user=self.manager1_user)
        res = self.client.get("/api/staff/bookings/")
        self.assertEqual(res.status_code, 200)
        ids = [b["id"] for b in res.data]
        self.assertIn(self.booking1.id, ids)
        self.assertIn(self.booking3.id, ids)
        self.assertNotIn(self.booking2.id, ids)

    def test_staff_booking_list_global_roles_can_view_all_and_filter(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get("/api/staff/bookings/")
        self.assertEqual(res.status_code, 200)
        ids = [b["id"] for b in res.data]
        self.assertIn(self.booking1.id, ids)
        self.assertIn(self.booking2.id, ids)
        self.assertIn(self.booking3.id, ids)

        # Filter by branch 2
        res_b2 = self.client.get(f"/api/staff/bookings/?branch={self.branch2.id}")
        self.assertEqual(res_b2.status_code, 200)
        b2_ids = [b["id"] for b in res_b2.data]
        self.assertEqual(b2_ids, [self.booking2.id])

    def test_staff_booking_action_branch_isolation(self):
        # Manager 1 (Branch 1) attempts to cancel booking in Branch 2 -> 403 Forbidden
        self.client.force_authenticate(user=self.manager1_user)
        res = self.client.patch(
            f"/api/staff/bookings/{self.booking2.id}/action/",
            {"status": "cancelled", "cancellation_reason": "Not allowed"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_staff_booking_action_confirm_requires_assigned_employee(self):
        self.client.force_authenticate(user=self.manager1_user)
        res = self.client.patch(
            f"/api/staff/bookings/{self.booking1.id}/action/",
            {"status": "confirmed"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("staff", res.data.get("detail", "").lower())

    def test_staff_booking_action_confirm_success_and_creates_queue(self):
        self.client.force_authenticate(user=self.manager1_user)
        res = self.client.patch(
            f"/api/staff/bookings/{self.booking1.id}/action/",
            {"status": "confirmed", "assigned_employee_id": self.employee1.id},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.booking1.refresh_from_db()
        self.assertEqual(self.booking1.status, "confirmed")

        # Verify queue entry was created
        self.assertTrue(QueueEntry.objects.filter(booking=self.booking1).exists())

    def test_staff_booking_action_terminal_status_protection(self):
        self.booking1.status = "done"
        self.booking1.save()
        self.client.force_authenticate(user=self.manager1_user)
        res = self.client.patch(
            f"/api/staff/bookings/{self.booking1.id}/action/",
            {"status": "cancelled", "cancellation_reason": "Too late"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_staff_booking_action_cancel_with_reason(self):
        self.client.force_authenticate(user=self.manager1_user)
        res = self.client.patch(
            f"/api/staff/bookings/{self.booking3.id}/action/",
            {"status": "cancelled", "cancellation_reason": "Customer requested cancellation"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.booking3.refresh_from_db()
        self.assertEqual(self.booking3.status, "cancelled")
        self.assertEqual(self.booking3.cancellation_reason, "Customer requested cancellation")

    def test_schedule_view_two_weeks_filter(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get("/api/staff/bookings/?schedule_view=two_weeks")
        self.assertEqual(res.status_code, 200)
        ids = [b["id"] for b in res.data]
        self.assertIn(self.booking1.id, ids)  # today
        self.assertIn(self.booking2.id, ids)  # 5 days ago
        self.assertNotIn(self.booking3.id, ids)  # 20 days ago

    def test_admin_appointment_list_view_and_read_only(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get("/appointments/")
        self.assertEqual(res.status_code, 200)

        # Admin appointments endpoint is view-only
        res_patch = self.client.patch(f"/appointments/{self.booking1.id}/", {"status": "confirmed"})
        self.assertEqual(res_patch.status_code, 405)

        res_delete = self.client.delete(f"/appointments/{self.booking1.id}/")
        self.assertEqual(res_delete.status_code, 405)

    def test_customer_cannot_cancel_done_booking(self):
        self.booking1.status = "done"
        self.booking1.save()
        self.client.force_authenticate(user=self.customer_user)
        res = self.client.patch(
            f"/api/bookings/{self.booking1.id}/",
            {"status": "cancelled"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)


class Phase3InventoryManagerTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Branches
        self.branch1 = Branch.objects.create(name="BGC Branch", address="Taguig", hours="8-6")
        self.branch2 = Branch.objects.create(name="Makati Branch", address="Makati", hours="8-6")

        # Users and Staff
        # Inventory Manager (Central)
        self.inv_manager_user = User.objects.create_user(email="inv_mgr@test.com", password="password123")
        self.inv_manager_staff = Staff.objects.create(
            user=self.inv_manager_user,
            first_name="Inv",
            last_name="Manager",
            role="Inventory Manager",
            status="Active",
            branch=None,
            branch_name="Central Warehouse",
        )

        # Branch 1 Inventory Staff
        self.inv_staff1_user = User.objects.create_user(email="inv_staff1@test.com", password="password123")
        self.inv_staff1 = Staff.objects.create(
            user=self.inv_staff1_user,
            first_name="Staff",
            last_name="BGC",
            role="Inventory",
            status="Active",
            branch=self.branch1,
            branch_name="BGC Branch",
        )

        # Central Inventory Item
        self.central_item = InventoryItem.objects.create(
            name="Premium Wax",
            category="Other",
            sku="PW-001",
            price=500.00,
            quantity=100,
            minimum_qty=20,
            unit="Pieces",
            supplier="Chemical Guys",
            branch=None,
            is_active=True,
        )

        # Branch 1 Inventory Item
        self.branch1_item = InventoryItem.objects.create(
            name="Premium Wax",
            category="Other",
            sku="PW-001-B1",
            price=500.00,
            quantity=10,
            minimum_qty=15,
            unit="Pieces",
            supplier="Chemical Guys",
            branch=self.branch1,
            is_active=True,
        )

    def test_product_distribution_to_new_branch_auto_creates_item(self):
        # Branch 2 does not have Premium Wax
        self.assertFalse(InventoryItem.objects.filter(branch=self.branch2, name="Premium Wax").exists())

        self.client.force_authenticate(user=self.inv_manager_user)
        res = self.client.post(
            "/inventory/transfer/",
            {
                "source_item_id": self.central_item.id,
                "target_branch_id": self.branch2.id,
                "quantity": 25,
                "immediate": True,
                "note": "Initial distribution to Makati Branch",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)

        # Central item deducted
        self.central_item.refresh_from_db()
        self.assertEqual(self.central_item.quantity, 75)

        # Branch 2 item auto-created with 25 quantity
        b2_item = InventoryItem.objects.filter(branch=self.branch2, name="Premium Wax").first()
        self.assertIsNotNone(b2_item)
        self.assertEqual(b2_item.quantity, 25)
        self.assertEqual(b2_item.category, "Other")

        # Transactions recorded
        self.assertTrue(InventoryTransaction.objects.filter(action_type="transfer_out", inventory_item=self.central_item).exists())
        self.assertTrue(InventoryTransaction.objects.filter(action_type="transfer_in", inventory_item=b2_item).exists())

    def test_product_distribution_staged_and_branch_receipt(self):
        self.client.force_authenticate(user=self.inv_manager_user)
        res = self.client.post(
            "/inventory/transfer/",
            {
                "source_item_id": self.central_item.id,
                "target_branch_id": self.branch1.id,
                "quantity": 10,
                "note": "Stock transfer to BGC",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        req_id = res.data["request_id"]

        rr = RestockRequest.objects.get(pk=req_id)
        self.assertEqual(rr.status, "approved")
        self.assertEqual(rr.request_type, "transfer")

        # Now BGC branch inventory receives the transfer
        self.client.force_authenticate(user=self.inv_staff1_user)
        receive_res = self.client.patch(
            f"/inventory/restock-requests/{req_id}/action/",
            {"action": "receive"},
            format="json",
        )
        self.assertEqual(receive_res.status_code, 200)

        self.central_item.refresh_from_db()
        self.branch1_item.refresh_from_db()
        self.assertEqual(self.central_item.quantity, 90)
        self.assertEqual(self.branch1_item.quantity, 20)

    def test_restock_request_approval_and_rejection(self):
        # Branch 1 requests restock
        rr = RestockRequest.objects.create(
            inventory_item=self.branch1_item,
            branch=self.branch1,
            requested_by=self.inv_staff1,
            quantity_requested=30,
            notes="Running low on wax",
            status="pending",
        )

        # Inventory manager rejects request
        self.client.force_authenticate(user=self.inv_manager_user)
        res = self.client.patch(
            f"/inventory/restock-requests/{rr.id}/action/",
            {"action": "reject", "reviewer_note": "Postponed until next month"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        rr.refresh_from_db()
        self.assertEqual(rr.status, "rejected")
        self.assertEqual(rr.reviewer_note, "Postponed until next month")

        # Duplicate review rejected
        dup_res = self.client.patch(
            f"/inventory/restock-requests/{rr.id}/action/",
            {"action": "approve"},
            format="json",
        )
        self.assertEqual(dup_res.status_code, 400)

    def test_automated_low_stock_alerts_and_deduplication(self):
        self.client.force_authenticate(user=self.inv_manager_user)

        # Drop central item to 10 (minimum_qty is 20)
        res = self.client.patch(
            f"/inventory/{self.central_item.id}/",
            {"quantity": 10},
            format="json",
        )
        self.assertEqual(res.status_code, 200)

        # Check notification was created
        notifs = Notification.objects.filter(notification_type="inventory", title__icontains="Premium Wax")
        self.assertTrue(notifs.exists())
        initial_count = notifs.count()

        # Update again within 24h to 5 (still low stock)
        res2 = self.client.patch(
            f"/inventory/{self.central_item.id}/",
            {"quantity": 5},
            format="json",
        )
        self.assertEqual(res2.status_code, 200)

        # Deduplication must prevent duplicate alerts
        after_count = Notification.objects.filter(notification_type="inventory", title__icontains="Premium Wax").count()
        self.assertEqual(initial_count, after_count)

    def test_inventory_distribution_endpoint(self):
        self.client.force_authenticate(user=self.inv_manager_user)
        res = self.client.get("/inventory/distribution/")
        self.assertEqual(res.status_code, 200)

        self.assertIn("summary", res.data)
        self.assertIn("branches", res.data)
        self.assertIn("distributions", res.data)

        dists = res.data["distributions"]
        self.assertGreaterEqual(len(dists), 1)

        wax_dist = next((d for d in dists if d["name"] == "Premium Wax"), None)
        self.assertIsNotNone(wax_dist)
        self.assertEqual(wax_dist["central_stock"], 100)
        self.assertIn(str(self.branch1.id), wax_dist["branch_stocks"])
        self.assertIn("balance_status", wax_dist)

    def test_inventory_filters_and_sorting(self):
        # Create second item with different price and quantity
        InventoryItem.objects.create(
            name="Air Freshener",
            category="Accessories",
            sku="AF-001",
            price=150.00,
            quantity=200,
            minimum_qty=10,
            branch=self.branch1,
            is_active=True,
        )

        self.client.force_authenticate(user=self.inv_manager_user)

        # Filter by branch_id
        res_branch = self.client.get(f"/inventory/?branch_id={self.branch1.id}")
        self.assertEqual(res_branch.status_code, 200)
        for item in res_branch.data:
            self.assertEqual(item["branch_name"], "BGC Branch")

        # Filter by Central
        res_central = self.client.get("/inventory/?branch=Central")
        self.assertEqual(res_central.status_code, 200)
        for item in res_central.data:
            self.assertIsNone(item["branch_name"])

        # Sort by price ascending
        res_sort_price = self.client.get("/inventory/?ordering=price")
        self.assertEqual(res_sort_price.status_code, 200)
        prices = [float(item["price"]) for item in res_sort_price.data]
        self.assertEqual(prices, sorted(prices))

        # Sort by quantity descending
        res_sort_qty = self.client.get("/inventory/?ordering=-quantity")
        self.assertEqual(res_sort_qty.status_code, 200)
        qtys = [item["quantity"] for item in res_sort_qty.data]
        self.assertEqual(qtys, sorted(qtys, reverse=True))


class Phase4BusinessOwnerTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Business Owner
        self.owner_user = User.objects.create_user(email="owner@avica.com", password="password123")
        self.owner_staff = Staff.objects.create(
            user=self.owner_user,
            first_name="Boss",
            last_name="Owner",
            phone="09111111111",
            role="Business Owner",
            status="Active",
        )

        # Unauthorized Employee
        self.employee_user = User.objects.create_user(email="emp@avica.com", password="password123")
        self.employee_staff = Staff.objects.create(
            user=self.employee_user,
            first_name="Regular",
            last_name="Worker",
            phone="09222222222",
            role="Employee",
            status="Active",
        )

        # Customer User
        self.cust_user = User.objects.create_user(email="client@avica.com", password="password123")
        self.customer = Customer.objects.create(
            user=self.cust_user,
            first_name="Client",
            last_name="One",
            phone="09333333333",
        )

        # Branches
        self.branch_makati = Branch.objects.create(
            name="Makati Central",
            address="Makati City",
            hours="8AM-8PM",
            slots=5,
            is_active=True,
        )
        self.branch_bgc = Branch.objects.create(
            name="BGC Branch",
            address="Taguig City",
            hours="9AM-7PM",
            slots=4,
            is_active=True,
        )

        # Branch Manager & Employee for Makati
        self.mgr_user = User.objects.create_user(email="mgr@avica.com", password="password123")
        self.mgr_staff = Staff.objects.create(
            user=self.mgr_user,
            first_name="Carlos",
            last_name="Mendoza",
            phone="09444444444",
            role="Branch Manager",
            branch=self.branch_makati,
            status="Active",
        )
        self.tech_user = User.objects.create_user(email="tech@avica.com", password="password123")
        self.tech_staff = Staff.objects.create(
            user=self.tech_user,
            first_name="Dave",
            last_name="Technician",
            phone="09555555555",
            role="Employee",
            branch=self.branch_makati,
            status="Active",
        )

        # Services
        self.service1 = Service.objects.create(
            name="Ceramic Coating",
            category="Detailing",
            description="Complete ceramic paint protection\n• 9H Hardness\n• 3-Year Warranty",
            duration=120,
            price=8000.00,
            price_list={"Small": 8000, "Medium": 9500, "Large": 11000},
            is_active=True,
        )
        self.service1.branches.set([self.branch_makati, self.branch_bgc])

        self.service2 = Service.objects.create(
            name="Express Wash",
            category="Wash",
            description="Quick exterior wash and tire shine\n• High pressure rinse",
            duration=30,
            price=350.00,
            is_active=True,
        )
        self.service2.branches.set([self.branch_makati])

        # Inventory Items for Makati
        self.item1 = InventoryItem.objects.create(
            name="Ceramic Liquid",
            category="Lubricants",
            sku="CER-01",
            price=1500.00,
            quantity=25,
            minimum_qty=10,
            branch=self.branch_makati,
            is_active=True,
        )
        self.item2 = InventoryItem.objects.create(
            name="Microfiber Towels",
            category="Other",
            sku="TOW-01",
            price=120.00,
            quantity=5,
            minimum_qty=15,  # Low stock!
            branch=self.branch_makati,
            is_active=True,
        )

        now = timezone.now()
        today = now.date()

        # Booking for Makati
        self.booking1 = Booking.objects.create(
            user=self.cust_user,
            branch=self.branch_makati,
            service="Ceramic Coating",
            price=8000.00,
            date=today,
            time="10:00:00",
            status="confirmed",
        )
        self.booking2 = Booking.objects.create(
            user=self.cust_user,
            branch=self.branch_makati,
            service="Express Wash",
            price=350.00,
            date=today,
            time="14:00:00",
            status="done",
        )

        # Rating for Makati
        Rating.objects.create(
            booking=self.booking2,
            customer=self.customer,
            branch=self.branch_makati,
            score=5,
            comment="Excellent service!",
        )

        # Payment for Makati
        PaymentTransaction.objects.create(
            branch=self.branch_makati,
            staff=self.mgr_staff,
            amount=8000.00,
            transaction_type="service",
            description="Ceramic Coating Payment",
            paid_at=now,
        )

    def test_owner_dashboard_stats_endpoint(self):
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.get("/owner/dashboard/stats/")
        self.assertEqual(response.status_code, 200)

        self.assertIn("total_revenue", response.data)
        self.assertIn("total_branches", response.data)
        self.assertIn("total_customers", response.data)
        self.assertIn("services_completed", response.data)
        self.assertIn("avg_satisfaction", response.data)

        self.assertEqual(response.data["total_revenue"], 8000.0)
        self.assertEqual(response.data["total_branches"], 2)
        self.assertEqual(response.data["total_customers"], 1)
        self.assertGreaterEqual(response.data["services_completed"], 1)
        self.assertEqual(response.data["avg_satisfaction"], 100.0)

    def test_owner_dashboard_permissions(self):
        # Regular employee denied (403)
        self.client.force_authenticate(user=self.employee_user)
        res_emp = self.client.get("/owner/dashboard/stats/")
        self.assertEqual(res_emp.status_code, 403)

        # Customer denied (403)
        self.client.force_authenticate(user=self.cust_user)
        res_cust = self.client.get("/owner/dashboard/stats/")
        self.assertEqual(res_cust.status_code, 403)

    def test_owner_revenue_trend_and_branch_revenue(self):
        self.client.force_authenticate(user=self.owner_user)

        # Revenue trend
        res_trend = self.client.get("/owner/dashboard/trend/")
        self.assertEqual(res_trend.status_code, 200)
        self.assertIsInstance(res_trend.data, list)
        self.assertGreaterEqual(len(res_trend.data), 1)

        current_month_label = timezone.now().strftime("%b %Y")
        current_pt = next((p for p in res_trend.data if p["label"] == current_month_label), None)
        self.assertIsNotNone(current_pt)
        self.assertEqual(current_pt["revenue"], 8000.0)

        # Branch revenue distribution
        res_brev = self.client.get("/owner/dashboard/branch-revenue/")
        self.assertEqual(res_brev.status_code, 200)
        makati_rev = next((b for b in res_brev.data if b["name"] == "Makati Central"), None)
        bgc_rev = next((b for b in res_brev.data if b["name"] == "BGC Branch"), None)

        self.assertIsNotNone(makati_rev)
        self.assertEqual(makati_rev["revenue"], 8000.0)
        self.assertIsNotNone(bgc_rev)
        self.assertEqual(bgc_rev["revenue"], 0.0)

    def test_owner_branches_list_and_breakdown(self):
        self.client.force_authenticate(user=self.owner_user)
        response = self.client.get("/owner/branches/")
        self.assertEqual(response.status_code, 200)

        makati_branch = next((b for b in response.data if b["name"] == "Makati Central"), None)
        bgc_branch = next((b for b in response.data if b["name"] == "BGC Branch"), None)

        self.assertIsNotNone(makati_branch)
        self.assertEqual(makati_branch["manager_name"], "Carlos Mendoza")
        self.assertEqual(makati_branch["staff_count"], 2)
        self.assertEqual(makati_branch["employee_count"], 1)
        self.assertEqual(makati_branch["monthly_revenue"], 8000.0)
        self.assertEqual(makati_branch["satisfaction_pct"], 100)
        self.assertEqual(makati_branch["inventory_count"], 2)
        self.assertEqual(makati_branch["low_stock_count"], 1)
        self.assertEqual(makati_branch["bookings_count"], 2)
        self.assertGreater(makati_branch["bay_utilization"], 0)

        self.assertIsNotNone(bgc_branch)
        self.assertEqual(bgc_branch["manager_name"], "Unassigned")
        self.assertEqual(bgc_branch["staff_count"], 0)
        self.assertEqual(bgc_branch["monthly_revenue"], 0.0)
        self.assertIsNone(bgc_branch["satisfaction_pct"])
        self.assertEqual(bgc_branch["inventory_count"], 0)
        self.assertEqual(bgc_branch["low_stock_count"], 0)

    def test_owner_services_branch_filtering(self):
        self.client.force_authenticate(user=self.owner_user)

        # All services
        res_all = self.client.get("/owner/services/")
        self.assertEqual(res_all.status_code, 200)
        self.assertEqual(len(res_all.data), 2)

        # Filter by BGC Branch -> only Ceramic Coating
        res_bgc = self.client.get(f"/owner/services/?branch={self.branch_bgc.id}")
        self.assertEqual(res_bgc.status_code, 200)
        self.assertEqual(len(res_bgc.data), 1)
        self.assertEqual(res_bgc.data[0]["name"], "Ceramic Coating")
        self.assertEqual(res_bgc.data[0]["price_range"], "₱8,000 – ₱11,000")
        self.assertEqual(len(res_bgc.data[0]["features"]), 3)

        # Filter by category Wash -> only Express Wash
        res_cat = self.client.get("/owner/services/?category=Wash")
        self.assertEqual(res_cat.status_code, 200)
        self.assertEqual(len(res_cat.data), 1)
        self.assertEqual(res_cat.data[0]["name"], "Express Wash")

        # Search filter
        res_search = self.client.get("/owner/services/?search=Ceramic")
        self.assertEqual(res_search.status_code, 200)
        self.assertEqual(len(res_search.data), 1)
        self.assertEqual(res_search.data[0]["name"], "Ceramic Coating")

        # Invalid and non-existent branch ID handling
        res_inv = self.client.get("/owner/services/?branch=invalid")
        self.assertEqual(res_inv.status_code, 400)
        res_nonexist = self.client.get("/owner/services/?branch=99999")
        self.assertEqual(res_nonexist.status_code, 400)

    def test_owner_appointments_filtering_and_calendar(self):
        self.client.force_authenticate(user=self.owner_user)

        # Filter by branch
        res_app = self.client.get(f"/owner/appointments/?branch={self.branch_makati.id}")
        self.assertEqual(res_app.status_code, 200)
        self.assertEqual(len(res_app.data), 2)

        # Filter by status
        res_done = self.client.get(f"/owner/appointments/?branch={self.branch_makati.id}&status=done")
        self.assertEqual(res_done.status_code, 200)
        self.assertEqual(len(res_done.data), 1)
        self.assertEqual(res_done.data[0]["service"], "Express Wash")

        # Calendar endpoint
        res_cal = self.client.get(f"/owner/appointments/calendar/?branch={self.branch_makati.id}")
        self.assertEqual(res_cal.status_code, 200)
        self.assertIsInstance(res_cal.data, dict)
        today_day = timezone.now().day
        self.assertTrue(today_day in res_cal.data or str(today_day) in res_cal.data)
        cal_entries = res_cal.data.get(today_day) or res_cal.data.get(str(today_day))
        self.assertIn("confirmed", cal_entries)
        self.assertIn("done", cal_entries)


class EmployeeLoginAndRoleRedirectionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.create(name="Central Branch", address="123 Main St", hours="8AM-6PM")

        # Employee (technician / detailer / worker)
        self.emp_user = User.objects.create_user(email="worker@test.com", password="password123")
        self.emp_staff = Staff.objects.create(
            user=self.emp_user, first_name="Juan", last_name="Worker", phone="09111111111", role="Employee", branch=self.branch
        )

        # Staff (Cashier)
        self.cashier_user = User.objects.create_user(email="cashier2@test.com", password="password123")
        self.cashier_staff = Staff.objects.create(
            user=self.cashier_user, first_name="Maria", last_name="Cashier", phone="09222222222", role="Staff", branch=self.branch
        )

        # Inventory Manager
        self.im_user = User.objects.create_user(email="im@test.com", password="password123")
        self.im_staff = Staff.objects.create(
            user=self.im_user, first_name="Carlos", last_name="Inventory", phone="09333333333", role="Inventory Manager", branch=self.branch
        )

        # Super Admin
        self.root_user = User.objects.create_superuser(email="root_admin@test.com", password="password123")

    def test_employee_login_returns_normalized_employee_role(self):
        res = self.client.post("/login/", {"email": "worker@test.com", "password": "password123"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data.get("success"))
        self.assertEqual(res.data["user"]["role"], "employee")
        self.assertIn("tokens", res.data)

    def test_staff_login_returns_normalized_staff_role(self):
        res = self.client.post("/login/", {"email": "cashier2@test.com", "password": "password123"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data.get("success"))
        self.assertEqual(res.data["user"]["role"], "staff")

    def test_inventory_manager_login_returns_normalized_role(self):
        res = self.client.post("/login/", {"email": "im@test.com", "password": "password123"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data.get("success"))
        self.assertEqual(res.data["user"]["role"], "inventory_manager")

    def test_superuser_login_returns_super_admin_role(self):
        res = self.client.post("/login/", {"email": "root_admin@test.com", "password": "password123"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data.get("success"))
        self.assertEqual(res.data["user"]["role"], "super_admin")


class VehicleAnalysisTop10RecommendationsTests(TestCase):
    def setUp(self):
        # Create 12 distinct services to verify Top 10 limit
        self.services = []
        for i in range(1, 13):
            svc = Service.objects.create(
                name=f"Service Option {i}",
                category="Wash" if i <= 3 else ("Detailing" if i <= 6 else "Protection"),
                price=Decimal(f"{100 * i}.00"),
                price_list={"small": 100 * i, "medium": 120 * i, "large": 150 * i},
                duration=30 + i * 5,
                description=f"Description for service option {i}",
                is_active=True,
            )
            self.services.append(svc)

    def test_match_recommended_services_returns_up_to_10_ranked_services(self):
        from api.services.ai_vehicle_service import _match_recommended_services
        recs = _match_recommended_services(self.services, "small", "Good", ["Service Option 1"])
        self.assertEqual(len(recs), 10)

        # Check ranking 1..10
        ranks = [r["rank"] for r in recs]
        self.assertEqual(ranks, list(range(1, 11)))

        # Check fields
        first = recs[0]
        self.assertIn("name", first)
        self.assertIn("price", first)
        self.assertIn("basePrice", first)
        self.assertIn("duration", first)
        self.assertIn("matchReason", first)
        self.assertIn("suitability", first)










class BranchArchiveAndRestoreTests(TestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model
        from rest_framework.test import APIClient
        User = get_user_model()
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email="branch_admin@test.com",
            password="AdminPassword123!"
        )
        self.client.force_authenticate(user=self.admin)
        self.branch1 = Branch.objects.create(name="Active Branch 1", address="Addr 1", is_active=True)
        self.branch2 = Branch.objects.create(name="Archived Branch 2", address="Addr 2", is_active=False)

    def test_archive_branch_via_delete_soft_deletes(self):
        res = self.client.delete(f"/branches/{self.branch1.id}/")
        self.assertEqual(res.status_code, 200)
        self.branch1.refresh_from_db()
        self.assertFalse(self.branch1.is_active)
        # Check record is still in database
        self.assertTrue(Branch.objects.filter(id=self.branch1.id).exists())

    def test_restore_branch_via_patch(self):
        res = self.client.patch(f"/branches/{self.branch2.id}/", {"is_active": True}, format="json")
        self.assertEqual(res.status_code, 200)
        self.branch2.refresh_from_db()
        self.assertTrue(self.branch2.is_active)

    def test_branch_list_status_filtering(self):
        # All
        res = self.client.get("/branches/?status=all")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data), 2)

        # Active only
        res_active = self.client.get("/branches/?status=active")
        self.assertEqual(res_active.status_code, 200)
        self.assertTrue(all(b["is_active"] for b in res_active.data))

        # Archived only
        res_archived = self.client.get("/branches/?status=archived")
        self.assertEqual(res_archived.status_code, 200)
        self.assertTrue(all(not b["is_active"] for b in res_archived.data))
