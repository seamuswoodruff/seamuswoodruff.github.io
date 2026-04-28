// Quiz flow controller.
import { loadMapping, loadResponses, pickImages, percentile } from "./data.js";

function assetUrl(relPath) {
  const m = window.location.pathname.match(/^(.*\/ai-detection\/)/);
  const root = m ? m[1] : "/";
  return root + relPath.replace(/^\.?\//, "");
}

const $ = (sel, root = document) => root.querySelector(sel);

const state = {
  mapping: null,
  responses: null,
  picks: [],
  idx: 0,
  answers: [],
  currentAnswer: null,
};

async function init() {
  state.mapping = await loadMapping();

  $("#pill-red").addEventListener("click", () => fireGlitch(start));
  $("#pill-blue").addEventListener("click", () => fireGlitch(enterConstruct));
  $("#construct-wake").addEventListener("click", () => showStage("intro"));
  $("#r-again").addEventListener("click", start);

  document.querySelectorAll(".quiz-choice").forEach((b) => {
    b.addEventListener("click", () => pickAnswer(b.dataset.answer, b));
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if ($("#stage-run").hidden) return;
    if (e.key === "r" || e.key === "R") pickAnswer("REAL", document.querySelector('.quiz-choice[data-answer="REAL"]'));
    else if (e.key === "a" || e.key === "A") pickAnswer("FAKE", document.querySelector('.quiz-choice[data-answer="FAKE"]'));
  });
}

function fireGlitch(callback) {
  const overlay = document.getElementById("construct-glitch");
  overlay.classList.remove("is-firing");
  void overlay.offsetWidth;
  overlay.classList.add("is-firing");
  setTimeout(callback, 350);
  setTimeout(() => overlay.classList.remove("is-firing"), 700);
}

async function enterConstruct() {
  const data = await fetch(assetUrl("assets/data/construct.json")).then(r => r.json());
  renderConstructResults(data.images);
  showStage("construct");
  const label = document.querySelector("#construct-wake span");
  if (label) typeWriter(label, "Knock, knock, Neo.");
}

function typeWriter(el, text, speed = 95) {
  el.textContent = "";
  const cursor = document.createElement("span");
  cursor.className = "tw-cursor";
  cursor.textContent = "▌";
  el.appendChild(cursor);
  let i = 0;
  const tick = () => {
    if (i < text.length) {
      cursor.insertAdjacentText("beforebegin", text[i++]);
      setTimeout(tick, speed);
    } else {
      setTimeout(() => cursor.remove(), 900);
    }
  };
  setTimeout(tick, 480);
}

function renderConstructResults(images) {
  const reel = document.getElementById("construct-reel");
  reel.innerHTML = images.map((img, i) => {
    const src = assetUrl(`assets/img/construct/${img.filename}`);
    return `
      <div class="reel-card reel-card--correct">
        <div class="reel-card__img"><img src="${src}" alt="Image ${i + 1}" loading="lazy" /></div>
        <div class="reel-card__body">
          <div class="reel-card__verdict">
            <span class="reel-card__icon" aria-hidden="true">✓</span>
            <span class="reel-card__num">Image ${String(i + 1).padStart(2, "0")}</span>
          </div>
          <div class="reel-card__answers">
            <span>You: <strong>Real</strong></span>
            <span style="color:var(--text-faint)">·</span>
            <span>Truth: <strong>Real</strong></span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function showStage(name) {
  ["intro", "run", "results", "construct"].forEach((k) => {
    const el = document.getElementById(`stage-${k}`);
    el.hidden = k !== name;
  });
  window.scrollTo({ top: 0, behavior: "instant" });
}

async function start() {
  state.picks = pickImages(state.mapping, { count: 10, balance: false });
  state.idx = 0;
  state.answers = [];
  state.currentAnswer = null;
  $("#q-total").textContent = String(state.picks.length);
  showStage("run");
  renderCurrent();
}

function renderCurrent() {
  const p = state.picks[state.idx];
  if (!p) return;
  const cat = p.Category === "REAL" ? "real" : "fake";
  const img = $("#q-img");
  const wrap = img.parentElement;
  wrap.classList.add("fading");
  // preload
  const next = new Image();
  next.onload = () => {
    img.src = next.src;
    wrap.classList.remove("fading");
  };
  next.src = assetUrl(`assets/img/${cat}/${p.OriginalFilename}`);

  $("#q-idx").textContent = String(state.idx + 1);
  $("#q-score").textContent = `${state.answers.length} answered`;
  $("#q-fill").style.width = `${(state.idx / state.picks.length) * 100}%`;

  // reset choice state
  state.currentAnswer = null;
  document.querySelectorAll(".quiz-choice").forEach((b) => {
    b.setAttribute("aria-pressed", "false");
    b.classList.remove("is-correct", "is-wrong");
  });
  $("#q-next").disabled = true;
}

function pickAnswer(ans, btn) {
  if (state.currentAnswer) return; // prevent double-firing during advance delay
  state.currentAnswer = ans;
  document.querySelectorAll(".quiz-choice").forEach((b) => b.setAttribute("aria-pressed", "false"));
  if (btn) {
    btn.setAttribute("aria-pressed", "true");
    const correct = ans === state.picks[state.idx].Category;
    btn.classList.add(correct ? "is-correct" : "is-wrong");
  }
  setTimeout(nextImage, 500);
}

function nextImage() {
  if (!state.currentAnswer) return;
  const p = state.picks[state.idx];
  state.answers.push({
    pick: p,
    answer: state.currentAnswer,
    correct: state.currentAnswer === p.Category,
  });
  state.idx++;
  if (state.idx >= state.picks.length) {
    showResults();
  } else {
    renderCurrent();
  }
}

async function showResults() {
  const score = state.answers.filter((a) => a.correct).length;
  const realCorrect = state.answers.filter((a) => a.pick.Category === "REAL" && a.correct).length;
  const fakeCorrect = state.answers.filter((a) => a.pick.Category === "FAKE" && a.correct).length;
  const realTotal = state.answers.filter((a) => a.pick.Category === "REAL").length;
  const fakeTotal = state.answers.filter((a) => a.pick.Category === "FAKE").length;
  $("#r-score").textContent = String(score);
  $("#r-real-correct").textContent = `${realCorrect}/${realTotal}`;
  $("#r-fake-correct").textContent = `${fakeCorrect}/${fakeTotal}`;

  // Percentile vs 508 participants
  try {
    if (!state.responses) state.responses = await loadResponses();
    const pct = percentile(state.responses, score);
    const lede = $("#r-percentile");
    if (pct != null) {
      if (pct >= 50) {
        lede.innerHTML = `You beat <strong>${pct}%</strong> of the 508 study participants.`;
      } else {
        lede.innerHTML = `You placed ahead of <strong>${pct}%</strong> of participants — the median score was <strong>7/10</strong>.`;
      }
    } else {
      lede.textContent = "Here's how you did.";
    }
  } catch (e) {
    $("#r-percentile").textContent = "Here's how you did.";
  }

  // Build reel
  const reel = $("#r-reel");
  reel.innerHTML = state.answers
    .map((a, i) => {
      const cat = a.pick.Category === "REAL" ? "real" : "fake";
      const src = assetUrl(`assets/img/${cat}/${a.pick.OriginalFilename}`);
      const correctClass = a.correct ? "reel-card--correct" : "reel-card--wrong";
      const icon = a.correct ? "✓" : "✕";
      const your = a.answer === "REAL" ? "Real" : "AI";
      const actual = a.pick.Category === "REAL" ? "Real" : "AI";
      return `
        <div class="reel-card ${correctClass}">
          <div class="reel-card__img"><img src="${src}" alt="Test image ${i + 1}" loading="lazy" /></div>
          <div class="reel-card__body">
            <div class="reel-card__verdict">
              <span class="reel-card__icon" aria-hidden="true">${icon}</span>
              <span class="reel-card__num">Image ${String(i + 1).padStart(2, "0")}</span>
            </div>
            <div class="reel-card__answers">
              <span>You: <strong>${your}</strong></span>
              <span style="color:var(--text-faint)">·</span>
              <span>Truth: <strong>${actual}</strong></span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  showStage("results");
}

init();
