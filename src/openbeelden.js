/* Open Beelden (openbeelden.nl): het open archief van Beeld en Geluid.
   Polygoon-journaals en ander bioscoopnieuws zijn er vrij te gebruiken (Creative Commons
   of rechtenvrij). We halen de gegevens op via de OAI-PMH-koppeling en bewaren een lijst
   in KV, zodat een startscherm-tegel ze als een tv-zender met oud nieuws kan afspelen.

   KV:
     ob:lijst   [{ id, t, j, s, p, v }]  titel, jaar, seconden, plaats, mp4-adres
     ob:stand   { token, klaar, ronde, bijgewerkt }  waar het ophalen gebleven is

   Ophalen gebeurt stapsgewijs: elke cron-run (elk kwartier) een paar pagina's van 100,
   tot alles binnen is. Daarna één keer per week opnieuw voor nieuwe en gewijzigde items. */

const BASIS = "https://www.openbeelden.nl";
const OAI = BASIS + "/feeds/oai/";
const MAX = 12000;          /* zoveel filmpjes bewaren we hooguit */
const TOT_JAAR = 1999;      /* alleen beelden van vroeger */
const MAX_DUUR = 20 * 60;   /* langer dan 20 minuten slaan we over */
const UA = "VanerumSchermen/1.0 (+https://www.vanerum.nl; startscherm voor de zorg)";

