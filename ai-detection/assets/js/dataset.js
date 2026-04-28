import { loadPublicResponses, loadMapping } from "./data.js";

function assetUrl(relPath) {
  const m = window.location.pathname.match(/^(.*\/ai-detection\/)/);
  const root = m ? m[1] : "/";
  return root + relPath.replace(/^\.?\//, "");
}

// ---------- Config ----------
const DEFAULT_COLS = [
  { key: "duration_sec",       label: "Duration (s)",   type: "num"   },
  { key: "score_total",        label: "Score",          type: "score" },
  { key: "device_type",        label: "Device",         type: "cat"   },
  { key: "affiliation",        label: "Affiliation",    type: "cat"   },
  { key: "age_group",          label: "Age group",      type: "cat"   },
  { key: "ai_familiarity",     label: "AI familiarity", type: "cat"   },
  { key: "gender",             label: "Gender",         type: "cat"   },
  { key: "ai_use_time",        label: "AI tool use",    type: "cat"   },
  { key: "social_media_time",  label: "Social media",   type: "cat"   },
];

const PAGE_SIZE = 25;

// Shorten affiliation strings for display
const SHORTEN = {
  "Class of 2026 (Seniors)":     "Seniors",
  "Class of 2027 (Juniors)":     "Juniors",
  "Class of 2028 (Sophomores)":  "Sophomores",
  "Class of 2029 (First-years)": "First-years",
};

function shorten(val) {
  return SHORTEN[val] ?? val ?? "";
}

// ---------- State ----------
let allRows = [];
let filteredRows = [];
let sortCol = "score_total";
let sortDir = "desc";
let currentPage = 1;
const colFilters = {};
let searchQuery = "";

// ---------- Build header ----------
function buildHeader() {
  const thead = document.getElementById("ds-thead");
  if (!thead) return;
  const tr = document.createElement("tr");
  DEFAULT_COLS.forEach(({ key, label, type }) => {
    const th = document.createElement("th");
    const sortable = type === "num" || type === "score" || type === "cat";
    if (sortable) th.classList.add("sortable");
    th.dataset.col = key;
    th.innerHTML = `<span class="ds-sort-icon">${label}</span>`;
    if (sortable) {
      th.addEventListener("click", () => {
        if (sortCol === key) {
          sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
          sortCol = key;
          sortDir = type === "num" || type === "score" ? "desc" : "asc";
        }
        applyAndRender();
        updateSortUI();
      });
    }
    tr.appendChild(th);
  });
  thead.appendChild(tr);
}

function updateSortUI() {
  document.querySelectorAll(".ds-table th").forEach((th) => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.col === sortCol) {
      th.classList.add(sortDir === "asc" ? "sort-asc" : "sort-desc");
    }
  });
}

// ---------- Build column filters ----------
function buildColFilters() {
  const container = document.getElementById("ds-col-filters");
  if (!container) return;

  const catCols = DEFAULT_COLS.filter((c) => c.type === "cat");
  const numCols = DEFAULT_COLS.filter((c) => c.type === "num" || c.type === "score");

  const html = [];

  // Categorical dropdowns
  catCols.forEach(({ key, label }) => {
    const uniqueVals = [...new Set(allRows.map((r) => r[key]).filter(Boolean))].sort();
    const opts = [`<option value="">All</option>`, ...uniqueVals.map((v) => `<option value="${v}">${shorten(v)}</option>`)].join("");
    html.push(`
      <div class="ds-col-filter">
        <span class="ds-col-filter-label">${label}</span>
        <select data-filter-col="${key}" aria-label="Filter by ${label}">${opts}</select>
      </div>
    `);
    colFilters[key] = { type: "cat", value: "" };
  });

  // Numeric ranges for Duration and Score
  numCols.forEach(({ key, label }) => {
    if (key === "Progress" || key === "imgCount") return;
    html.push(`
      <div class="ds-col-filter">
        <span class="ds-col-filter-label">${label}</span>
        <div class="ds-range-filter">
          <input type="number" data-range-min="${key}" placeholder="Min" aria-label="${label} min" />
          <span class="ds-range-sep">–</span>
          <input type="number" data-range-max="${key}" placeholder="Max" aria-label="${label} max" />
        </div>
      </div>
    `);
    colFilters[key] = { type: "num", min: "", max: "" };
  });

  container.innerHTML = html.join("");

  // Wire dropdowns
  container.querySelectorAll("select[data-filter-col]").forEach((sel) => {
    sel.addEventListener("change", () => {
      colFilters[sel.dataset.filterCol].value = sel.value;
      currentPage = 1;
      applyAndRender();
    });
  });

  // Wire numeric ranges
  container.querySelectorAll("input[data-range-min]").forEach((inp) => {
    inp.addEventListener("input", () => {
      colFilters[inp.dataset.rangeMin].min = inp.value;
      currentPage = 1;
      applyAndRender();
    });
  });
  container.querySelectorAll("input[data-range-max]").forEach((inp) => {
    inp.addEventListener("input", () => {
      colFilters[inp.dataset.rangeMax].max = inp.value;
      currentPage = 1;
      applyAndRender();
    });
  });
}

