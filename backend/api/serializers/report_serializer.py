from rest_framework import serializers

from api.models import ReportRun


class ReportRunSerializer(serializers.ModelSerializer):
    branch_name = serializers.SerializerMethodField()
    generated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ReportRun
        fields = [
            "id",
            "report_type",
            "scope_type",
            "period_type",
            "branch",
            "branch_name",
            "filters",
            "summary",
            "file_path",
            "status",
            "error_message",
            "generated_by",
            "generated_by_name",
            "generated_at",
        ]
        read_only_fields = fields

    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else ""

    def get_generated_by_name(self, obj):
        if not obj.generated_by:
            return "System"
        return f"{obj.generated_by.first_name} {obj.generated_by.last_name}".strip()


class ReportGenerateRequestSerializer(serializers.Serializer):
    report_type = serializers.ChoiceField(choices=[choice[0] for choice in ReportRun.REPORT_TYPE_CHOICES])
    period_type = serializers.ChoiceField(choices=[choice[0] for choice in ReportRun.PERIOD_TYPE_CHOICES], default="monthly")
    scope_type = serializers.ChoiceField(choices=[choice[0] for choice in ReportRun.SCOPE_TYPE_CHOICES], default="global")
    branch_id = serializers.IntegerField(required=False, allow_null=True)
    filters = serializers.DictField(required=False, default=dict)
