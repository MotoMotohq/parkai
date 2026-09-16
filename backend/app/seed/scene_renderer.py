"""Synthetic parking-scene image generator.

Renders garage photos that are internally consistent: same floor -> same wall
tone/texture, same zone -> same column color, same spot -> same sign text. That
consistency is what makes the similarity search demo meaningful without needing a
real photo corpus. Rendering uses lighting gradients, soft shadows, ceiling detail,
and film grain to read as a photo rather than flat vector art — there is no image
model available in this environment, so this is a procedural upgrade, not a
generative one.
"""

import hashlib
import io
import random
from dataclasses import dataclass

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 640, 480
WALL_H = 340
CEILING_H = 34

ZONE_COLORS = {
    "A": (196, 48, 48),
    "B": (40, 82, 190),
    "C": (196, 156, 34),
    "D": (48, 132, 80),
}
ZONE_COLOR_NAMES = {"A": "Red", "B": "Blue", "C": "Gold", "D": "Green"}

FLOOR_WALL_TONE = {"P1": (172, 158, 142), "P2": (132, 144, 162)}
FLOOR_LINE_COLOR = {"P1": (224, 190, 40), "P2": (226, 226, 226)}

FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"


def _font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


@dataclass
class SpotFeatures:
    floor: str
    zone: str
    row: int
    parking_number: str
    zone_color: tuple
    zone_color_name: str
    wall_tone: tuple
    line_color: tuple
    has_elevator: bool
    has_fire_cabinet: bool
    column_x: int


def spot_features(floor: str, zone: str, row: int) -> SpotFeatures:
    return SpotFeatures(
        floor=floor,
        zone=zone,
        row=row,
        parking_number=f"{zone}{row:02d}",
        zone_color=ZONE_COLORS[zone],
        zone_color_name=ZONE_COLOR_NAMES[zone],
        wall_tone=FLOOR_WALL_TONE[floor],
        line_color=FLOOR_LINE_COLOR[floor],
        has_elevator=row in (1, 3, 5),
        has_fire_cabinet=row in (1, 2, 3, 4),
        column_x=60 + (row - 1) * 90,
    )


def _seed_for(floor: str, zone: str, row: int, salt: str) -> int:
    key = f"{floor}:{zone}:{row}:{salt}".encode()
    return int(hashlib.md5(key).hexdigest(), 16) % (2**31)


def _lerp(a: tuple, b: tuple, t: float) -> tuple:
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def _shade(color: tuple, amount: int) -> tuple:
    return tuple(max(0, min(255, c + amount)) for c in color)


def _vertical_gradient(size: tuple[int, int], top: tuple, bottom: tuple) -> np.ndarray:
    w, h = size
    t = np.linspace(0.0, 1.0, h, dtype=np.float32).reshape(h, 1, 1)
    top_a = np.asarray(top, dtype=np.float32).reshape(1, 1, 3)
    bottom_a = np.asarray(bottom, dtype=np.float32).reshape(1, 1, 3)
    grad = top_a * (1 - t) + bottom_a * t
    return np.broadcast_to(grad, (h, w, 3))


def _horizontal_gradient(size: tuple[int, int], left: tuple, right: tuple) -> np.ndarray:
    w, h = size
    t = np.linspace(0.0, 1.0, w, dtype=np.float32).reshape(1, w, 1)
    left_a = np.asarray(left, dtype=np.float32).reshape(1, 1, 3)
    right_a = np.asarray(right, dtype=np.float32).reshape(1, 1, 3)
    grad = left_a * (1 - t) + right_a * t
    return np.broadcast_to(grad, (h, w, 3))


def _paste_array(img: Image.Image, arr: np.ndarray, box: tuple[int, int]) -> None:
    patch = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    img.paste(patch, box)


def _draw_ceiling(img: Image.Image, draw: ImageDraw.ImageDraw, feats: SpotFeatures) -> None:
    tone = _shade(feats.wall_tone, -60)
    draw.rectangle([0, 0, W, CEILING_H], fill=tone)
    draw.line([(0, CEILING_H), (W, CEILING_H)], fill=_shade(tone, -30), width=2)
    for cx in (170, 470):
        draw.rounded_rectangle([cx - 46, 10, cx + 46, 24], radius=5, fill=(238, 234, 214))
        for r in (60, 40, 22):
            alpha_color = _lerp(tone, (255, 250, 225), max(0, 1 - r / 60) * 0.5)
            draw.ellipse([cx - r, 17 - r * 0.4, cx + r, 17 + r * 0.4], fill=tuple(int(c) for c in alpha_color))
        draw.rounded_rectangle([cx - 46, 10, cx + 46, 24], radius=5, fill=(240, 236, 218))
    draw.line([(60, CEILING_H), (60, CEILING_H + 14)], fill=_shade(tone, -20), width=6)
    draw.line([(60, CEILING_H + 14), (W - 40, CEILING_H + 14)], fill=_shade(tone, -20), width=6)


