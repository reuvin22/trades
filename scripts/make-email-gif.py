"""
Builds the animated GIF used in the RadEx verification email.

An equity curve draws itself left to right under a rising balance, then holds
before looping. Run with:  python scripts/make-email-gif.py
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path("public/email/verify.gif")

W, H = 560, 280
SCALE = 2  # draw large, downsample once for cheap anti-aliasing

BG = (10, 9, 23)
CARD = (21, 20, 43)
GRID = (38, 36, 68)
ACCENT = (124, 108, 246)
ACCENT_LIGHT = (168, 156, 255)
GREEN = (74, 222, 128)
TEXT = (236, 234, 248)
MUTED = (123, 121, 154)

FRAMES = 30
HOLD = 8  # frames parked on the finished curve before looping

# Right edge is inset so the leading dot never clips against the card.
PLOT = (44, 92, W - 48, H - 44)
OPENING = 10000.0
CLOSING = 12450.20


def load_font(size: int, bold: bool = False):
    names = (
        ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf"]
        if bold
        else ["segoeui.ttf", "arial.ttf"]
    )
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def curve_points(count: int) -> list[tuple[float, float]]:
    """A plausible equity run: chop, a dip, then a trend leg into the highs."""
    keys = [
        (0.00, 10000), (0.12, 10180), (0.24, 10920), (0.33, 11390),
        (0.42, 11080), (0.52, 11240), (0.64, 11760), (0.78, 12180),
        (0.90, 12360), (1.00, 12450),
    ]

    points = []
    for i in range(count):
        t = i / (count - 1)

        segment = 0
        while segment < len(keys) - 2 and keys[segment + 1][0] < t:
            segment += 1

        t0, v0 = keys[segment]
        t1, v1 = keys[segment + 1]
        local = (t - t0) / (t1 - t0)
        eased = local * local * (3 - 2 * local)
        value = v0 + (v1 - v0) * eased

        # A little deterministic texture so it does not read as a formula.
        value += math.sin(t * 47.3) * 26

        points.append((t, value))

    return points


POINTS = curve_points(96)
LOW, HIGH = 9600.0, 12900.0


def to_pixels(t: float, value: float) -> tuple[float, float]:
    left, top, right, bottom = [c * SCALE for c in PLOT]
    x = left + (right - left) * t
    y = bottom - (bottom - top) * ((value - LOW) / (HIGH - LOW))
    return x, y


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius * SCALE, fill=fill)


def render(progress: float) -> Image.Image:
    big = Image.new("RGB", (W * SCALE, H * SCALE), BG)
    draw = ImageDraw.Draw(big)

    rounded(draw, [0, 0, W * SCALE, H * SCALE], 0, BG)
    rounded(draw, [12 * SCALE, 12 * SCALE, (W - 12) * SCALE, (H - 12) * SCALE], 14, CARD)

    title = load_font(15 * SCALE, bold=True)
    label = load_font(9 * SCALE)
    figure = load_font(30 * SCALE, bold=True)
    small = load_font(10 * SCALE)

    draw.text((34 * SCALE, 28 * SCALE), "RadEx", font=title, fill=TEXT)
    draw.text(
        (34 * SCALE, 48 * SCALE),
        "KNOW YOUR TRADES. GROW YOUR EDGE.",
        font=label,
        fill=MUTED,
    )

    # Headline balance counts up alongside the curve.
    shown = OPENING + (CLOSING - OPENING) * progress
    amount = f"${shown:,.2f}"
    draw.text((W * SCALE - 34 * SCALE, 28 * SCALE), amount, font=figure, fill=TEXT, anchor="ra")

    pct = ((shown - OPENING) / OPENING) * 100
    draw.text(
        (W * SCALE - 34 * SCALE, 64 * SCALE),
        f"+{pct:.1f}%  this quarter",
        font=small,
        fill=GREEN,
        anchor="ra",
    )

    left, top, right, bottom = [c * SCALE for c in PLOT]
    for i in range(5):
        y = top + (bottom - top) * (i / 4)
        for x in range(int(left), int(right), 10 * SCALE):
            draw.line([(x, y), (x + 4 * SCALE, y)], fill=GRID, width=SCALE)

    visible = [p for p in POINTS if p[0] <= progress]
    if len(visible) < 2:
        visible = POINTS[:2]

    pixels = [to_pixels(t, v) for t, v in visible]

    # Fill under the drawn portion, lightened toward the curve.
    if len(pixels) > 2:
        area = Image.new("RGBA", big.size, (0, 0, 0, 0))
        area_draw = ImageDraw.Draw(area)
        area_draw.polygon(
            pixels + [(pixels[-1][0], bottom), (pixels[0][0], bottom)],
            fill=(124, 108, 246, 58),
        )
        big.alpha_composite(area.convert("RGBA")) if big.mode == "RGBA" else None
        big = Image.alpha_composite(big.convert("RGBA"), area).convert("RGB")
        draw = ImageDraw.Draw(big)

    draw.line(pixels, fill=ACCENT_LIGHT, width=2 * SCALE, joint="curve")

    # Leading dot with a soft halo.
    hx, hy = pixels[-1]
    for radius, shade in ((9, (60, 52, 120)), (6, (95, 82, 200)), (3.2, (255, 255, 255))):
        r = radius * SCALE
        draw.ellipse([hx - r, hy - r, hx + r, hy + r], fill=shade)

    draw.text((34 * SCALE, (H - 34) * SCALE), "Day 1", font=small, fill=MUTED)
    draw.text(
        (W * SCALE - 34 * SCALE, (H - 34) * SCALE),
        "Day 90",
        font=small,
        fill=MUTED,
        anchor="ra",
    )

    return big.resize((W, H), Image.LANCZOS)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)

    frames = []
    for index in range(FRAMES):
        t = (index + 1) / FRAMES
        frames.append(render(t * t * (3 - 2 * t)))  # ease the draw
    frames.extend([frames[-1]] * HOLD)

    # One shared palette across every frame keeps the file small and stops
    # colours shimmering between frames.
    shared = frames[-1].quantize(colors=64, method=Image.MEDIANCUT)
    palette = [frame.quantize(palette=shared, dither=Image.NONE) for frame in frames]

    palette[0].save(
        OUT,
        save_all=True,
        append_images=palette[1:],
        duration=[70] * FRAMES + [120] * HOLD,
        loop=0,
        optimize=True,
        disposal=2,
    )

    size_kb = OUT.stat().st_size / 1024
    print(f"wrote {OUT}  {len(palette)} frames  {size_kb:.0f} KB  {W}x{H}")


if __name__ == "__main__":
    main()
