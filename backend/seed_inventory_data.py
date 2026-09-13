import os
import django
import random
from datetime import timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.utils import timezone
from api.models import (
    InventoryItem, RestockRequest, InventoryTransaction, Staff, Branch
)

def seed_inventory_data():
    christian = Staff.objects.filter(user__email="inventory.manager@avica.com").first()
    gabriel = Staff.objects.filter(user__email="inventory.staff@avica.com").first()
    branches = list(Branch.objects.filter(is_active=True))
    items = list(InventoryItem.objects.all())
    branch_managers = list(Staff.objects.filter(role="Branch Manager"))

    if not items or not branches:
        print("Missing items or branches.")
        return

    now = timezone.now()

    # 1. Seed Realistic Restock Requests
    RestockRequest.objects.all().delete()
    print("Cleaned existing RestockRequests.")

    restock_templates = [
        ("Stock running low due to high weekend wash volume", "pending", None, ""),
        ("Urgent: heavy demand for ceramic wax after promo campaign", "pending", None, ""),
        ("Weekly branch reorder for high-turnover consumables", "approved", christian, "Approved for 30 units dispatch from Central."),
        ("Refill for detailing and paint protection bay", "approved", christian, "Stock ready for carrier pickup."),
        ("Bi-weekly restock replenishment arrived and inspected", "received", christian, "Verified complete and in good condition."),
        ("Bulk shampoo replenishment delivered and restocked", "received", christian, "Received by branch team."),
        ("Excessive quantity requested beyond safety ceiling", "rejected", christian, "Rejected: please request max 25 units per order."),
        ("Duplicate request submitted by morning shift", "rejected", christian, "Cancelled due to duplicate submission."),
    ]

    branch_items = [item for item in items if item.branch is not None]
    created_rr = 0

    for i, item in enumerate(branch_items[:24]):
        template = restock_templates[i % len(restock_templates)]
        notes, status_val, reviewer, rev_note = template

        mgr = next((m for m in branch_managers if m.branch_id == item.branch_id), None)
        if not mgr and branch_managers:
            mgr = branch_managers[i % len(branch_managers)]

        req_days_ago = random.randint(1, 20)
        req_time = now - timedelta(days=req_days_ago, hours=random.randint(1, 8))

        rr = RestockRequest(
            inventory_item=item,
            branch=item.branch,
            requested_by=mgr,
            quantity_requested=random.choice([15, 20, 25, 30, 40, 50]),
            notes=notes,
            request_type=random.choice(["restock", "restock", "transfer"]),
            status=status_val,
            reviewed_by=reviewer if status_val != "pending" else None,
            reviewer_note=rev_note if status_val != "pending" else "",
            reviewed_at=(req_time + timedelta(hours=random.randint(2, 24))) if status_val != "pending" else None,
        )
        rr.save()
        # Set created_at explicitly
        RestockRequest.objects.filter(pk=rr.pk).update(created_at=req_time, updated_at=req_time + timedelta(hours=2))
        created_rr += 1

    print(f"Created {created_rr} RestockRequests.")

    # 2. Seed Realistic Inventory Transactions (Movement Log)
    InventoryTransaction.objects.all().delete()
    print("Cleaned existing InventoryTransactions.")

    actions = [
        ("transfer", -20, "Transfer dispatched from Central to branch"),
        ("transfer", 20, "Transfer stock received at branch"),
        ("create", 100, "Inbound supplier batch delivery at Central Warehouse"),
        ("restock_approved", 0, "Approved restock request from branch manager"),
        ("restock_received", 30, "Restock batch verified and added to active shelf"),
        ("usage", -5, "Consumed in customer vehicle service job"),
        ("usage", -8, "Consumed in high-volume weekend queue"),
        ("update", 10, "Stock count adjustment after physical inventory cycle"),
    ]

    created_tx = 0
    # Seed over the past 30 days
    for day in range(30, -1, -1):
        day_date = now - timedelta(days=day)
        # 3 to 6 transactions per day
        daily_count = random.randint(3, 6)
        for _ in range(daily_count):
            item = random.choice(items)
            act_type, qty_change, base_note = random.choice(actions)
            branch_label = item.branch.name if item.branch else "Central Warehouse"
            target_label = random.choice(branches).name if act_type == "transfer" and not item.branch else ""

            performed = random.choice([christian, gabriel]) if not item.branch else (
                next((m for m in branch_managers if m.branch_id == item.branch_id), christian)
            )

            before_q = item.quantity or 20
            after_q = max(0, before_q + qty_change)

            tx = InventoryTransaction(
                inventory_item=item,
                action_type=act_type,
                quantity_before=before_q,
                quantity_after=after_q,
                quantity_changed=qty_change,
                branch_name=branch_label,
                target_branch_name=target_label,
                performed_by=performed,
                notes=f"{base_note} ({item.name})",
            )
            tx.save()
            tx_time = day_date.replace(hour=random.randint(8, 18), minute=random.randint(0, 59))
            InventoryTransaction.objects.filter(pk=tx.pk).update(created_at=tx_time)
            created_tx += 1

    print(f"Created {created_tx} InventoryTransactions.")

if __name__ == "__main__":
    seed_inventory_data()
