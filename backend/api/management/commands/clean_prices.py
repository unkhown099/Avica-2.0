from django.core.management.base import BaseCommand
from api.models import Booking, QueueEntry
import re

def parse_price(value):
    try:
        cleaned = re.sub(r'[₱,\s]', '', str(value))
        return float(cleaned) if cleaned else 0.0
    except (ValueError, TypeError):
        return 0.0

class Command(BaseCommand):
    help = "Clean dirty price strings in Booking and QueueEntry tables"

    def handle(self, *args, **kwargs):
        # Fix Bookings
        fixed_bookings = 0
        for b in Booking.objects.all():
            raw = str(b.price)
            if any(c in raw for c in ['₱', ',']):
                b.price = parse_price(raw)
                b.save(update_fields=["price"])
                fixed_bookings += 1
        self.stdout.write(f"Fixed {fixed_bookings} Booking rows")

        # Fix QueueEntries
        fixed_queue = 0
        for q in QueueEntry.objects.all():
            raw = str(q.price)
            if any(c in raw for c in ['₱', ',']):
                q.price = parse_price(raw)
                q.save(update_fields=["price"])
                fixed_queue += 1
        self.stdout.write(f"Fixed {fixed_queue} QueueEntry rows")

        self.stdout.write(self.style.SUCCESS("Price cleanup complete."))