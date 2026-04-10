import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

with connection.cursor() as cursor:
    cursor.execute("DESCRIBE staffs")
    columns = [row[0] for row in cursor.fetchall()]
    print("Staff columns:", columns)

    cursor.execute("DESCRIBE customers")
    columns = [row[0] for row in cursor.fetchall()]
    print("Customer columns:", columns)
