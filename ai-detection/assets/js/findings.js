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
    surface: v("--surface"),
  };
}

function setChartDefaults() {
  const t = chartTheme();
  Chart.defaults.font.family = "'Geist Mono', 'JetBrains Mono', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = t.muted;
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = "rgba(17,17,20,0.95)";
  Chart.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,0.1)";
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.titleColor = t.text;
  Chart.defaults.plugins.tooltip.bodyColor = t.muted;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
}

function gridColor() {
  return chartTheme().hairline;
}

// ---------- Device histogram chart ----------
function buildDeviceChart(laptopHist, mobileHist) {
  const t = chartTheme();
  const total = (arr) => arr.reduce((a, b) => a + b, 0);
  const lTotal = total(laptopHist);
  const mTotal = total(mobileHist);
  const labels = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const laptopPct = laptopHist.map((n) => lTotal ? +((n / lTotal) * 100).toFixed(1) : 0);
  const mobilePct = mobileHist.map((n) => mTotal ? +((n / mTotal) * 100).toFixed(1) : 0);

  new Chart(document.getElementById("chart-device"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Laptop",
          data: laptopPct,
          backgroundColor: t.accent + "cc",
          borderColor: t.accent,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: "Mobile",
          data: mobilePct,
          backgroundColor: t.fake + "99",
          borderColor: t.fake,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        x: {
          title: { display: true, text: "Score (0–10)", color: chartTheme().faint, font: { size: 10 } },
          grid: { color: gridColor() },
          ticks: { color: chartTheme().muted },
        },
        y: {
          title: { display: true, text: "% of respondents", color: chartTheme().faint, font: { size: 10 } },
          grid: { color: gridColor() },
          ticks: { color: chartTheme().muted, callback: (v) => v + "%" },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%`,
          },
        },
      },
    },
  });
}

// ---------- Confidence vs accuracy chart ----------
function buildConfidenceChart(pctCorrect, totals) {
  const t = chartTheme();
  const labels = ["1–2", "3–4", "5–6", "7–8", "9–10"];

  new Chart(document.getElementById("chart-confidence"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "% correct",
          data: pctCorrect.map((v) => +v.toFixed(1)),
          backgroundColor: labels.map((_, i) => {
            const alpha = 0.55 + (i / 4) * 0.4;
            return t.accent + Math.round(alpha * 255).toString(16).padStart(2, "0");
          }),
          borderColor: t.accent,
          borderWidth: 1,
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        x: {
          title: { display: true, text: "Confidence (1–10)", color: chartTheme().faint, font: { size: 10 } },
          grid: { color: gridColor() },
          ticks: { color: chartTheme().muted },
        },
        y: {
          title: { display: true, text: "% correct answers", color: chartTheme().faint, font: { size: 10 } },
          grid: { color: gridColor() },
          ticks: { color: chartTheme().muted, callback: (v) => v + "%" },
          min: 40,
          max: 85,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `Confidence ${items[0].label}`,
            label: (ctx) => ` ${ctx.raw}% correct  (n = ${totals[ctx.dataIndex]})`,
          },
        },
      },
    },
  });

  const el = document.getElementById("conf-caption");
  const totalN = totals.reduce((a, b) => a + b, 0);
  if (el) el.textContent = `Pooled across all image-answer pairs · n = ${totalN.toLocaleString()}`;
}

// ---------- Timing scatter chart ----------
function buildTimingChart(points, r) {
  const t = chartTheme();

  new Chart(document.getElementById("chart-timing"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Participant",
          data: points,
          backgroundColor: t.accent + "40",
          borderColor: t.accent + "80",
          borderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 700, easing: "easeOutQuart" },
      scales: {
        x: {
          title: { display: true, text: "Survey duration (seconds)", color: chartTheme().faint, font: { size: 10 } },
          grid: { color: gridColor() },
          ticks: { color: chartTheme().muted },
          min: 0,
          max: 1200,
        },
        y: {
          title: { display: true, text: "Score (0–10)", color: chartTheme().faint, font: { size: 10 } },
          grid: { color: gridColor() },
          ticks: { color: chartTheme().muted },
          min: 0,
          max: 10,
          stepSize: 1,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${Math.round(ctx.raw.x)}s · score ${ctx.raw.y}`,
          },
        },
      },
    },
  });

  const cap = document.getElementById("timing-caption");
  if (cap) cap.textContent = `Pearson r = ${r >= 0 ? "+" : ""}${r.toFixed(2)} · n = ${points.length} · clipped at 1200s`;
}

// ---------- Familiarity bars ----------
function buildFamiliarityBars(famOrder, famShort, famScores) {
  const container = document.getElementById("familiarity-bars");
  if (!container) return;

  const maxMean = 10;
  const html = famOrder.map((key, i) => {
    const scores = famScores[key] || [];
    const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const widthPct = (mean / maxMean) * 100;
    return `
      <div class="fam-bar-row">
        <div class="fam-bar-label" title="${key}">${famShort[i]}</div>
        <div class="fam-bar-track">
          <div class="fam-bar-fill" style="width:${widthPct}%" data-target="${widthPct}"></div>
        </div>
        <div>
          <div class="fam-bar-val">${mean.toFixed(1)}</div>
          <div class="fam-bar-n">n=${scores.length}</div>
        </div>
      </div>
    `;
  }).join("");
  container.innerHTML = html;

  // Animate bars in when they scroll into view
  const fills = container.querySelectorAll(".fam-bar-fill");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-animated");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  fills.forEach((f) => obs.observe(f));
}

