/* Weer-iconen in Vanerum-stijl: dikke donkere lijn, vlakken in geel, lichtblauw, lila en wit.
   VW.icoon(code, isDag) geeft een <svg> voor elke WMO-weercode van Open-Meteo, met dag- en nachtversie.
   VW.omschrijving(code) geeft de Nederlandse tekst. Kleine animaties (stralen, regen, sneeuw) via CSS. */
(function () {
  const INK = "var(--ink, #1e1e1e)";
  const GEEL = "#fbb900", BLAUW = "#b8e7f9", LILA = "#bda8bd", WIT = "#ffffff", GRIJS = "#d9dde0", DONKER = "#9aa3ab", DRUP = "#2f86b8";

  const zon = (cx, cy, r, stralen = true) =>
    `<g class="vw-zon">${stralen ? `<g class="vw-stralen">${[0, 45, 90, 135, 180, 225, 270, 315].map(a =>
      `<line x1="${cx}" y1="${cy - r - 6}" x2="${cx}" y2="${cy - r - 14}" stroke="${GEEL}" stroke-width="5.5" stroke-linecap="round" transform="rotate(${a} ${cx} ${cy})"/>`).join("")}</g>` : ""}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${GEEL}" stroke="${INK}" stroke-width="3.2"/></g>`;
  const maan = (cx, cy, r) =>
    `<g class="vw-maan"><path d="M${cx + r * .35} ${cy - r} A${r} ${r} 0 1 0 ${cx + r} ${cy + r * .25} A${r * .78} ${r * .78} 0 0 1 ${cx + r * .35} ${cy - r}z" fill="${LILA}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
      <circle cx="${cx + r * 1.15}" cy="${cy - r * .9}" r="2.2" fill="${INK}"/><circle cx="${cx + r * 1.45}" cy="${cy - r * .2}" r="1.6" fill="${INK}"/></g>`;
  /* wolk: x,y = linksboven van een wolk van 64 × 38 bij schaal 1 */
  const wolk = (x, y, s, kleur) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M14 38h38a13 13 0 0 0 1-26 19 19 0 0 0-36-3A14.5 14.5 0 0 0 14 38z" fill="${kleur}" stroke="${INK}" stroke-width="${3.2 / s}" stroke-linejoin="round"/>`;
  const regen = (n, zwaar) => {
    const xs = { 1: [50], 2: [42, 60], 3: [36, 52, 68], 4: [30, 44, 58, 72] }[n];
    return `<g transform="translate(0 -6)"><g class="vw-regen">${xs.map((x, i) => `<line x1="${x}" y1="${70 + (i % 2) * 5}" x2="${x - 5}" y2="${82 + (i % 2) * 5 + (zwaar ? 4 : 0)}" stroke="${DRUP}" stroke-width="${zwaar ? 5.5 : 4.5}" stroke-linecap="round" style="animation-delay:${i * .22}s"/>`).join("")}</g></g>`;
  };
  const motregen = n => `<g transform="translate(0 -6)"><g class="vw-regen">${[34, 46, 58, 70].slice(0, n).map((x, i) => `<circle cx="${x}" cy="${76 + (i % 2) * 7}" r="2.8" fill="${DRUP}" style="animation-delay:${i * .25}s"/>`).join("")}</g></g>`;
  const vlok = (x, y, r) => `<g transform="translate(${x} ${y})" stroke="${INK}" stroke-width="2.4" stroke-linecap="round">${[0, 60, 120].map(a => `<line x1="0" y1="${-r}" x2="0" y2="${r}" transform="rotate(${a})"/>`).join("")}</g>`;
  const sneeuw = n => `<g transform="translate(0 -5)"><g class="vw-sneeuw">${[[36, 76], [54, 86], [70, 76], [46, 94], [64, 96]].slice(0, n).map(([x, y], i) => `<g style="animation-delay:${i * .4}s">${vlok(x, y, 5.5)}</g>`).join("")}</g></g>`;
  const korrels = () => `<g transform="translate(0 -5)"><g class="vw-sneeuw">${[[36, 78], [52, 86], [68, 78], [44, 94], [60, 95]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${WIT}" stroke="${INK}" stroke-width="2"/>`).join("")}</g></g>`;
  const hagel = () => `<g>${[[38, 80], [54, 88], [70, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="${BLAUW}" stroke="${INK}" stroke-width="2.4"/>`).join("")}</g>`;
  const ijs = () => `<g transform="translate(0 -6)">${[[34, 78], [62, 80]].map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${x - 4}" y2="${y + 11}" stroke="${DRUP}" stroke-width="4.5" stroke-linecap="round"/>`).join("")}<path d="M48 76l4 7-4 7-4-7z" fill="${BLAUW}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M76 78l3.5 6-3.5 6-3.5-6z" fill="${BLAUW}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/></g>`;
  const bliksem = (x = 0) => `<path class="vw-bliksem" transform="translate(${x} 0)" d="M54 62 42 82h11l-6 16 18-23H54l7-13z" fill="${GEEL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  const mistlijnen = () => `<g class="vw-mist" stroke="${INK}" stroke-width="4" stroke-linecap="round"><line x1="14" y1="70" x2="62" y2="70"/><line x1="70" y1="70" x2="86" y2="70"/><line x1="22" y1="82" x2="78" y2="82"/><line x1="14" y1="94" x2="40" y2="94"/><line x1="48" y1="94" x2="84" y2="94"/></g>`;
  const hemel = (dag, cx, cy, r) => dag ? zon(cx, cy, r) : maan(cx, cy, r);

  /* elke code: [omschrijving, tekenfunctie(dag)] */
  const T = {
    0: ["Zonnig", d => d ? zon(50, 50, 20) : maan(46, 50, 22), "Helder"],
    1: ["Overwegend zonnig", d => hemel(d, 40, 38, 17) + wolk(42, 50, .82, WIT), "Overwegend helder"],
    2: ["Half bewolkt", d => hemel(d, 36, 34, 16) + wolk(24, 42, 1.08, WIT), "Half bewolkt"],
    3: ["Bewolkt", () => wolk(6, 16, .9, GRIJS) + wolk(22, 34, 1.1, WIT)],
    45: ["Mist", () => wolk(18, 12, 1, WIT) + mistlijnen()],
    48: ["Mist met rijp", () => wolk(18, 12, 1, WIT) + mistlijnen() + vlok(80, 28, 6)],
    51: ["Lichte motregen", () => wolk(13, 13, 1.15, BLAUW) + motregen(2)],
    53: ["Motregen", () => wolk(13, 13, 1.15, BLAUW) + motregen(3)],
    55: ["Dichte motregen", () => wolk(13, 13, 1.15, BLAUW) + motregen(4)],
    56: ["Lichte ijzel", () => wolk(13, 13, 1.15, BLAUW) + ijs()],
    57: ["IJzel", () => wolk(13, 13, 1.15, LILA) + ijs()],
    61: ["Lichte regen", () => wolk(13, 13, 1.15, BLAUW) + regen(2)],
    63: ["Regen", () => wolk(13, 13, 1.15, BLAUW) + regen(3)],
    65: ["Zware regen", () => wolk(2, 4, .85, DONKER) + wolk(13, 13, 1.15, BLAUW) + regen(4, true)],
    66: ["Lichte ijzel", () => wolk(13, 13, 1.15, BLAUW) + ijs()],
    67: ["IJzel", () => wolk(13, 13, 1.15, LILA) + ijs()],
    71: ["Lichte sneeuw", () => wolk(13, 13, 1.15, WIT) + sneeuw(2)],
    73: ["Sneeuw", () => wolk(13, 13, 1.15, WIT) + sneeuw(3)],
    75: ["Zware sneeuw", () => wolk(2, 4, .85, GRIJS) + wolk(13, 13, 1.15, WIT) + sneeuw(5)],
    77: ["Korrelsneeuw", () => wolk(13, 13, 1.15, WIT) + korrels()],
    80: ["Lichte buien", d => hemel(d, 30, 30, 14) + wolk(22, 26, 1, BLAUW) + regen(2)],
    81: ["Buien", d => hemel(d, 30, 30, 14) + wolk(22, 26, 1, BLAUW) + regen(3)],
    82: ["Zware buien", d => hemel(d, 30, 30, 14) + wolk(22, 26, 1, DONKER) + regen(4, true)],
    85: ["Sneeuwbuien", d => hemel(d, 30, 30, 14) + wolk(22, 26, 1, WIT) + sneeuw(3)],
    86: ["Zware sneeuwbuien", d => hemel(d, 30, 30, 14) + wolk(22, 26, 1, GRIJS) + sneeuw(5)],
    95: ["Onweer", () => wolk(13, 10, 1.15, LILA) + bliksem()],
    96: ["Onweer met hagel", () => wolk(13, 10, 1.15, LILA) + bliksem(-12) + `<g transform="translate(14 -4)">${hagel()}</g>`],
    99: ["Zwaar onweer met hagel", () => wolk(2, 2, .85, DONKER) + wolk(13, 10, 1.15, LILA) + bliksem(-12) + `<g transform="translate(14 -4)">${hagel()}</g>`]
  };
  const zoek = c => T[c] ? c : c <= 2 ? 2 : c <= 48 ? 45 : c <= 57 ? 53 : c <= 67 ? 63 : c <= 77 ? 73 : c <= 82 ? 81 : c <= 86 ? 85 : 95;

  function omschrijving(code, dag = true) { const t = T[zoek(code)]; return (!dag && t[2]) || t[0]; }
  function icoon(code, dag = true, stil = false) {
    return `<svg class="vw${stil ? " vw-stil" : ""}" viewBox="0 0 100 104" aria-hidden="true" overflow="visible">${T[zoek(code)][1](dag)}</svg>`;
  }

  /* klein icoontje voor wind, neerslag en gevoel */
  function klein(soort) {
    const p = {
      wind: `<path d="M8 14h20a6 6 0 1 0-6-6M8 22h28a6 6 0 1 1-6 6M8 30h12" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`,
      paraplu: `<path d="M6 22a16 16 0 0 1 32 0z" fill="${BLAUW}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M22 22v12a4 4 0 0 1-8 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><line x1="22" y1="6" x2="22" y2="3" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
      thermo: `<path d="M18 26V8a4 4 0 0 1 8 0v18a8 8 0 1 1-8 0z" fill="${WIT}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="22" cy="32" r="4.5" fill="${GEEL}"/><line x1="22" y1="16" x2="22" y2="28" stroke="${GEEL}" stroke-width="3.4" stroke-linecap="round"/>`,
      zonop: `<path d="M8 32h28" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M12 32a10 10 0 0 1 20 0z" fill="${GEEL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M22 4v8m-4-4 4-4 4 4" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
      zononder: `<path d="M8 32h28" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M12 32a10 10 0 0 1 20 0z" fill="${GEEL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M22 4v8m-4-4 4 4 4-4" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    }[soort];
    return `<svg class="vw-klein" viewBox="0 0 44 40" aria-hidden="true">${p}</svg>`;
  }
  const beaufort = kmh => [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118].findIndex(g => kmh < g) === -1 ? 12 : [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118].findIndex(g => kmh < g);
  const richting = deg => ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"][Math.round(((deg % 360) + 360) % 360 / 45) % 8];

  const CSS = `
.vw .vw-stralen{transform-box:fill-box;transform-origin:center;animation:vw-draai 24s linear infinite}
.vw .vw-regen>*{animation:vw-val 1.6s ease-in infinite}
.vw .vw-sneeuw>*{animation:vw-sneeuw 3.2s ease-in-out infinite}
.vw .vw-bliksem{animation:vw-flits 4s steps(1) infinite}
.vw .vw-mist{animation:vw-mist 6s ease-in-out infinite alternate}
.vw.vw-stil *{animation:none!important}
@keyframes vw-draai{to{transform:rotate(360deg)}}
@keyframes vw-val{0%{transform:translateY(-4px);opacity:0}30%{opacity:1}100%{transform:translateY(8px);opacity:0}}
@keyframes vw-sneeuw{0%,100%{transform:translate(0,-3px)}50%{transform:translate(2px,4px)}}
@keyframes vw-flits{0%,86%,92%,100%{opacity:1}88%,95%{opacity:.25}}
@keyframes vw-mist{to{transform:translateX(5px)}}
@media (prefers-reduced-motion: reduce){.vw *{animation:none!important}}`;
  if (typeof document !== "undefined" && !document.getElementById("vw-css")) {
    const st = document.createElement("style"); st.id = "vw-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  window.VW = { icoon, omschrijving, klein, beaufort, richting, CODES: Object.keys(T).map(Number) };
})();
