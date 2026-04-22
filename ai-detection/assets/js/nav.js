// Injects the site-wide nav and footer into every page.
// Each page includes <header id="site-nav"></header> and <footer id="site-footer"></footer>
// and marks its current page via <body data-page="home|quiz|findings|distribution|dataset|about">.

import { bindThemeToggle } from "./theme-toggle.js";

// Resolve the site base (handles /ai-detection/ subdir on GitHub Pages).
function siteBase() {
  const path = window.location.pathname;
  const m = path.match(/^(.*\/ai-detection)(\/|$)/);
  if (m) return m[1] + "/";
  // When served at the repo root locally we also strip everything up to the nearest folder.
  return "/";
}

const BASE = siteBase();
const link = (slug, label) =>
  `<a class="site-nav__link" href="${BASE}${slug}" data-nav="${slug === "" ? "home" : slug.replace(/\/$/, "")}">${label}</a>`;
const draw = (slug, label) =>
  `<a href="${BASE}${slug}" data-nav="${slug === "" ? "home" : slug.replace(/\/$/, "")}">${label}</a>`;

const ACTIONS_HTML = `
  <button class="theme-toggle" data-theme-toggle aria-label="Toggle colour theme" type="button">
    <svg class="theme-toggle__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
    <svg class="theme-toggle__moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
  </button>
  <button class="site-nav__mobile" data-menu-toggle aria-label="Open navigation" aria-expanded="false" type="button">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
  </button>
`;

const NAV_HTML_C = `
  <nav class="site-nav site-nav--c" aria-label="Primary">
    <div class="shell site-nav__inner">
      <a class="hnav-brand" href="${BASE}" aria-label="AI Detection Study home">
        <span class="hnav-brand__word hnav-brand__word--real">REAL</span>
        <span class="hnav-brand__plus" aria-hidden="true">+</span>
        <span class="hnav-brand__word hnav-brand__word--fake">FAKE</span>
      </a>
      <div class="hnav-c__right">
        <div class="site-nav__links" role="menubar">
          ${link("quiz/", "Take the test")}
          ${link("survey/", "Survey design")}
          ${link("findings/", "Findings")}
          ${link("distribution/", "Distribution")}
          ${link("dataset/", "Dataset")}
          ${link("about/", "About")}
        </div>
        <div class="site-nav__actions">${ACTIONS_HTML}</div>
      </div>
    </div>
    <div class="shell hnav-ticker" aria-hidden="true">
      <div class="hnav-ticker__track" data-ticker>
        <span class="hnav-ticker__item is-active">n = 508 · μ = 7.0 · laptop +0.6 vs mobile</span>
        <span class="hnav-ticker__item">80 images · 10 per participant · 508 responses</span>
        <span class="hnav-ticker__item">AI-familiarity effect ≈ 0 · r(duration, score) ≈ +0.04</span>
        <span class="hnav-ticker__item">median score = 7/10 · modal bucket = 7/10</span>
      </div>
    </div>
    <div class="site-nav__drawer" data-menu-drawer>
      ${draw("quiz/", "Take the test")}
      ${draw("survey/", "Survey design")}
      ${draw("findings/", "Findings")}
      ${draw("distribution/", "Distribution")}
      ${draw("dataset/", "Dataset")}
      ${draw("about/", "About")}
    </div>
  </nav>
`;

const NAV_HTML_D = `
  <nav class="site-nav site-nav--d" aria-label="Primary">
    <div class="hnav-pill" data-pill>
      <a class="hnav-pill__brand" href="${BASE}" aria-label="AI Detection Study home">
        <span class="hnav-pill__brand-word hnav-pill__brand-word--real">R</span>
        <span class="hnav-pill__brand-slash" aria-hidden="true">/</span>
        <span class="hnav-pill__brand-word hnav-pill__brand-word--fake">F</span>
      </a>
      <div class="site-nav__links hnav-pill__links" role="menubar">
        ${link("quiz/", "Take the test")}
        ${link("survey/", "Survey design")}
        ${link("findings/", "Findings")}
        ${link("distribution/", "Distribution")}
        ${link("dataset/", "Dataset")}
        ${link("about/", "About")}
      </div>
      <div class="site-nav__actions hnav-pill__actions">${ACTIONS_HTML}</div>
    </div>
    <div class="site-nav__drawer" data-menu-drawer>
      ${draw("quiz/", "Take the test")}
      ${draw("survey/", "Survey design")}
      ${draw("findings/", "Findings")}
      ${draw("distribution/", "Distribution")}
      ${draw("dataset/", "Dataset")}
      ${draw("about/", "About")}
    </div>
  </nav>
`;

const NAV_HTML = NAV_HTML_D;

const FOOTER_HTML = `
  <footer class="site-footer">
    <div class="shell">
      <div class="site-footer__meta">
        <span>DCS3850 · Bowdoin College · 2026</span>
        <span>n = 508 · 80 images · 10 per participant</span>
      </div>
    </div>
  </footer>
`;

function markCurrent() {
  const page = document.body.dataset.page || "home";
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === page) a.setAttribute("aria-current", "page");
  });
}

function wireMobileMenu() {
  const btn = document.querySelector("[data-menu-toggle]");
  const drawer = document.querySelector("[data-menu-drawer]");
  if (!btn || !drawer) return;
  btn.addEventListener("click", () => {
    const open = drawer.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

function revealOnLoad() {
  const els = document.querySelectorAll("[data-reveal]");
  els.forEach((el, i) => {
    const delay = Number(el.dataset.revealDelay ?? i * 60);
    el.style.setProperty("--reveal-delay", `${delay}ms`);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("is-revealed"));
    });
  });
}

function mountVariantC() {
  // Ticker rotation
  const items = document.querySelectorAll(".hnav-ticker__item");
  let i = 0;
  if (items.length > 1) {
    setInterval(() => {
      items[i].classList.remove("is-active");
      i = (i + 1) % items.length;
      items[i].classList.add("is-active");
    }, 5000);
  }
  // Scroll-collapse
  const navEl = document.querySelector(".site-nav--c");
  if (navEl) {
    const onScroll = () => { navEl.dataset.collapsed = window.scrollY > 32 ? "true" : "false"; };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
}

function mountVariantD() {
  const pill = document.querySelector("[data-pill]");
  if (pill) {
    const onScroll = () => { pill.dataset.floated = window.scrollY > 16 ? "true" : "false"; };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
}

function mount() {
  document.documentElement.dataset.header = "d";
  const nav = document.getElementById("site-nav");
  const ftr = document.getElementById("site-footer");
  if (nav) nav.outerHTML = NAV_HTML;
  if (ftr) ftr.outerHTML = FOOTER_HTML;
  bindThemeToggle();
  markCurrent();
  wireMobileMenu();
  revealOnLoad();
  mountVariantD();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
