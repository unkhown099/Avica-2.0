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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #07070d; color: #ffffff; margin: 0; padding: 20px; }}
            .container {{ max-width: 620px; margin: 20px auto; background: #111827; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }}
            .header {{ background-color: #000000; padding: 28px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06); }}
            .logo {{ height: 50px; }}
            .content {{ padding: 36px 32px; }}
            h2 {{ color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 16px; text-align: center; }}
            p {{ color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }}
            .message-card {{ background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-left: 4px solid #dc2626; border-radius: 8px; padding: 18px 20px; margin: 20px 0; color: #f3f4f6; font-size: 15px; line-height: 1.7; }}
            .signature-box {{ margin-top: 24px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 14px; color: #9ca3af; }}
            .signature-box strong {{ color: #ffffff; }}
            .footer {{ background: rgba(0,0,0,0.3); padding: 22px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); }}
            .footer-text {{ color: #6b7280; font-size: 12px; margin: 0; line-height: 1.5; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://i.ibb.co/vzR0F7Z/otokwikklogo.png" alt="Otokwikk" class="logo">
            </div>
            <div class="content">
              <h2>Thank You for Your Feedback</h2>
              <p>Hi <strong>{customer_name}</strong>,</p>
              <p>Thank you for sharing your experience with us regarding your service at <strong>{branch_name}</strong>. Here is the response from our team:</p>
              <div class="message-card">
                {safe_message}
              </div>
              <div class="signature-box">
                Best regards,<br>
                <strong>{manager_name}</strong><br>
                <span>{branch_name} • Otokwikk Services</span>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">© 2026 Otokwikk Services. All rights reserved.<br>This is an automated message, please do not reply directly to this email.</p>
            </div>
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
