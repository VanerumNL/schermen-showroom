/* Gedeeld door het aanraakscherm (kiosk.html) en de instellingen (kiosk-editor.html):
   standaardinstellingen, kleuren en de soorten dia's. */
(function () {
  /* achtergronden die u kunt kiezen; een eigen kleur (#rrggbb) mag ook */
  const ACHTERGRONDEN = {
    licht: { naam: "Lichtblauw verloop", bg: "linear-gradient(180deg,#dcf1f9 0%,#eef8fc 55%,#f7fbfc 100%)", ink: "#1e1e1e" },
    wit: { naam: "Wit", bg: "#ffffff", ink: "#1e1e1e" },
    grijs: { naam: "Lichtgrijs", bg: "#f4f4f2", ink: "#1e1e1e" },
    donker: { naam: "Zwart", bg: "#1e1e1e", ink: "#ffffff" },
    geel: { naam: "Geel", bg: "#fbb900", ink: "#1e1e1e" }
  };
  const KLEUREN = [
    ["#fbb900", "Geel"], ["#b8e7f9", "Lichtblauw"], ["#bda8bd", "Lila"], ["#a8cb67", "Groen"],
    ["#1e1e1e", "Zwart"], ["#ffffff", "Wit"], ["#f4f4f2", "Lichtgrijs"]
  ];

  /* is een kleur donker? (voor witte of zwarte letters erop) */
  function donker(kleur) {
    const m = /^#([0-9a-f]{6})$/i.exec(kleur || "");
    if (!m) return false;
    const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) < 140;
  }
  /* achtergrond als css + tekstkleur */
  function achtergrond(waarde) {
    if (ACHTERGRONDEN[waarde]) return ACHTERGRONDEN[waarde];
    if (/^#[0-9a-f]{6}$/i.test(waarde || "")) return { naam: "Eigen kleur", bg: waarde, ink: donker(waarde) ? "#ffffff" : "#1e1e1e" };
    return ACHTERGRONDEN.licht;
  }

  const DIA_TYPEN = {
    foto: { naam: "Foto", std: () => ({ src: "", kop: "", tekst: "", passend: "vullen" }) },
    demo: { naam: "Product of filmpje", std: () => ({ pad: "/demos/motion-cubes-intro-169/", seconden: 30 }) },
    vimo: { naam: "Vimo", std: () => ({ titel: "Welkom bij *Vanerum!*", ondertitel: "Tik op het scherm en ontdek onze producten.", zinnen: ["Welkom bij Vanerum!", "Kijk, de Motion Cube!", "Bewegen in de klas!", "Tik op het scherm!"], seconden: 20 }) },
    tekst: { naam: "Tekst", std: () => ({ kop: "Bewegend leren met *Vanerum*", tekst: "" }) }
  };

  const TEGELS_STD = () => ([
    { titel: "Motion Cubes", tekst: "Kruk, tafeltje en dobbelsteen in één.", kleur: "#fbb900", product: "/demos/motion-cubes/", lab: "/demos/motion-cube-lab/", foto: "/img/kiosk/motion-cubes.jpg" },
    { titel: "Agili tafels", tekst: "Zitten, staan, kantelen en inklappen.", kleur: "#b8e7f9", product: "/demos/agili-tafel/", lab: "/demos/agili-lab/", foto: "/img/kiosk/agili-tafel.jpg" },
    { titel: "Opti+ Move tafels", tekst: "De tafel in elke vorm en hoogte.", kleur: "#a8cb67", product: "/demos/opti-move-tafel/", lab: "", foto: "/img/kiosk/opti-move-tafel.jpg" },
    { titel: "Opti+ Move stoelen", tekst: "Actief zitten, in elke maat.", kleur: "#bda8bd", product: "/demos/opti-move-stoel/", lab: "", foto: "/img/kiosk/opti-move-stoel.jpg" }
  ]);

  const WEETJES = [
    "Kinderen zitten een groot deel van de schooldag stil. Korte beweegmomenten helpen de aandacht vast te houden.",
    "De Motion Cube is kruk, tafeltje en dobbelsteen in één. Hij werkt samen met het digibord.",
    "De Agili tafel gaat van zitten naar staan, kantelt en klapt in: één tafel, vier standen.",
    "Een stoel en tafel op de juiste hoogte helpen leerlingen om goed en geconcentreerd te zitten.",
    "Vanerum maakt schoolmeubilair in een eigen fabriek in België.",
    "Onze meubels gaan lang mee en losse onderdelen zijn te vervangen."
  ];
  const BALK_STD = () => ({ aan: true, logo: true, klok: true, titel: "", kleur: "" });
  const BAND_STD = () => ({ aan: true, bron: "weetjes", label: "", weetjes: WEETJES.slice(), teksten: [], feed: "https://vanerum.nl/nl/rss.xml", kleur: "#2e3033", labelKleur: "#fbb900", wifi: false });

  function nieuweKiosk(id, naam) {
    return {
      id, naam,
      balk: BALK_STD(), band: BAND_STD(),
      presentatie: {
        achtergrond: "licht", seconden: 10,
        hint: "Tik voor onze producten", hintKleur: "#fbb900", hintPlek: "ro"
      },
      dias: [
        Object.assign({ type: "vimo" }, DIA_TYPEN.vimo.std()),
        { type: "demo", pad: "/demos/motion-cubes-intro-169/", seconden: 30 },
        { type: "demo", pad: "/demos/opti-move-stoel-demo/", seconden: 45 },
        { type: "tekst", kop: "Samen de ideale *leeromgeving* van morgen", tekst: "Tik op het scherm en bekijk de Motion Cubes, Agili en Opti+ Move." }
      ],
      overzicht: {
        titel: "Ontdek onze producten", intro: "Tik op een product voor de 3D-productpagina. Van daaruit gaat u door naar het lab.",
        achtergrond: "grijs", balk: "#1e1e1e", knop: "#fbb900", terugNa: 90, labTekst: "Naar het lab"
      },
      tegels: TEGELS_STD()
    };
  }

  /* *woord* → gele markering */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const markeer = t => esc(t).replace(/\*([^*]+)\*/g, "<mark>$1</mark>").replace(/\n/g, "<br>");

  window.KS = { WEETJES, BALK_STD, BAND_STD, ACHTERGRONDEN, KLEUREN, DIA_TYPEN, TEGELS_STD, nieuweKiosk, achtergrond, donker, esc, markeer };
})();
