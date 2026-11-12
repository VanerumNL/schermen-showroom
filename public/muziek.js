/* Muziek maken op het startscherm: instrumenten om op te tikken, gemaakt voor mensen met dementie.
   Alle klanken worden in de browser gemaakt (Web Audio), er zijn geen geluidsbestanden nodig.
   Piano, xylofoon en harp gebruiken een vijftonige toonladder: elke combinatie van tonen klinkt mooi,
   dus het kan niet "fout" klinken. Elke aanraking geeft meteen geluid en een zichtbare reactie.

   Muziek.start(vak, tegel, hulp)   tegel.instrumenten: welke instrumenten (standaard alle) */
(function () {
  const INSTRUMENTEN = {
    piano: { naam: "Piano", uitleg: "Tik op de toetsen", kleur: "#b8e7f9" },
    xylofoon: { naam: "Xylofoon", uitleg: "Tik op de gekleurde staven", kleur: "#fbb900" },
    trommels: { naam: "Trommels", uitleg: "Trommel en bekken", kleur: "#f2c7a5" },
    harp: { naam: "Harp", uitleg: "Strijk over de snaren", kleur: "#bda8bd" },
    klokjes: { naam: "Klokjes", uitleg: "Heldere klokjes", kleur: "#a8cb67" }
  };

  /* tekeningen voor het menu (eigen werk, Vanerum-kleuren) */
  const S = '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#1e1e1e" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">';
  const E = "</g></svg>";
  const TEKENING = {
    piano: S + '<rect x="24" y="60" width="152" height="96" rx="10" fill="#fff"/><path d="M62 60v96M100 60v96M138 60v96" fill="none"/><rect x="50" y="60" width="22" height="56" rx="3" fill="#1e1e1e"/><rect x="88" y="60" width="22" height="56" rx="3" fill="#1e1e1e"/><rect x="126" y="60" width="22" height="56" rx="3" fill="#1e1e1e"/>' + E,
    xylofoon: S + '<rect x="30" y="58" width="22" height="96" rx="8" fill="#e04b3a"/><rect x="60" y="66" width="22" height="80" rx="8" fill="#f39c33"/><rect x="90" y="74" width="22" height="64" rx="8" fill="#fbb900"/><rect x="120" y="82" width="22" height="48" rx="8" fill="#6fb23f"/><rect x="150" y="90" width="22" height="32" rx="8" fill="#4a90d9"/><path d="M44 172l40-34" fill="none"/><circle cx="88" cy="134" r="10" fill="#fff"/>' + E,
    trommels: S + '<ellipse cx="100" cy="80" rx="66" ry="22" fill="#fff"/><path d="M34 80v54c0 12 30 22 66 22s66-10 66-22V80" fill="#e04b3a"/><path d="M34 80c0 12 30 22 66 22s66-10 66-22" fill="none"/><path d="M50 98l20 50M80 104l10 50M120 104l-10 50M150 98l-20 50" fill="none"/><path d="M70 30l26 40M138 26l-30 44" fill="none"/>' + E,
    harp: S + '<path d="M50 172V40c50 0 90 30 110 80l10 52z" fill="#fbb900"/><path d="M50 172h120" fill="none"/><path d="M70 50v122M88 58v114M106 70v102M124 86v86M142 106v66" fill="none" stroke-width="4"/>' + E,
    klokjes: S + '<path d="M70 70c0-20 14-34 30-34s30 14 30 34v40l12 16H58l12-16z" fill="#fbb900"/><circle cx="100" cy="136" r="9" fill="#1e1e1e"/><path d="M100 22v14" fill="none"/><path d="M40 60c-8 10-8 30 0 40M160 60c8 10 8 30 0 40M26 50c-14 18-14 42 0 60M174 50c14 18 14 42 0 60" fill="none" stroke-width="5"/>' + E
  };

  /* vijftonige toonladder (C D E G A), over twee octaven */
  const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

  let ac = null, uit = null;
  function audio() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 6;
      uit = ac.createGain(); uit.gain.value = 0.7;
      uit.connect(comp).connect(ac.destination);
    }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  function toon(freq, { type = "sine", duur = 1.5, luid = 0.3, aanslag = 0.005, delen = [[1, 1]] } = {}) {
    const a = audio(), nu = a.currentTime;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, nu);
    g.gain.exponentialRampToValueAtTime(luid, nu + aanslag);
    g.gain.exponentialRampToValueAtTime(0.0001, nu + duur);
    g.connect(uit);
    delen.forEach(([mul, sterk]) => {
      const o = a.createOscillator(), og = a.createGain();
      o.type = type; o.frequency.value = freq * mul; og.gain.value = sterk;
      o.connect(og).connect(g); o.start(nu); o.stop(nu + duur + 0.05);
    });
  }
  const KLANK = {
    piano: f => toon(f, { type: "triangle", duur: 2.2, luid: 0.35, delen: [[1, 1], [2, 0.35], [3, 0.12], [4, 0.06]] }),
    xylofoon: f => { toon(f * 2, { duur: 0.9, luid: 0.4, aanslag: 0.002, delen: [[1, 1], [3.93, 0.25]] }); },
    harp: f => toon(f, { type: "triangle", duur: 2.6, luid: 0.25, aanslag: 0.004, delen: [[1, 1], [2, 0.3], [3, 0.1]] }),
    klokje: f => toon(f * 2, { duur: 3.5, luid: 0.22, aanslag: 0.003, delen: [[1, 1], [2.76, 0.4], [5.4, 0.2], [8.9, 0.08]] })
  };
  function ruis(duur) {
    const a = audio(), n = Math.floor(a.sampleRate * duur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(); s.buffer = buf; return s;
  }
  const SLAG = {
    grote: () => {   /* grote trom: lage toon die zakt */
      const a = audio(), nu = a.currentTime, o = a.createOscillator(), g = a.createGain();
      o.frequency.setValueAtTime(130, nu); o.frequency.exponentialRampToValueAtTime(45, nu + 0.35);
      g.gain.setValueAtTime(0.9, nu); g.gain.exponentialRampToValueAtTime(0.0001, nu + 0.6);
      o.connect(g).connect(uit); o.start(nu); o.stop(nu + 0.65);
    },
    kleine: () => {   /* kleine trom: tik met wat ruis */
      const a = audio(), nu = a.currentTime, r = ruis(0.25), f = a.createBiquadFilter(), g = a.createGain();
      f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 0.8;
      g.gain.setValueAtTime(0.6, nu); g.gain.exponentialRampToValueAtTime(0.0001, nu + 0.22);
      r.connect(f).connect(g).connect(uit); r.start(nu);
      toon(190, { duur: 0.15, luid: 0.3, aanslag: 0.002 });
    },
    bekken: () => {
      const a = audio(), nu = a.currentTime, r = ruis(1.6), f = a.createBiquadFilter(), g = a.createGain();
      f.type = "highpass"; f.frequency.value = 5000;
      g.gain.setValueAtTime(0.35, nu); g.gain.exponentialRampToValueAtTime(0.0001, nu + 1.5);
      r.connect(f).connect(g).connect(uit); r.start(nu);
    },
    tamboerijn: () => {
      const a = audio(), nu = a.currentTime;
      [0, 0.03, 0.06].forEach(t => {
        const r = ruis(0.2), f = a.createBiquadFilter(), g = a.createGain();
        f.type = "bandpass"; f.frequency.value = 7000; f.Q.value = 2;
        g.gain.setValueAtTime(0.0001, nu + t); g.gain.exponentialRampToValueAtTime(0.4, nu + t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, nu + t + 0.18);
        r.connect(f).connect(g).connect(uit); r.start(nu + t);
      });
    }
  };

  const CSS = `
  .mz{position:absolute;inset:0;background:#fdf8ef;color:#1e1e1e;display:grid;grid-template-rows:auto minmax(0,1fr);font-family:var(--font);touch-action:none;-webkit-user-select:none;user-select:none}
  .mz .mbalk{display:flex;align-items:center;gap:30px;padding:22px 40px;min-height:120px}
  .mz .mbalk h3{margin:0;font-size:52px;flex:1;letter-spacing:0}
  .mz .mterug{display:inline-flex;align-items:center;gap:16px;background:#fff;border:4px solid #1e1e1e;border-radius:999px;font-weight:700;font-size:40px;padding:14px 36px}
  .mz .mvlak{position:relative;min-height:0;padding:0 40px 40px;display:flex}
  .mz .mvlak>*{flex:1;min-width:0}
  .mz .noot{position:absolute;font-size:70px;pointer-events:none;animation:zweef 1.6s ease-out forwards;z-index:5}
  @keyframes zweef{from{opacity:1;transform:translate(-50%,-50%) scale(.8)}to{opacity:0;transform:translate(-50%,-260%) scale(1.3)}}
  .mmenu{display:grid;gap:34px;grid-template-columns:repeat(var(--k,3),1fr);grid-auto-rows:1fr}
  .mmenu button{display:grid;grid-template-rows:minmax(0,1fr) auto;background:#fff;border-radius:40px;overflow:hidden;box-shadow:0 18px 40px rgba(30,30,30,.1);text-align:center}
  .mmenu .mi{background:var(--c);position:relative}
  .mmenu .mi svg{position:absolute;left:50%;top:50%;height:78%;transform:translate(-50%,-50%)}
  .mmenu b{display:block;font-size:52px;padding:18px 10px 4px;letter-spacing:0}
  .mmenu small{display:block;font-size:30px;opacity:.65;padding:0 10px 20px}
  /* piano */
  .pn{position:relative;display:flex;gap:10px;background:#1e1e1e;border-radius:28px;padding:16px 16px 22px}
  .pn .wt{flex:1;background:#fff;border-radius:0 0 22px 22px;position:relative;box-shadow:inset 0 -14px 0 #e8e5de;transition:background .1s}
  .pn .wt.aan{background:#fbb900;box-shadow:inset 0 -6px 0 #d89e00}
  /* xylofoon */
  .xy{display:flex;align-items:center;justify-content:center;gap:22px;background:#9b6a43;border-radius:28px;padding:40px 30px}
  .xy .st{flex:1;border-radius:24px;border:5px solid rgba(0,0,0,.25);box-shadow:0 10px 0 rgba(0,0,0,.2);transition:transform .08s}
  .xy .st.aan{transform:translateY(8px) scale(.98);box-shadow:0 2px 0 rgba(0,0,0,.2);filter:brightness(1.15)}
  /* trommels */
  .tr{display:grid;grid-template-columns:repeat(4,1fr);gap:40px;align-items:center}
  .tr button{position:relative;aspect-ratio:1;border-radius:50%;border:12px solid #1e1e1e;font-weight:700;font-size:44px;display:grid;place-items:center;box-shadow:0 18px 0 rgba(0,0,0,.18);transition:transform .08s}
  .tr button.aan{transform:scale(.93);box-shadow:0 6px 0 rgba(0,0,0,.18)}
  .tr button::after{content:attr(data-naam);position:absolute;left:50%;top:calc(100% + 40px);transform:translateX(-50%);white-space:nowrap;font-size:40px;font-weight:700;color:#1e1e1e}
  .tr .grote{background:radial-gradient(circle,#fff 0 55%,#e04b3a 56%)}
  .tr .kleine{background:radial-gradient(circle,#fff 0 60%,#4a90d9 61%)}
  .tr .bekken{background:radial-gradient(circle,#fff6c9 0 12%,#fbb900 13% 70%,#d89e00 71%)}
  .tr .tamboerijn{background:radial-gradient(circle,#fdf8ef 0 62%,#9b6a43 63%)}
  /* harp */
  .hp{position:relative;display:flex;justify-content:space-around;align-items:stretch;background:linear-gradient(180deg,#fff7e0,#f2c7a5);border-radius:28px;padding:30px 60px}
  .hp .sn{width:80px;position:relative;display:flex;justify-content:center}
  .hp .sn i{width:10px;border-radius:5px;background:var(--c);box-shadow:0 0 0 2px rgba(0,0,0,.15);transition:transform .1s}
  .hp .sn.aan i{animation:tril .4s}
  @keyframes tril{25%{transform:translateX(-8px)}50%{transform:translateX(7px)}75%{transform:translateX(-4px)}}
  /* klokjes */
  .kj{display:grid;grid-template-columns:repeat(5,1fr);gap:30px;align-items:center}
  .kj button{display:grid;place-items:center;transition:transform .2s}
  .kj button svg{width:100%;height:auto}
  .kj button.aan{animation:schommel .9s ease-in-out}
  @keyframes schommel{25%{transform:rotate(14deg)}55%{transform:rotate(-10deg)}80%{transform:rotate(5deg)}}
  `;

  const NOOT_KLEUREN = ["#e04b3a", "#f39c33", "#fbb900", "#6fb23f", "#4a90d9", "#b77fc9"];

  function start(vak, t, hulp) {
    if (!document.getElementById("muziek-css")) { const st = document.createElement("style"); st.id = "muziek-css"; st.textContent = CSS; document.head.appendChild(st); }
    const { esc } = hulp;
    const OUD = Object.keys(INSTRUMENTEN);
    const aan = (Array.isArray(t.instrumenten) && t.instrumenten.length ? t.instrumenten : OUD).filter(k => INSTRUMENTEN[k]);
    const root = document.createElement("div"); root.className = "mz"; vak.appendChild(root);

    /* een vrolijk notenbalkje dat omhoog zweeft waar je tikt */
    function noot(e, kleur) {
      const r = root.getBoundingClientRect(), k = r.width / root.offsetWidth || 1;
      const n = document.createElement("div"); n.className = "noot"; n.textContent = Math.random() < 0.5 ? "♪" : "♫";
      n.style.left = (e.clientX - r.left) / k + "px"; n.style.top = (e.clientY - r.top) / k + "px";
      n.style.color = kleur || NOOT_KLEUREN[Math.floor(Math.random() * NOOT_KLEUREN.length)];
      root.appendChild(n); setTimeout(() => n.remove(), 1700);
    }
    function flits(el) { el.classList.remove("aan"); void el.offsetWidth; el.classList.add("aan"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("aan"), 450); }

    function scherm(titel, isMenu) {
      root.innerHTML = `<div class="mbalk">${aan.length > 1 && !isMenu ? `<button class="mterug" type="button">◂ Instrumenten</button>` : ""}<h3>${esc(titel)}</h3></div><div class="mvlak"></div>`;
      const tr = root.querySelector(".mterug"); if (tr) tr.addEventListener("click", menu);
      return root.querySelector(".mvlak");
    }
    /* tik meteen bij het aanraken (pointerdown), voor elke vinger apart */
    function tik(box, sel, fn) {
      box.addEventListener("pointerdown", e => {
        const el = e.target.closest(sel); if (!el) return;
        e.preventDefault(); fn(el, e);
      });
    }

    function menu() {
      if (aan.length === 1) { SPEEL[aan[0]](); return; }
      const v = scherm("Kies een instrument", true);
      const k = aan.length <= 3 ? aan.length : 3;
      v.innerHTML = `<div class="mmenu" style="--k:${k}">${aan.map(s => `<button type="button" data-s="${s}" style="--c:${INSTRUMENTEN[s].kleur}"><div class="mi">${TEKENING[s]}</div><div><b>${INSTRUMENTEN[s].naam}</b><small>${INSTRUMENTEN[s].uitleg}</small></div></button>`).join("")}</div>`;
      v.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => { audio(); SPEEL[b.dataset.s](); }));
    }

    const SPEEL = {
      piano() {
        const v = scherm("Piano");
        const tonen = PENTA.slice(0, 8);
        v.innerHTML = `<div class="pn">${tonen.map((f, i) => `<button class="wt" type="button" data-i="${i}" aria-label="Toets"></button>`).join("")}</div>`;
        tik(v, ".wt", (el, e) => { KLANK.piano(tonen[+el.dataset.i]); flits(el); noot(e); });
      },
      xylofoon() {
        const v = scherm("Xylofoon");
        const kl = ["#e04b3a", "#f39c33", "#fbb900", "#a8cb67", "#6fb23f", "#4a90d9", "#7f6fd1", "#b77fc9"];
        const tonen = PENTA.slice(0, 8);
        v.innerHTML = `<div class="xy">${tonen.map((f, i) => `<button class="st" type="button" data-i="${i}" style="background:${kl[i]};height:${92 - i * 6}%" aria-label="Staaf"></button>`).join("")}</div>`;
        tik(v, ".st", (el, e) => { KLANK.xylofoon(tonen[+el.dataset.i]); flits(el); noot(e, kl[+el.dataset.i]); });
      },
      trommels() {
        const v = scherm("Trommels");
        const t4 = [["grote", "Grote trom"], ["kleine", "Kleine trom"], ["bekken", "Bekken"], ["tamboerijn", "Rammelaar"]];
        v.innerHTML = `<div class="tr">${t4.map(([k, n]) => `<button class="${k}" type="button" data-k="${k}" data-naam="${n}" aria-label="${n}"></button>`).join("")}</div>`;
        tik(v, "[data-k]", (el, e) => { SLAG[el.dataset.k](); flits(el); noot(e); });
      },
      harp() {
        const v = scherm("Harp · strijk met je vinger over de snaren");
        const tonen = PENTA.slice(0, 10);
        const kl = ["#e04b3a", "#f39c33", "#fbb900", "#6fb23f", "#4a90d9", "#e04b3a", "#f39c33", "#fbb900", "#6fb23f", "#4a90d9"];
        v.innerHTML = `<div class="hp">${tonen.map((f, i) => `<div class="sn" data-i="${i}" style="--c:${kl[i]}"><i></i></div>`).join("")}</div>`;
        const hp = v.querySelector(".hp");
        const laatst = new Map();
        const raak = (e, nieuw) => {
          const el = document.elementFromPoint(e.clientX, e.clientY);
          const sn = el && el.closest(".sn"); if (!sn) { laatst.delete(e.pointerId); return; }
          if (!nieuw && laatst.get(e.pointerId) === sn) return;
          laatst.set(e.pointerId, sn);
          KLANK.harp(tonen[+sn.dataset.i]); flits(sn);
          if (nieuw || Math.random() < 0.4) noot(e, kl[+sn.dataset.i]);
        };
        hp.addEventListener("pointerdown", e => { e.preventDefault(); try { hp.releasePointerCapture(e.pointerId); } catch (x) {} raak(e, true); });
        hp.addEventListener("pointermove", e => { if (e.pointerType === "mouse" && !e.buttons) return; raak(e, false); });
        const los = e => laatst.delete(e.pointerId);
        hp.addEventListener("pointerup", los); hp.addEventListener("pointercancel", los); hp.addEventListener("pointerleave", los);
      },
      klokjes() {
        const v = scherm("Klokjes");
        const tonen = [PENTA[0], PENTA[2], PENTA[3], PENTA[4], PENTA[5]];
        const kl = ["#e04b3a", "#fbb900", "#6fb23f", "#4a90d9", "#b77fc9"];
        const bel = c => `<svg viewBox="0 0 200 220" aria-hidden="true"><g stroke="#1e1e1e" stroke-width="7" stroke-linejoin="round"><path d="M100 20v24" fill="none"/><path d="M56 112c0-38 18-66 44-66s44 28 44 66v40l20 24H36l20-24z" fill="${c}"/><circle cx="100" cy="194" r="14" fill="#1e1e1e"/></g></svg>`;
        v.innerHTML = `<div class="kj">${tonen.map((f, i) => `<button type="button" data-i="${i}" aria-label="Klokje">${bel(kl[i])}</button>`).join("")}</div>`;
        tik(v, "[data-i]", (el, e) => { KLANK.klokje(tonen[+el.dataset.i]); flits(el); noot(e, kl[+el.dataset.i]); });
      }
    };

    menu();
    return () => {};
  }

  window.Muziek = { start, INSTRUMENTEN };
})();
