// survey.js — animated count-up for sampling funnel numbers

function animateCount(el, target, duration = 1100) {
  const start = performance.now();
  const fmt = (n) => n >= 1000 ? n.toLocaleString() : String(n);

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    const current = Math.round(target * eased);
    el.textContent = fmt(current);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      animateCount(el, Number(el.dataset.count));
      observer.unobserve(el);
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll("[data-count]").forEach((el) => {
  el.textContent = "0";
  observer.observe(el);
});