// ---------- Affiliation bar chart (age finding) ----------
// Values from PDF slide "Score across affiliation" (n=418 analytic sample)
function buildAffiliationChart() {
  const canvas = document.getElementById("chart-affiliation");
  if (!canvas) return;
  const t = chartTheme();

  const groups = [
    { label: "Faculty / Staff", mean: 6.43, n: 74 },
    { label: "Juniors", mean: 6.93, n: 54 },
    { label: "Sophomores", mean: 6.97, n: 89 },
    { label: "First-years", mean: 7.15, n: 93 },
    { label: "Seniors", mean: 7.19, n: 108 },
  ];

  // Colour by whether over-25 (faculty/staff = danger tint, students = accent tint)
  const colors = groups.map((g) =>
    g.label === "Faculty / Staff"
      ? t.fake + "cc"
      : t.accent + "99"
  );
  const borders = groups.map((g) =>
    g.label === "Faculty / Staff" ? t.fake : t.accent
  );

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: groups.map((g) => g.label),
      datasets: [
        {
          label: "Mean score",
          data: groups.map((g) => g.mean),
          backgroundColor: colors,
          borderColor: borders,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        x: {
          title: { display: true, text: "Mean score (out of 10)", color: chartTheme().faint, font: { size: 10 } },
          grid: { color: gridColor() },
          ticks: { color: chartTheme().muted },
          min: 5.5,
          max: 8,
        },
        y: {
          grid: { display: false },
          ticks: { color: chartTheme().muted },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const g = groups[ctx.dataIndex];
              return ` Mean: ${g.mean.toFixed(2)}  (n = ${g.n})`;
            },
          },
        },
      },
    },
  });
}

// ---------- Most-fooled grid ----------
function buildFooledGrid(realMistakes, fakeMistakes) {
  const container = document.getElementById("fooled-grid");
  if (!container) return;

  const makeCard = ([qid, d]) => {
    const cat = d.cat.toLowerCase();
    const src = assetUrl(`assets/img/${cat}/${d.file}`);
    const pct = Math.round(d.pct * 100);
    const pillClass = cat === "real" ? "pill--real" : "pill--fake";
    const pillLabel = cat === "real" ? "Real photo" : "AI-generated";
    return `
      <div class="fooled-card">
        <div class="fooled-card__img-wrap">
          <img src="${src}" alt="${pillLabel}" loading="lazy" decoding="async" />
          <div class="fooled-card__overlay"></div>
          <div class="fooled-card__pct">
            ${pct}%
            <span class="fooled-card__pct-sub">got it wrong</span>
          </div>
        </div>
        <div class="fooled-card__body">
          <span class="fooled-card__filename">${d.file}</span>
          <span class="pill ${pillClass}" style="padding:4px 9px;font-size:10px">
            <span class="pill__dot"></span>${pillLabel}
          </span>
        </div>
      </div>
    `;
  };

  const realSection = `
    <div class="findings-fooled-divider">
      <div class="findings-fooled-divider__line"></div>
      <div class="findings-fooled-divider__label text-real">Real photos — mistaken for AI</div>
      <div class="findings-fooled-divider__line"></div>
    </div>
    ${realMistakes.map(makeCard).join("")}
    <div class="findings-fooled-divider">
      <div class="findings-fooled-divider__line"></div>
      <div class="findings-fooled-divider__label text-fake">AI images — mistaken for real</div>
      <div class="findings-fooled-divider__line"></div>
    </div>
    ${fakeMistakes.map(makeCard).join("")}
  `;
  container.innerHTML = realSection;
}

