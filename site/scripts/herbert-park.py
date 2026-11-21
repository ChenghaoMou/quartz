"""Render a photo of Herbert Park as a full-colour dot-matrix picture for the footer.

Usage (needs Pillow and NumPy):
    python3 site/scripts/herbert-park.py photo.png [left,top,right,bottom]

The photo is reduced to one pixel per dot. Sky dots are translucent so the
trees carry the picture. The footer's CSS fades the edges into the page. The footer scales it up with crisp edges and masks it
with a grid of square dots.

Writes the footer PNG, its SCSS dot grid, and the animation’s still mask.
"""

import base64
import sys
from pathlib import Path
from urllib.parse import quote

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

COLS = 160
# Lit square, as a fraction of the cell. Light mode uses larger dots: the page
# shows between them, and cream gaps wash the picture out where black ones do not.
DOT = 0.62
DOT_LIGHT = 0.74
STARS = 5  # a few, well apart
STAR_SPACING = 8  # minimum distance between stars, in dots
STAR_TOP = 8  # highest row for a star; the fade hides anything above
COLOURS = 64  # palette size; keeps the PNG small without visible banding
SKY_ALPHA = 0.4  # opacity of sky dots

ROOT = Path(__file__).resolve().parents[2]
PNG = ROOT / "quartz" / "static" / "herbert-park.png"
SCSS = ROOT / "site" / "styles" / "site" / "_park.scss"

MASK = ROOT / "site/plugins/personal-site/src/park-still-mask.ts"

# Coordinates in the original 1300×450 Herbert Park photo, before cropping.
# Wide trunks and the banks are polygons. Thin structures use stroked paths
# so their contribution survives reduction to the footer’s dot grid.
STILL_POLYGONS = (
    # Left trunks and exposed branch bases, center tree, and right birches.
    [(135, 334), (145, 315), (148, 273), (164, 275), (169, 319), (176, 334)],
    [(208, 355), (218, 329), (219, 289), (215, 267), (228, 270), (238, 264),
     (242, 289), (245, 329), (253, 351), (248, 358)],
    [(605, 266), (616, 278), (620, 259), (625, 271), (623, 286), (627, 316),
     (616, 317), (614, 286)],
    [(1095, 307), (1099, 266), (1102, 221), (1111, 222), (1109, 269), (1109, 308)],
    [(1241, 308), (1236, 268), (1234, 225), (1242, 224), (1244, 264), (1250, 309)],
    # Left path and retaining wall, behind the hanging foliage.
    [(0, 328), (206, 326), (283, 328), (339, 333), (366, 341), (379, 352),
     (404, 350), (403, 365), (330, 374), (230, 392), (124, 412), (0, 450)],
    # Far path and concrete pond rim, including the island’s front edge.
    [(419, 321), (545, 321), (578, 330), (620, 332), (772, 331), (900, 332),
     (1050, 329), (1300, 328), (1300, 346), (1050, 346), (900, 347), (710, 347),
     (579, 344), (543, 336), (413, 337)],
    # Partly obscured building behind the right birch.
    [(1076, 255), (1118, 256), (1118, 280), (1075, 281)],
    # Benches and the yellow sign by the far path.
    [(528, 313), (552, 311), (558, 323), (525, 324)],
    [(1206, 311), (1267, 310), (1270, 329), (1203, 329)],
    [(1154, 311), (1174, 310), (1174, 328), (1155, 329)],
)

STILL_LINES = (
    # Exposed main limbs and distant trunks.
    (9, [(224, 285), (226, 259), (241, 240)]),
    (8, [(149, 293), (151, 271), (145, 252)]),
    (7, [(517, 282), (503, 252), (489, 219)]),
    (6, [(618, 286), (595, 270), (577, 247)]),
    (6, [(620, 284), (640, 265), (653, 244)]),
    (7, [(1105, 235), (1108, 199), (1112, 157)]),
    (6, [(1238, 234), (1236, 188), (1230, 128)]),
    (7, [(1168, 314), (1168, 283)]),
    # Far rail / wall below the trees and slender posts behind the left tree.
    (11, [(907, 289), (1044, 285), (1170, 282), (1299, 280)]),
    (4, [(302, 315), (302, 288)]),
    (4, [(338, 315), (337, 288)]),
)


