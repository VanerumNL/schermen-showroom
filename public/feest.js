/* Feestthema's voor de tv-schermen: kalender, verjaardagen en versiering.
   Een feest toevoegen: één item in FEESTEN (id, naam, van/tot als "MM-DD", kleuren, rand, moment).
   Geen DOM nodig, zodat dit ook in Node getest kan worden (test/feest.test.js). */
(function () {
  const ROOD = "#c8102e", DONKERROOD = "#8a0b1f", GEEL = "#fbb900", GOUD = "#d9a300", WIT = "#ffffff";
  const VANERUM = ["#fbb900", "#b8e7f9", "#bda8bd", "#a8cb67"];

  /* slinger met vlaggetjes over de volle breedte, twee bogen */
  function slinger(w, kleuren) {
    const h = 44, bogen = 2, bw = w / bogen, zak = 11;
    let lijn = "", vlag = "";
    for (let b = 0; b < bogen; b++) {
      const x0 = b * bw;
      lijn += `M${x0} 4 Q${x0 + bw / 2} ${4 + zak * 2} ${x0 + bw} 4 `;
      const n = Math.round(bw / 56);
      for (let i = 1; i < n; i++) {
        const t = i / n, x = x0 + t * bw, y = 4 + 2 * zak * 2 * t * (1 - t) - 1;
        const k = kleuren[(b * n + i) % kleuren.length];
        vlag += `<path d="M${(x - 12).toFixed(1)} ${y.toFixed(1)}L${(x + 12).toFixed(1)} ${y.toFixed(1)}L${x.toFixed(1)} ${(y + 22).toFixed(1)}Z" fill="${k}"/>`;
      }
    }
    return `<svg class="feest-slinger" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="${lijn}" fill="none" stroke="#1e1e1e" stroke-opacity=".35" stroke-width="2"/>${vlag}</svg>`;
  }

  function pepernoot(x, y, r) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#b8733d"/><circle cx="${x - r * .3}" cy="${y - r * .25}" r="${r * .14}" fill="#8c5226"/><circle cx="${x + r * .35}" cy="${y + r * .1}" r="${r * .12}" fill="#8c5226"/><circle cx="${x - r * .05}" cy="${y + r * .4}" r="${r * .1}" fill="#8c5226"/>`;
  }

  const mijterHoek = () => `<svg class="feest-hoek" viewBox="0 0 170 130" width="136" height="104" aria-hidden="true">
    <path d="M30 118 L30 58 Q30 30 62 8 Q94 30 94 58 L94 118 Z" fill="${ROOD}"/>
    <path d="M30 104 H94 V118 H30Z" fill="${GOUD}"/>
    <path d="M58 40 H66 V88 H58Z M46 54 H78 V62 H46Z" fill="${GOUD}"/>
    <path d="M30 104 H94" stroke="${DONKERROOD}" stroke-width="2"/>
    ${pepernoot(118, 112, 13)}${pepernoot(146, 106, 15)}${pepernoot(132, 86, 11)}
  </svg>`;

  const ballonnenHoek = () => {
    const b = (x, y, k, d) => `<path d="M${x} ${y + 34} q${d} 30 ${-d} 60" fill="none" stroke="#1e1e1e" stroke-opacity=".4" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="26" ry="32" fill="${k}"/><path d="M${x - 5} ${y + 34} h10 l-5 -6z" fill="${k}"/><ellipse cx="${x - 9}" cy="${y - 12}" rx="6" ry="9" fill="#fff" opacity=".45"/>`;
    return `<svg class="feest-hoek" viewBox="0 0 170 150" width="136" height="120" aria-hidden="true">${b(40, 52, VANERUM[2], 8)}${b(128, 46, VANERUM[3], -8)}${b(84, 36, VANERUM[0], 6)}</svg>`;
  };

  const FEESTEN = [
    {
      id: "sinterklaas", naam: "Sinterklaas", van: "11-12", tot: "12-05",
      kleur: ROOD, streepjes: [ROOD, GEEL, DONKERROOD, GOUD],
      rand: staand => slinger(staand ? 1080 : 1920, [ROOD, GEEL, WIT, DONKERROOD]) + mijterHoek(),
      moment: () => ({ kop: "Fijne *Sinterklaas!*", tekst: "Een gezellige pakjesavond gewenst van iedereen bij Vanerum.", vallen: "pepernoot" })
    }
  ];

  const VERJAARDAG = {
    id: "verjaardag", naam: "Verjaardag",
    kleur: GEEL, streepjes: null,
    rand: staand => slinger(staand ? 1080 : 1920, VANERUM) + ballonnenHoek(),
    moment: naam => ({ kop: `Gefeliciteerd, *${naam || ""}!*`, tekst: "Een hele fijne verjaardag!", vallen: "confetti" })
  };

  const FEEST_STD = () => ({ aan: true, moment: false, verjaardagen: [] });

  const mmdd = datum => String(datum.getMonth() + 1).padStart(2, "0") + "-" + String(datum.getDate()).padStart(2, "0");
  /* valt dag (MM-DD) binnen van..tot (inclusief)? werkt ook over de jaarwisseling */
  const binnen = (dag, van, tot) => van <= tot ? dag >= van && dag <= tot : dag >= van || dag <= tot;
  const geldigeDatum = s => typeof s === "string" && /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s);

  function actiefFeest(datum, f, forceer) {
    f = f || {};
    if (forceer) {
      if (forceer === "verjaardag") return { feest: VERJAARDAG, naam: "Voorbeeld" };
      const fe = FEESTEN.find(x => x.id === forceer);
      if (fe) return { feest: fe };
    }
    if (f.aan === false) return null;
    const dag = mmdd(datum);
    const jarig = (Array.isArray(f.verjaardagen) ? f.verjaardagen : [])
      .find(v => v && typeof v.naam === "string" && v.naam.trim() && geldigeDatum(v.datum) && v.datum === dag);
    if (jarig) return { feest: VERJAARDAG, naam: jarig.naam.trim() };
    const fe = FEESTEN.find(x => binnen(dag, x.van, x.tot));
    return fe ? { feest: fe } : null;
  }

  const VF = { FEESTEN, VERJAARDAG, FEEST_STD, actiefFeest, binnen, mmdd };
  if (typeof module !== "undefined" && module.exports) module.exports = VF;
  if (typeof window !== "undefined") window.VF = VF;
})();
