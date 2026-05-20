# seamuswoodruff.github.io

Personal portfolio site for Seamus Woodruff — Digital and Computational Studies + Dance, Bowdoin College '26.

---

## Overview

Single-file static site built with HTML, CSS, and vanilla JS. No frameworks, no build step. All styles are inline in `index.html`.

**Live:** [seamuswoodruff.github.io](https://seamuswoodruff.github.io)

---

## Stack

- **HTML/CSS/JS** — single `index.html`, all styles inline
- **Fonts** — Fraunces (display), DM Sans (body), JetBrains Mono (labels) via Google Fonts
- **Tailwind** — not used; fully custom CSS with design tokens

---

## Structure

```
index.html          — full site
favicon.svg         — SW monogram favicon
Resume_Woodruff_current.pdf - classic resume
Photos/             — profile photo and assets
ai-detection/       — separate hosted project (seamuswoodruff.github.io/ai-detection)
```

---

## Sections

1. **Hero** — animated name reveal, profile photo, CTAs
2. **Marquee** — scrolling skills strips
3. **About** — bio, stats, skill pills
4. **Projects** — cards for five projects
5. **Experience** — timeline of jobs
6. **Contact** — email CTA + footer links
---

## Design Notes

- Color palette: warm off-white base (`#FAF8F2`) with sage green primary accent
- Dark mode available via toggle in top-right nav; defaults to light
- Custom cursor, scroll progress bar, scroll-triggered reveal animations
- Preloader on first visit
