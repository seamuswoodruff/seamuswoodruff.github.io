// Theme toggle: binds click handler to .theme-toggle buttons.
// Must run after nav is injected; nav.js calls bindThemeToggle().
export function bindThemeToggle(root = document) {
  const btns = root.querySelectorAll("[data-theme-toggle]");
  btns.forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      const html = document.documentElement;
      const now = html.getAttribute("data-theme") === "light" ? "dark" : "light";
      html.setAttribute("data-theme", now);
      try {
        localStorage.setItem("aid.theme", now);
      } catch {}
    });
  });
}