// ---------- Apply filters + sort ----------
function applyAndRender() {
  // Search
  const q = searchQuery.toLowerCase();

  filteredRows = allRows.filter((row) => {
    // Search
    if (q) {
      const haystack = DEFAULT_COLS.map((c) => (row[c.key] || "").toLowerCase()).join(" ");
      if (!haystack.includes(q)) return false;
    }
    // Column filters
    for (const [key, f] of Object.entries(colFilters)) {
      const val = row[key] ?? "";
      if (f.type === "cat" && f.value && val !== f.value) return false;
      if (f.type === "num") {
        const num = parseFloat(val);
        if (f.min !== "" && !isNaN(parseFloat(f.min)) && num < parseFloat(f.min)) return false;
        if (f.max !== "" && !isNaN(parseFloat(f.max)) && num > parseFloat(f.max)) return false;
      }
    }
    return true;
  });

  // Sort
  const colDef = DEFAULT_COLS.find((c) => c.key === sortCol);
  if (colDef) {
    const numeric = colDef.type === "num" || colDef.type === "score";
    filteredRows.sort((a, b) => {
      const av = a[sortCol] ?? "";
      const bv = b[sortCol] ?? "";
      let cmp;
      if (numeric) {
        cmp = (parseFloat(av) || 0) - (parseFloat(bv) || 0);
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  renderPage();
}

// ---------- Render table body ----------
function renderPage() {
  const tbody = document.getElementById("ds-tbody");
  if (!tbody) return;

  const rowCount = document.getElementById("ds-row-count");
  if (rowCount) rowCount.textContent = `${filteredRows.length.toLocaleString()} rows`;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filteredRows.slice(start, start + PAGE_SIZE);

  if (pageRows.length === 0) {
    tbody.innerHTML = `<tr class="ds-empty-row"><td colspan="${DEFAULT_COLS.length}"><div class="ds-empty-msg">No matching rows.</div></td></tr>`;
    updatePagination(totalPages);
    return;
  }

  const maxScore = 10;
  const scoreGradient = (s) => {
    const n = Math.max(0, Math.min(10, s)) / 10;
    const h = Math.round(n * 120); // 0=red, 120=green
    return `hsl(${h}, 70%, 55%)`;
  };

  tbody.innerHTML = pageRows.map((row) => {
    const cells = DEFAULT_COLS.map(({ key, type }) => {
      const raw = row[key] ?? "";
      if (type === "score") {
        const s = parseInt(raw, 10);
        const color = Number.isFinite(s) ? scoreGradient(s) : "var(--text-faint)";
        return `<td class="cell-num"><span class="ds-score-badge" style="background:${color}20;color:${color};border:1px solid ${color}40">${raw}</span></td>`;
      }
      if (type === "num") {
        const n = parseFloat(raw);
        const display = Number.isFinite(n) ? (Number.isInteger(n) ? n : n.toFixed(0)) : raw;
        return `<td class="cell-num">${display}</td>`;
      }
      // cat
      const display = shorten(raw);
      return `<td title="${raw}">${display}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  updatePagination(totalPages);
}

function updatePagination(totalPages) {
  const info = document.getElementById("ds-page-info");
  const prev = document.getElementById("ds-prev");
  const next = document.getElementById("ds-next");
  if (info) info.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prev) prev.disabled = currentPage <= 1;
  if (next) next.disabled = currentPage >= totalPages;
}

// ---------- CSV export ----------
function downloadCSV() {
  // Export all columns from the source data, not just the visible table columns
  const cols = allRows.length ? Object.keys(allRows[0]) : [];
  const header = cols.join(",");
  const escape = (v) => {
    const s = v ?? "";
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const rows = filteredRows.map((row) => cols.map((k) => escape(row[k])).join(","));
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ai-detection-study-dataset.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Image pool ----------
async function buildImagePool() {
  const grid = document.getElementById("ds-imgpool-grid");
  if (!grid) return;

  let mapping;
  try {
    mapping = await loadMapping();
  } catch (e) {
    grid.innerHTML = `<p style="font-family:var(--font-mono);font-size:12px;color:var(--text-faint);padding:var(--s-4)">Failed to load images.</p>`;
    return;
  }

  const real = mapping
    .filter((m) => m.Category === "REAL")
    .sort((a, b) => a.OriginalFilename.localeCompare(b.OriginalFilename));
  const fake = mapping
    .filter((m) => m.Category === "FAKE")
    .sort((a, b) => a.OriginalFilename.localeCompare(b.OriginalFilename));

  const renderGroup = (images, cat, label) => {
    const cards = images.map((img) => {
      const src = assetUrl(`assets/img/${cat}/${img.OriginalFilename}`);
      return `<div class="ds-img-card">
        <img src="${src}" alt="" loading="lazy" />
        <span class="ds-img-label ds-img-label--${cat}">${label}</span>
      </div>`;
    }).join("");
    return `<div class="ds-imgpool-group">
      <div class="ds-imgpool-group__head">
        <span class="ds-img-label ds-img-label--${cat}">${label}</span>
        <span class="ds-imgpool-group__count mono-label">${images.length} images</span>
      </div>
      <div class="ds-imgpool-cards">${cards}</div>
    </div>`;
  };

  grid.innerHTML =
    renderGroup(real, "real", "Real") +
    renderGroup(fake, "fake", "AI");
}

// ---------- Init ----------
async function init() {
  try {
    const responses = await loadPublicResponses();

    // Keep only rows with a valid score
    allRows = responses.filter((r) => r.score_total && r.score_total !== "");

    buildHeader();
    updateSortUI();
    buildColFilters();
    applyAndRender();

    // Search
    const searchEl = document.getElementById("ds-search");
    if (searchEl) {
      searchEl.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        applyAndRender();
      });
    }

    // Pagination
    document.getElementById("ds-prev")?.addEventListener("click", () => {
      if (currentPage > 1) { currentPage--; renderPage(); }
    });
    document.getElementById("ds-next")?.addEventListener("click", () => {
      const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
      if (currentPage < totalPages) { currentPage++; renderPage(); }
    });

    // Download
    document.getElementById("ds-download")?.addEventListener("click", downloadCSV);

    // Image pool — lazy-build on first open
    const poolDetails = document.getElementById("ds-imgpool-details");
    if (poolDetails) {
      poolDetails.addEventListener("toggle", () => {
        if (poolDetails.open && !poolDetails.dataset.loaded) {
          poolDetails.dataset.loaded = "true";
          buildImagePool();
        }
      });
    }

  } catch (err) {
    console.error("dataset.js error:", err);
    const tbody = document.getElementById("ds-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="padding:var(--s-7);text-align:center;color:var(--text-faint);font-family:var(--font-mono);font-size:12px">Failed to load dataset.</td></tr>`;
  }
}

init();
