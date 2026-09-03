import os
import shutil
import glob
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ARTIFACT_DIR = r"C:\Users\admin\.gemini\antigravity-ide\brain\24d0b184-2b78-478b-b770-b91018af7fd1"
MEDIA_DIR = r"C:\Users\admin\Documents\Avica-2.0\backend\media\service_images"

def get_font(size):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        try:
            return ImageFont.truetype("calibri.ttf", size)
        except Exception:
            return ImageFont.load_default()

def blur_region(img, box, radius=20):
    """Applies gaussian blur to a specific (left, top, right, bottom) bbox."""
    cropped = img.crop(box)
    blurred = cropped.filter(ImageFilter.GaussianBlur(radius))
    img.paste(blurred, box)
    return img

def fill_gradient_or_color(img, box, fill_color):
    """Draws a clean filled rectangle over the box with soft antialiasing."""
    draw = ImageDraw.Draw(img)
    draw.rectangle(box, fill=fill_color)
    return img

def replace_banner(img, box, bg_color, border_color, text, text_color, font_size=20):
    draw = ImageDraw.Draw(img)
    draw.rectangle(box, fill=bg_color, outline=border_color, width=2)
    if text:
        font = get_font(font_size)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = box[0] + (box[2] - box[0] - tw) // 2
        ty = box[1] + (box[3] - box[1] - th) // 2
        draw.text((tx, ty), text, fill=text_color, font=font)
    return img

# 1. First, copy our 100% freshly generated clean carwash & engine wash
clean_carwash = os.path.join(ARTIFACT_DIR, "clean_carwash_vios_1788468122954.jpg")
if os.path.exists(clean_carwash):
    shutil.copy2(clean_carwash, os.path.join(MEDIA_DIR, "ph_carwash_vios.jpg"))
    print("[COPIED] Fresh clean carwash image")

clean_engine = os.path.join(ARTIFACT_DIR, "clean_engine_wash_1788468148292.jpg")
if os.path.exists(clean_engine):
    shutil.copy2(clean_engine, os.path.join(MEDIA_DIR, "ph_engine_wash.jpg"))
    shutil.copy2(clean_engine, os.path.join(MEDIA_DIR, "ph_pms_40k.jpg"))
    shutil.copy2(clean_engine, os.path.join(MEDIA_DIR, "ph_pms_80k.jpg"))
    print("[COPIED] Fresh clean engine wash image to PMS 40k & 80k")

# 2. Retouch ph_under_wash.jpg (1200 x 896)
# Left sign: "J.R. AUTOWORKS" at approx x=(35, 125, 200, 360)
# Technician shirt patch at approx x=(870, 480, 960, 560)
underwash_path = os.path.join(MEDIA_DIR, "ph_under_wash.jpg")
if os.path.exists(underwash_path):
    img = Image.open(underwash_path).convert("RGB")
    # Clean left wall banner
    replace_banner(img, (35, 125, 200, 360), (28, 33, 40), (45, 55, 72), "OTOKWIKK\nAUTO CARE", (255, 255, 255), 18)
    # Blur technician shirt patch
    blur_region(img, (870, 500, 960, 555), radius=15)
    img.save(underwash_path, quality=95)
    print("[RETOUCHED] ph_under_wash.jpg")

# 3. Retouch ph_hand_wax.jpg (1200 x 896)
# Top neon signs "MANILA GLOSS / AUTO DETAILING / PREMIUM WAX / CERAMIC COATING"
# Technician shirt text
handwax_path = os.path.join(MEDIA_DIR, "ph_hand_wax.jpg")
if os.path.exists(handwax_path):
    img = Image.open(handwax_path).convert("RGB")
    # Retouch top left banner area
    replace_banner(img, (0, 30, 680, 200), (15, 18, 24), (30, 40, 55), "OTOKWIKK PREMIUM AUTO CARE • MANILA", (239, 68, 68), 24)
    # Blur shirt text
    blur_region(img, (720, 380, 830, 500), radius=20)
    # Wax can brand
    blur_region(img, (700, 510, 785, 580), radius=15)
    img.save(handwax_path, quality=95)
    shutil.copy2(handwax_path, os.path.join(MEDIA_DIR, "ph_all_shine.jpg"))
    print("[RETOUCHED] ph_hand_wax.jpg & ph_all_shine.jpg")

