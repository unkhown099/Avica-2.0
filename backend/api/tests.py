from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
import json

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
