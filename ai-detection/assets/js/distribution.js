import { loadMapping, loadResponses, loadFullResponses } from "./data.js";

function assetUrl(relPath) {
  const m = window.location.pathname.match(/^(.*\/ai-detection\/)/);
  const root = m ? m[1] : "/";
  return root + relPath.replace(/^\.?\//, "");
}

function chartTheme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k) => cs.getPropertyValue(k).trim();
  return {
    text: v("--text"),
    muted: v("--text-muted"),
    faint: v("--text-faint"),
    accent: v("--accent"),
    real: v("--real"),
    fake: v("--fake"),
    hairline: v("--hairline"),
  };
}

let chartInstance = null;
let allRows = [];
let allMapping = [];

// Active filter state
const filters = {
  device: "all",
  class: "all",
  familiarity: "all",
};

function applyFilters(rows) {
  return rows.filter((r) => {
    if (filters.device !== "all" && r.DeviceType !== filters.device) return false;
    if (filters.class !== "all" && r.Affiliation !== filters.class) return false;
    if (filters.familiarity !== "all" && r["AI Familiarity"]?.trim() !== filters.familiarity) return false;
    return true;
  });
}

function activeLabel() {
  const parts = [];
  const deviceMap = { "Laptop": "Laptop", "Mobile phone": "Mobile phone" };
  const classMap = {
    "Class of 2029": "First-years",
    "Class of 2028": "Sophomores",
    "Class of 2027": "Juniors",
    "Class of 2026": "Seniors",
    "Faculty/Staff": "Faculty/Staff",
  };
  const famMap = {
    "Somewhat familiar (I understand the basics)": "Somewhat familiar",
    "Very familiar (I actively use/create/work with AI-generated images)": "Very familiar",
    "Extremely familiar (In addition to the above, I could explain how it works to someone else)": "Extremely familiar",
  };
  if (filters.device !== "all") parts.push(deviceMap[filters.device] || filters.device);
  if (filters.class !== "all") parts.push(classMap[filters.class] || filters.class);
  if (filters.familiarity !== "all") parts.push(famMap[filters.familiarity] || "Custom familiarity");
  return parts.length ? parts.join(" · ") : "All participants";
}

function updateStats(rows) {
  const scores = rows.map((r) => parseInt(r.CalculatedScore, 10)).filter(Number.isFinite);
  const n = scores.length;
  const meanVal = n ? (scores.reduce((a, b) => a + b, 0) / n).toFixed(1) : "—";
  const sorted = [...scores].sort((a, b) => a - b);
  const medianVal = n ? sorted[Math.floor(n / 2)] : "—";

  const nEl = document.getElementById("dist-n");
  const meanEl = document.getElementById("dist-mean");
  const medEl = document.getElementById("dist-median");
  const meanDisp = document.getElementById("dist-mean-display");
  const activeEl = document.getElementById("dist-active-filters");

  if (nEl) nEl.textContent = n;
  if (meanEl) meanEl.textContent = meanVal;
  if (medEl) medEl.textContent = medianVal;
  if (meanDisp) meanDisp.textContent = meanVal;
  if (activeEl) activeEl.textContent = activeLabel();
}

function renderChart(rows) {
  updateStats(rows);

  const scores = rows.map((r) => parseInt(r.CalculatedScore, 10)).filter(Number.isFinite);
  const buckets = Array.from({ length: 11 }, () => 0);
  scores.forEach((s) => { if (s >= 0 && s <= 10) buckets[s]++; });

  const t = chartTheme();
  const labels = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

  // Color bars by score: low = fake-ish, high = real-ish, peak = accent
  const maxB = Math.max(...buckets);
  const barColors = buckets.map((v) => {
    const norm = v / maxB;
    return t.accent + Math.round((0.4 + norm * 0.55) * 255).toString(16).padStart(2, "0");
  });

  if (chartInstance) {
    chartInstance.data.datasets[0].data = buckets;
    chartInstance.data.datasets[0].backgroundColor = barColors;
    chartInstance.update({ duration: 500, easing: "easeOutQuart" });
    return;
  }

  Chart.defaults.font.family = "'Geist Mono', 'JetBrains Mono', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = t.muted;

  chartInstance = new Chart(document.getElementById("dist-chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Participants",
          data: buckets,
          backgroundColor: barColors,
          borderColor: t.accent + "66",
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: "easeOutQuart" },
      scales: {
        x: {
          title: {
            display: true,
            text: "Score (out of 10)",
            color: t.faint,
            font: { size: 11 },
          },
          grid: { color: t.hairline },
          ticks: { color: t.muted },
        },
        y: {
          title: {
            display: true,
            text: "Number of participants",
            color: t.faint,
            font: { size: 11 },
          },
          grid: { color: t.hairline },
          ticks: { color: t.muted, precision: 0 },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(17,17,20,0.95)",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          titleColor: t.text,
          bodyColor: t.muted,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: (items) => `Score: ${items[0].label}/10`,
            label: (ctx) => ` ${ctx.raw} participant${ctx.raw !== 1 ? "s" : ""}`,
          },
        },
      },
    },
  });
}