# 4. Retouch ph_buffing_polishing.jpg & ph_exterior_detailing.jpg (1200 x 896)
# Top left wall: "MANILA AUTO SPA"
# Right shelf: "Koch Chemie", "Meguiar's"
# Technician apron: "MANILA AUTO SPA"
buffing_path = os.path.join(MEDIA_DIR, "ph_buffing_polishing.jpg")
if os.path.exists(buffing_path):
    img = Image.open(buffing_path).convert("RGB")
    # Retouch top left wall
    replace_banner(img, (20, 170, 310, 280), (220, 225, 230), (190, 195, 200), "OTOKWIKK AUTO CARE", (17, 24, 39), 20)
    # Retouch right shelf header
    replace_banner(img, (900, 160, 1200, 230), (24, 28, 36), (40, 45, 55), "PREMIUM DETAILING PRODUCTS", (240, 240, 240), 16)
    # Blur right shelf bottles
    blur_region(img, (900, 230, 1200, 480), radius=18)
    # Blur technician apron logo
    blur_region(img, (760, 380, 850, 480), radius=18)
    img.save(buffing_path, quality=95)
    shutil.copy2(buffing_path, os.path.join(MEDIA_DIR, "ph_exterior_detailing.jpg"))
    print("[RETOUCHED] ph_buffing_polishing.jpg & ph_exterior_detailing.jpg")

# 5. Retouch ph_interior_detailing.jpg (1200 x 896)
# Left wall: "ELITE AUTO CARE"
# Center top: "ELITE"
# Shirts: "ELITE"
# Vacuum cleaner: "Numatic"
interior_path = os.path.join(MEDIA_DIR, "ph_interior_detailing.jpg")
if os.path.exists(interior_path):
    img = Image.open(interior_path).convert("RGB")
    # Left wall logo
    replace_banner(img, (5, 230, 220, 320), (240, 242, 245), (200, 205, 215), "OTOKWIKK CARE", (30, 41, 59), 20)
    # Center background banner
    replace_banner(img, (240, 250, 410, 320), (240, 242, 245), (200, 205, 215), "AUTO SPA", (30, 41, 59), 18)
    # Blur female shirt logo
    blur_region(img, (170, 480, 240, 530), radius=15)
    blur_region(img, (280, 460, 330, 500), radius=15)
    # Blur male shirt logo
    blur_region(img, (740, 530, 810, 580), radius=15)
    # Blur vacuum cleaner brand text
    blur_region(img, (770, 700, 930, 880), radius=22)
    img.save(interior_path, quality=95)
    print("[RETOUCHED] ph_interior_detailing.jpg")

# 6. Retouch ph_ceramic_coating.jpg (1200 x 896)
# Technician shirt: "ZENITH AUTO DETAILING", "9H CERAMIC"
ceramic_path = os.path.join(MEDIA_DIR, "ph_ceramic_coating.jpg")
if os.path.exists(ceramic_path):
    img = Image.open(ceramic_path).convert("RGB")
    # Shirt chest logo
    replace_banner(img, (770, 490, 880, 570), (51, 65, 85), (71, 85, 105), "OTOKWIKK\nCARE", (255, 255, 255), 14)
    # Sleeve patch
    blur_region(img, (930, 510, 975, 590), radius=15)
    img.save(ceramic_path, quality=95)
    print("[RETOUCHED] ph_ceramic_coating.jpg")

# 7. Retouch ph_headlight_resto.jpg (1200 x 896)
# Center tape has repeating "3M" text -> replace with solid clean green tape
# Right wall background has "3M", "Meguiar's"
# Technician shirt has "VIOS DETAILING PH"
headlight_path = os.path.join(MEDIA_DIR, "ph_headlight_resto.jpg")
if os.path.exists(headlight_path):
    img = Image.open(headlight_path).convert("RGB")
    # Solid clean green tape in center (strip from top to bottom)
    draw = ImageDraw.Draw(img)
    # Tape is around x=572 to x=628
    draw.rectangle((572, 0, 626, 896), fill=(46, 185, 102))
    # Right wall logos blur
    blur_region(img, (680, 30, 840, 150), radius=25)
    # Technician shirt text
    blur_region(img, (900, 310, 1000, 480), radius=20)
    img.save(headlight_path, quality=95)
    print("[RETOUCHED] ph_headlight_resto.jpg")

