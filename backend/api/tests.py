from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
import json
from datetime import timedelta

from api.models import Branch, PaymentTransaction, QueueEntry, Staff, User, Service, ServiceCategory, Customer, Booking
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






