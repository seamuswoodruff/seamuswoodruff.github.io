# The AI Detection Study — website

Multi-page static site for a Bowdoin DCS3850 final project studying how well people distinguish real photographs from AI-generated images. Deploys as a subdirectory of [swoodruff.github.io](https://swoodruff.github.io/) at `/ai-detection/`.

## Stack
- Vanilla HTML + CSS + ES module JS. **No build step.**
- Fonts: Fraunces (display) + Geist (body) + Geist Mono (data/UI), via Google Fonts.
- Charts: Chart.js (CDN, included only on pages that need it).
- CSV parsing: built-in fallback parser in `assets/js/data.js`; can plug in PapaParse by adding a `<script>` tag if needed.

## Run locally
```sh
node serve.mjs
```
Opens on http://localhost:3000/ and also serves the same tree at http://localhost:3000/ai-detection/ so you can test the GitHub Pages subpath behaviour.

## Screenshot
```sh
# Puppeteer required. Install once:
npm install puppeteer

# Then:
node screenshot.mjs http://localhost:3000/ [optional-label]
```
Screenshots save to `./temporary screenshots/screenshot-N[-label].png` (auto-incremented).

## Deploy to GitHub Pages
Copy or commit the entire `ai-detection/` folder into your `swoodruff.github.io` repo as `ai-detection/`. Every path in the site is relative, so it works at both the repo root and the subdirectory.

From your personal homepage, link to it with:
```html
<a href="ai-detection/">The AI Detection Study →</a>
```

## Architecture

### Pages
```
/                       Homepage (hero, CTA, four-card explore grid)
/quiz/                  10-image test, 1-10 confidence slider per image, results reel
/findings/              Single-page narrative with modular sections (extensible)
/distribution/          Score histogram with device/class-year/familiarity filters
/dataset/               Paginated, searchable, sortable table with CSV download
/about/                 Methodology, team, limitations
```

### Shared chrome
Every page imports `assets/js/nav.js` which injects the site-wide nav and footer into `<header id="site-nav">` and `<footer id="site-footer">`. The nav has a dark/light theme toggle whose preference persists via `localStorage` under `aid.theme`. `theme-init.js` is inlined in `<head>` to prevent flash-of-wrong-theme.

### Design system
All tokens live in `assets/css/theme.css` as CSS custom properties. Swap dark/light by setting `data-theme="dark"` or `"light"` on `<html>`. Page-specific styles go in their own `.css` file (e.g. `home.css`, `quiz.css`).

### Data layer
`assets/js/data.js` exports:
- `loadMapping()` — promise, returns `[{QuestionID, Category, OriginalFilename, BlockDescription}, …]` with ATTN rows filtered out.
- `loadResponses()` — promise, returns the cleaned 446-row survey data.
- `pickImages(mapping, {count, balance})` — balanced random sample for the quiz.
- `scoreHistogram(responses, filterFn)` — 0–10 bucket counts.
- `percentile(responses, score, filterFn)` — percent of participants who scored below a given score.

CSV fetching is cached per-session; calling `loadMapping()` twice hits the network only once.

## Adding a new finding (later)
When you finish a new analysis and want to add it to the Findings page:
1. Open `findings/index.html`.
2. Duplicate one of the `<section class="finding">...</section>` blocks.
3. Swap the title, lede, stat callout, chart data, and interpretation prose.
4. If the finding needs a new chart, add a new `<canvas>` with a unique id and a new call in `assets/js/findings.js`.

No page reload logic or navigation wiring needed — the Findings page is a single scrollable document.

## File inventory
See `CLAUDE.md` for a quick tree, and `HANDOFF.md` for the build brief used to produce the current state.

## Credits
DCS3850, Bowdoin College, Spring 2026. Team: [add names]. Website by Seamus Woodruff.
