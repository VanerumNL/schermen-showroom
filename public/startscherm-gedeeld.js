/* Gedeeld door het startscherm (startscherm.html) en de instellingen (startschermen.html):
   een tegelscherm voor een touchscreen in de zorg, zoals Symbaloo maar groot en rustig.
   Elke tegel is een website, een filmpje, een radiozender of een fotoalbum. */
(function () {
  const ACHTERGRONDEN = {
    licht: { naam: "Lichtblauw verloop", bg: "linear-gradient(180deg,#dcf1f9 0%,#eef8fc 55%,#f7fbfc 100%)", ink: "#1e1e1e" },
    warm: { naam: "Warm crème", bg: "linear-gradient(180deg,#fbf3e2 0%,#fdf8ef 60%,#fffdf8 100%)", ink: "#1e1e1e" },
    grijs: { naam: "Lichtgrijs", bg: "#f4f4f2", ink: "#1e1e1e" },
    wit: { naam: "Wit", bg: "#ffffff", ink: "#1e1e1e" },
    donker: { naam: "Zwart", bg: "#1e1e1e", ink: "#ffffff" }
  };
  const KLEUREN = [["#fbb900", "Geel"], ["#b8e7f9", "Lichtblauw"], ["#bda8bd", "Lila"], ["#a8cb67", "Groen"], ["#f2c7a5", "Perzik"], ["#1e1e1e", "Zwart"]];

  const SOORTEN = {
    website: { naam: "Website", kleur: "#b8e7f9", uitleg: "Opent een website binnen het scherm, met een grote Terug-knop erboven." },
    video: { naam: "Filmpje", kleur: "#fbb900", uitleg: "Een YouTube-filmpje, een hele YouTube-afspeellijst (bijv. clips van vroeger) of een eigen filmpje (mp4). Alles begint aan het eind weer opnieuw." },
    radio: { naam: "Radio", kleur: "#a8cb67", uitleg: "Een radiozender, met grote knoppen voor aan/uit en harder/zachter. Foto's erbij lopen mee in beeld." },
    fotos: { naam: "Fotoalbum", kleur: "#bda8bd", uitleg: "Foto's die rustig na elkaar in beeld komen, met grote pijlen om zelf te bladeren." }
  };

  /* eenvoudige tekeningen voor tegels zonder foto (eigen werk, Vanerum-kleuren) */
  const S = '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="#1e1e1e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">';
  const E = "</g></svg>";
  const ICONEN = {
    radio: { naam: "Radio", svg: S + '<path d="M70 70l60-38"/><circle cx="132" cy="31" r="5" fill="#1e1e1e"/><rect x="28" y="70" width="144" height="98" rx="20" fill="#fff"/><circle cx="74" cy="119" r="27" fill="#fbb900"/><path d="M58 119h32M61 107h26M61 131h26"/><rect x="114" y="92" width="40" height="18" rx="5" fill="#b8e7f9"/><path d="M128 92v18"/><circle cx="122" cy="141" r="8"/><circle cx="148" cy="141" r="8"/>' + E },
    vis: { naam: "Vissen", svg: S + '<path d="M36 102c22-34 76-42 106 0-30 40-84 32-106 0z" fill="#fbb900"/><path d="M142 102l32-26v52z" fill="#fbb900"/><circle cx="66" cy="95" r="5" fill="#1e1e1e"/><path d="M96 80c7 13 7 31 0 44"/><circle cx="54" cy="52" r="9" fill="#fff"/><circle cx="74" cy="30" r="6" fill="#fff"/><path d="M24 164c16-9 26-9 42 0s26 9 42 0 26-9 42 0 20 8 28 3"/>' + E },
    vuur: { naam: "Haardvuur", svg: S + '<rect x="26" y="40" width="148" height="20" rx="6" fill="#fff"/><path d="M40 172V60h120v112"/><path d="M58 172v-78a42 42 0 0 1 84 0v78" fill="#2e3033"/><path d="M100 160c-24 0-34-19-24-39 5 10 12 12 14 4 2-14-6-22 4-38 6 18 26 26 26 47 0 16-8 26-20 26z" fill="#fbb900"/><path d="M100 160c-10 0-14-8-10-16 3 4 6 4 7 0 2-7 0-10 4-16 4 8 10 11 10 19 0 8-4 13-11 13z" fill="#fff"/><path d="M68 168h64"/>' + E },
    foto: { naam: "Foto's", svg: S + '<rect x="50" y="58" width="118" height="98" rx="8" fill="#fff" transform="rotate(8 109 107)"/><rect x="32" y="46" width="118" height="98" rx="8" fill="#fff"/><rect x="44" y="58" width="94" height="64" fill="#b8e7f9"/><path d="M44 122l28-30 20 20 14-12 32 22"/><circle cx="118" cy="76" r="9" fill="#fbb900"/>' + E },
    tv: { naam: "Televisie", svg: S + '<path d="M100 62L76 30M100 62l24-32"/><rect x="28" y="62" width="144" height="104" rx="18" fill="#bda8bd"/><rect x="42" y="76" width="94" height="76" rx="14" fill="#fff"/><circle cx="154" cy="94" r="7" fill="#fff"/><circle cx="154" cy="122" r="7" fill="#fff"/><path d="M58 178l12-12M142 178l-12-12"/>' + E },
    muziek: { naam: "Muziek", svg: S + '<path d="M78 142V54l74-16v90"/><path d="M78 76l74-16"/><ellipse cx="62" cy="144" rx="21" ry="16" fill="#fbb900"/><ellipse cx="136" cy="130" rx="21" ry="16" fill="#fbb900"/>' + E },
    puzzel: { naam: "Puzzel", svg: S + '<path d="M46 56h36a16 16 0 1 1 32 0h36v36a16 16 0 1 1 0 32v36h-36a16 16 0 1 0-32 0H46v-36a16 16 0 1 0 0-32z" fill="#a8cb67"/>' + E },
    bloem: { naam: "Bloemen", svg: S + '<path d="M100 104v72"/><path d="M100 150c-20-2-34-14-38-30 20 0 34 12 38 30z" fill="#a8cb67"/><circle cx="100" cy="52" r="20" fill="#fff"/><circle cx="128" cy="74" r="20" fill="#fff"/><circle cx="118" cy="104" r="20" fill="#fff"/><circle cx="82" cy="104" r="20" fill="#fff"/><circle cx="72" cy="74" r="20" fill="#fff"/><circle cx="100" cy="82" r="16" fill="#fbb900"/>' + E },
    boom: { naam: "Natuur", svg: S + '<path d="M100 176v-60"/><path d="M100 140l-22-18M100 128l20-16"/><circle cx="100" cy="74" r="46" fill="#a8cb67"/><path d="M40 176h120"/>' + E },
    hart: { naam: "Hart", svg: S + '<path d="M100 166C60 138 34 112 34 82a32 32 0 0 1 66-12 32 32 0 0 1 66 12c0 30-26 56-66 84z" fill="#f2c7a5"/>' + E },
    ster: { naam: "Ster", svg: S + '<path d="M100 30l21 44 48 6-35 33 9 48-43-24-43 24 9-48-35-33 48-6z" fill="#fbb900"/>' + E }
  };

  const tegel = (soort, titel, icoon, kleur, extra) => Object.assign({ soort, titel, icoon, kleur, foto: "", blijfAan: soort !== "website" }, extra || {});
  function nieuwStartscherm(id, naam) {
    return {
      id, naam,
      start: { titel: naam || "", welkom: true, achtergrond: "warm", stand: "liggend", logo: "", vanerum: false, terugNa: 5 },
      tegels: [
        tegel("radio", "Muziek", "radio", "#fbb900", { zender: "NPO Radio 5", stream: "https://icecast.omroep.nl/radio5-bb-mp3", fotos: [], seconden: 15 }),
        tegel("video", "Vissen", "vis", "#b8e7f9", { video: "" }),
        tegel("video", "Haardvuur", "vuur", "#f2c7a5", { video: "" }),
        tegel("fotos", "Vroeger", "foto", "#bda8bd", { fotos: [], seconden: 12 }),
        tegel("video", "Oude tv", "tv", "#a8cb67", { video: "" }),
        tegel("video", "Zingen", "muziek", "#fbb900", { video: "" })
      ]
    };
  }

  /* is de tegel klaar om te tonen? */
  function compleet(t) {
    if (!t || !t.titel) return false;
    if (t.soort === "website") return /^https:\/\//i.test(t.url || "");
    if (t.soort === "video") return !!(youtubeLijst(t.video) || youtubeId(t.video) || /^(https:\/\/|\/media\/)/i.test(t.video || ""));
    if (t.soort === "radio") return /^https:\/\//i.test(t.stream || "");
    if (t.soort === "fotos") return Array.isArray(t.fotos) && t.fotos.some(f => f && f.src);
    return false;
  }
  function ontbreekt(t) {
    if (!t.titel) return "Geef de tegel een naam";
    if (t.soort === "website") return /^http:\/\//i.test(t.url || "") ? "Het adres moet met https:// beginnen" : "Vul het adres van de website in";
    if (t.soort === "video") return "Plak een YouTube-link (filmpje of afspeellijst) of upload een filmpje";
    if (t.soort === "radio") return /^http:\/\//i.test(t.stream || "") ? "Het adres van de zender moet met https:// beginnen" : "Vul het adres van de radiostream in";
    if (t.soort === "fotos") return "Upload een of meer foto's";
    return "";
  }

  /* een YouTube-afspeellijst: ...?list=PL... of /playlist?list=... */
  function youtubeLijst(u) {
    const m = String(u || "").match(/youtube(?:-nocookie)?\.com\/.*[?&]list=([A-Za-z0-9_-]{10,})/);
    return m ? m[1] : "";
  }
  function youtubeId(u) {
    const m = String(u || "").match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  }

  function donker(kleur) {
    const m = /^#([0-9a-f]{6})$/i.exec(kleur || "");
    if (!m) return false;
    const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) < 140;
  }
  function achtergrond(w) {
    if (ACHTERGRONDEN[w]) return ACHTERGRONDEN[w];
    if (/^#[0-9a-f]{6}$/i.test(w || "")) return { naam: "Eigen kleur", bg: w, ink: donker(w) ? "#ffffff" : "#1e1e1e" };
    return ACHTERGRONDEN.warm;
  }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  window.SS = { ACHTERGRONDEN, KLEUREN, SOORTEN, ICONEN, nieuwStartscherm, compleet, ontbreekt, youtubeId, youtubeLijst, donker, achtergrond, esc };
})();
