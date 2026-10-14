"""Builds outlined Nihongo Mock logo variants (D-048) from the original artwork.

Text is shaped with HarfBuzz (kerning as browsers do) from Inter instanced at the same axes a
browser would use for the original SVG <text> (weight 750, tagline weight 650, default optical size 14 — matching the supplied PNG;
), then converted to paths at the original positions.
"""
import io
import math
import sys

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONT = sys.argv[1]
OUT = sys.argv[2]
TAGLINE = "PRACTICE SMART. PASS WITH CONFIDENCE."


def instance(wght, opsz):
    font = TTFont(FONT)
    inst = instantiateVariableFont(font, {"wght": wght, "opsz": opsz}, inplace=False)
    buf = io.BytesIO()
    inst.save(buf)
    data = buf.getvalue()
    return TTFont(io.BytesIO(data)), data


def text_path(font, data, text, x, y, size, letter_spacing):
    """Returns (svg path d, end x) for text drawn like SVG <text> with letter-spacing."""
    upem = font["head"].unitsPerEm
    face = hb.Face(data)
    hbfont = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": False})
    glyph_order = font.getGlyphOrder()
    glyph_set = font.getGlyphSet()
    scale = size / upem
    pen_x = x
    parts = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = glyph_order[info.codepoint]
        svg = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        gx = pen_x + pos.x_offset * scale
        gy = y - pos.y_offset * scale
        glyph_set[name].draw(TransformPen(svg, (scale, 0, 0, -scale, gx, gy)))
        d = svg.getCommands()
        if d:
            parts.append(d)
        pen_x += pos.x_advance * scale + letter_spacing
    return "".join(parts), pen_x


EMBLEM = """<g transform="translate(24 16)">
    <circle cx="94" cy="94" r="88" fill="url(#{gid})"/>
    <circle cx="94" cy="94" r="70" fill="none" stroke="#FFFFFF" stroke-opacity=".20" stroke-width="2"/>
    <path d="M47 48 H141 L134 59 H54 Z" fill="#FFFFFF"/>
    <path d="M58 61 H130 V70 H58 Z" fill="#FFFFFF"/>
    <path d="M66 70 H78 V104 H66 Z M110 70 H122 V104 H110 Z" fill="#FFFFFF"/>
    <path d="M27 112 C49 101 70 105 91 120 V158 C70 143 49 140 27 150 Z" fill="#FFFFFF"/>
    <path d="M161 112 C139 101 118 105 97 120 V158 C118 143 139 140 161 150 Z" fill="#FFFFFF"/>
    <path d="M94 120 V159" fill="none" stroke="#C92732" stroke-width="4" stroke-linecap="round"/>
    <path d="M42 120 C56 115 68 118 80 125 M42 130 C56 125 68 128 80 135 M146 120 C132 115 120 118 108 125 M146 130 C132 125 120 128 108 135" fill="none" stroke="#AAB7C8" stroke-width="2.5" stroke-linecap="round"/>
  </g>"""

GRADIENT = """<linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E64646"/><stop offset="1" stop-color="#B91F2B"/></linearGradient>"""

wm_font, wm_data = instance(750, 14)
tg_font, tg_data = instance(650, 14)

nihongo, nihongo_end = text_path(wm_font, wm_data, "Nihongo", 226, 112, 72, -2.5)
mock, mock_end = text_path(wm_font, wm_data, "Mock", 527, 112, 72, -2.5)
tagline, tagline_end = text_path(tg_font, tg_data, TAGLINE, 229, 170, 21, 4.1)

lockup_w = max(900, math.ceil(tagline_end + 24))
header_w = math.ceil(mock_end + 28)
print(f"Nihongo ends {nihongo_end:.1f} (Mock starts 527); Mock ends {mock_end:.1f}; tagline ends {tagline_end:.1f}")
print(f"lockup width {lockup_w}, header width {header_w}")

COLORS = {
    "default": {"nihongo": "#142B4A", "mock": "#C92732", "bar": "#C92732", "tag": "#5B6575"},
    "reversed": {"nihongo": "#FFFFFF", "mock": "#FF6B70", "bar": "#FF6B70", "tag": "#AAB7C8"},
}


def build(kind, colors, with_tagline, width, title):
    gid = f"nm-sun-{kind}"
    tag = f'\n  <path d="{tagline}" fill="{colors["tag"]}"/>' if with_tagline else ""
    desc = (
        "Nihongo Mock logo: a red sun emblem with a torii gate and an open book, the words Nihongo Mock"
        + (f", and the tagline {TAGLINE.title()}" if with_tagline else "")
        + "."
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="220" viewBox="0 0 {width} 220" role="img" aria-labelledby="t-{kind} d-{kind}">
  <title id="t-{kind}">{title}</title>
  <desc id="d-{kind}">{desc}</desc>
  <defs>{GRADIENT.format(gid=gid)}</defs>
  {EMBLEM.format(gid=gid)}
  <path d="{nihongo}" fill="{colors["nihongo"]}"/>
  <path d="{mock}" fill="{colors["mock"]}"/>
  <rect x="229" y="134" width="66" height="5" rx="2.5" fill="{colors["bar"]}"/>{tag}
</svg>
"""


files = {
    "nihongo-mock-logo.svg": build("logo", COLORS["default"], True, lockup_w, "Nihongo Mock"),
    "nihongo-mock-logo-reversed.svg": build("logo-rev", COLORS["reversed"], True, lockup_w, "Nihongo Mock"),
    "nihongo-mock-wordmark.svg": build("wm", COLORS["default"], False, header_w, "Nihongo Mock"),
    "nihongo-mock-wordmark-reversed.svg": build("wm-rev", COLORS["reversed"], False, header_w, "Nihongo Mock"),
}

ICON_SHAPES = """<path d="M49 43 H143 L136 55 H56 Z"/>
      <path d="M60 57 H132 V66 H60 Z"/>
      <path d="M68 66 H80 V101 H68 Z M112 66 H124 V101 H112 Z"/>
      <path d="M28 111 C50 100 72 104 93 119 V157 C72 142 50 139 28 149 Z"/>
      <path d="M164 111 C142 100 120 104 99 119 V157 C120 142 142 139 164 149 Z"/>"""

files["nihongo-mock-icon-mono.svg"] = f"""<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192" role="img" aria-labelledby="t-mono">
  <title id="t-mono">Nihongo Mock</title>
  <defs>
    <mask id="nm-mono-cut">
      <rect width="192" height="192" fill="#FFFFFF"/>
      <g fill="#000000">
      {ICON_SHAPES}
      </g>
    </mask>
  </defs>
  <!-- One colour (currentColor): the gate and book are cut out of the sun. For small sizes and monochrome use. -->
  <circle cx="96" cy="96" r="92" fill="currentColor" mask="url(#nm-mono-cut)"/>
</svg>
"""

for name, svg in files.items():
    with open(f"{OUT}/{name}", "w", encoding="utf-8", newline="\n") as fh:
        fh.write(svg)
    print("wrote", name, len(svg), "bytes")
