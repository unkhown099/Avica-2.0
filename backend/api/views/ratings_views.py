from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from api.models import Rating, Booking, Customer


class RatingCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        score      = request.data.get("score")
        comment    = request.data.get("comment", "")

        # Validate score
        if not score or int(score) not in range(1, 6):
            return Response(
                {"detail": "Score must be between 1 and 5."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate booking belongs to this user and is done
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

        # Prevent duplicate ratings
        if Rating.objects.filter(booking=booking).exists():
            return Response(
                {"detail": "You have already reviewed this booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer = Customer.objects.filter(user=request.user).first()
        if not customer:
            return Response(
                {"detail": "Customer profile not found."},
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