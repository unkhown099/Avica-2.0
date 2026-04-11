from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.mail import BadHeaderError
from django.utils.html import strip_tags
from smtplib import SMTPException
from html import escape
from api.models import Rating, Booking, Customer, QueueEntry


class RatingCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        queue_id = request.data.get("queue_id")
        score      = request.data.get("score")
        comment    = request.data.get("comment", "")

        # Validate score
        if not score or int(score) not in range(1, 6):
            return Response(
                {"detail": "Score must be between 1 and 5."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer = Customer.objects.filter(user=request.user).first()
        if not customer:
            return Response(
                {"detail": "Customer profile not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Walk-in / queue review path (supports items without booking)
        if queue_id:
            try:
                queue = QueueEntry.objects.select_related("booking", "branch").get(
                    pk=queue_id,
                    status="done",
                    payment_status="paid",
                )
            except QueueEntry.DoesNotExist:
                return Response(
                    {"detail": "Queue entry not found or not eligible for review."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if queue.booking_id:
                if queue.booking.user_id != request.user.id:
                    return Response(
                        {"detail": "Queue entry not found or not eligible for review."},
                        status=status.HTTP_404_NOT_FOUND,
                    )
            elif queue.customer_user_id != request.user.id:
                return Response(
                    {"detail": "Queue entry not found or not eligible for review."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if queue.booking_id and Rating.objects.filter(booking=queue.booking).exists():
                return Response(
                    {"detail": "You have already reviewed this service."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if queue.rating_score:
                return Response(
                    {"detail": "You have already reviewed this service."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            queue.rating_score = int(score)
            queue.rating_comment = comment or ""
            queue.rated_at = timezone.now()
            queue.save(update_fields=["rating_score", "rating_comment", "rated_at"])

            # Keep existing booking rating behavior for booking-linked queue entries.
            if queue.booking_id and not Rating.objects.filter(booking=queue.booking).exists():
                Rating.objects.create(
                    booking=queue.booking,
                    customer=customer,
                    branch=queue.booking.branch or queue.branch,
                    score=int(score),
                    comment=comment or "",
                )

            return Response(
                {
                    "id": queue.id,
                    "queue_id": queue.id,
                    "score": queue.rating_score,
                    "comment": queue.rating_comment,
                },
                status=status.HTTP_201_CREATED,
            )

        if not booking_id:
            return Response(
                {"detail": "booking_id or queue_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Booking review path
        try:
            booking = Booking.objects.select_related("branch").get(
                pk=booking_id,
                user=request.user,
                status="done",
            )
        except Booking.DoesNotExist:
            return Response(
                {"detail": "Booking not found or not eligible for review."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if Rating.objects.filter(booking=booking).exists():
            return Response(
                {"detail": "You have already reviewed this booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rating = Rating.objects.create(
            booking=booking,
            customer=customer,
            branch=booking.branch,
            score=int(score),
            comment=comment or "",
        )

        return Response({
            "id":      rating.id,
            "score":   rating.score,
            "comment": rating.comment,
        }, status=status.HTTP_201_CREATED)


class ManagerBranchReviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        staff = getattr(request.user, "staff_profile", None)
        if not staff:
            return Response({"detail": "Staff access required."}, status=status.HTTP_403_FORBIDDEN)
        if staff.role != "Branch Manager":
            return Response({"detail": "Only Branch Manager can access branch reviews."}, status=status.HTTP_403_FORBIDDEN)
        if not staff.branch_id:
            return Response({"detail": "Manager branch is not assigned."}, status=status.HTTP_400_BAD_REQUEST)

        ratings = (
            Rating.objects.select_related("customer__user", "booking", "branch")
            .filter(branch_id=staff.branch_id)
            .order_by("-created_at")
        )

        data = []
        for rating in ratings:
            customer_name = "Customer"
            customer_email = ""
            if rating.customer:
                customer_name = f"{rating.customer.first_name} {rating.customer.last_name}".strip() or "Customer"
                if rating.customer.user:
                    customer_email = rating.customer.user.email or ""

            data.append(
                {
                    "id": rating.id,
                    "score": rating.score,
                    "comment": rating.comment or "",
                    "created_at": rating.created_at,
                    "branch": rating.branch.name if rating.branch else "",
                    "service": rating.booking.service if rating.booking else "",
                    "customer_name": customer_name,
                    "customer_email": customer_email,
                    "response_status": rating.response_status,
                    "responded_at": rating.responded_at,
                }
            )

        return Response(data, status=status.HTTP_200_OK)


class ManagerReviewReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):
        staff = getattr(request.user, "staff_profile", None)
        if not staff:
            return Response({"detail": "Staff access required."}, status=status.HTTP_403_FORBIDDEN)
        if staff.role != "Branch Manager":
            return Response({"detail": "Only Branch Manager can reply to reviews."}, status=status.HTTP_403_FORBIDDEN)
        if not staff.branch_id:
            return Response({"detail": "Manager branch is not assigned."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rating = Rating.objects.select_related("customer__user", "branch").get(
                pk=review_id,
                branch_id=staff.branch_id,
            )
        except Rating.DoesNotExist:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)

        customer_email = getattr(getattr(rating.customer, "user", None), "email", "")
        if not customer_email:
            return Response({"detail": "Customer email is unavailable for this review."}, status=status.HTTP_400_BAD_REQUEST)

        reply_message = (request.data.get("message") or "").strip()
        subject = (request.data.get("subject") or "").strip() or "Response to your Otokwikk review"
        if not reply_message:
            return Response({"detail": "Reply message is required."}, status=status.HTTP_400_BAD_REQUEST)

        manager_name = f"{staff.first_name} {staff.last_name}".strip() or "Branch Manager"
        branch_name = rating.branch.name if rating.branch else "your branch"
        customer_name = f"{rating.customer.first_name} {rating.customer.last_name}".strip() or "Customer"

        safe_message = escape(reply_message).replace("\n", "<br>")
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background:#0b0f1a; color:#f9fafb; padding:24px;">
            <div style="max-width:640px; margin:0 auto; background:#111827; border-radius:12px; padding:24px;">
              <h2 style="margin-top:0;">Thank you for your feedback</h2>
              <p>Hi {customer_name},</p>
              <p>Thank you for sharing your review for <strong>{branch_name}</strong>.</p>
              <p>{safe_message}</p>
              <p style="margin-top:24px;">Regards,<br>{manager_name}<br>Otokwikk</p>
            </div>
          </body>
        </html>
        """
        text_content = strip_tags(html_content)

        try:
            msg = EmailMultiAlternatives(
                subject,
                text_content,
                settings.DEFAULT_FROM_EMAIL,
                [customer_email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
        except (SMTPException, OSError, ValueError, BadHeaderError):
            return Response({"detail": "Failed to send email response."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        rating.response_status = "responded"
        rating.responded_at = timezone.now()
        rating.responded_by = staff
        rating.save(update_fields=["response_status", "responded_at", "responded_by"])

        return Response({"detail": "Reply email sent successfully."}, status=status.HTTP_200_OK)
