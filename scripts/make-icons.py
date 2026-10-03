"""One-off: draw the app icons (PNG) with Pillow. Dark square, cyan ring, red centre.
Usage: python scripts/make-icons.py   -> public/icons/icon-192.png, icon-512.png, icon-maskable-512.png
"""
from PIL import Image, ImageDraw

BG = (5, 5, 5, 255)
CYAN = (0, 229, 255, 255)
RED = (255, 0, 60, 255)


def draw(size: int, safe: float) -> Image.Image:
    """safe = fraction of the canvas used by the artwork (maskable icons need ~0.6)."""
    s = 4  # supersample for smooth edges
    big = size * s
    img = Image.new("RGBA", (big, big), BG)
    d = ImageDraw.Draw(img)
    c = big / 2
    r = big * safe / 2
    d.ellipse([c - r, c - r, c + r, c + r], outline=CYAN, width=int(big * 0.035))
    r2 = r * 0.62
    d.ellipse([c - r2, c - r2, c + r2, c + r2], outline=(0, 229, 255, 110), width=int(big * 0.015))
    r3 = r * 0.2
    d.ellipse([c - r3, c - r3, c + r3, c + r3], fill=RED)
    # crosshair ticks
    t = int(big * 0.02)
    for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
        x0, y0 = c + dx * r * 0.78, c + dy * r * 0.78
        x1, y1 = c + dx * r * 1.0, c + dy * r * 1.0
        d.line([x0, y0, x1, y1], fill=CYAN, width=t)
    return img.resize((size, size), Image.LANCZOS)


draw(192, 0.78).save("public/icons/icon-192.png")
draw(512, 0.78).save("public/icons/icon-512.png")
draw(512, 0.56).save("public/icons/icon-maskable-512.png")
print("icons written")
