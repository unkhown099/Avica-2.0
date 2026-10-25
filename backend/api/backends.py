# api/backends.py
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        if not email or not password:
            return None

        clean_email = str(email).strip()
        user = User.objects.filter(email__iexact=clean_email).first()
        if not user:
            # Flexible domain resolution: support both @avica.com and @avica.local seamlessly
            if clean_email.lower().endswith('@avica.com'):
                alt_email = clean_email[:-10] + '@avica.local'
                user = User.objects.filter(email__iexact=alt_email).first()
            elif clean_email.lower().endswith('@avica.local'):
                alt_email = clean_email[:-12] + '@avica.com'
                user = User.objects.filter(email__iexact=alt_email).first()

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
