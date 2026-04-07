from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
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