# Visible crowns in original photo coordinates, back to front. The order
# assigns IDs 1–8 and matches the client’s motion profiles.
CROWNS = (
    # Large left tree, including its hanging lower branches.
    [(0, 0), (480, 0), (500, 130), (459, 265), (445, 327), (412, 354),
     (375, 347), (359, 304), (189, 278), (0, 291)],
    # Dark tree partly behind the round central tree.
    [(464, 116), (551, 116), (579, 173), (576, 257), (540, 310),
     (451, 320), (454, 252)],
    # Round central tree.
    [(524, 231), (541, 184), (581, 166), (636, 171), (674, 198),
     (686, 248), (652, 296), (621, 315), (565, 296), (532, 270)],
    # Dense dark crown and shrubs behind it.
    [(654, 214), (672, 155), (737, 111), (803, 98), (837, 132),
     (860, 209), (915, 259), (880, 319), (692, 318), (662, 277)],
    # Higher, warm-toned crown behind the right-hand trees.
    [(816, 86), (885, 77), (954, 103), (971, 164), (938, 231),
     (903, 296), (857, 300), (858, 208), (831, 153)],
    # Broad green crown left of the birches.
    [(901, 83), (940, 33), (1007, 47), (1061, 88), (1080, 154),
     (1057, 224), (1016, 267), (938, 275), (891, 232), (883, 158)],
    # First birch and hanging foliage beside the building.
    [(1044, 99), (1089, 49), (1134, 66), (1166, 114), (1173, 178),
     (1139, 236), (1108, 264), (1058, 255), (1040, 221), (1038, 161)],
    # Outer birch at the right edge.
    [(1158, 111), (1193, 53), (1260, 36), (1300, 53), (1300, 279),
     (1251, 287), (1191, 264), (1154, 222), (1149, 163)],
)


def tree_labels(size, crop, grid):
    crowns = Image.new("L", size)
    draw = ImageDraw.Draw(crowns)
    for label, polygon in enumerate(CROWNS, 1):
        draw.polygon(polygon, fill=label)
    if crop:
        crowns = crowns.crop(crop)
    # Choose the dominant visible crown by coverage, never by averaging IDs.
    labels = np.asarray(crowns)
    coverage = np.stack([
        np.asarray(Image.fromarray((labels == label).astype(np.uint8) * 255)
                   .resize(grid, Image.Resampling.BOX))
        for label in range(len(CROWNS) + 1)
    ])
    return coverage.argmax(axis=0).astype(np.uint8)


def still_mask(size, crop, grid):
    mask = Image.new("L", size)
    draw = ImageDraw.Draw(mask)
    for polygon in STILL_POLYGONS:
        draw.polygon(polygon, fill=255)
    for width, points in STILL_LINES:
        draw.line(points, fill=255, width=width)
    if crop:
        mask = mask.crop(crop)
    coverage = np.asarray(mask.resize(grid, Image.Resampling.BOX))
    # Keep mixed cells where an object occupies at least a quarter of the dot.
    return coverage >= 64