def _draw_wall(img: Image.Image, draw: ImageDraw.ImageDraw, feats: SpotFeatures) -> None:
    top = _shade(feats.wall_tone, 22)
    bottom = _shade(feats.wall_tone, -28)
    grad = _vertical_gradient((W, WALL_H - CEILING_H), top, bottom)
    _paste_array(img, grad, (0, CEILING_H))

    shade = _shade(feats.wall_tone, -14)
    if feats.floor == "P1":
        for y in range(CEILING_H + 70, WALL_H, 85):
            draw.line([(0, y), (W, y)], fill=shade, width=1)
    else:
        for y in range(CEILING_H + 45, WALL_H, 58):
            draw.line([(0, y), (W, y)], fill=shade, width=1)
        for x in range(0, W, 80):
            draw.line([(x, CEILING_H), (x, WALL_H)], fill=shade, width=1)

    draw.line([(0, WALL_H), (W, WALL_H)], fill=_shade(feats.wall_tone, -55), width=3)


def _draw_floor(img: Image.Image, draw: ImageDraw.ImageDraw, feats: SpotFeatures) -> None:
    grad = _vertical_gradient((W, H - WALL_H), (46, 46, 50), (74, 74, 79))
    _paste_array(img, grad, (0, WALL_H))

    for x in (feats.column_x - 55, feats.column_x + 115):
        draw.polygon(
            [(x, H), (x + 12, WALL_H + 10), (x + 22, WALL_H + 10), (x + 10, H)],
            fill=feats.line_color,
        )
    for x in (feats.column_x - 150, feats.column_x + 210):
        if 0 < x < W:
            draw.polygon(
                [(x, H), (x + 6, WALL_H + 6), (x + 12, WALL_H + 6), (x + 8, H)],
                fill=_shade(feats.line_color, -40),
            )


