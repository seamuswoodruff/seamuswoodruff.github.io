# AI Detection Study — Claude Code Handoff

**Project owner:** Seamus Woodruff (Bowdoin College, DCS3850)
**Live site:** https://swoodruff.github.io/ai-detection/
**Local path:** `/Users/swoodruff/Claude/group project/ai-detection/`

---

## What this project is

A static research website presenting the results of a study where 508 Bowdoin students, faculty, and staff tried to distinguish real photographs from AI-generated images. It includes:

- A **quiz** where new visitors can take the same 10-image test
- A **findings** page with 7 statistical findings + conclusion
- A **distribution** page with a filterable score histogram
- A **dataset** page with a searchable/sortable data table + full labeled image pool
- A **survey design** page explaining methodology
- An **about** page with team info and hypotheses

**Stack:** Pure vanilla HTML + CSS + JS. No build step, no frameworks, no npm. Everything is hand-edited static files. Chart.js (CDN) is the only external dependency.

---

## File structure

```
ai-detection/
├── index.html                  ← Homepage
├── quiz/index.html             ← Take the test (10-image quiz)
├── findings/index.html         ← Main findings page
├── distribution/index.html     ← Score histogram
├── dataset/index.html          ← Data table + image pool
├── survey/index.html           ← Survey design / methodology
├── about/index.html            ← Team + hypotheses
├── favicon.svg
├── assets/
│   ├── css/
│   │   ├── theme.css           ← Global design tokens, typography, layout
│   │   ├── findings.css        ← Findings-specific layout (incl. two-col grid)
│   │   ├── quiz.css
│   │   ├── distribution.css
│   │   ├── dataset.css
│   │   ├── home.css
│   │   ├── survey.css
│   │   └── about.css
│   ├── js/
│   │   ├── nav.js              ← Injects shared site nav into every page
│   │   ├── theme-init.js       ← Dark/light mode init (runs before paint)
│   │   ├── theme-toggle.js
│   │   ├── data.js             ← Shared data loading utilities
│   │   ├── quiz.js             ← Full quiz logic (pill buttons, glitch, construct)
│   │   ├── findings.js         ← Chart rendering for findings page
│   │   ├── distribution.js     ← Histogram + filter logic
│   │   ├── dataset.js          ← Table, pagination, search, image pool lazy-load
│   │   ├── home.js
│   │   └── survey.js
│   ├── data/
│   │   ├── responses.csv       ← Main cleaned dataset (508 rows)
│   │   ├── responses_public.csv
│   │   ├── responses_full.csv
│   │   ├── mapping.csv         ← Image filename → real/fake label mapping
│   │   └── construct.json      ← Data for the blue-pill "construct" easter egg
│   ├── audio/
│   │   └── knock-knock.mp3     ← Plays when blue pill ("Or don't...") is clicked
│   └── img/
│       ├── hero/               ← Red/blue pill images for quiz hero
│       ├── real/               ← Real photographs used in study
│       ├── fake/               ← AI-generated images used in study
│       └── construct/          ← Images shown in the Matrix "construct" easter egg
```

---

## Design system

All design tokens are in `assets/css/theme.css`. Key ones:

| Token | Value / meaning |
|---|---|
| `--accent` | Orange — used for "real" highlights and Finding 01 pill |
| `--fake` | Purple — used for AI/fake highlights and Finding 03 pill |
| `--real` | Green/teal — used for real photo highlights |
| `--s-1` … `--s-10` | Spacing scale |
| `--font-mono` | Monospace font |
| `data-theme="dark"` | Default theme on `<html>` |

**Reveal animations:** Elements with `data-reveal` fade in on scroll. `data-reveal-delay="80"` staggers them by 80ms.

---

## Findings page architecture (most complex page)

Each finding uses a two-column grid layout defined in `findings.css`:

```html
<div class="findings-two-col">               <!-- or findings-two-col--rev for flipped -->
  <div class="findings-copy__head">          <!-- Row 1: eyebrow pill + h2 -->
    <span class="pill ...">Finding 0X</span>
    <h2 class="section">Heading text</h2>
  </div>
  <div class="findings-copy__body">          <!-- Row 2: body text, stats, etc. -->
    <p>...</p>
  </div>
  <div class="findings-chart-wrap">          <!-- Row 2: chart (aligns to bottom of h2) -->
    <canvas ...></canvas>
  </div>
</div>
```

