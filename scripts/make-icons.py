"""One-off: draw the app icons with Pillow, the same geometry as components/LogoMark.tsx and public/icons/icon.svg.
Usage: python scripts/make-icons.py   -> public/icons/icon-192.png, icon-512.png, icon-maskable-512.png, app/favicon.ico
"""
from PIL import Image, ImageDraw

BG = (18, 17, 16, 255)
CREAM = (244, 239, 230, 255)
STONE = (156, 148, 136, 115)  # 45 % range ring
ACCENT = (224, 90, 43, 255)
SS = 8  # supersample for smooth edges


def draw(size: int, scale: float, bold: float = 1.0, detail: bool = True) -> Image.Image:
    """scale = fraction of the canvas taken by the 20 unit emblem box (maskable icons keep inside the 80 % safe circle).
    bold widens strokes and the dot for tiny sizes; detail=False drops the range ring and sweep, which smear at 16 px."""
    big = size * SS
    img = Image.new("RGBA", (big, big), BG)
    u = big * scale / 20  # one emblem unit in pixels
    c = big / 2

    def px(v: float) -> float:
        return c + (v - 10) * u

    def ring(d: ImageDraw.ImageDraw, r: float, width: float, colour) -> None:
        outer = r + width / 2  # Pillow draws the width inwards; SVG centres it on the radius
        d.ellipse([c - outer * u, c - outer * u, c + outer * u, c + outer * u], outline=colour, width=max(1, round(width * u)))

    if detail:
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ring(ImageDraw.Draw(layer), 5, 1 * bold, STONE)
        img.alpha_composite(layer)
    d = ImageDraw.Draw(img)
    ring(d, 8, 1.5 * bold, CREAM)
    for x0, y0, x1, y1 in ((10, 0.5, 10, 3.6), (19.5, 10, 16.4, 10), (10, 19.5, 10, 16.4), (0.5, 10, 3.6, 10)):
        d.line([px(x0), px(y0), px(x1), px(y1)], fill=CREAM, width=round(1.5 * bold * u))
    if detail:
        d.line([px(10), px(10), px(15.2), px(4.8)], fill=CREAM, width=round(0.75 * bold * u))
    r = 2.4 * bold * u
    d.ellipse([c - r, c - r, c + r, c + r], fill=ACCENT)
    return img.resize((size, size), Image.LANCZOS)


draw(192, 0.84).save("public/icons/icon-192.png")
draw(512, 0.84).save("public/icons/icon-512.png")
draw(512, 0.64).save("public/icons/icon-maskable-512.png")
small = draw(16, 0.98, bold=1.3, detail=False)
draw(32, 0.94, bold=1.15).save("app/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)], append_images=[small])
print("icons written")
