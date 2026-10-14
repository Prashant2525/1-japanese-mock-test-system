# Design System — Nihongo Mock

**Status:** APPROVED 2026-10-14. Direction **B "Tokyo Transit"** (D-046), tagline "Practice Smart. Pass with Confidence." (D-047), logo variants approved (D-048). This document is binding for all UI work (CLAUDE.md rule 13). Every colour, label and section listed as CMS-editable here is managed in the Admin CMS (D-030). The values below are the **defaults** seeded into the CMS.

Preview used for the decision: https://claude.ai/artifact/XNZRmr4e8HoxCs76bUZy9b (source `docs/design/visual-directions.html`; Directions A and C were rejected).

Last updated: 2026-10-14 (Phase 3 approved).

---

## 1. Brand

- **Logo:** red sun disc with a white torii gate and open book; wordmark "Nihongo" (navy) + "Mock" (red). Original files are in `nihongo-mock-logo-assets/`. Do not alter the artwork.
- **Variants to produce in Phase 8 (D-048):** outlined wordmark (no font dependency); reversed version (white "Nihongo", `#FF6B70` "Mock") for navy backgrounds; monochrome icon for ≤ 24px; lockups with the new tagline; a tagline-free header logo. All are uploaded to the CMS "Site settings" so an admin can swap them.
- **Tagline:** EN "Practice Smart. Pass with Confidence." · JA draft "賢く練習して、自信を持って合格へ。" (CMS-editable; JA reviewed under PA-6).
- **Voice:** clear, encouraging, exact. No promises of results, no official-affiliation claims.

## 2. Concept — "Tokyo Transit"

