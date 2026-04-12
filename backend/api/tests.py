from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
import json
from datetime import timedelta

from api.models import Branch, PaymentTransaction, QueueEntry, Staff, User

class CarRecognitionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('api.views.genai.Client')
    def test_car_recognition_success(self, mock_genai_client):
        # Mock Gemini response
        mock_response = MagicMock()
        mock_response.text = '{"make": "Toyota", "model": "Fortuner", "year": "2023", "color": "White"}'
        
        mock_client = MagicMock()
        mock_genai_client.return_value = mock_client
        mock_client.models.generate_content.return_value = mock_response

        # Create a mock image
        image_content = b"fake image content"
        car_image = SimpleUploadedFile("car.jpg", image_content, content_type="image/jpeg")

        response = self.client.post('/api/car-recognition/', {'car_image': car_image}, format='multipart')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['result']['make'], 'Toyota')
        self.assertEqual(response.data['result']['model'], 'Fortuner')
        self.assertFalse(response.data['result'].get('is_demo', True))

    def test_car_recognition_no_image(self):
        response = self.client.post('/api/car-recognition/', {}, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])


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
