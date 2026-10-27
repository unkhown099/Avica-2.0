import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

try:
    from api.models import User, Staff, Customer, Branch  # type: ignore
except ImportError:
    from backend.api.models import User, Staff, Customer, Branch  # type: ignore
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
from reportlab.pdfgen import canvas

UNIVERSAL_PASSWORD = "Password123!"

# Master list of all system accounts
SYSTEM_ACCOUNTS = [
    # ── Executive & System Administration ──
    {
        "category": "1. Executive & System Administration",
        "name": "Alexander Morales",
        "email": "superadmin@avica.com",
        "role": "Super Admin",
        "branch": "Central Head Office",
        "type": "Staff",
    },
    {
        "category": "1. Executive & System Administration",
        "name": "Eduardo Ramos",
        "email": "owner@avica.com",
        "role": "Business Owner",
        "branch": "Central Head Office",
        "type": "Staff",
    },
    {
        "category": "1. Executive & System Administration",
        "name": "Pierce De Ocampo",
        "email": "admin@avica.com",
        "role": "Admin",
        "branch": "Central Head Office",
        "type": "Staff",
    },

    # ── Inventory Management ──
    # ── Inventory Management & Main Warehouse (Saranay) ──
    {
        "category": "2. Central Inventory & Main Warehouse (Saranay)",
        "name": "Christian Dela Cruz",
        "email": "inventory.manager@avica.com",
        "role": "Inventory Manager",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "category": "2. Central Inventory & Main Warehouse (Saranay)",
        "name": "Christian Dela Cruz",
        "email": "inventorymanager@avica.com",
        "role": "Inventory Manager",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },

    # ── Dedicated Branch Inventory Staff (All Branches) ──
    # Branch 1 - South Caloocan
    {
        "category": "3. Branch Inventory Staff",
        "name": "Aldrin Santos",
        "email": "inventory.southcal@avica.com",
        "role": "Inventory",
        "branch": "South Caloocan",
        "branch_id": 1,
        "type": "Staff",
    },
    {
        "category": "3. Branch Inventory Staff",
        "name": "Paolo Mendoza",
        "email": "inventory1.southcal@avica.com",
        "role": "Inventory",
        "branch": "South Caloocan",
        "branch_id": 1,
        "type": "Staff",
    },
    # Branch 2 - Tanza Cavite
    {
        "category": "3. Branch Inventory Staff",
        "name": "Jomar Gutierrez",
        "email": "inventory.tanza@avica.com",
        "role": "Inventory",
        "branch": "Tanza Cavite",
        "branch_id": 2,
        "type": "Staff",
    },
    {
        "category": "3. Branch Inventory Staff",
        "name": "Renato Diaz",
        "email": "inventory1.tanza@avica.com",
        "role": "Inventory",
        "branch": "Tanza Cavite",
        "branch_id": 2,
        "type": "Staff",
    },
    # Branch 3 - Saranay North Caloocan
    {
        "category": "3. Branch Inventory Staff",
        "name": "Gabriel Soriano",
        "email": "inventory.saranay@avica.com",
        "role": "Inventory",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "category": "3. Branch Inventory Staff",
        "name": "Gabriel Soriano",
        "email": "inventory.staff@avica.com",
        "role": "Inventory",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "category": "3. Branch Inventory Staff",
        "name": "Danilo Ocampo",
        "email": "inventory1.saranay@avica.com",
        "role": "Inventory",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },
    # Branch 4 - San Mateo Rizal
    {
        "category": "3. Branch Inventory Staff",
        "name": "Francis Morales",
        "email": "inventory.sanmateo@avica.com",
        "role": "Inventory",
        "branch": "San Mateo Rizal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "category": "3. Branch Inventory Staff",
        "name": "Jeffrey Tolentino",
        "email": "inventory1.sanmateo@avica.com",
        "role": "Inventory",
        "branch": "San Mateo Rizal",
        "branch_id": 4,
        "type": "Staff",
    },
    # Branch 5 - Camarin North Caloocan
    {
        "category": "3. Branch Inventory Staff",
        "name": "Nathaniel Reyes",
        "email": "inventory.camarin@avica.com",
        "role": "Inventory",
        "branch": "Camarin North Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },
    {
        "category": "3. Branch Inventory Staff",
        "name": "Marco Villanueva",
        "email": "inventory1.camarin@avica.com",
        "role": "Inventory",
        "branch": "Camarin North Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },

    # ── Branch Managers ──
    {
        "category": "4. Branch Managers",
        "name": "Rolando Aquino",
        "email": "manager.southcal@avica.com",
        "role": "Branch Manager",
        "branch": "South Caloocan",
        "branch_id": 1,
        "type": "Staff",
    },
    {
        "category": "4. Branch Managers",
        "name": "Ricardo Dizon",
        "email": "manager.tanza@avica.com",
        "role": "Branch Manager",
        "branch": "Tanza Cavite",
        "branch_id": 2,
        "type": "Staff",
    },
    {
        "category": "4. Branch Managers",
        "name": "Mateo Alcantara",
        "email": "manager.saranay@avica.com",
        "role": "Branch Manager",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "category": "4. Branch Managers",
        "name": "Ferdinand Santos",
        "email": "manager.sanmateo@avica.com",
        "role": "Branch Manager",
        "branch": "San Mateo Rizal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "category": "4. Branch Managers",
        "name": "Bernardo Castillo",
        "email": "manager.camarin@avica.com",
        "role": "Branch Manager",
        "branch": "Camarin North Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },

    # ── Branch Staff / Cashiers / Service Advisors ──
    {
        "category": "5. Branch Staff / Cashiers",
        "name": "Reggie Salazar",
        "email": "staff.southcal@avica.com",
        "role": "Staff",
        "branch": "South Caloocan",
        "branch_id": 1,
        "type": "Staff",
    },
    {
        "category": "5. Branch Staff / Cashiers",
        "name": "Mark Anthony Reyes",
        "email": "staff.tanza@avica.com",
        "role": "Staff",
        "branch": "Tanza Cavite",
        "branch_id": 2,
        "type": "Staff",
    },
    {
        "category": "5. Branch Staff / Cashiers",
        "name": "Jerome Bautista",
        "email": "staff.saranay@avica.com",
        "role": "Staff",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "category": "5. Branch Staff / Cashiers",
        "name": "Dennis Ilagan",
        "email": "staff.sanmateo@avica.com",
        "role": "Staff",
        "branch": "San Mateo Rizal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "category": "5. Branch Staff / Cashiers",
        "name": "Ronnie Villanueva",
        "email": "staff.camarin@avica.com",
        "role": "Staff",
        "branch": "Camarin North Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },

    # ── Auto Technicians / Employees: South Caloocan (Branch 1) ──
    {
        "category": "6. Auto Technicians — South Caloocan",
        "name": "Michael Santos",
        "email": "michael.santos@avica.com",
        "role": "Employee",
        "branch": "South Caloocan",
        "branch_id": 1,
        "type": "Staff",
    },
    {
        "category": "6. Auto Technicians — South Caloocan",
        "name": "Noel Vergara",
        "email": "noel.vergara@avica.com",
        "role": "Employee",
        "branch": "South Caloocan",
        "branch_id": 1,
        "type": "Staff",
    },
    {
        "category": "6. Auto Technicians — South Caloocan",
        "name": "Jeffrey Villanueva",
        "email": "jeffrey.villanueva@avica.com",
        "role": "Employee",
        "branch": "South Caloocan",
        "branch_id": 1,
        "type": "Staff",
    },
    {
        "category": "6. Auto Technicians — South Caloocan",
        "name": "Paolo Cruz",
        "email": "paolo.cruz@avica.com",
        "role": "Employee",
        "branch": "South Caloocan",
        "branch_id": 1,
        "type": "Staff",
    },

    # ── Auto Technicians / Employees: Tanza Cavite (Branch 2) ──
    {
        "category": "7. Auto Technicians — Tanza Cavite",
        "name": "Arnel Mendoza",
        "email": "arnel.mendoza@avica.com",
        "role": "Employee",
        "branch": "Tanza Cavite",
        "branch_id": 2,
        "type": "Staff",
    },
    {
        "category": "7. Auto Technicians — Tanza Cavite",
        "name": "Kenneth Flores",
        "email": "kenneth.flores@avica.com",
        "role": "Employee",
        "branch": "Tanza Cavite",
        "branch_id": 2,
        "type": "Staff",
    },
    {
        "category": "7. Auto Technicians — Tanza Cavite",
        "name": "John Paul Dela Rosa",
        "email": "johnpaul.delarosa@avica.com",
        "role": "Employee",
        "branch": "Tanza Cavite",
        "branch_id": 2,
        "type": "Staff",
    },
    {
        "category": "7. Auto Technicians — Tanza Cavite",
        "name": "Joshua Ramos",
        "email": "joshua.ramos@avica.com",
        "role": "Employee",
        "branch": "Tanza Cavite",
        "branch_id": 2,
        "type": "Staff",
    },

    # ── Auto Technicians / Employees: Saranay North Cal (Branch 3) ──
    {
        "category": "8. Auto Technicians — Saranay North Cal",
        "name": "Danilo Ramos",
        "email": "danilo.ramos@avica.com",
        "role": "Employee",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "category": "8. Auto Technicians — Saranay North Cal",
        "name": "Raymond Garcia",
        "email": "raymond.garcia@avica.com",
        "role": "Employee",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "category": "8. Auto Technicians — Saranay North Cal",
        "name": "Mark Joseph Castro",
        "email": "markjoseph.castro@avica.com",
        "role": "Employee",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "category": "8. Auto Technicians — Saranay North Cal",
        "name": "Carlito Fernandez",
        "email": "carlito.fernandez@avica.com",
        "role": "Employee",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "category": "8. Auto Technicians — Saranay North Cal",
        "name": "Rico Salazar",
        "email": "rico.salazar@avica.com",
        "role": "Employee",
        "branch": "Saranay North Cal",
        "branch_id": 3,
        "type": "Staff",
    },

    # ── Auto Technicians / Employees: San Mateo Rizal (Branch 4) ──
    {
        "category": "9. Auto Technicians — San Mateo Rizal",
        "name": "Alvin David",
        "email": "alvin.david@avica.com",
        "role": "Employee",
        "branch": "San Mateo Rizal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "category": "9. Auto Technicians — San Mateo Rizal",
        "name": "Gerald Toralba",
        "email": "gerald.toralba@avica.com",
        "role": "Employee",
        "branch": "San Mateo Rizal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "category": "9. Auto Technicians — San Mateo Rizal",
        "name": "Bryan Tolentino",
        "email": "bryan.tolentino@avica.com",
        "role": "Employee",
        "branch": "San Mateo Rizal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "category": "9. Auto Technicians — San Mateo Rizal",
        "name": "Lester Gonzales",
        "email": "lester.gonzales@avica.com",
        "role": "Employee",
        "branch": "San Mateo Rizal",
        "branch_id": 4,
        "type": "Staff",
    },

    # ── Auto Technicians / Employees: Camarin North Caloocan (Branch 5) ──
    {
        "category": "10. Auto Technicians — Camarin North Caloocan",
        "name": "Christopher Reyes",
        "email": "christopher.reyes@avica.com",
        "role": "Employee",
        "branch": "Camarin North Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },
    {
        "category": "10. Auto Technicians — Camarin North Caloocan",
        "name": "Marvin Dizon",
        "email": "marvin.dizon@avica.com",
        "role": "Employee",
        "branch": "Camarin North Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },
    {
        "category": "10. Auto Technicians — Camarin North Caloocan",
        "name": "Ericson Valenzuela",
        "email": "ericson.valenzuela@avica.com",
        "role": "Employee",
        "branch": "Camarin North Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },
    {
        "category": "10. Auto Technicians — Camarin North Caloocan",
        "name": "Dexter Pascual",
        "email": "dexter.pascual@avica.com",
        "role": "Employee",
        "branch": "Camarin North Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },

    # ── Customers / Vehicle Owners ──
    {
        "category": "10. Vehicle Owners / Customers",
        "name": "Juan Dela Cruz",
        "email": "customer@avica.com",
        "role": "Customer",
        "branch": "Saranay / Multi-Branch",
        "type": "Customer",
    },
    {
        "category": "10. Vehicle Owners / Customers",
        "name": "Maria Clara Santos",
        "email": "maria.santos@avica.com",
        "role": "Customer",
        "branch": "Tanza / Multi-Branch",
        "type": "Customer",
    },
]

print("=== SYNCING ALL USERS WITH @avica.com EMAIL DOMAIN ===")
for acc in SYSTEM_ACCOUNTS:
    email = str(acc["email"])
    name_str = str(acc["name"])
    name_parts = name_str.split(None, 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "is_active": True,
            "email_verified": True,
        }
    )
    user.is_active = True
    user.email_verified = True
    user.set_password(UNIVERSAL_PASSWORD)
    user.save()

    if acc.get("type") == "Staff":
        branch_obj = None
        branch_id = acc.get("branch_id")
        branch_name_val = str(acc.get("branch", ""))
        if branch_id is not None:
            branch_obj = Branch.objects.filter(id=int(branch_id)).first()
        elif branch_name_val and branch_name_val not in ["Central Head Office", "Central Warehouse"]:
            first_word = branch_name_val.split()[0] if branch_name_val.split() else ""
            if first_word:
                branch_obj = Branch.objects.filter(name__icontains=first_word).first()

        Staff.objects.update_or_create(
            user=user,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "role": acc["role"],
                "phone": "+639171234567",
                "branch": branch_obj,
                "branch_name": branch_obj.name if branch_obj else acc["branch"],
                "status": "Active",
            }
        )
    elif acc["type"] == "Customer":
        Customer.objects.update_or_create(
            user=user,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "phone": "+639189876543",
            }
        )
    print(f"Synced [{acc['role']:15}] {acc['name']:25} -> {email}", flush=True)

print("\n=== GENERATING PDF CREDENTIALS SHEET ===", flush=True)

# Build PDF using ReportLab
pdf_filename = "AVICA_System_User_Accounts.pdf"
output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), pdf_filename)
artifact_dir = r"C:\Users\Admin\.gemini\antigravity-ide\brain\21476d3b-069c-4ed9-babc-2b6f4914a351"
artifact_path = os.path.join(artifact_dir, pdf_filename)

doc = SimpleDocTemplate(
    output_path,
    pagesize=letter,
    leftMargin=36,
    rightMargin=36,
    topMargin=36,
    bottomMargin=36
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'TitleStyle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=18,
    leading=22,
    textColor=colors.HexColor('#DC2626'),
    alignment=1, # Center
)

subtitle_style = ParagraphStyle(
    'SubTitleStyle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=10,
    leading=14,
    textColor=colors.HexColor('#4B5563'),
    alignment=1,
)

banner_box_style = ParagraphStyle(
    'BannerBox',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=10,
    leading=14,
    textColor=colors.HexColor('#1E293B'),
    alignment=1,
)

category_header_style = ParagraphStyle(
    'CategoryHeader',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=15,
    textColor=colors.HexColor('#991B1B'),
    spaceBefore=8,
    spaceAfter=4,
)

cell_style = ParagraphStyle(
    'CellStyle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor('#1F2937'),
)

cell_bold_style = ParagraphStyle(
    'CellBoldStyle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor('#111827'),
)

cell_email_style = ParagraphStyle(
    'CellEmailStyle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8,
    leading=10,
    textColor=colors.HexColor('#2563EB'),
)

cell_role_style = ParagraphStyle(
    'CellRoleStyle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8,
    leading=10,
    textColor=colors.HexColor('#DC2626'),
)

cell_pwd_style = ParagraphStyle(
    'CellPwdStyle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8,
    leading=10,
    textColor=colors.HexColor('#059669'),
)

story = []

# Header
story.append(Paragraph("AVICA: OPERATIONS MANAGEMENT SYSTEM", title_style))
story.append(Paragraph("Otokwikk Auto Service Center — Master User Accounts & Login Credentials", subtitle_style))
story.append(Spacer(1, 8))

# Banner Info
banner_data = [[
    Paragraph(f"<b>Default Universal Password:</b> <font color='#059669'>{UNIVERSAL_PASSWORD}</font>  |  <b>Login URL:</b> <font color='#2563EB'>http://localhost:5173/signin</font>  |  <b>Domain:</b> @avica.com", banner_box_style)
]]
banner_table = Table(banner_data, colWidths=[540])
banner_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF2F2')),
    ('BORDER', (0, 0), (-1, -1), 1, colors.HexColor('#FCA5A5')),
    ('PADDING', (0, 0), (-1, -1), 6),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(banner_table)
story.append(Spacer(1, 10))

# Group accounts by category
from itertools import groupby
categories = {}
for acc in SYSTEM_ACCOUNTS:
    cat = acc["category"]
    if cat not in categories:
        categories[cat] = []
    categories[cat].append(acc)

for cat_title, items in categories.items():
    cat_story = []
    cat_story.append(Paragraph(cat_title, category_header_style))

    table_data = [
        [
            Paragraph("<b>Full Name</b>", cell_bold_style),
            Paragraph("<b>Role / Title</b>", cell_bold_style),
            Paragraph("<b>Branch Location</b>", cell_bold_style),
            Paragraph("<b>Login Email (@avica.com)</b>", cell_bold_style),
            Paragraph("<b>Password</b>", cell_bold_style),
        ]
    ]

    for item in items:
        table_data.append([
            Paragraph(item["name"], cell_bold_style),
            Paragraph(item["role"], cell_role_style),
            Paragraph(item["branch"], cell_style),
            Paragraph(item["email"], cell_email_style),
            Paragraph(UNIVERSAL_PASSWORD, cell_pwd_style),
        ])

    table = Table(table_data, colWidths=[110, 85, 115, 150, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F3F4F6')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F9FAFB')]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    cat_story.append(table)
    cat_story.append(Spacer(1, 6))
    story.append(KeepTogether(cat_story))

# Footer note
footer_note = Paragraph(
    "<i>Generated for AVICA Capstone System Demo & Verification • September 2026 • University of Caloocan City</i>",
    ParagraphStyle('Foot', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=7.5, leading=10, textColor=colors.HexColor('#9CA3AF'), alignment=1)
)
story.append(Spacer(1, 8))
story.append(footer_note)

doc.build(story)
print(f"Successfully generated PDF: {output_path}")

# Copy to artifacts directory if exists
if os.path.exists(os.path.dirname(artifact_path)):
    import shutil
    shutil.copyfile(output_path, artifact_path)
    print(f"Copied PDF to Artifacts: {artifact_path}")