The student's journey is a train line. The **level check is a route: N5 → N4 → N3**. Each level is a station with its own line colour, like a metro map. The route line appears:
1. in the public "How it works" section (drawn on scroll);
2. during the level check (the current stage is the lit station);
3. on the "Your level" summary (the line ends at the student's station, with one celebratory animation);
4. on the student home and in results (the level badge uses the line colour).

Signage cues: condensed numerals for levels, durations and counts; pill-shaped "station" badges; strong navy "night" sections against light "day" sections.

## 3. Tokens (defaults; colours CMS-editable with contrast validation)

### Colour

| Token | Value | Use |
|---|---|---|
| `--night` | `#0F2340` | Hero and dark sections, primary text on light |
| `--night-2` | `#16294A` | Raised surfaces on dark |
| `--signal` | `#D7262F` | Primary CTA, brand accent (4.99:1 on white) |
| `--signal-hover` | `#B81E26` | CTA hover/pressed |
| `--day` | `#F2F4F8` | Page background (light sections) |
| `--surface` | `#FFFFFF` | Cards, forms, the runner |
| `--text` | `#0F2340` | Body text |
| `--text-muted` | `#4A5770` | Secondary text (7.3:1 on white) |
| `--text-on-night` | `#F3F6FB` | Text on dark |
| `--muted-on-night` | `#B8C4D8` | Secondary text on dark |
| `--line` | `#DCE2EC` | Borders, dividers |
| `--focus` | `#1D5FD1` (light) / `#FFD166` (on night) | Focus ring, 3px |
| `--success` | `#17803D` | Pass, saved |
| `--warning` | `#B25E00` | Time warnings, pending |
| `--danger` | `#B42318` | Fail, errors (always with an icon and a label) |
| `--info` | `#1F56B8` | Notices |

### Level line colours (seeded per level in the CMS)

`line` is decorative (≥ 3:1 against its background); `badge` carries white text (≥ 4.5:1).

| Level | line | badge |
|---|---|---|
| N5 / NAT 5Q | `#1E9E5A` | `#13703F` |
| N4 / NAT 4Q | `#E59A00` | `#8A5B00` |
| N3 / NAT 3Q | `#2B6BD8` | `#1F56B8` |
| N2 / NAT 2Q | `#7A4FC8` | `#6A42B5` |
| N1 / NAT 1Q | `#B0306A` | `#962858` |
| JFT A1 · A2.1 · A2.2 · A2 | `#14A3A3` · `#0E8A8A` · `#0B7285` · `#0A5F70` | `#0B6E6E` · `#0B6E6E` · `#095C6B` · `#084C5C` |

### Typography

| Role | Face | Weights | Use |
|---|---|---|---|
| Display | Zen Kaku Gothic New | 700, 900 | Headings, hero, section titles (JA + Latin) |
| Signage | Barlow Condensed | 600, 700 | Level codes (N5), numbers, durations, counts, station labels |
| Body | Noto Sans JP | 400, 500, 700 | All reading text, forms, the runner |
| Mono | IBM Plex Mono | 500 | Timer digits only |

Scale (rem): 0.75 · 0.875 · 1 · 1.125 · 1.25 · 1.5 · 2 · 2.5 · 3.25 · 4.25 (hero max, `clamp()`-based).
Japanese text: line-height ≥ 1.8, no letter-spacing, `line-break: strict`; furigana via `<ruby>` at about 50% size; minimum body 16px; runner question text 18–20px. Fonts are self-hosted and subset, with `font-display: swap`.

### Shape, space, depth

- Spacing: 4px base (4, 8, 12, 16, 24, 32, 48, 64, 96, 128).
- Radius: 6px inputs · 10px cards and buttons · 999px badges, pills and station markers.
- Shadow (card): `0 1px 0 var(--line), 0 10px 30px -22px rgba(15,35,64,.5)`; hover lifts 4px.
- Breakpoints: 360 · 640 · 768 · 1024 · 1280 · 1536.
- Dark mode: **not in scope** (not requested). The design already alternates night and day sections.

## 4. Motion (D-029, D-038)

- **Durations:** 120 ms instant · 200 ms quick · 320 ms base · 600 ms slow · 900–1200 ms scroll scenes.
- **Easing:** standard `cubic-bezier(.2,.7,.2,1)`; emphasised `cubic-bezier(.16,1,.3,1)`.
- **Signature moments:**
  - **Hero:** three skyline layers plus the sun move at different speeds (default speeds .02 / .09 / .18 / .32), with a red rail line along the bottom.
  - **Route draw:** the route line draws with scroll progress; stations light up and pulse once reached.
  - **"How it works":** pinned, scroll-driven scene on desktop (≥ 1024px); a stacked, non-pinned version on mobile.
  - **Page transitions** in the student area: a short horizontal slide, like a train pulling in (≤ 320 ms).
  - **"Your level":** a single celebratory sequence as the line reaches the student's station.
- **CMS animation presets per section:** `none` · `fade-up` · `stagger-children` · `parallax-slow` · `parallax-layers` (2–4 uploaded layers with speed presets) · `draw-route` · `scale-in` · `pin-and-reveal` (desktop only).
- **Reduced motion:** presets fall back to `none` or a 120 ms fade; the route is drawn complete and stations are lit; there is no pinning or parallax.
- **Performance:** animate only `transform` and `opacity`. GSAP loads on marketing routes only. Effects pause off-screen. Core Web Vitals budget per UX-R03.
- **Content is readable at rest:** nothing waits at `opacity: 0` for JavaScript.

## 5. Exam runner (UX-R04, identical everywhere)

White surface, navy text, no decorative motion, no parallax, no page transitions inside an attempt. The timer shows static digits that update each second; at 5 minutes and 1 minute remaining it changes colour (`--warning`, then `--danger`) **and** shows a text label. Answer targets are ≥ 44px. Keyboard: 1–4 to choose, ← → to navigate, F to flag. The top bar shows the test name, "Question n of N", the timer and a thin progress bar. Below it: the question palette (answered, unanswered, flagged) and Previous / Mark for review / Next.

## 6. Accessibility

WCAG 2.2 AA; visible 3px focus ring (`--focus`); semantic landmarks; labelled, keyboard-operable audio player; status = text + icon + colour; `lang="ja"` on Japanese content; level colours never carry meaning alone (the code "N4" is always shown).

## 7. Components (built once in Phase 8)

Buttons (primary signal, secondary outline, ghost-on-night), links, inputs, select, checkbox/radio, textarea, form field + validation, **station badge** (level code + line colour), status badges (free / owned until / paid), test card (coloured top rail = level line), material card, tabs, dialog, drawer, toast, data table, pagination, breadcrumb, language toggle (EN / 日本語), navbar (day and night variants), footer, skeletons, empty state, error state, audio player, PDF viewer frame, **route map** (static, scroll-drawn and progress variants), timer, progress bar, question card, option list, question palette, result score ring, section breakdown, answer-review item.

## 8. CMS-editable design surface (D-030)

Theme colours (validated against WCAG AA contrast before saving); level line and badge colours; logo variants, favicon, tagline; hero skyline/parallax layers (uploaded images or the built-in skyline) with speed presets; animation preset per page section; section order; all copy in EN/JA. **Not editable:** the runner's calm rules, reduced-motion behaviour, and accessibility minimums (safety invariants, D-020).