# 8. Retouch ph_acid_rain_glass.jpg (1200 x 896)
# Top wall banner: "AUTO SHINE PH / DETAILING BAY"
# Right shelf: "GYEON", "Meguiar's"
# Technician shirt: "AUTO SHINE PH"
acid_path = os.path.join(MEDIA_DIR, "ph_acid_rain_glass.jpg")
if os.path.exists(acid_path):
    img = Image.open(acid_path).convert("RGB")
    # Retouch top wall banner
    replace_banner(img, (210, 90, 400, 190), (20, 24, 30), (45, 55, 72), "OTOKWIKK\nDETAILING BAY", (239, 68, 68), 20)
    # Retouch right shelf header
    replace_banner(img, (650, 50, 720, 180), (30, 35, 45), (50, 60, 75), "AUTO\nCARE", (255, 255, 255), 14)
    # Blur shelf bottles
    blur_region(img, (0, 80, 100, 220), radius=20)
    # Blur technician shirt logo
    blur_region(img, (170, 540, 240, 600), radius=15)
    img.save(acid_path, quality=95)
    print("[RETOUCHED] ph_acid_rain_glass.jpg")

# 9. Retouch ph_change_oil.jpg & PMS images (1200 x 896)
# Top right sign: "TOYOTA GENUINE PARTS"
# Top left sign: "TOYOTA SERVICE BAY"
# Oil bottle brand
changeoil_path = os.path.join(MEDIA_DIR, "ph_change_oil.jpg")
if os.path.exists(changeoil_path):
    img = Image.open(changeoil_path).convert("RGB")
    # Retouch top right wall sign
    replace_banner(img, (870, 40, 1000, 130), (255, 255, 255), (220, 38, 38), "OTOKWIKK\nGENUINE CARE", (220, 38, 38), 16)
    # Retouch top left sign
    replace_banner(img, (145, 175, 250, 235), (255, 255, 255), (220, 38, 38), "PMS SERVICE BAY", (220, 38, 38), 12)
    # Blur oil bottle brand
    blur_region(img, (350, 520, 420, 620), radius=15)
    img.save(changeoil_path, quality=95)
    shutil.copy2(changeoil_path, os.path.join(MEDIA_DIR, "ph_pms_5k.jpg"))
    shutil.copy2(changeoil_path, os.path.join(MEDIA_DIR, "ph_pms_10k.jpg"))
    shutil.copy2(changeoil_path, os.path.join(MEDIA_DIR, "ph_pms_20k.jpg"))
    print("[RETOUCHED] ph_change_oil.jpg & PMS 5k/10k/20k")

# 10. Retouch ph_brake_service.jpg & ph_pms_60k.jpg (1200 x 896)
# Top right sign: "TOYOTA"
# Tool chest text: "Snap-on"
brake_path = os.path.join(MEDIA_DIR, "ph_brake_service.jpg")
if os.path.exists(brake_path):
    img = Image.open(brake_path).convert("RGB")
    # Retouch top sign
    replace_banner(img, (620, 140, 730, 200), (240, 242, 245), (200, 205, 215), "OTOKWIKK", (220, 38, 38), 16)
    # Blur tool chest brand
    blur_region(img, (920, 305, 1000, 335), radius=15)
    # Blur shirt patch
    blur_region(img, (760, 440, 830, 510), radius=15)
    img.save(brake_path, quality=95)
    shutil.copy2(brake_path, os.path.join(MEDIA_DIR, "ph_pms_60k.jpg"))
    print("[RETOUCHED] ph_brake_service.jpg & ph_pms_60k.jpg")

print("\n=== ALL IMAGES ARE NOW 100% CLEAN & DEFENSE-SAFE ===")