def render(path, crop=None):
    photo = Image.open(path).convert("RGB")
    if crop:
        photo = photo.crop(crop)
    rows = round(COLS * photo.height / photo.width)
    cells = photo.filter(ImageFilter.GaussianBlur(1)).resize((COLS, rows), Image.BOX)
    rgb = np.asarray(cells, dtype=float) / 255
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    sky = (blue > green) & (blue > red + 0.08)
    alpha = np.where(sky, SKY_ALPHA, 1.0)
    rgba = np.dstack([np.asarray(cells), (alpha * 255).round()]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA").quantize(COLOURS, method=Image.Quantize.FASTOCTREE)


def skies(image):
    source = np.asarray(image.convert("RGBA"))
    sky = source[:, :, 3] < 250
    y, x = np.indices(sky.shape)
    depth = y / max(image.height - 1, 1)

    day = source.copy()
    # Keep the original light variation while giving the cream backdrop more blue.
    pale = (source[:, :, 0].astype(float) - 128) / 128
    day[:, :, :3][sky] = np.stack([
        61 + 46 * depth + 28 * pale,
        130 + 54 * depth + 24 * pale,
        222 + 23 * depth + 12 * pale,
    ], axis=-1).clip(0, 255)[sky]
    day[:, :, 3][sky] = 148

    night = source.copy()
    night[:, :, :3] = (source[:, :, :3] * [0.43, 0.49, 0.61] + [5, 7, 12]).astype(np.uint8)
    night[:, :, :3][sky] = np.stack([
        13 + 16 * depth, 20 + 22 * depth, 40 + 33 * depth,
    ], axis=-1)[sky]
    night[:, :, 3][sky] = 192

    # Stable, irregular spacing, one star per row so they never line up. The
    # star alpha is reserved so the client can find stars without a separate
    # map and exclude them from sampling.
    priority = ((x * 73856093) ^ (y * 19349663) ^ (x * y * 83492791)) % 104729
    stars = []
    for index in np.argsort(priority, axis=None):
        row, col = np.unravel_index(index, sky.shape)
        if row < STAR_TOP or not sky[row, col]:
            continue
        vicinity = sky[max(0, row - 1):row + 2, max(0, col - 1):col + 2]
        if not vicinity.all() or any(
            row == r or (row - r)**2 + (col - c)**2 < STAR_SPACING**2 for r, c in stars
        ):
            continue
        stars.append((row, col))
        tone = 112 + int(priority[row, col] % 54)
        night[row, col] = [tone, tone + 12, tone + 26, 232]
        if len(stars) == STARS:
            break

    return Image.fromarray(day, "RGBA"), Image.fromarray(night, "RGBA")


def dot_mask(rows, cols, dot):
    inset = (1 - dot) / 2
    svg = (
        f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {cols} {rows}' preserveAspectRatio='none'>"
        f"<pattern id='d' width='1' height='1' patternUnits='userSpaceOnUse'>"
        f"<rect x='{inset:g}' y='{inset:g}' width='{dot:g}' height='{dot:g}'/></pattern>"
        f"<rect width='{cols}' height='{rows}' fill='url(#d)'/></svg>"
    )
    return "data:image/svg+xml," + quote(svg, safe="/:=' ")


def main():
    crop = tuple(int(v) for v in sys.argv[2].split(",")) if len(sys.argv) > 2 else None
    image = render(sys.argv[1], crop)
    day, night = skies(image)
    day.save(PNG, optimize=True)
    night.save(PNG.with_name("herbert-park-night.png"), optimize=True)
    with Image.open(sys.argv[1]) as photo:
        still = still_mask(photo.size, crop, image.size)
        trees = tree_labels(photo.size, crop, image.size).ravel()
    tree_bits = base64.b64encode((trees[::2] | (trees[1::2] << 4)).tobytes()).decode("ascii")
    packed = base64.b64encode(np.packbits(still, bitorder="little").tobytes()).decode("ascii")
    MASK.write_text(
        "// Generated by site/scripts/herbert-park.py. Do not edit.\n"
        f"export const stillMaskWidth = {image.width}\n"
        f"export const stillMaskHeight = {image.height}\n"
        f'export const stillMaskBits =\n  "{packed}"\n'
        f'export const treeLabelBits =\n  "{tree_bits}"\n'
    )
    SCSS.write_text(
        "/* Generated by site/scripts/herbert-park.py. Do not edit. */\n\n"
        f"$cols: {COLS};\n"
        f"$rows: {image.height};\n"
        f'$dots: "{dot_mask(image.height, image.width, DOT)}";\n'
        f'$dots-light: "{dot_mask(image.height, image.width, DOT_LIGHT)}";\n'
    )


if __name__ == "__main__":
    main()
