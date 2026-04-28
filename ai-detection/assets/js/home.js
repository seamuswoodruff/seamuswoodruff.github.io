// Homepage: populate the decorative hero image grid from dedicated scroll images.

function assetUrl(relPath) {
  const m = window.location.pathname.match(/^(.*\/ai-detection\/)/);
  const root = m ? m[1] : "/";
  return root + relPath.replace(/^\.?\//, "");
}

const HERO_FAKE = [
  "0028.jpg","0031.jpg","0117.jpg","0236.jpg","0276.jpg",
  "0335.jpg","0336.jpg","0383.jpg","0384.jpg","0441.jpg",
  "0757.png","0925.png","0957.png","1076.png","1090.png",
];
const HERO_REAL = [
  "0002.jpg","0358.jpg","0416.jpg","0627.jpg","0650.jpg",
  "0655.jpg","0677.jpg","1237.jpg","1280.jpg","1289.jpg",
  "1290.jpg","1327.jpg","1336.jpg","1340.jpg","1356.jpg",
];

function sample(arr, n) {
  const copy = arr.slice();
  const out = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function buildHeroGrid() {
  const track = document.querySelector(".hero__grid-track");
  if (!track) return;

  const reals = sample(HERO_REAL, 6).map((f) => ({ cat: "real", file: f }));
  const fakes = sample(HERO_FAKE, 6).map((f) => ({ cat: "fake", file: f }));
  const picks = [...reals, ...fakes].sort(() => Math.random() - 0.5);

  const tiles = picks.map(({ cat, file }) => {
    const src = assetUrl(`assets/img/hero/${cat}/${file}`);
    return `
      <div class="hero__grid-tile hero__grid-tile--${cat}">
        <img src="${src}" alt="" loading="lazy" decoding="async" />
        <span class="hero__grid-tile__label">${cat.toUpperCase()}</span>
      </div>
    `;
  }).join("");

  track.innerHTML = tiles + tiles;
}

buildHeroGrid();