def _draw_column(img: Image.Image, draw: ImageDraw.ImageDraw, feats: SpotFeatures) -> None:
    x0, x1 = feats.column_x, feats.column_x + 64
    y0, y1 = 55, WALL_H + 25

    lit = _shade(feats.zone_color, 35)
    core = feats.zone_color
    dark = _shade(feats.zone_color, -55)
    grad = _horizontal_gradient((x1 - x0, y1 - y0), lit, core)
    _paste_array(img, grad, (x0, y0))
    draw.rectangle([x1 - 16, y0, x1, y1], fill=dark)
    draw.rectangle([x0, y0, x0 + 4, y1], fill=_shade(lit, 25))

    shadow_w = 46
    shadow = Image.new("RGBA", (shadow_w * 2, 18), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([0, 0, shadow_w * 2, 18], fill=(10, 10, 10, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(5))
    img.paste(shadow, (x0 + 32 - shadow_w, WALL_H + 12), shadow)


def _draw_sign(draw: ImageDraw.ImageDraw, feats: SpotFeatures) -> None:
    x0, y0 = feats.column_x - 6, 78
    x1, y1 = x0 + 148, y0 + 84
    draw.rounded_rectangle([x0 + 2, y0 + 4, x1 + 2, y1 + 4], radius=8, fill=(30, 28, 24))
    draw.rounded_rectangle([x0, y0, x1, y1], radius=8, fill=(248, 247, 242), outline=feats.zone_color, width=5)
    draw.rounded_rectangle([x0 + 6, y0 + 6, x1 - 6, y0 + 18], radius=4, fill=(255, 255, 255))
    draw.text((x0 + 74, y0 + 20), feats.floor, font=_font(FONT_REGULAR, 20), fill=(90, 90, 90), anchor="mm")
    draw.text((x0 + 74, y0 + 56), feats.parking_number, font=_font(FONT_BOLD, 34), fill=(25, 25, 25), anchor="mm")


def _draw_elevator(img: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    x0, y0, x1, y1 = 16, 130, 96, 300
    grad = _horizontal_gradient((x1 - x0, y1 - y0), (172, 176, 182), (210, 213, 217))
    _paste_array(img, grad, (x0, y0))
    draw.rectangle([x0, y0, x1, y1], outline=(110, 114, 120), width=3)
    draw.line([((x0 + x1) // 2, y0), ((x0 + x1) // 2, y1)], fill=(120, 124, 130), width=3)
    for lx in (x0 + 14, x1 - 20):
        draw.line([(lx, y0 + 10), (lx, y1 - 10)], fill=(150, 154, 160), width=1)
    draw.ellipse([x1 - 14, (y0 + y1) // 2 - 6, x1 - 4, (y0 + y1) // 2 + 4], outline=(90, 94, 100), width=2)
    draw.text(((x0 + x1) // 2, y0 - 18), "LIFT", font=_font(FONT_BOLD, 16), fill=(230, 230, 230), anchor="mm")


def _draw_fire_cabinet(img: Image.Image, draw: ImageDraw.ImageDraw) -> None:
    x0, y0, x1, y1 = 556, 190, 610, 260
    grad = _vertical_gradient((x1 - x0, y1 - y0), _shade((196, 40, 40), 30), _shade((196, 40, 40), -35))
    _paste_array(img, grad, (x0, y0))
    draw.rectangle([x0, y0, x1, y1], outline=(90, 16, 16), width=3)
    draw.line([(x0 + 4, y0 + 4), (x1 - 10, y0 + 12)], fill=(255, 160, 160), width=2)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    draw.rectangle([cx - 4, cy - 16, cx + 4, cy + 16], fill=(250, 250, 250))
    draw.rectangle([cx - 16, cy - 4, cx + 16, cy + 4], fill=(250, 250, 250))


def _draw_car(img: Image.Image, draw: ImageDraw.ImageDraw, feats: SpotFeatures) -> None:
    rng = random.Random(_seed_for(feats.floor, feats.zone, feats.row, "car"))
    palette = [(35, 38, 46), (180, 26, 26), (222, 222, 226), (24, 78, 152), (82, 84, 90)]
    color = palette[rng.randrange(len(palette))]
    cx = feats.column_x + 150

    shadow = Image.new("RGBA", (220, 26), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([0, 0, 220, 26], fill=(8, 8, 8, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    img.paste(shadow, (cx - 110, 424), shadow)

    body = [cx - 90, 372, cx + 90, 430]
    lit, dark = _shade(color, 30), _shade(color, -35)
    grad = _vertical_gradient((body[2] - body[0], body[3] - body[1]), lit, dark)
    mask = Image.new("L", (body[2] - body[0], body[3] - body[1]), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, body[2] - body[0] - 1, body[3] - body[1] - 1], radius=18, fill=255)
    _paste_masked(img, grad, mask, (body[0], body[1]))
    draw.rounded_rectangle(body, radius=18, outline=(14, 14, 17), width=3)

    cabin = [cx - 55, 350, cx + 45, 380]
    draw.rounded_rectangle(cabin, radius=10, fill=_shade(color, -10), outline=(14, 14, 17), width=3)
    draw.rounded_rectangle([cx - 46, 355, cx + 36, 373], radius=6, fill=(38, 46, 56))
    draw.line([(cx - 40, 358), (cx - 10, 358)], fill=(150, 175, 195), width=2)

    for wx in (cx - 60, cx + 60):
        draw.ellipse([wx - 16, 415, wx + 16, 447], fill=(18, 18, 20))
        draw.ellipse([wx - 7, 424, wx + 7, 438], fill=(60, 60, 62))
    draw.line([(cx - 88, 388), (cx + 20, 378)], fill=tuple(min(255, c + 55) for c in lit), width=3)


def _paste_masked(img: Image.Image, arr: np.ndarray, mask: Image.Image, box: tuple[int, int]) -> None:
    patch = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    img.paste(patch, box, mask)


def _finish(img: Image.Image, seed: int) -> Image.Image:
    img = img.filter(ImageFilter.GaussianBlur(0.35))
    arr = np.asarray(img, dtype=np.float32)

    h, w = arr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dist = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    vignette = np.clip(1 - 0.22 * np.clip(dist - 0.55, 0, None), 0, 1)
    arr *= vignette[..., None]

    grain = np.random.RandomState(seed).normal(0, 3.2, arr.shape)
    arr = np.clip(arr + grain, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def render_scene(floor: str, zone: str, row: int, *, with_car: bool, variant: str = "saved") -> Image.Image:
    feats = spot_features(floor, zone, row)
    canvas_size = (W + 60, H + 60) if variant != "saved" else (W, H)
    img = Image.new("RGB", canvas_size, feats.wall_tone)
    draw = ImageDraw.Draw(img)

    _draw_wall(img, draw, feats)
    _draw_ceiling(img, draw, feats)
    _draw_floor(img, draw, feats)
    _draw_column(img, draw, feats)
    _draw_sign(draw, feats)
    if feats.has_elevator:
        _draw_elevator(img, draw)
    if feats.has_fire_cabinet:
        _draw_fire_cabinet(img, draw)
    if with_car:
        _draw_car(img, draw, feats)

    img = _finish(img, _seed_for(floor, zone, row, variant + "-grain"))

    if variant != "saved":
        rng = random.Random(_seed_for(floor, zone, row, variant))
        max_dx, max_dy = canvas_size[0] - W, canvas_size[1] - H
        dx, dy = rng.randint(0, max_dx), rng.randint(0, max_dy)
        img = img.crop((dx, dy, dx + W, dy + H))
        img = ImageEnhance.Brightness(img).enhance(rng.uniform(0.88, 1.12))
        img = ImageEnhance.Contrast(img).enhance(rng.uniform(0.92, 1.08))
        arr = np.asarray(img, dtype=np.float32)
        noise = np.random.RandomState(_seed_for(floor, zone, row, variant + "-noise")).normal(0, 5.0, arr.shape)
        arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(arr)

    return img


def image_to_bytes(img: Image.Image, fmt: str = "JPEG") -> bytes:
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format=fmt, quality=88)
    return buf.getvalue()
