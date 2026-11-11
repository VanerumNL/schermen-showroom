/* Spelletjes voor het startscherm, gemaakt voor mensen met dementie:
   geen tijdsdruk, je kunt niet verliezen, grote knoppen, weinig tegelijk in beeld,
   en altijd een vriendelijke reactie. Wordt geladen door startscherm.html.

   Spellen.start(vak, tegel, hulp)
     vak    het element waarin het spel komt
     tegel  de tegel-instellingen (spellen, paren, stukjes, fotos, geluid)
     hulp   { esc, ICONEN } */
(function () {
  const SPELLEN = {
    memory: { naam: "Memory", uitleg: "Zoek de twee dezelfde", kleur: "#b8e7f9", icoon: "ster" },
    puzzel: { naam: "Legpuzzel", uitleg: "Maak de foto weer heel", kleur: "#a8cb67", icoon: "puzzel" },
    spreekwoord: { naam: "Spreekwoorden", uitleg: "Maak het spreekwoord af", kleur: "#fbb900", icoon: "hart" },
    bellen: { naam: "Zeepbellen", uitleg: "Tik op de bellen", kleur: "#bda8bd", icoon: "boom" },
    kleuren: { naam: "Kleurplaat", uitleg: "Kleur de tekening in", kleur: "#f2c7a5", icoon: "bloem" },
    sorteren: { naam: "Knopen sorteren", uitleg: "Doe de knoop in het goede bakje", kleur: "#fbb900", icoon: "knoop" }
  };

  const LOF = ["Goed gedaan!", "Mooi zo!", "Prachtig!", "Heel goed!", "Knap gedaan!"];
  const lof = () => LOF[Math.floor(Math.random() * LOF.length)];
  const schud = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* bekende spreekwoorden en gezegden: begin, goed einde, twee andere einden */
  const SPREEKWOORDEN = [
    ["Wie het kleine niet eert,", "is het grote niet weerd", "gaat vroeg naar bed", "heeft geen geld"],
    ["Al draagt een aap een gouden ring,", "het is en blijft een lelijk ding", "hij blijft in de boom", "hij kan niet zingen"],
    ["Oost west,", "thuis best", "zon in het zuiden", "wind in de rug"],
    ["Wie wat bewaart,", "heeft wat", "is de baas", "wordt oud"],
    ["De appel valt niet ver", "van de boom", "van de kar", "in het water"],
    ["Morgenstond heeft", "goud in de mond", "koffie op tafel", "regen in de lucht"],
    ["Na regen komt", "zonneschijn", "de wind", "de sneeuw"],
    ["Beter een goede buur", "dan een verre vriend", "dan een nieuwe fiets", "dan een warme jas"],
    ["Hoge bomen", "vangen veel wind", "geven veel appels", "groeien niet snel"],
    ["Een ongeluk komt", "zelden alleen", "altijd 's nachts", "met de trein"],
    ["Zoals de ouden zongen,", "piepen de jongen", "dansen de kinderen", "lachen de buren"],
    ["Wie niet waagt,", "die niet wint", "blijft thuis", "heeft geen zorgen"],
    ["Oude liefde", "roest niet", "is het mooist", "kost geen geld"],
    ["Eind goed,", "al goed", "alles mooi", "niets aan de hand"],
    ["Haastige spoed", "is zelden goed", "komt altijd thuis", "wint de race"],
    ["Boontje komt", "om zijn loontje", "naar de markt", "uit de tuin"],
    ["Als de kat van huis is,", "dansen de muizen", "slaapt de hond", "is het stil"],
    ["Spreken is zilver,", "zwijgen is goud", "lachen is brons", "zingen is fijn"],
    ["Je moet geen slapende honden", "wakker maken", "eten geven", "uitlaten"],
    ["Eén vogel in de hand", "is beter dan tien in de lucht", "zingt het mooist", "vliegt niet weg"],
    ["Gedeelde smart", "is halve smart", "is dubbel verdriet", "duurt het langst"],
    ["Wie A zegt,", "moet ook B zeggen", "moet ook C zeggen", "krijgt een snoepje"],
    ["Liever lui", "dan moe", "dan laat", "dan ziek"],
    ["Het is niet alles goud", "wat er blinkt", "wat in de winkel ligt", "wat je koopt"],
    ["Zo vader,", "zo zoon", "zo moeder", "zo opa"],
    ["Met je neus", "in de boter vallen", "op de deur staan", "in de wind lopen"],
    ["Twee vliegen", "in één klap slaan", "in de soep doen", "op het raam zien"],
    ["Wie eerst komt,", "eerst maalt", "eerst eet", "gaat eerst naar huis"],
    ["Over smaak", "valt niet te twisten", "moet je praten", "kun je lachen"],
    ["Ieder huisje", "heeft zijn kruisje", "heeft een tuintje", "heeft een dak"],
    ["De kogel", "is door de kerk", "is in de pan", "zit in de la"],
    ["Zachte heelmeesters", "maken stinkende wonden", "zijn de beste", "werken langzaam"],
    ["Geen rook", "zonder vuur", "zonder schoorsteen", "in de kamer"],
    ["Van uitstel", "komt afstel", "komt rust", "komt plezier"],
    ["Wie zijn billen brandt,", "moet op de blaren zitten", "moet naar de dokter", "krijgt een pleister"],
    ["Komt tijd,", "komt raad", "komt koffie", "komt slaap"],
    ["Het oog", "wil ook wat", "is zo moe", "ziet alles"],
    ["Wat de boer niet kent,", "dat eet hij niet", "dat koopt hij niet", "dat zaait hij niet"],
    ["Een gegeven paard", "moet je niet in de bek kijken", "moet je goed borstelen", "loopt het hardst"],
    ["Ieder voordeel", "heeft zijn nadeel", "is meegenomen", "kost geld"]
  ];

  /* kleurplaten: elk vlak is een pad dat je kunt inkleuren */
  const L = 'fill="#fff" stroke="#1e1e1e" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
  const KLEURPLATEN = [
    /* tulpen in een vaas */
    `<rect data-v x="0" y="0" width="400" height="300" ${L} stroke-width="0"/>
     <rect data-v x="10" y="250" width="380" height="40" rx="6" ${L}/>
     <path data-v d="M150 170h100l-14 82h-72z" ${L}/>
     <path d="M200 172C198 130 196 110 200 80" ${L} fill="none"/>
     <path d="M170 172c-8-36-24-60-46-78" ${L} fill="none"/>
     <path d="M230 172c8-36 24-60 46-78" ${L} fill="none"/>
     <path data-v d="M200 150c-26-6-40-22-40-40 20 2 34 16 40 40z" ${L}/>
     <path data-v d="M200 140c26-6 40-22 40-40-20 2-34 16-40 40z" ${L}/>
     <path data-v d="M178 84c0-26 10-42 22-50 12 8 22 24 22 50-8 10-36 10-44 0z" ${L}/>
     <path data-v d="M100 98c0-26 10-42 22-50 12 8 22 24 22 50-8 10-36 10-44 0z" ${L}/>
     <path data-v d="M256 98c0-26 10-42 22-50 12 8 22 24 22 50-8 10-36 10-44 0z" ${L}/>`,
    /* huisje met zon */
    `<rect data-v x="0" y="0" width="400" height="230" ${L} stroke-width="0"/>
     <rect data-v x="0" y="230" width="400" height="70" ${L}/>
     <circle data-v cx="335" cy="62" r="34" ${L}/>
     <rect data-v x="236" y="70" width="26" height="54" ${L}/>
     <path data-v d="M80 132L190 50l110 82z" ${L}/>
     <rect data-v x="96" y="132" width="188" height="110" ${L}/>
     <rect data-v x="172" y="172" width="40" height="70" rx="4" ${L}/>
     <rect data-v x="112" y="150" width="44" height="40" ${L}/>
     <rect data-v x="226" y="150" width="44" height="40" ${L}/>
     <path data-v d="M20 230c10-30 40-30 50 0z" ${L}/>
     <path data-v d="M320 230c10-30 40-30 50 0z" ${L}/>`,
    /* vis in het water */
    `<rect data-v x="0" y="0" width="400" height="300" ${L} stroke-width="0"/>
     <path data-v d="M0 250c40-20 80-20 120 0s80 20 120 0 80-20 120 0 30 14 40 6v44H0z" ${L}/>
     <path data-v d="M90 150c40-60 150-70 210 0-60 70-170 60-210 0z" ${L}/>
     <path data-v d="M300 150l60-46v92z" ${L}/>
     <path data-v d="M180 104c10-30 40-40 60-30-10 10-20 20-24 36" ${L}/>
     <path data-v d="M160 150c8 20 8 40 0 56 26-8 40-26 40-56z" ${L}/>
     <circle data-v cx="135" cy="138" r="12" ${L}/>
     <circle data-v cx="70" cy="80" r="16" ${L}/>
     <circle data-v cx="92" cy="40" r="11" ${L}/>
     <path d="M40 250c-6-30 4-60 0-90M60 250c6-24-2-50 6-70" ${L} fill="none"/>`
  ];
  /* een grote knoop (zoals uit de naaidoos), in elke kleur */
  const knoop = (kleur, maat) => `<svg viewBox="0 0 200 200" width="${maat || 200}" height="${maat || 200}" aria-hidden="true"><circle cx="100" cy="100" r="86" fill="${kleur}" stroke="#1e1e1e" stroke-width="8"/><circle cx="100" cy="100" r="62" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="8"/><circle cx="80" cy="80" r="12" fill="#1e1e1e"/><circle cx="120" cy="80" r="12" fill="#1e1e1e"/><circle cx="80" cy="120" r="12" fill="#1e1e1e"/><circle cx="120" cy="120" r="12" fill="#1e1e1e"/></svg>`;
  const KNOOPKLEUREN = [["#e04b3a", "rood"], ["#4a90d9", "blauw"], ["#fbb900", "geel"], ["#6fb23f", "groen"]];

  const VERF = [["#e04b3a", "Rood"], ["#f39c33", "Oranje"], ["#fbb900", "Geel"], ["#6fb23f", "Groen"], ["#4a90d9", "Blauw"], ["#b77fc9", "Paars"], ["#f2a7c0", "Roze"], ["#9b6a43", "Bruin"]];

  /* een vrolijke tekening als puzzel, als er geen eigen foto's zijn */
  const PUZZELPLAAT = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="420" fill="#b8e7f9"/><rect y="420" width="800" height="180" fill="#a8cb67"/><circle cx="660" cy="110" r="64" fill="#fbb900"/><path d="M160 270L330 150l170 120z" fill="#e04b3a" stroke="#1e1e1e" stroke-width="8" stroke-linejoin="round"/><rect x="185" y="270" width="290" height="190" fill="#f2c7a5" stroke="#1e1e1e" stroke-width="8"/><rect x="305" y="350" width="60" height="110" fill="#9b6a43" stroke="#1e1e1e" stroke-width="8"/><rect x="210" y="300" width="64" height="60" fill="#fff" stroke="#1e1e1e" stroke-width="8"/><rect x="390" y="300" width="64" height="60" fill="#fff" stroke="#1e1e1e" stroke-width="8"/><g stroke="#1e1e1e" stroke-width="6"><path d="M590 520v-90M650 520v-90M710 520v-90"/></g><circle cx="590" cy="420" r="26" fill="#e04b3a" stroke="#1e1e1e" stroke-width="6"/><circle cx="650" cy="420" r="26" fill="#fbb900" stroke="#1e1e1e" stroke-width="6"/><circle cx="710" cy="420" r="26" fill="#b77fc9" stroke="#1e1e1e" stroke-width="6"/><path d="M80 140c20-24 60-24 80 0 20-24 60-24 80 0" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round"/></svg>`);

  /* zacht belletje als iets lukt */
  let ac = null;
  function belletje(aan, hoog) {
    if (!aan) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const nu = ac.currentTime;
      [hoog ? 784 : 659, hoog ? 1047 : 880].forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, nu + i * 0.12); g.gain.linearRampToValueAtTime(0.08, nu + i * 0.12 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, nu + i * 0.12 + 0.6);
        o.connect(g).connect(ac.destination); o.start(nu + i * 0.12); o.stop(nu + i * 0.12 + 0.65);
      });
    } catch (e) {}
  }

  const CSS = `
  .spel{position:absolute;inset:0;background:#fdf8ef;color:#1e1e1e;display:grid;grid-template-rows:auto minmax(0,1fr);font-family:var(--font)}
  .spel .sbalk{display:flex;align-items:center;gap:30px;padding:22px 40px;min-height:120px}
  .spel .sbalk h3{margin:0;font-size:52px;flex:1;letter-spacing:0}
  .spel .sterug{display:inline-flex;align-items:center;gap:16px;background:#fff;border:4px solid #1e1e1e;border-radius:999px;font-weight:700;font-size:40px;padding:14px 36px}
  .spel .svlak{position:relative;min-height:0;padding:0 40px 40px;display:flex;align-items:center;justify-content:center}
  .spel .svlak>*{flex:1 1 auto;min-width:0;min-height:0;height:100%;max-height:100%}
  .spel .svlak>.sw{flex:0 1 auto;height:auto}
  .spel .knop3{background:#fbb900;color:#1e1e1e;font-weight:700;font-size:46px;border-radius:999px;padding:26px 56px;box-shadow:0 10px 24px rgba(0,0,0,.15)}
  .spel .knop3:active{transform:scale(.97)}
  .spel .feest{position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:36px;background:rgba(253,248,239,.9);z-index:5;text-align:center;animation:sIn .5s ease}
  .spel .feest b{font-size:96px;letter-spacing:0}
  @keyframes sIn{from{opacity:0}to{opacity:1}}
  /* menu */
  .smenu{display:grid;gap:34px;width:100%;height:100%;grid-template-columns:repeat(var(--k,3),1fr);grid-auto-rows:1fr;padding:10px 0}
  .smenu button{display:grid;grid-template-rows:minmax(0,1fr) auto;background:#fff;border-radius:40px;overflow:hidden;box-shadow:0 18px 40px rgba(30,30,30,.1);text-align:center}
  .smenu .si{background:var(--c);position:relative}
  .smenu .si svg{position:absolute;left:50%;top:50%;height:76%;transform:translate(-50%,-50%)}
  .smenu b{display:block;font-size:52px;padding:18px 10px 4px;letter-spacing:0}
  .smenu small{display:block;font-size:30px;opacity:.65;padding:0 10px 20px}
  /* memory */
  .mem{display:grid;gap:28px;width:100%;height:100%;grid-template-columns:repeat(var(--k),1fr);grid-auto-rows:1fr}
  .kaart{position:relative;border-radius:30px;perspective:1600px}
  .kaart .in{position:absolute;inset:0;transition:transform .6s;transform-style:preserve-3d}
  .kaart.open .in{transform:rotateY(180deg)}
  .kaart .voor,.kaart .achter{position:absolute;inset:0;border-radius:30px;backface-visibility:hidden;overflow:hidden;box-shadow:0 12px 28px rgba(0,0,0,.14)}
  .kaart .achter{background:#1e1e1e;display:grid;place-items:center}
  .kaart .achter i{width:40%;aspect-ratio:1;border-radius:50%;border:12px solid #fbb900;opacity:.9}
  .kaart .voor{transform:rotateY(180deg);background:var(--c,#fff);display:grid;place-items:center}
  .kaart .voor img{width:100%;height:100%;object-fit:cover}
  .kaart .voor svg{height:80%;max-width:80%}
  .kaart.goed .voor{box-shadow:0 0 0 10px #6fb23f,0 12px 28px rgba(0,0,0,.14)}
  /* puzzel */
  .puz{display:flex;gap:50px;align-items:center;justify-content:center;width:100%;height:100%}
  .puz .bord{display:grid;gap:6px;background:#1e1e1e;border-radius:18px;padding:6px;grid-template-columns:repeat(var(--k),1fr);aspect-ratio:4/3;height:100%;max-width:100%}
  .puz .stuk{background-size:calc(var(--k) * 100%) calc(var(--r) * 100%);border-radius:10px;border:0;transition:transform .2s, box-shadow .2s}
  .puz .stuk.kies{transform:scale(.92);box-shadow:0 0 0 10px #fbb900}
  .puz .stuk.goed{box-shadow:inset 0 0 0 6px rgba(111,178,63,.9)}
  .puz .voorbeeld{width:360px;flex:none;text-align:center;font-size:30px}
  .puz .voorbeeld div{aspect-ratio:4/3;background-size:cover;background-position:center;border-radius:16px;border:6px solid #fff;box-shadow:0 10px 24px rgba(0,0,0,.15);margin-bottom:14px}
  .puz .tip{font-size:32px;opacity:.75;margin-top:24px}
  /* spreekwoorden */
  .sw{display:grid;gap:40px;width:min(1500px,100%);text-align:center}
  .sw .zin{font-size:80px;font-weight:700;line-height:1.15;letter-spacing:0}
  .sw .zin em{font-style:normal;background:#fbb900;border-radius:16px;padding:0 14px}
  .sw .opties{display:grid;gap:24px}
  .sw .opties button{background:#fff;border:5px solid #1e1e1e;border-radius:28px;font-size:56px;font-weight:700;padding:26px 30px;transition:opacity .4s}
  .sw .opties button.mis{opacity:.3}
  .sw .opties button.goed{background:#6fb23f;color:#fff;border-color:#6fb23f}
  .sw .hint{font-size:40px;min-height:1.2em;opacity:.8}
  /* zeepbellen */
  .bel{position:absolute;border-radius:50%;background:radial-gradient(circle at 32% 30%,#fff 0 8%,rgba(255,255,255,.35) 9% 30%,hsla(var(--h),80%,72%,.45) 62%,hsla(calc(var(--h) + 60),75%,62%,.85) 100%);border:3px solid hsla(var(--h),60%,55%,.45);box-shadow:inset -10px -14px 30px rgba(255,255,255,.55),0 10px 26px rgba(0,0,0,.10);will-change:transform}
  .bel.knap{animation:knap .45s ease forwards}
  @keyframes knap{to{transform:var(--t) scale(1.5);opacity:0}}
  .bellenlucht{position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#cfe9f6,#eef7fb)}
  .bellenteller{position:absolute;left:50%;bottom:30px;transform:translateX(-50%);font-size:40px;font-weight:700;opacity:.6}

  /* knopen sorteren */
  .sort{display:grid;grid-template-rows:minmax(0,1fr) auto;gap:30px;width:100%;height:100%;justify-items:center}
  .sort .los{display:grid;place-items:center;position:relative;width:100%}
  .sort .los .k{transition:transform .7s cubic-bezier(.5,0,.3,1),opacity .7s;filter:drop-shadow(0 16px 24px rgba(0,0,0,.18))}
  .sort .los .k.wiebel{animation:wiebel2 .5s}
  @keyframes wiebel2{25%{transform:translateX(-24px)}75%{transform:translateX(24px)}}
  .sort .bakjes{display:flex;gap:60px;justify-content:center}
  .sort .bakje{width:320px;height:190px;border-radius:0 0 160px 160px;background:var(--c);border:8px solid #1e1e1e;border-top-width:14px;display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:center;padding:10px 24px 26px;gap:4px;box-shadow:0 14px 30px rgba(0,0,0,.15);overflow:hidden}
  .sort .bakje svg{width:46px;height:46px}
  .sort .bakje:active{transform:scale(.97)}
  .sort .tel{font-size:36px;opacity:.7;text-align:center}
  /* kleurplaat */
  .kl{display:flex;gap:40px;width:100%;height:100%;align-items:center;justify-content:center}
  .kl svg{height:100%;width:auto;max-width:calc(100% - 300px);background:#fff;border-radius:24px;box-shadow:0 12px 28px rgba(0,0,0,.1)}
  .kl svg [data-v]{cursor:pointer;transition:fill .3s}
  .kl .verf{display:grid;grid-template-columns:repeat(2,110px);gap:20px;flex:none}
  .kl .verf button{width:110px;height:110px;border-radius:50%;border:5px solid rgba(0,0,0,.15)}
  .kl .verf button.aan{box-shadow:0 0 0 8px #fdf8ef,0 0 0 16px #1e1e1e}
  .kl .verf .nieuw{grid-column:1/3;width:auto;height:auto;border-radius:999px;background:#fff;border:4px solid #1e1e1e;font-weight:700;font-size:32px;padding:16px}
  `;

  function start(vak, t, hulp) {
    if (!document.getElementById("spellen-css")) { const st = document.createElement("style"); st.id = "spellen-css"; st.textContent = CSS; document.head.appendChild(st); }
    const { esc, ICONEN } = hulp;
    const geluid = t.geluid !== false;
    const fotos = (t.fotos || []).map(f => f && f.src).filter(Boolean);
    /* tegels van vóór het zesde spelletje hadden alle vijf aangevinkt: dan ook het nieuwe tonen */
    const OUD = ["memory", "puzzel", "spreekwoord", "bellen", "kleuren"];
    const gekozen = Array.isArray(t.spellen) && t.spellen.length && !OUD.every(k => t.spellen.includes(k)) ? t.spellen : Object.keys(SPELLEN);
    const aan = gekozen.filter(k => SPELLEN[k]);
    const root = document.createElement("div"); root.className = "spel"; vak.appendChild(root);
    let stop = null;   /* opruimen van het spel dat nu loopt */
    const leeft = () => root.isConnected;

    function scherm(titel, metTerug) {
      if (stop) { try { stop(); } catch (e) {} stop = null; }
      root.innerHTML = `<div class="sbalk">${metTerug ? `<button class="sterug" type="button">◂ Spelletjes</button>` : ""}<h3>${esc(titel)}</h3></div><div class="svlak"></div>`;
      if (metTerug) root.querySelector(".sterug").addEventListener("click", menu);
      return root.querySelector(".svlak");
    }
    function feest(vlak, tekst, opnieuw) {
      belletje(geluid, true);
      const f = document.createElement("div"); f.className = "feest";
      f.innerHTML = `<b>${esc(tekst || lof())}</b><button class="knop3" type="button">Nog een keer</button>`;
      vlak.appendChild(f);
      f.querySelector("button").addEventListener("click", opnieuw);
    }

    function menu() {
      if (aan.length === 1) { SPEL[aan[0]](); return; }
      const v = scherm("Kies een spelletje", false);
      const k = aan.length <= 3 ? aan.length : aan.length === 4 ? 2 : 3;
      v.innerHTML = `<div class="smenu" style="--k:${k}">${aan.map(s => `<button type="button" data-s="${s}" style="--c:${SPELLEN[s].kleur}"><div class="si">${SPELLEN[s].icoon === "knoop" ? knoop("#e04b3a") : (ICONEN[SPELLEN[s].icoon] || ICONEN.ster).svg}</div><div><b>${SPELLEN[s].naam}</b><small>${SPELLEN[s].uitleg}</small></div></button>`).join("")}</div>`;
      v.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => SPEL[b.dataset.s]()));
    }

    const SPEL = {
      memory() {
        const v = scherm("Memory · zoek de twee dezelfde", aan.length > 1);
        const paren = Math.min(8, Math.max(2, +t.paren || 4));
        let bronnen;
        if (fotos.length >= paren) bronnen = schud(fotos.slice()).slice(0, paren).map(src => ({ html: `<img src="${esc(src)}" alt="">`, c: "#fff" }));
        else {
          const kl = ["#fbb900", "#b8e7f9", "#a8cb67", "#bda8bd", "#f2c7a5", "#fff"];
          bronnen = schud(Object.keys(ICONEN)).slice(0, paren).map((k, i) => ({ html: ICONEN[k].svg, c: kl[i % kl.length] }));
        }
        const kaarten = schud(bronnen.flatMap((b, i) => [{ ...b, p: i }, { ...b, p: i }]));
        const n = kaarten.length, k = n <= 4 ? n : n <= 8 ? 4 : n <= 12 ? 4 : 6;
        v.innerHTML = `<div class="mem" style="--k:${k}">${kaarten.map((x, i) => `<button class="kaart" type="button" data-i="${i}" aria-label="Kaart"><div class="in"><div class="achter"><i></i></div><div class="voor" style="--c:${x.c}">${x.html}</div></div></button>`).join("")}</div>`;
        let open = [], bezig = false, klaar = 0;
        v.querySelectorAll(".kaart").forEach(el => el.addEventListener("click", () => {
          if (bezig || el.classList.contains("open")) return;
          el.classList.add("open"); open.push(el);
          if (open.length < 2) return;
          const [a, b] = open; open = [];
          if (kaarten[+a.dataset.i].p === kaarten[+b.dataset.i].p) {
            setTimeout(() => { a.classList.add("goed"); b.classList.add("goed"); belletje(geluid); }, 500);
            if (++klaar === paren) setTimeout(() => leeft() && feest(v, "", SPEL.memory), 1400);
          } else {
            bezig = true;
            setTimeout(() => { a.classList.remove("open"); b.classList.remove("open"); bezig = false; }, 1800);
          }
        }));
      },

      puzzel() {
        const v = scherm("Legpuzzel · tik op twee stukjes om ze te wisselen", aan.length > 1);
        const aantal = [4, 6, 9, 12].includes(+t.stukjes) ? +t.stukjes : 4;
        const [k, r] = { 4: [2, 2], 6: [3, 2], 9: [3, 3], 12: [4, 3] }[aantal];
        const plaat = fotos.length ? fotos[Math.floor(Math.random() * fotos.length)] : PUZZELPLAAT;
        let volgorde;
        do { volgorde = schud([...Array(aantal).keys()]); } while (volgorde.every((x, i) => x === i));
        v.innerHTML = `<div class="puz"><div class="bord" style="--k:${k};--r:${r}"></div><div class="voorbeeld"><div style="background-image:url('${plaat}')"></div>Zo moet het worden</div></div>`;
        const bord = v.querySelector(".bord");
        let gekozen = null;
        const teken = () => {
          bord.innerHTML = volgorde.map((s, plek) => {
            const x = s % k, y = Math.floor(s / k);
            return `<button class="stuk${s === plek ? " goed" : ""}" type="button" data-plek="${plek}" style="background-image:url('${plaat}');background-position:${k > 1 ? (x / (k - 1)) * 100 : 0}% ${r > 1 ? (y / (r - 1)) * 100 : 0}%"></button>`;
          }).join("");
        };
        teken();
        bord.addEventListener("click", e => {
          const b = e.target.closest(".stuk"); if (!b) return;
          const plek = +b.dataset.plek;
          if (gekozen === null) { gekozen = plek; b.classList.add("kies"); return; }
          if (gekozen !== plek) { [volgorde[gekozen], volgorde[plek]] = [volgorde[plek], volgorde[gekozen]]; if (volgorde[plek] === plek || volgorde[gekozen] === gekozen) belletje(geluid); }
          gekozen = null; teken();
          if (volgorde.every((x, i) => x === i)) { bord.style.gap = "0"; setTimeout(() => leeft() && feest(v, "", SPEL.puzzel), 900); }
        });
      },

      spreekwoord() {
        const v = scherm("Spreekwoorden", aan.length > 1);
        const rij = schud(SPREEKWOORDEN.slice());
        let nr = 0;
        const vraag = () => {
          const [begin, goed, ...fout] = rij[nr % rij.length];
          const opties = schud([goed, ...fout]);
          v.innerHTML = `<div class="sw"><div class="zin">${esc(begin)} <em>…</em></div><div class="opties">${opties.map(o => `<button type="button">${esc(o)}</button>`).join("")}</div><div class="hint"></div></div>`;
          const hint = v.querySelector(".hint");
          v.querySelectorAll(".opties button").forEach(b => b.addEventListener("click", () => {
            if (b.textContent === goed) {
              belletje(geluid, true);
              b.classList.add("goed");
              v.querySelectorAll(".opties button").forEach(x => { if (x !== b) x.classList.add("mis"); });
              v.querySelector(".zin").innerHTML = `${esc(begin)} <em>${esc(goed)}</em>`;
              hint.innerHTML = "";
              const vd = document.createElement("button"); vd.className = "knop3"; vd.type = "button"; vd.textContent = lof() + "  Volgende ▸";
              vd.addEventListener("click", () => { nr++; vraag(); });
              hint.appendChild(vd);
            } else {
              b.classList.add("mis");
              hint.textContent = "Bijna! Probeer een ander antwoord.";
            }
          }));
        };
        vraag();
      },

      bellen() {
        const v = scherm("Zeepbellen · tik op de bellen", aan.length > 1);
        v.style.padding = "0";
        v.innerHTML = `<div class="bellenlucht"></div>`;
        const lucht = v.querySelector(".bellenlucht");
        const bellen = [];
        let laatste = 0, raf = 0, geprikt = 0;
        const nieuw = () => {
          const W = lucht.clientWidth, H = lucht.clientHeight;
          const d = 130 + Math.random() * 150;
          const el = document.createElement("div"); el.className = "bel"; el.style.width = el.style.height = d + "px";
          el.style.setProperty("--h", Math.floor(Math.random() * 360));
          const b = { el, x: Math.random() * (W - d), y: H + 20, d, s: 0.6 + Math.random() * 0.7, w: Math.random() * Math.PI * 2 };
          el.addEventListener("pointerdown", () => {
            if (b.weg) return; b.weg = true;
            el.style.setProperty("--t", el.style.transform); el.classList.add("knap");
            belletje(geluid); geprikt++;
            setTimeout(() => el.remove(), 460);
          });
          lucht.appendChild(el); bellen.push(b);
        };
        const stap = tijd => {
          if (!leeft()) return;
          if (tijd - laatste > 1300 && bellen.filter(b => !b.weg).length < 9) { nieuw(); laatste = tijd; }
          for (let i = bellen.length - 1; i >= 0; i--) {
            const b = bellen[i];
            if (b.weg) { if (!b.el.isConnected) bellen.splice(i, 1); continue; }
            b.y -= b.s; b.w += 0.012;
            const x = b.x + Math.sin(b.w) * 30;
            b.el.style.transform = `translate(${x}px,${b.y}px)`;
            if (b.y < -b.d - 20) { b.el.remove(); bellen.splice(i, 1); }
          }
          raf = requestAnimationFrame(stap);
        };
        raf = requestAnimationFrame(stap);
        stop = () => cancelAnimationFrame(raf);
      },

      sorteren() {
        const v = scherm("Knopen sorteren · tik op het bakje met dezelfde kleur", aan.length > 1);
        const kleuren = schud(KNOOPKLEUREN.slice()).slice(0, 3), totaal = 9;
        let gedaan = 0, bezig = false, nu = null;
        v.innerHTML = `<div class="sort"><div class="los"></div><div><div class="bakjes">${kleuren.map(([c, n]) => `<button class="bakje" type="button" data-c="${c}" style="--c:${c}" aria-label="Bakje ${n}"></button>`).join("")}</div><div class="tel"></div></div></div>`;
        const los = v.querySelector(".los"), tel = v.querySelector(".tel");
        const volgende = () => {
          if (gedaan >= totaal) { feest(v, "Alles opgeruimd!", SPEL.sorteren); return; }
          nu = kleuren[Math.floor(Math.random() * kleuren.length)][0];
          los.innerHTML = `<div class="k">${knoop(nu, 300)}</div>`;
          tel.textContent = `Nog ${totaal - gedaan} ${totaal - gedaan === 1 ? "knoop" : "knopen"}`;
          bezig = false;
        };
        v.querySelectorAll(".bakje").forEach(b => b.addEventListener("click", () => {
          if (bezig || !nu) return;
          const k = los.querySelector(".k");
          if (b.dataset.c === nu) {
            bezig = true; belletje(geluid);
            const a = k.getBoundingClientRect(), z = b.getBoundingClientRect(), schaal = a.width / (k.offsetWidth || 1);
            k.style.transform = `translate(${(z.left + z.width / 2 - (a.left + a.width / 2)) / schaal}px,${(z.top + z.height / 2 - (a.top + a.height / 2)) / schaal}px) scale(.2)`;
            k.style.opacity = "0";
            setTimeout(() => { if (!leeft()) return; b.insertAdjacentHTML("beforeend", knoop(nu, 46)); gedaan++; volgende(); }, 700);
          } else {
            k.classList.remove("wiebel"); void k.offsetWidth; k.classList.add("wiebel");
            tel.textContent = "Kijk nog eens goed naar de kleur";
          }
        }));
        volgende();
      },

      kleuren() {
        const v = scherm("Kleurplaat · kies een kleur en tik op de tekening", aan.length > 1);
        let plaat = Math.floor(Math.random() * KLEURPLATEN.length), kleur = VERF[2][0];
        const teken = () => {
          v.innerHTML = `<div class="kl"><svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">${KLEURPLATEN[plaat]}</svg>
            <div class="verf">${VERF.map(([c, n]) => `<button type="button" data-c="${c}" class="${c === kleur ? "aan" : ""}" style="background:${c}" aria-label="${n}"></button>`).join("")}<button class="nieuw" type="button">Andere tekening</button></div></div>`;
          v.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => { kleur = b.dataset.c; v.querySelectorAll("[data-c]").forEach(x => x.classList.toggle("aan", x === b)); }));
          v.querySelectorAll("svg [data-v]").forEach(p => p.addEventListener("click", () => { p.setAttribute("fill", kleur); }));
          v.querySelector(".nieuw").addEventListener("click", () => { plaat = (plaat + 1) % KLEURPLATEN.length; teken(); });
        };
        teken();
      }
    };

    menu();
    return () => { if (stop) try { stop(); } catch (e) {} };
  }

  window.Spellen = { start, SPELLEN };
})();