function buildFooledGrid(mistakes, tab) {
  const container = document.getElementById("dist-fooled-grid");
  if (!container) return;

  const filtered = Object.entries(mistakes)
    .filter(([, d]) => (tab === "real" ? d.cat === "REAL" : d.cat === "FAKE"))
    .sort((a, b) => b[1].pct - a[1].pct)
    .slice(0, 5);

  container.innerHTML = filtered.map(([, d]) => {
    const cat = d.cat.toLowerCase();
    const src = assetUrl(`assets/img/${cat}/${d.file}`);
    const pct = Math.round(d.pct * 100);
    const pillClass = cat === "real" ? "pill--real" : "pill--fake";
    const pillLabel = cat === "real" ? "Real" : "AI";
    return `
      <div class="fooled-card">
        <div class="fooled-card__img-wrap">
          <img src="${src}" alt="${pillLabel}" loading="lazy" decoding="async" />
          <div class="fooled-card__overlay"></div>
          <div class="fooled-card__pct">${pct}%<span class="fooled-card__pct-sub">wrong</span></div>
        </div>
        <div class="fooled-card__body">
          <span class="fooled-card__filename">${d.file}</span>
          <span class="pill ${pillClass}" style="padding:3px 8px;font-size:10px">
            <span class="pill__dot"></span>${pillLabel}
          </span>
        </div>
      </div>
    `;
  }).join("");
}

function wireFilters(allRowsRef, mistakesRef) {
  const groups = ["device", "class", "familiarity"];
  groups.forEach((group) => {
    const container = document.getElementById(`filter-${group}`);
    if (!container) return;
    container.querySelectorAll(".dist-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".dist-filter-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        filters[group] = btn.dataset.value;
        renderChart(applyFilters(allRowsRef));
      });
    });
  });

  // Tab toggle for fooled grid
  document.querySelectorAll(".dist-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".dist-tab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      buildFooledGrid(mistakesRef, tab.dataset.tab);
    });
  });
}

async function init() {
  try {
    const [mapping, responses, fullResponses] = await Promise.all([
      loadMapping(), loadResponses(), loadFullResponses(),
    ]);
    allRows = responses;
    allMapping = mapping;

    const rows = responses.filter((r) => r.CalculatedScore && r.CalculatedScore !== "");

    renderChart(rows);

    // Compute most-fooled from full responses (which have per-image Q-columns)
    const imgCols = mapping.map((m) => ({ qid: m.QuestionID, cat: m.Category, file: m.OriginalFilename }));
    const fullRows = fullResponses.filter((r) => r.CalculatedScore && r.CalculatedScore !== "");
    const mistakes = {};
    for (const img of imgCols) {
      const correct = img.cat === "REAL" ? "Real photograph" : "AI-generated image";
      let wrong = 0, total = 0;
      for (const row of fullRows) {
        if (row[img.qid]) { total++; if (row[img.qid] !== correct) wrong++; }
      }
      if (total > 0) mistakes[img.qid] = { pct: wrong / total, cat: img.cat, file: img.file };
    }

    buildFooledGrid(mistakes, "real");
    wireFilters(rows, mistakes);
  } catch (err) {
    console.error("distribution.js error:", err);
  }
}

init();