**Key CSS pattern** (`findings.css`): Uses `grid-template-rows: auto 1fr` so that Row 1 auto-sizes to the tallest h2, and the chart always starts at the same vertical level as the first paragraph of body copy. `--rev` variant flips columns using explicit `grid-column` assignments.

**Finding order (current):**
1. Finding 01 — Hypothesis 1 (device type effect) — orange pill
2. Finding 02A — Device × real images
3. Finding 02B — Device × AI images
4. Finding 03 — Hypothesis 2 (AI familiarity, falsified) — purple pill
5. Finding 04 — Confidence ratings
6. Finding 05 — Response time
7. Finding 06 — Age / class year
8. Conclusion (centered, full-width)
9. Bonus finding (hardest images — real mistaken for AI and vice versa)
10. Limitations

---

## Quiz easter egg (blue pill / construct)

The quiz hero has two pill buttons:
- **Red pill** ("Take the test") → starts the quiz
- **Blue pill** ("Or don't...") → triggers a glitch animation then shows a Matrix-themed "construct" stage

When the construct stage opens:
- It displays a scrolling image reel from `assets/img/construct/`
- It types "Knock, knock, Neo." letter by letter
- It plays `assets/audio/knock-knock.mp3`

Relevant JS: `quiz.js` — `enterConstruct()` function, `fireGlitch()`, `typeWriter()`.

---

## Dataset page — image pool

The full labeled image pool lives inside a `<details>` accordion at the bottom of `dataset/index.html` (`id="ds-imgpool-details"`). It lazy-loads images on first open to avoid loading 80 images on page load.

**Auto-open behavior:** If a visitor arrives at `dataset/#image-pool` (e.g. from the quiz results page "Browse the full labeled image pool" link), `dataset.js` will:
1. Strip the hash via `history.replaceState` (prevents browser's native anchor scroll)
2. Open the `<details>` element programmatically
3. After 50ms, scroll so the accordion top sits just below the nav bar

---

## Recent changes (this polishing session)

A full pass was made across every page. Major changes:

- **Findings page:** Completely restructured. Findings reordered (07A/07B → 02A/02B; familiarity finding → 03). All findings converted to `findings-copy__head` / `findings-copy__body` split for CSS grid alignment. Chart alignment fixed so visuals always align to bottom of h2. "Who took the survey" section removed. "Regression Method" section removed. "In short" replaced with centered `<h2>Conclusion</h2>`. "Bonus finding" (hardest images) moved to after Conclusion. Finding 01 pill changed to orange. Finding 03 pill kept purple.
- **Survey design page:** "Why this study" section removed. Sections renumbered 01–08. `&` → `and` in "Variables and measurement". `·` removed from all section eyebrows.
- **About page:** All header periods removed. `id="future-directions"` added to Future directions section. H1/H2 swapped.
- **Homepage:** Section eyebrows removed. H2s now carry the text formerly in H1s. Explore card numbers/dots removed. Card meta text and descriptions updated.
- **Dataset page:** Hero changed to "Our data". Description updated. Image pool auto-open on hash nav implemented.
- **Distribution page:** Hero period removed. H2 changed to "The hardest images to detect". Eyebrow removed. Em dash → comma in lede.
- **Quiz page:** "Browse the full labeled image pool" link goes to `../dataset/#image-pool`. Knock Knock.mp3 plays on blue pill click.

---

## Things to be aware of

- **No build step** — edits take effect immediately on save. Just open the local files in a browser or use a simple static server.
- **Sed cascade bug** — if you ever renumber sections with sed, use line-specific addresses (`'57s|...|...|'`) rather than global substitution, otherwise numbers cascade (e.g. 08→07, then the new 07 gets caught by 07→06, etc.).
- **`findings-two-col--rev`** — when inserting a new finding, check that all subsequent `--rev` classes still alternate correctly (odd findings left-chart, even findings right-chart or vice versa).
- **Image pool is lazy** — `buildImagePool()` only runs on first `toggle` open of the `<details>`. Don't move it outside that listener.
- The `data-theme="dark"` on `<html>` sets the default. `theme-init.js` reads localStorage and overrides it before first paint to prevent flash.
