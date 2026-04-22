// Shared CSV loaders + helpers.
// Uses PapaParse loaded via a <script src="https://...papaparse..."> in the page,
// OR falls back to a minimal local parser if Papa is unavailable.

function resolveAsset(relPath) {
  // Walk up to find the /ai-detection/ root, then resolve relative to that.
  const here = window.location.pathname;
  const m = here.match(/^(.*\/ai-detection\/)/);
  const root = m ? m[1] : "/";
  return root + relPath.replace(/^\.?\//, "");
}

function parseCSV(text) {
  if (window.Papa && typeof window.Papa.parse === "function") {
    const res = window.Papa.parse(text, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
    });
    return res.data;
  }
  // Minimal fallback: handles quoted fields & newlines.
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (c === "\r") {
        // skip
      } else cur += c;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  const head = rows.shift() ?? [];
  return rows.map((r) => {
    const o = {};
    head.forEach((k, i) => (o[k] = r[i] ?? ""));
    return o;
  });
}

const DEVICE_TYPE = { "0": "Laptop", "1": "Mobile phone", "2": "Other" };

let _mapping = null;
let _responses = null;
let _responsesFullObj = null;

export async function loadMapping() {
  if (_mapping) return _mapping;
  const url = resolveAsset("assets/data/mapping.csv");
  const res = await fetch(url);
  if (!res.ok) throw new Error("mapping fetch failed: " + res.status);
  const text = await res.text();
  const all = parseCSV(text);
  _mapping = all.filter((r) => r.Category === "REAL" || r.Category === "FAKE");
  return _mapping;
}

export async function loadResponses() {
  if (_responses) return _responses;
  const url = resolveAsset("assets/data/responses.csv");
  const res = await fetch(url);
  if (!res.ok) throw new Error("responses fetch failed: " + res.status);
  const text = await res.text();
  const rows = parseCSV(text);
  // Decode numeric DeviceType to readable strings
  for (const r of rows) {
    if (r.DeviceType !== undefined) r.DeviceType = DEVICE_TYPE[r.DeviceType] ?? r.DeviceType;
  }
  _responses = rows;
  return _responses;
}

export async function loadPublicResponses() {
  const url = resolveAsset("assets/data/responses_public.csv");
  const res = await fetch(url);
  if (!res.ok) throw new Error("responses_public fetch failed: " + res.status);
  const text = await res.text();
  return parseCSV(text);
}

// Loads responses_full.csv (original Qualtrics Q-columns for per-image analysis).
// Skips the second Qualtrics description row before returning parsed rows.
export async function loadFullResponses() {
  if (_responsesFullObj) return _responsesFullObj;
  const url = resolveAsset("assets/data/responses_full.csv");
  const res = await fetch(url);
  if (!res.ok) throw new Error("responses_full fetch failed: " + res.status);
  const text = await res.text();
  const rows = parseCSV(text);
  // Row 0 is the Qualtrics description row (its "StartDate" value is "Start Date").
  const filtered = rows.filter((r) => r.StartDate !== "Start Date");
  if (filtered.length) filtered[0]; // no-op, just confirm
  _responsesFullObj = filtered;
  return _responsesFullObj;
}

// Random sample: balanced `count` (half REAL, half FAKE), shuffled.
export function pickImages(mapping, { count = 10, balance = true } = {}) {
  const reals = mapping.filter((r) => r.Category === "REAL");
  const fakes = mapping.filter((r) => r.Category === "FAKE");
  function sample(arr, n) {
    const copy = arr.slice();
    const out = [];
    while (out.length < n && copy.length) {
      const i = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(i, 1)[0]);
    }
    return out;
  }
  let picks;
  if (balance) {
    const half = Math.floor(count / 2);
    picks = [...sample(reals, half), ...sample(fakes, count - half)];
  } else {
    picks = sample([...reals, ...fakes], count);
  }
  // Shuffle final order.
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return picks;
}

export function scoreHistogram(responses, filterFn) {
  const buckets = Array.from({ length: 11 }, () => 0);
  let total = 0;
  for (const r of responses) {
    if (filterFn && !filterFn(r)) continue;
    const s = parseInt(r.CalculatedScore, 10);
    if (!Number.isFinite(s) || s < 0 || s > 10) continue;
    buckets[s]++;
    total++;
  }
  return { buckets, total };
}

export function percentile(responses, score, filterFn) {
  const scores = [];
  for (const r of responses) {
    if (filterFn && !filterFn(r)) continue;
    const s = parseInt(r.CalculatedScore, 10);
    if (Number.isFinite(s)) scores.push(s);
  }
  if (!scores.length) return null;
  const below = scores.filter((s) => s < score).length;
  return Math.round((below / scores.length) * 100);
}
