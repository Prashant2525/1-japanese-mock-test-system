# Design System — Nihongo Mock

**Status:** PROPOSED — three visual directions waiting for the owner's choice. The shared foundations in §2 apply whichever direction is chosen. After approval, this document records the chosen direction's tokens and becomes binding (CLAUDE.md rule 13).

Live preview (animated, EN/JA switch, reduced-motion switch): https://claude.ai/artifact/XNZRmr4e8HoxCs76bUZy9b (private to the owner). Source: `docs/design/visual-directions.html`.

Last updated: 2026-10-14 (Phase 3 — proposal).

---

## 1. Brand inputs (D-005, D-031)

- Logo: red sun disc with a white torii gate and open book; wordmark "Nihongo" (navy `#142B4A`) + "Mock" (red `#C92732`), underline bar, tagline.
- Palette from the logo: sun gradient `#E64646 → #B91F2B`, brand red `#C92732`, navy `#142B4A`, slate `#5B6575`, mist `#AAB7C8`.
- Tagline: **"Practice Smart. Pass JLPT."** (kept, CMS-editable). Alternatives offered for the owner's choice:
  - "Practice Smart. Pass with Confidence."
  - "Practice Smart. Pass JLPT, NAT & JFT." (names all three exams)
  - "Your route to Japan, one level at a time." (pairs with Direction B)
- **Asset gaps (we can derive these; no new design needed):**
  1. The wordmark is live SVG text that depends on the Inter font. Convert it to outlines (KI-05).
  2. A **reversed logo** (white "Nihongo" for dark backgrounds) is needed for dark sections.
  3. A monochrome icon for small sizes and the browser tab.

## 2. Shared foundations (all directions)

### Tokens (CSS variables; colour tokens CMS-editable with contrast validation — D-030)
- **Colour roles:** `bg`, `surface`, `surface-raised`, `text`, `text-muted`, `brand` (red), `brand-ink` (navy), `accent`, `border`, `focus`, plus semantic `success`, `warning`, `danger`, `info`. Semantic colours never reuse the brand red, so "Fail" never looks like a brand accent.
- **Level colours:** one per level (N5…N1, NAT 5Q…1Q mapped, JFT tiers), used for badges and route lines; always shown with a text label (never colour alone).
- **Spacing:** 4px base (4, 8, 12, 16, 24, 32, 48, 64, 96, 128).
- **Radius, elevation, z-index, breakpoints** (360, 640, 768, 1024, 1280, 1536).

### Typography
- Japanese and Latin pairing per direction (§3). All faces self-hosted in the app (subset Japanese fonts, `font-display: swap`).
- Japanese body text: line-height ≥ 1.8, no letter-spacing, `line-break: strict`. Long Latin strings use `overflow-wrap: anywhere`. Headings use `text-wrap: balance`.
- Furigana via `<ruby>`/`<rt>` at about 50% size; it must not break line height in the runner.
- Minimum body size 16px; question text in the runner 18–20px.

### Motion system (D-029, D-038)
- **Durations:** instant 120 ms · quick 200 ms · base 320 ms · slow 600 ms · scene 900–1200 ms (scroll scenes only).
- **Easing:** standard `cubic-bezier(.2,.7,.2,1)`, emphasised `cubic-bezier(.16,1,.3,1)`.
- **CMS animation presets per section** (safe list): `none` · `fade-up` · `stagger-children` · `parallax-slow` · `parallax-layers` (2–4 image layers) · `draw-line` · `scale-in` · `pin-and-reveal` (desktop only).
- **Reduced motion:** every preset maps to `none` or a 120 ms opacity fade. Parallax layers render static. Smooth scrolling is off.
- **Performance:** animate only `transform` and `opacity`. GSAP is loaded on marketing routes only. Effects pause off-screen. Core Web Vitals budget per UX-R03.
- **Content is visible at rest:** nothing waits at `opacity: 0` for JavaScript; animations start from a readable state.

### Exam runner rules (all directions — UX-R04)
- Neutral surface, high-contrast text, no decorative motion, no parallax, no sound.
- The timer is static digits updated each second, never animated. A colour change plus a text label at 5 minutes and 1 minute remaining.
- Large tap targets (≥ 44px), visible focus, full keyboard operation (1–4 to choose an option, ← → to navigate, F to flag).

### Accessibility
WCAG 2.2 AA contrast; visible focus ring (`focus` token); semantic landmarks; labelled audio controls with keyboard support; statuses use text + icon + colour; `lang="ja"` on Japanese content for correct font shaping and screen readers.

### Component inventory (built once, used everywhere)
Buttons, links, inputs, select, checkbox/radio, textarea, form field with validation, cards (test card, material card, level card), badges (level, status, free/owned), tabs, dialog, drawer, toast, table (admin-style for student history), pagination, breadcrumb, language toggle, navbar, footer, skeletons, empty state, error state, audio player, PDF viewer frame, timer, progress bar, question card, option list, question palette, route/progress map (level path), result score ring, section breakdown, answer-review item.

## 3. The three directions

### Direction A — "Ink & Sun" (editorial, calm, trustworthy)
- **Idea:** a Japanese textbook page. White paper, navy sumi-ink type, a single red sun used sparingly. Vertical Japanese labels (縦書き) as accents.
- **Type:** Shippori Mincho B1 (display, JA + Latin) + Noto Sans JP (body) + IBM Plex Mono (numbers).
- **Motion:** the sun disc rises slowly behind the hero as you scroll; brush-stroke underlines draw in; sections reveal with gentle ink fades. Low to medium intensity.
- **Best for:** an exam-prep brand that wants to feel serious and credible.
- **Trade-off:** the least "wow" of the three.

### Direction B — "Tokyo Transit" (bold wayfinding, energetic) — **recommended**
- **Idea:** Japanese railway signage and route maps. **The level check is drawn as a train line: N5 → N4 → N3 stations**, which light up as the student progresses. The same route line appears on the dashboard and results. Each level has its own line colour, like a metro map.
- **Type:** Zen Kaku Gothic New (heavy display, JA + Latin) + Barlow Condensed (station numerals and labels) + Noto Sans JP (body).
- **Motion:** the route line draws itself on scroll, stations pulse as they are reached, a layered city-skyline parallax sits in the hero, and the "how it works" section is pinned and scroll-driven. Medium to high intensity.
- **Best for:** the owner's "best UI, animation, parallax" brief. The metaphor ties directly to the core feature (N5-first progression) and to learners preparing for life and work in Japan.
- **Trade-off:** the most custom illustration and animation work; needs disciplined restraint inside the student area.

### Direction C — "Washi Layers" (soft depth, friendly)
- **Idea:** layered paper cut-outs (mountain, torii, clouds, sun) stacked with soft shadows, giving deep multi-layer parallax. Rounded type, warm and approachable.
- **Type:** Zen Maru Gothic (rounded display/body, JA) + Nunito (Latin).
- **Motion:** 4-layer paper parallax in the hero, cards lift like paper on hover, clouds drift slowly. High parallax, gentle everything else.
- **Best for:** beginners (N5/N4), a friendly and low-anxiety feel.
- **Trade-off:** risks looking playful rather than exam-serious; rounded type is less crisp for dense Japanese reading.

## 4. Owner decision needed

1. Choose **A, B or C** (or name elements to combine, e.g. "B with A's typography").
2. Choose the tagline: keep "Practice Smart. Pass JLPT." or one of the alternatives in §1.
3. Approve deriving the logo variants in §1 (outlined wordmark, reversed logo, monochrome icon) without changing the design.
