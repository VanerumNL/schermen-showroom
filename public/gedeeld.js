/* Gedeeld door editor en scherm: sjablonen, blokken en standaardwaarden. */
(function () {
  const SJABLONEN = {
    volledig: { naam: "Eén groot vlak", cols: "1fr", rows: "1fr", areas: ["a"] },
    twee: { naam: "Twee naast elkaar", cols: "1fr 1fr", rows: "1fr", areas: ["a b"] },
    zijbalk: { naam: "Groot + zijbalk", cols: "1.9fr 1fr", rows: "1fr 1fr", areas: ["a b", "a c"] },
    boven: { naam: "Groot boven, twee onder", cols: "1fr 1fr", rows: "1.5fr 1fr", areas: ["a a", "b c"] },
    drie: { naam: "Drie kolommen", cols: "1fr 1fr 1fr", rows: "1fr", areas: ["a b c"] },
    vier: { naam: "Vier vlakken", cols: "1fr 1fr", rows: "1fr 1fr", areas: ["a b", "c d"] }
  };
  const vakkenVan = sj => [...new Set(SJABLONEN[sj].areas.join(" ").split(" "))];

  const THEMAS = {
    licht: { naam: "Lichtblauw", bg: "linear-gradient(180deg,#dcf1f9 0%,#eef8fc 55%,#f7fbfc 100%)", kaart: "#ffffff", ink: "#1e1e1e", zacht: "#5f5d58", lijn: "#eeedea" },
    wit: { naam: "Wit", bg: "#f4f3f0", kaart: "#ffffff", ink: "#1e1e1e", zacht: "#5f5d58", lijn: "#eeedea" },
    donker: { naam: "Antraciet", bg: "#1e1e1e", kaart: "#2e3033", ink: "#ffffff", zacht: "#c9c7c2", lijn: "#45474a" },
    geel: { naam: "Geel", bg: "#fbb900", kaart: "#ffffff", ink: "#1e1e1e", zacht: "#5f5d58", lijn: "#eeedea" }
  };

  const FEEDS = [
    { groep: "Landelijk", naam: "NOS – algemeen", url: "https://feeds.nos.nl/nosnieuwsalgemeen" },
    { groep: "Landelijk", naam: "NOS – binnenland", url: "https://feeds.nos.nl/nosnieuwsbinnenland" },
    { groep: "Landelijk", naam: "NOS – sport", url: "https://feeds.nos.nl/nossportalgemeen" },
    { groep: "Landelijk", naam: "NOS – tech", url: "https://feeds.nos.nl/nosnieuwstech" },
    { groep: "Landelijk", naam: "NU.nl – algemeen", url: "https://www.nu.nl/rss" },
    { groep: "Landelijk", naam: "NU.nl – binnenland", url: "https://www.nu.nl/rss/Binnenland" },
    { groep: "Landelijk", naam: "NU.nl – economie", url: "https://www.nu.nl/rss/Economie" },
    { groep: "Landelijk", naam: "NU.nl – tech", url: "https://www.nu.nl/rss/Tech" },
    { groep: "Landelijk", naam: "NU.nl – sport", url: "https://www.nu.nl/rss/Sport" },
    { groep: "Landelijk", naam: "AD", url: "https://www.ad.nl/home/rss.xml" },
    { groep: "Landelijk", naam: "de Volkskrant", url: "https://www.volkskrant.nl/voorpagina/rss.xml" },
    { groep: "Landelijk", naam: "NRC", url: "https://www.nrc.nl/rss/" },
    { groep: "Landelijk", naam: "De Telegraaf", url: "https://www.telegraaf.nl/rss" },
    { groep: "Regionaal", naam: "RTV Utrecht", url: "https://www.rtvutrecht.nl/rss/index.xml" },
    { groep: "Regionaal", naam: "Omroep Gelderland", url: "https://www.omroepgelderland.nl/rss" },
    { groep: "Regionaal", naam: "RTV Oost (Overijssel)", url: "https://www.rtvoost.nl/rss/default.aspx" },
    { groep: "Regionaal", naam: "RTV Noord (Groningen)", url: "https://www.rtvnoord.nl/rss" },
    { groep: "Regionaal", naam: "Omroep Brabant", url: "https://www.omroepbrabant.nl/rss" },
    { groep: "Regionaal", naam: "Omroep West", url: "https://www.omroepwest.nl/rss/index.xml" },
    { groep: "Onderwijs", naam: "Kennisnet", url: "https://www.kennisnet.nl/feed/" }
  ];

  const VIMO_BEWEGINGEN = ["hoi", "wijzen", "kubus", "springen", "balans", "knieen", "draaien"];

  /* Elk blok: naam, korte uitleg en standaardinstellingen */
  const BLOKKEN = {
    mededelingen: { naam: "Mededelingen", uitleg: "Berichten die om de beurt in beeld komen", std: () => ({ titel: "Mededelingen", seconden: 12, items: [{ kop: "Welkom!", tekst: "Fijn dat u er bent.", van: "", tot: "" }] }) },
    klok: { naam: "Klok", uitleg: "Tijd met seconden en de datum", std: () => ({ seconden: true }) },
    weer: { naam: "Weer", uitleg: "Het weer nu en de komende dagen", std: () => ({ plaats: "IJsselstein", lat: 52.02, lon: 5.04 }) },
    nieuws: { naam: "Nieuws", uitleg: "Koppen uit een nieuwsbron (RSS)", std: () => ({ titel: "Nieuws", feed: FEEDS[0].url, seconden: 10 }) },
    vimo: { naam: "Vimo", uitleg: "De bewegende mascotte met tekstballon", std: () => ({ kubus: true, zinnen: ["Welkom bij Vanerum!", "Kijk, de Motion Cube!", "Bewegen in de klas!", "Fijn dat u er bent!"] }) },
    fotos: { naam: "Foto's", uitleg: "Diavoorstelling van eigen afbeeldingen", std: () => ({ afbeeldingen: [], seconden: 8, passend: "vullen" }) },
    demo: { naam: "Productdemo", uitleg: "Uw 3D-demo's en productpagina's; ze lopen vanzelf en wisselen elkaar af", std: () => ({ demos: ["/demos/multiflex-demo/"], seconden: 45, eigen: [] }) },
    video: { naam: "Video", uitleg: "YouTube-video, zonder geluid en herhalend", std: () => ({ youtube: "" }) },
    tekst: { naam: "Tekst", uitleg: "Kop en tekst; zet *sterretjes* om een woord voor een gele markering", std: () => ({ kop: "Welkom bij *Vanerum!*", tekst: "", grootte: "groot" }) },
    logo: { naam: "Logo", uitleg: "Het Vanerum-logo met streepjes", std: () => ({ ondertitel: "" }) },
    leeg: { naam: "Leeg", uitleg: "Niets tonen", std: () => ({}) }
  };

  function nieuwScherm(id, naam) {
    return {
      id, naam, sjabloon: "zijbalk", thema: "licht",
      balk: { aan: true, logo: true, klok: true, titel: "" },
      band: { aan: true, bron: "nieuws", feed: FEEDS[0].url },
      vakken: {
        a: Object.assign({ type: "mededelingen" }, BLOKKEN.mededelingen.std()),
        b: Object.assign({ type: "weer" }, BLOKKEN.weer.std()),
        c: Object.assign({ type: "vimo" }, BLOKKEN.vimo.std()),
        d: Object.assign({ type: "klok" }, BLOKKEN.klok.std())
      }
    };
  }

  function youtubeId(u) {
    u = (u || "").trim();
    const m = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/) || u.match(/^([\w-]{11})$/);
    return m ? m[1] : "";
  }

  window.VS = { SJABLONEN, vakkenVan, THEMAS, FEEDS, BLOKKEN, VIMO_BEWEGINGEN, nieuwScherm, youtubeId };
})();