function ontsnap(s) {
  return String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/\s+/g, " ").trim();
}
function duur(iso) {
  const m = String(iso || "").match(/P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  return m ? (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + Math.round(+(m[3] || 0)) : 0;
}
/* waarden van een element, met of zonder voorvoegsel (oi:, dc:, dcterms:) */
function waarden(blok, naam) {
  const re = new RegExp(`<(?:[\\w-]+:)?${naam}\\b([^>]*)>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${naam}>`, "g");
  const uit = []; let m;
  while ((m = re.exec(blok))) uit.push({ attr: m[1], tekst: ontsnap(m[2]) });
  return uit;
}
function nl(lijst) {
  const v = lijst.find(x => /xml:lang=["']nl/i.test(x.attr)) || lijst.find(x => !/xml:lang=["']en/i.test(x.attr)) || lijst[0];
  return v ? v.tekst : "";
}

/* Eén OAI-record omzetten naar een filmpje voor het scherm (of null als het niet bruikbaar is) */
export function leesRecord(rec) {
  if (/<header[^>]*status=["']deleted/i.test(rec)) return null;
  const id = (rec.match(/oai:openimages\.eu:(\d+)/) || [])[1];
  if (!id) return null;
  /* het mp4-adres; soms volledig, soms beginnend met /files/ */
  const mp4s = [...rec.matchAll(/((?:https?:\/\/[^\s<>"']+)?\/files\/[^\s<>"']+?\.mp4)\b/gi)].map(m => m[1]);
  if (!mp4s.length) return null;
  const pad = mp4s[0].replace(/&amp;/g, "&");
  const v = pad.startsWith("http") ? pad.replace(/^http:/, "https:") : BASIS + pad;
  const typen = waarden(rec, "type").map(x => x.tekst.toLowerCase());
  if (typen.length && !typen.some(t => /moving|video|film/.test(t))) return null;
  const titel = nl(waarden(rec, "title"));
  const jaar = +((waarden(rec, "date").map(x => x.tekst).join(" ").match(/\b(1[89]\d\d|20[0-2]\d)\b/) || [])[1] || 0);
  const s = duur((waarden(rec, "extent")[0] || {}).tekst);
  if (s && s > MAX_DUUR) return null;
  const plaats = nl(waarden(rec, "spatial")).split(/[;,]/)[0].trim();
  if (!titel || !jaar || jaar > TOT_JAAR) return null;
  return { id: +id, t: titel.slice(0, 120), j: jaar, s, p: plaats.slice(0, 60), v };
}

export function leesPagina(xml) {
  const items = [];
  for (const m of xml.matchAll(/<record\b[\s\S]*?<\/record>/g)) {
    const it = leesRecord(m[0]);
    if (it) items.push(it);
  }
  const tok = xml.match(/<resumptionToken\b[^>]*>([^<]*)<\/resumptionToken>/);
  const fout = (xml.match(/<error\b[^>]*code=["']([^"']+)/) || [])[1] || "";
  return { items, token: tok ? ontsnap(tok[1]) : "", fout };
}

async function haalPagina(stand) {
  const u = stand.token
    ? `${OAI}?verb=ListRecords&resumptionToken=${encodeURIComponent(stand.token)}`
    : `${OAI}?verb=ListRecords&metadataPrefix=oai_oi&set=beeldengeluid${stand.vanaf ? "&from=" + stand.vanaf : ""}`;
  const res = await fetch(u, { headers: { "user-agent": UA, accept: "application/xml,text/xml" } });
  if (!res.ok) throw new Error("Open Beelden gaf een fout (" + res.status + ")");
  return leesPagina(await res.text());
}

/* Een paar pagina's verder ophalen en de lijst in KV bijwerken */
export async function verzamel(env, paginas = 3) {
  const nu = new Date();
  let stand = (await env.KV.get("ob:stand", "json")) || { token: "", klaar: false, vanaf: "" };
  if (stand.klaar) {
    /* alles binnen: eens per week opnieuw beginnen vanaf de vorige keer, voor nieuwe items */
    if (nu - new Date(stand.bijgewerkt || 0) < 7 * 864e5) return { klaar: true, nieuw: 0 };
    stand = { token: "", klaar: false, vanaf: (stand.bijgewerkt || "").slice(0, 10) };
  }
  const lijst = (await env.KV.get("ob:lijst", "json")) || [];
  const bekend = new Map(lijst.map((x, i) => [x.id, i]));
  let nieuw = 0;
  for (let n = 0; n < paginas; n++) {
    const p = await haalPagina(stand);
    if (p.fout === "noRecordsMatch") { stand.token = ""; stand.klaar = true; break; }
    if (p.fout === "badResumptionToken") { stand.token = ""; break; }   /* opnieuw beginnen; bekende items worden bijgewerkt */
    if (p.fout && !p.items.length) throw new Error("Open Beelden: " + p.fout);
    for (const it of p.items) {
      if (bekend.has(it.id)) lijst[bekend.get(it.id)] = it;
      else if (lijst.length < MAX) { bekend.set(it.id, lijst.length); lijst.push(it); nieuw++; }
    }
    stand.token = p.token;
    if (!p.token) { stand.klaar = true; break; }
  }
  stand.bijgewerkt = nu.toISOString(); stand.aantal = lijst.length;
  await env.KV.put("ob:lijst", JSON.stringify(lijst));
  await env.KV.put("ob:stand", JSON.stringify(stand));
  return { klaar: stand.klaar, nieuw, aantal: lijst.length };
}

/* Voor het scherm: een geschudde selectie filmpjes uit de gekozen jaren */
export async function selectie(env, van, tot, aantal) {
  let lijst = (await env.KV.get("ob:lijst", "json")) || [];
  let passend = lijst.filter(x => x.j >= van && x.j <= tot);
  /* nog (bijna) niets binnen: meteen een paar pagina's ophalen, zodat er iets te zien is */
  if (passend.length < 10) {
    const stand = (await env.KV.get("ob:stand", "json")) || {};
    if (!stand.klaar) {
      try { await verzamel(env, 4); } catch (e) { if (!passend.length) throw e; }
      lijst = (await env.KV.get("ob:lijst", "json")) || [];
      passend = lijst.filter(x => x.j >= van && x.j <= tot);
    }
  }
  for (let a = passend.length - 1; a > 0; a--) { const b = Math.floor(Math.random() * (a + 1)); [passend[a], passend[b]] = [passend[b], passend[a]]; }
  return { totaal: passend.length, items: passend.slice(0, aantal) };
}