// ---------- Animate scale-bars on scroll ----------
function animateScaleBars(selector) {
  const bars = document.querySelectorAll(selector);
  if (!bars.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-animated");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  bars.forEach((b) => obs.observe(b));
}

// ---------- Main ----------
async function init() {
  try {
    setChartDefaults();
    const [mapping, responses, fullResponses] = await Promise.all([
      loadMapping(), loadResponses(), loadFullResponses(),
    ]);

    // Lite responses (508 rows) — used for all stats except most-fooled
    const rows = responses.filter((r) => r.CalculatedScore && r.CalculatedScore !== "");

    const imgCols = mapping.map((m) => ({
      qid: m.QuestionID,
      cat: m.Category,
      file: m.OriginalFilename,
    }));

    // Hero stat
    const allScores = rows.map((r) => parseInt(r.CalculatedScore, 10)).filter(Number.isFinite);
    const globalMean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const meanEl = document.getElementById("stat-mean");
    if (meanEl) meanEl.textContent = globalMean.toFixed(1);

    // Device scores (DeviceType already decoded to "Laptop"/"Mobile phone" in data.js)
    const byDevice = (tag) =>
      rows.filter((r) => r.DeviceType === tag).map((r) => parseInt(r.CalculatedScore, 10)).filter(Number.isFinite);
    const laptopScores = byDevice("Laptop");
    const mobileScores = byDevice("Mobile phone");
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const laptopEl = document.getElementById("stat-laptop");
    const mobileEl = document.getElementById("stat-mobile");
    if (laptopEl) laptopEl.textContent = mean(laptopScores).toFixed(1);
    if (mobileEl) mobileEl.textContent = mean(mobileScores).toFixed(1);

    // Device histogram
    const buckets11 = () => Array.from({ length: 11 }, () => 0);
    const laptopHist = buckets11();
    const mobileHist = buckets11();
    laptopScores.forEach((s) => { if (s >= 0 && s <= 10) laptopHist[s]++; });
    mobileScores.forEach((s) => { if (s >= 0 && s <= 10) mobileHist[s]++; });
    buildDeviceChart(laptopHist, mobileHist);

    // Confidence vs accuracy — uses Question1..10 (TP/TN/FP/FN) + Question1Conf..10Conf
    const confBuckets = [0, 0, 0, 0, 0];
    const confTotal = [0, 0, 0, 0, 0];

    for (const row of rows) {
      for (let q = 1; q <= 10; q++) {
        const result = row[`Question${q}`];
        const conf = parseFloat(row[`Question${q}Conf`]);
        if (!result || !Number.isFinite(conf)) continue;
        const correct = result === "TP" || result === "TN";
        const bucket = Math.min(4, Math.floor((conf - 1) / 2));
        confBuckets[bucket] += correct ? 1 : 0;
        confTotal[bucket]++;
      }
    }

    const confAccuracy = confBuckets.map((c, i) =>
      confTotal[i] > 0 ? (c / confTotal[i]) * 100 : 0
    );
    buildConfidenceChart(confAccuracy, confTotal);

    // Duration vs score scatter
    const scatter = [];
    for (const row of rows) {
      const d = parseFloat(row["Duration (in seconds)"]);
      const s = parseInt(row.CalculatedScore, 10);
      if (Number.isFinite(d) && Number.isFinite(s) && d > 0 && d <= 1200) {
        scatter.push({ x: Math.round(d), y: s });
      }
    }

    const n = scatter.length;
    const mx = scatter.reduce((a, p) => a + p.x, 0) / n;
    const my = scatter.reduce((a, p) => a + p.y, 0) / n;
    const num = scatter.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0);
    const den = Math.sqrt(
      scatter.reduce((a, p) => a + (p.x - mx) ** 2, 0) *
      scatter.reduce((a, p) => a + (p.y - my) ** 2, 0)
    );
    buildTimingChart(scatter, num / den);

    // Familiarity — uses "AI Familiarity" column
    const FAM_ORDER = [
      "Not familiar at all (I've never heard of this)",
      "Slightly familiar (I've heard the term but don't know much)",
      "Somewhat familiar (I understand the basics)",
      "Very familiar (I actively use/create/work with AI-generated images)",
      "Extremely familiar (In addition to the above, I could explain how it works to someone else)",
    ];
    const FAM_SHORT = [
      "Not familiar",
      "Slightly familiar",
      "Somewhat familiar",
      "Very familiar",
      "Extremely familiar",
    ];

    const famScores = {};
    for (const row of rows) {
      const f = row["AI Familiarity"]?.trim();
      const s = parseInt(row.CalculatedScore, 10);
      if (f && Number.isFinite(s)) {
        famScores[f] = famScores[f] || [];
        famScores[f].push(s);
      }
    }
    buildFamiliarityBars(FAM_ORDER, FAM_SHORT, famScores);
    buildAffiliationChart();
    animateScaleBars(".findings-who__bar");
    animateScaleBars(".findings-ladder__bar");

    // Most-fooled images — uses full responses (Q80/Q81_1 pattern)
    const fullRows = fullResponses.filter((r) => r.CalculatedScore && r.CalculatedScore !== "");
    const mistakes = {};
    for (const img of imgCols) {
      const correct = img.cat === "REAL" ? "Real photograph" : "AI-generated image";
      let wrong = 0;
      let total = 0;
      for (const row of fullRows) {
        if (row[img.qid]) {
          total++;
          if (row[img.qid] !== correct) wrong++;
        }
      }
      if (total > 0) {
        mistakes[img.qid] = { pct: wrong / total, cat: img.cat, file: img.file, wrong, total };
      }
    }

    const realMistakes = Object.entries(mistakes)
      .filter(([, d]) => d.cat === "REAL")
      .sort((a, b) => b[1].pct - a[1].pct)
      .slice(0, 3);

    const fakeMistakes = Object.entries(mistakes)
      .filter(([, d]) => d.cat === "FAKE")
      .sort((a, b) => b[1].pct - a[1].pct)
      .slice(0, 3);

    buildFooledGrid(realMistakes, fakeMistakes);
  } catch (err) {
    console.error("findings.js init error:", err);
  }
}

init();
