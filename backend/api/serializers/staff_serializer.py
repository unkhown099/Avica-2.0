# api/serializers/staff_serializer.py
from rest_framework import serializers
from django.db import transaction
from ..models import User, Staff


class StaffSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Staff
        fields = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "role",
            "branch",
            "status",
        ]
        extra_kwargs = {
            "email": {"required": False},
            "password": {"required": False},
        }

    def validate(self, attrs):
        role = attrs.get("role")
        branch = attrs.get("branch")
        if self.instance is not None:
            role = role if role is not None else self.instance.role
            branch = branch if branch is not None else self.instance.branch

        request = self.context.get("request")
        requester_staff = getattr(getattr(request, "user", None), "staff_profile", None)

        if requester_staff and requester_staff.role == "Staff" and role == "Business Owner":
            raise serializers.ValidationError(
                {"role": "Staff accounts are not allowed to create or assign Business Owner role."}
            )

        if role == "Admin" and (self.instance is None or self.instance.role != "Admin"):
            raise serializers.ValidationError(
                {"role": "Creating Admin accounts from staff management is not allowed."}
            )

        if role == "Branch Manager":
            if not branch:
                raise serializers.ValidationError(
                    {"branch": "Branch is required when role is Branch Manager."}
                )
            if Staff.objects.filter(role="Branch Manager", branch=branch).exists():
                raise serializers.ValidationError(
                    {"branch": "This branch already has a Branch Manager."}
                )

        return attrs

    def create(self, validated_data):
        email = validated_data.pop("email")
        password = validated_data.pop("password")

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=password
            )
            staff = Staff.objects.create(user=user, **validated_data)

        return staff

    def update(self, instance, validated_data):
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if email:
            instance.user.email = email
            instance.user.save(update_fields=["email"])
        if password:
            instance.user.set_password(password)
            instance.user.save(update_fields=["password"])

        return instance
