from rest_framework import serializers
from ..models import Service, Branch


PRICE_TIER_KEYS = ["motor", "small", "medium", "large", "xl"]


class BranchNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name"]


class ServiceSerializer(serializers.ModelSerializer):
    branches     = BranchNameSerializer(many=True, read_only=True)
    branch_ids   = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), many=True, write_only=True, source="branches"
    )
    price_display = serializers.SerializerMethodField()

    class Meta:
        model  = Service
        fields = [
            "id", "name", "category", "description", "image",
            "duration", "price", "price_display",
            "price_list", "is_active", "branches", "branch_ids", "created_at",
        ]

    def validate_price_list(self, value):
        if value in (None, ""):
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("price_list must be an object.")

        cleaned = {}
        for key, raw in value.items():
            tier = str(key).strip().lower()
            if tier not in PRICE_TIER_KEYS:
                raise serializers.ValidationError(
                    f"Invalid tier '{key}'. Allowed tiers: {', '.join(PRICE_TIER_KEYS)}"
                )
            if raw in (None, ""):
                continue
            try:
                amount = float(raw)
            except (TypeError, ValueError):
                raise serializers.ValidationError(f"Invalid amount for tier '{key}'.")
            if amount < 0:
                raise serializers.ValidationError(f"Tier '{key}' cannot be negative.")
            cleaned[tier] = round(amount, 2)
        return cleaned

    def validate(self, attrs):
        attrs = super().validate(attrs)
        price_list = attrs.get("price_list")
        if price_list is None and self.instance is not None:
            price_list = self.instance.price_list or {}

        if isinstance(price_list, dict) and price_list:
            values = [float(v) for v in price_list.values() if v is not None]
            if values:
                attrs["price"] = min(values)
        return attrs

    def get_price_display(self, obj):
        if isinstance(obj.price_list, dict) and obj.price_list:
            values = [float(v) for v in obj.price_list.values() if v is not None]
            if values:
                lo = int(min(values))
                hi = int(max(values))
                if lo == hi:
                    return f"₱{lo:,}"
                return f"₱{lo:,} - ₱{hi:,}"
        amount = int(obj.price or 0)
        return f"₱{amount:,}"