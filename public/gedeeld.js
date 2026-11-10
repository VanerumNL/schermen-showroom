/* Gedeeld door editor en scherm: sjablonen, blokken en standaardwaarden. */
(function () {
  const SJABLONEN = {
    volledig: { naam: "Eén groot vlak", cols: "1fr", rows: "1fr", areas: ["a"] },
    twee: { naam: "Twee naast elkaar", cols: "1fr 1fr", rows: "1fr", areas: ["a b"] },
    zijbalk: { naam: "Groot + zijbalk", cols: "1.9fr 1fr", rows: "1fr 1fr", areas: ["a b", "a c"] },
    boven: { naam: "Groot boven, twee onder", cols: "1fr 1fr", rows: "1.5fr 1fr", areas: ["a a", "b c"] },
    drie: { naam: "Drie kolommen", cols: "1fr 1fr 1fr", rows: "1fr", areas: ["a b c"] },
    vier: { naam: "Vier vlakken", cols: "1fr 1fr", rows: "1fr 1fr", areas: ["a b", "c d"] },
    welkom: { naam: "Welkomstscherm", cols: "1fr", rows: "1fr", areas: ["a"], speciaal: true }
  };
  /* Staande versies (1080 × 1920) van dezelfde sjablonen; de vakletters zijn gelijk,
     zodat wisselen tussen liggend en staand geen inhoud kwijtraakt. */
  const STAAND = {
    volledig: { naam: "Eén groot vlak", cols: "1fr", rows: "1fr", areas: ["a"] },
    twee: { naam: "Twee onder elkaar", cols: "1fr", rows: "1fr 1fr", areas: ["a", "b"] },
    zijbalk: { naam: "Groot + twee onder", cols: "1fr 1fr", rows: "1.7fr 1fr", areas: ["a a", "b c"] },
    boven: { naam: "Groot boven, twee onder elkaar", cols: "1fr", rows: "1.6fr 1fr 1fr", areas: ["a", "b", "c"] },
    drie: { naam: "Drie onder elkaar", cols: "1fr", rows: "1fr 1fr 1fr", areas: ["a", "b", "c"] },
    vier: { naam: "Vier vlakken", cols: "1fr 1fr", rows: "1fr 1fr", areas: ["a b", "c d"] },
    welkom: { naam: "Welkomstscherm", cols: "1fr", rows: "1fr", areas: ["a"], speciaal: true }
  };
  const isStaand = s => !!s && s.stand === "staand";
  /* het raster van een sjabloon in de juiste stand */
  const sjabloon = (sj, staand) => {
    const k = sj in SJABLONEN ? sj : "zijbalk";
    return staand ? STAAND[k] : SJABLONEN[k];
  };
  const vakkenVan = sj => [...new Set(SJABLONEN[sj].areas.join(" ").split(" "))];

  const THEMAS = {
    licht: { naam: "Lichtblauw", bg: "linear-gradient(180deg,#dcf1f9 0%,#eef8fc 55%,#f7fbfc 100%)", kaart: "#ffffff", ink: "#1e1e1e", zacht: "#5f5d58", lijn: "#eeedea" },
    wit: { naam: "Wit", bg: "#f4f3f0", kaart: "#ffffff", ink: "#1e1e1e", zacht: "#5f5d58", lijn: "#eeedea" },
    donker: { naam: "Antraciet", bg: "#1e1e1e", kaart: "#2e3033", ink: "#ffffff", zacht: "#c9c7c2", lijn: "#45474a" },
    geel: { naam: "Geel", bg: "#fbb900", kaart: "#ffffff", ink: "#1e1e1e", zacht: "#5f5d58", lijn: "#eeedea" }
  };

  const FEEDS = [
    { groep: "Vanerum", naam: "Vanerum nieuws", url: "https://vanerum.nl/nl/rss.xml" },
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
    video: { naam: "Video / filmpje", uitleg: "Een Vanerum-filmpje of een YouTube-video, zonder geluid en steeds opnieuw", std: () => ({ youtube: "", film: "/demos/vanerum-loopt-169/" }) },
    tekst: { naam: "Tekst", uitleg: "Kop en tekst; zet *sterretjes* om een woord voor een gele markering", std: () => ({ kop: "Welkom bij *Vanerum!*", tekst: "", grootte: "groot" }) },
    logo: { naam: "Logo", uitleg: "Het Vanerum-logo met streepjes", std: () => ({ ondertitel: "" }) },
    leeg: { naam: "Leeg", uitleg: "Niets tonen", std: () => ({}) }
  };

  /* het welkomstscherm met Vimo en wist-u-datjes */
  const WELKOM_STD = () => ({
    titel: "Welkom bij *Vanerum!*",
    ondertitel: "Fijn dat u er bent. Samen maken we de ideale leeromgeving van morgen.",
    weetjes: [
      "Kinderen zitten een groot deel van de schooldag stil. Korte beweegmomenten helpen de aandacht vast te houden.",
      "De Motion Cube is kruk, tafeltje en dobbelsteen in één. Hij werkt samen met het digibord.",
      "Een stoel en tafel op de juiste hoogte helpen leerlingen om goed en geconcentreerd te zitten.",
      "Goede akoestiek maakt een lokaal rustiger: leerlingen verstaan elkaar beter en de leerkracht hoeft minder hard te praten.",
      "Vanerum maakt schoolmeubilair in een eigen fabriek in België.",
      "Een leeromgeving op maat van de visie van uw school: daar denken wij graag over mee.",
      "Onze meubels gaan lang mee en losse onderdelen zijn te vervangen."
    ],
    seconden: 12,
    zinnen: ["Welkom bij Vanerum!", "Kijk, de Motion Cube!", "Ik sta op de kubus!", "Bewegen in de klas!", "Fijn dat u er bent!", "Kunt u dit ook?", "", "Even draaien!"],
    klok: true
  });
  const WELKOM_BEWEGINGEN = ["hoi", "wijzen", "kubus", "springen", "hoi", "balans", "knieen", "draaien"];


  /* onderwijsquotes voor het tussendoor-scherm (de bronvermelding is zoals de quote meestal wordt toegeschreven) */
  const QUOTES = [
    { tekst: "Onderwijs is het krachtigste wapen dat je kunt gebruiken om de wereld te veranderen.", wie: "Nelson Mandela" },
    { tekst: "Help mij het zelf te doen.", wie: "Maria Montessori" },
    { tekst: "Ik heb geen speciaal talent. Ik ben alleen hartstochtelijk nieuwsgierig.", wie: "Albert Einstein" },
    { tekst: "Onderwijs is het paspoort naar de toekomst, want morgen is van hen die zich er vandaag op voorbereiden.", wie: "Malcolm X" },
    { tekst: "Vertel het mij en ik vergeet het. Leer het mij en ik onthoud het misschien. Laat mij meedoen en ik leer het.", wie: "Chinees gezegde" },
    { tekst: "Een goede leerkracht geeft hoop, ontsteekt de verbeelding en wekt de liefde voor leren.", wie: "Brad Henry" },
    { tekst: "Wie stopt met leren, is oud. Wie blijft leren, blijft jong.", wie: "Henry Ford" },
    { tekst: "Onderwijs is niet het vullen van een emmer, maar het ontsteken van een vuur.", wie: "Naar Plutarchus" }
  ];

  /* tussendoor: na een tijdje een paar seconden een volledig scherm */
  const TUSSEN_TYPEN = {
    weer: { naam: "Weer", std: () => ({ plaats: "IJsselstein", lat: 52.02, lon: 5.04 }) },
    quote: { naam: "Quote over onderwijs", std: () => ({ bron: "bibliotheek", tekst: "", wie: "" }) },
    weetje: { naam: "Wist u dat…", std: () => ({ weetjes: WELKOM_STD().weetjes }) },
    product: { naam: "Product", std: () => ({ titel: "Motion Cube", tekst: "Kruk, tafeltje en dobbelsteen in één.", punten: ["Samen met het digibord te gebruiken", "Even bewegen in de les"], foto: "" }) },
    countdown: { naam: "Countdown (bijv. naar de NOT)", std: () => ({ titel: "Nationale Onderwijs Tentoonstelling", ondertitel: "Jaarbeurs Utrecht · 19 t/m 23 januari 2027", datum: "2027-01-19", eind: "2027-01-23", tekst: "" }) },
    tekst: { naam: "Eigen bericht", std: () => ({ kop: "Welkom bij *Vanerum!*", tekst: "" }) }
  };
  const TUSSENDOOR_STD = () => ({
    aan: false, elke: 5, duur: 20,
    kaarten: [Object.assign({ type: "weer" }, TUSSEN_TYPEN.weer.std()), Object.assign({ type: "quote" }, TUSSEN_TYPEN.quote.std()), Object.assign({ type: "weetje" }, TUSSEN_TYPEN.weetje.std())]
  });

  function nieuwScherm(id, naam) {
    return {
      id, naam, sjabloon: "zijbalk", thema: "licht",
      balk: { aan: true, logo: true, klok: true, titel: "" },
      band: { aan: true, bron: "nieuws", feed: FEEDS[0].url },
      tussendoor: TUSSENDOOR_STD(),
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

  window.VS = { WELKOM_STD, WELKOM_BEWEGINGEN, SJABLONEN, STAAND, isStaand, sjabloon, vakkenVan, THEMAS, FEEDS, BLOKKEN, VIMO_BEWEGINGEN, nieuwScherm, youtubeId, QUOTES, TUSSEN_TYPEN, TUSSENDOOR_STD };
})();
