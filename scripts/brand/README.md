# Logo variants (D-048)

`public/brand/` holds the logo files the website uses. They are generated from the original artwork in `nihongo-mock-logo-assets/` (unchanged) with the wordmark converted to outlines, so the logo looks the same on every device without needing the Inter font.

| File | Use |
|---|---|
| `nihongo-mock-logo.svg` | Full lockup with tagline, light backgrounds |
| `nihongo-mock-logo-reversed.svg` | Full lockup, dark (night) backgrounds |
| `nihongo-mock-wordmark.svg` | Header logo without tagline, light backgrounds |
| `nihongo-mock-wordmark-reversed.svg` | Header logo without tagline, dark backgrounds |
| `nihongo-mock-icon.svg` | Favicon / app icon (original emblem) |
| `nihongo-mock-icon-mono.svg` | One-colour icon (`currentColor`) for small or monochrome use |

## Regenerating (only if the tagline or wordmark changes)

Requires Python 3.12+, plus the open-source Inter variable font from Google Fonts (`ofl/inter/Inter[opsz,wght].ttf`):

```bash
python -m venv .venv-brand && .venv-brand/Scripts/pip install fonttools==4.60.1 uharfbuzz==0.51.1
.venv-brand/Scripts/python scripts/brand/make_logos.py path/to/Inter.ttf public/brand
```

The tagline text is the `TAGLINE` constant in `make_logos.py`. The tagline shown on the website itself is editable in the CMS; this file only affects the logo artwork.
