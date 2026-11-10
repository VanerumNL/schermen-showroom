/* Koppeling met AbleSign (https://api.ablesign.tv/api/v1).
   Nodig in Cloudflare (Settings → Variables and Secrets):
     ABLESIGN_KEY        secret, de API-sleutel uit AbleSign (Account → API Keys), begint met ak_
     ABLESIGN_WORKSPACE  (optioneel) nummer van de workspace, als u er meer dan één hebt
     MELDING_WEBHOOK     (optioneel) secret, webhook-adres van een Teams-kanaal (Workflows) voor offline-meldingen
     SITE_URL            (optioneel) adres van de editor, voor de knop in de melding
   KV-sleutels:
     ablesign:webapp:<id>   nummer van de web app in AbleSign voor indeling <id>
     ablesign:offline       { schermId: { titel, sinds } } van schermen die nu offline zijn (voor de meldingen) */

const STANDAARD_API = "https://api.ablesign.tv/api/v1";
const ONLINE_MINUTEN = 10;      /* in de editor: groen als het scherm zich de laatste 10 minuten meldde */
const OFFLINE_MINUTEN = 20;     /* melding pas na 20 minuten stilte, zodat een herstart geen melding geeft */
const KANTOOR = { dagen: [1, 2, 3, 4, 5], van: "08:00", tot: "18:00", zone: "Europe/Amsterdam" };

export class AbleSignFout extends Error {
  constructor(msg, status, code) { super(msg); this.status = status; this.code = code; }
}

const VERTALING = {
  RATE_LIMITED: "AbleSign krijgt even te veel verzoeken. Probeer het over een minuut opnieuw.",
  RATE_LIMIT_EXCEEDED: "Dit scherm is net een paar keer aangepast; AbleSign laat dat maximaal 15 keer per minuut en 30 keer per uur toe. Probeer het straks opnieuw.",
  PLAYLIST_LIMIT_EXCEEDED: "De playlist van dit scherm zit vol (maximaal 100 onderdelen).",
  NOT_FOUND: "Niet gevonden in AbleSign.",
  RESOURCE_LIMIT_REACHED: "Het maximale aantal websites in uw AbleSign-account is bereikt."
};

export function ableSignAan(env) { return !!env.ABLESIGN_KEY; }

async function as(env, pad, opties = {}) {
  const basis = (env.ABLESIGN_API || STANDAARD_API).replace(/\/+$/, "");
  const headers = { authorization: "Bearer " + env.ABLESIGN_KEY, accept: "application/json" };
  if (env.ABLESIGN_WORKSPACE) headers["workspace-id"] = String(env.ABLESIGN_WORKSPACE);
  if (opties.body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(basis + pad, { method: opties.method || "GET", headers, body: opties.body !== undefined ? JSON.stringify(opties.body) : undefined });
  if (res.status === 204) return null;
  const d = await res.json().catch(() => ({}));
  if (!res.ok || d.status === "error") {
    if (res.status === 401) throw new AbleSignFout("AbleSign weigert de API-sleutel. Klopt het secret ABLESIGN_KEY in Cloudflare?", 502, "UNAUTHORIZED");
    throw new AbleSignFout(VERTALING[d.code] || ("AbleSign: " + (d.message || "fout " + res.status)), res.status === 429 ? 429 : 502, d.code);
  }
  return d;
}

/* alle pagina's van een lijst ophalen (max. 200 per keer) */
async function alles(env, pad) {
  const uit = [];
  for (let offset = 0; offset < 2000; offset += 200) {
    const d = await as(env, pad + (pad.includes("?") ? "&" : "?") + "limit=200&offset=" + offset);
    uit.push(...(d.data || []));
    if (uit.length >= (d.totalItems || 0) || !(d.data || []).length) break;
  }
  return uit;
}

const schermUrl = (origin, id) => origin + "/s/" + id;
const zelfdeUrl = (a, b) => (a || "").replace(/\/+$/, "").toLowerCase() === (b || "").replace(/\/+$/, "").toLowerCase();
function minutenGeleden(t) { return t ? (Date.now() - Date.parse(t)) / 60000 : Infinity; }

/* Playlist van een scherm, of van zijn schermgroep als het scherm in een groep zit (dan speelt de groep). */
function playlistPad(doel) { return doel.groep ? "/screen_groups/" + doel.groep : "/screens/" + doel.scherm; }

/* een opgehaald playlist-item omzetten naar wat "playlist opslaan" verwacht */
const ITEMVELDEN = ["mediafileId", "webAppId", "displayDuration", "transition", "transitionSpeedLabel", "scheduleEnabled", "scheduleStartDate", "scheduleEndDate", "scheduleRrule", "periodicScheduleEnabled",
  ...["mon", "tue", "wed", "thu", "fri", "sat", "sun"].flatMap(d => [d + "Start", d + "End"])];
function naarOpslaan(pl, items) {
  return {
    shufflePlay: !!pl.shufflePlay,
    defaultTransition: pl.defaultTransition ?? null,
    defaultTransitionSpeedLabel: pl.defaultTransitionSpeedLabel ?? null,
    enableImageTransitions: !!pl.enableImageTransitions,
    enableWebappTransitions: !!pl.enableWebappTransitions,
    items: items.map((it, i) => {
      const o = { sequenceNumber: i };
      for (const k of ITEMVELDEN) if (it[k] !== undefined) o[k] = it[k];
      if (o.mediafileId == null) delete o.mediafileId;
      if (o.webAppId == null) delete o.webAppId;
      return o;
    })
  };
}

/* De web app in AbleSign die naar /s/<id> wijst: bewaard nummer, anders zoeken op adres, anders nieuw maken. */
async function webAppVoor(env, origin, id, naam) {
  const url = schermUrl(origin, id);
  const bewaard = await env.KV.get("ablesign:webapp:" + id);
  if (bewaard) {
    try {
      const d = await as(env, "/web_apps/" + bewaard);
      if (d && d.data && zelfdeUrl(d.data.url, url)) return +bewaard;
    } catch (e) { if (e.code !== "NOT_FOUND") throw e; }
  }
  const lijst = await alles(env, "/web_apps?sortBy=creation_date_desc");
  for (const w of lijst) {
    if (!w.url) {   /* de lijst geeft geen adres; bij twijfel de details ophalen */
      if (!/vanerum|scherm/i.test(w.title || "")) continue;
      const d = await as(env, "/web_apps/" + w.id).catch(() => null);
      w.url = d && d.data && d.data.url;
    }
    if (zelfdeUrl(w.url, url)) { await env.KV.put("ablesign:webapp:" + id, String(w.id)); return w.id; }
  }
  const nieuw = await as(env, "/web_apps", { method: "POST", body: { title: ("Vanerum Schermen – " + (naam || id)).slice(0, 255), description: "Gemaakt vanuit Vanerum Schermen", url } });
  await env.KV.put("ablesign:webapp:" + id, String(nieuw.data.id));
  return nieuw.data.id;
}

/* Overzicht voor de editor: alle AbleSign-schermen, of ze online zijn en welke indelingen ze tonen. */
export async function overzicht(env, origin) {
  const schermen = (await alles(env, "/screens?sortBy=title_asc")).filter(s => !s.demo);
  /* welke web apps horen bij welke indeling */
  const webapps = {};
  const lijst = await env.KV.list({ prefix: "ablesign:webapp:" });
  for (const k of lijst.keys) { const n = await env.KV.get(k.name); if (n) webapps[n] = k.name.slice("ablesign:webapp:".length); }
  /* playlists ophalen: één keer per groep, één keer per los scherm */
  const playlists = {};
  const doelen = [...new Set(schermen.map(s => s.screenGroupId ? "g" + s.screenGroupId : "s" + s.id))].slice(0, 30);
  await Promise.all(doelen.map(async d => {
    const pad = d[0] === "g" ? "/screen_groups/" + d.slice(1) : "/screens/" + d.slice(1);
    try { playlists[d] = (await as(env, pad + "/playlist")).data; } catch (e) { playlists[d] = null; }
  }));
  const groepen = {};
  if (schermen.some(s => s.screenGroupId)) {
    for (const g of await alles(env, "/screen_groups")) groepen[g.id] = g.title;
  }
  return schermen.map(s => {
    const pl = playlists[s.screenGroupId ? "g" + s.screenGroupId : "s" + s.id];
    const items = pl ? pl.items || [] : [];
    return {
      id: s.id, titel: s.title, stand: /portrait/.test(s.orientation || "") ? "staand" : "liggend",
      online: minutenGeleden(s.heartbeatTime) <= ONLINE_MINUTEN, gezien: s.heartbeatTime || null,
      groep: s.screenGroupId ? { id: s.screenGroupId, titel: groepen[s.screenGroupId] || "groep " + s.screenGroupId } : null,
      aantal: items.length,
      indelingen: [...new Set(items.filter(it => it.webAppId && webapps[it.webAppId]).map(it => webapps[it.webAppId]))],
      playlistOnbekend: !pl
    };
  });
}

/* Indeling <id> op AbleSign-schermen zetten.
   alleen=true: de playlist bevat daarna alleen deze indeling. Anders komt hij vooraan erbij (als hij er nog niet in staat). */
export async function zetOpTv(env, origin, { id, naam, schermen, alleen, seconden }) {
  const webAppId = await webAppVoor(env, origin, id, naam);
  const duur = Math.max(10, Math.min(86400, +seconden || 60));
  const alle = await alles(env, "/screens");
  const resultaat = [], gedaan = new Set();
  for (const sid of schermen) {
    const s = alle.find(x => x.id === +sid);
    if (!s) { resultaat.push({ id: sid, ok: false, fout: "Scherm niet gevonden in AbleSign" }); continue; }
    const doel = s.screenGroupId ? { groep: s.screenGroupId } : { scherm: s.id };
    const sleutel = playlistPad(doel);
    if (gedaan.has(sleutel)) { resultaat.push({ id: s.id, titel: s.title, ok: true, via: "groep" }); continue; }
    gedaan.add(sleutel);
    try {
      const pl = (await as(env, sleutel + "/playlist")).data || {};
      const items = pl.items || [];
      const staatErIn = items.some(it => it.webAppId === webAppId);
      if (alleen) {
        if (!(items.length === 1 && staatErIn)) {
          await as(env, sleutel + "/playlist", { method: "PUT", body: naarOpslaan(pl, [{ webAppId, displayDuration: duur }]) });
        }
      } else if (!staatErIn) {
        await as(env, sleutel + "/playlist_items", { method: "POST", body: { position: "start", items: [{ webAppId, displayDuration: duur }] } });
      }
      resultaat.push({ id: s.id, titel: s.title, ok: true, al: staatErIn && !alleen, groep: s.screenGroupId || null });
    } catch (e) {
      resultaat.push({ id: s.id, titel: s.title, ok: false, fout: e.message });
    }
  }
  return { webAppId, resultaat };
}

/* Indeling <id> van één AbleSign-scherm (of zijn groep) halen; de rest van de playlist blijft staan. */
export async function haalVanTv(env, { id, scherm }) {
  const webAppId = +(await env.KV.get("ablesign:webapp:" + id) || 0);
  if (!webAppId) return { ok: true };
  const s = (await as(env, "/screens/" + scherm)).data;
  const sleutel = playlistPad(s.screenGroupId ? { groep: s.screenGroupId } : { scherm: s.id });
  const pl = (await as(env, sleutel + "/playlist")).data || {};
  const items = pl.items || [];
  const rest = items.filter(it => it.webAppId !== webAppId);
  if (rest.length !== items.length) await as(env, sleutel + "/playlist", { method: "PUT", body: naarOpslaan(pl, rest) });
  return { ok: true, leeg: rest.length === 0 };
}

/* ===== offline-melding (cron) ===== */
function tijdIn(zone, d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: zone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).map(x => [x.type, x.value]));
  return { dag: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), hhmm: p.hour + ":" + p.minute };
}
export function kantoortijd(d = new Date()) {
  const t = tijdIn(KANTOOR.zone, d);
  return KANTOOR.dagen.includes(t.dag) && t.hhmm >= KANTOOR.van && t.hhmm < KANTOOR.tot;
}
const tijdNl = t => t ? new Date(t).toLocaleString("nl-NL", { timeZone: KANTOOR.zone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "nooit";

export async function stuurMelding(env, titel, regels, link) {
  if (!env.MELDING_WEBHOOK) return false;
  /* Teams-workflow ("Post to a channel when a webhook request is received") verwacht een Adaptive Card */
  const kaart = {
    type: "AdaptiveCard", $schema: "http://adaptivecards.io/schemas/adaptive-card.json", version: "1.4",
    body: [{ type: "TextBlock", text: titel, weight: "Bolder", size: "Medium", wrap: true },
      ...regels.map(r => ({ type: "TextBlock", text: r, wrap: true, spacing: "Small" }))],
    actions: link ? [{ type: "Action.OpenUrl", title: "Open Vanerum Schermen", url: link }] : []
  };
  const res = await fetch(env.MELDING_WEBHOOK, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "message", text: titel + "\n" + regels.join("\n"), attachments: [{ contentType: "application/vnd.microsoft.card.adaptive", content: kaart }] }) });
  if (!res.ok) throw new Error("Webhook gaf fout " + res.status);
  return true;
}

export async function controleer(env, { forceer = false } = {}) {
  if (!ableSignAan(env)) return { overgeslagen: "geen ABLESIGN_KEY" };
  const schermen = (await alles(env, "/screens")).filter(s => !s.demo);
  const vorig = (await env.KV.get("ablesign:offline", "json")) || {};
  const nu = {};
  for (const s of schermen) if (minutenGeleden(s.heartbeatTime) > OFFLINE_MINUTEN) nu[s.id] = { titel: s.title, sinds: s.heartbeatTime || null };
  const nieuwOffline = Object.keys(nu).filter(id => !vorig[id]);
  const weerOnline = Object.keys(vorig).filter(id => !nu[id] && schermen.some(s => String(s.id) === id));
  const melden = forceer || kantoortijd();
  if (melden && (nieuwOffline.length || weerOnline.length)) {
    const regels = [
      ...nieuwOffline.map(id => `🔴 ${nu[id].titel} is offline (laatst gezien: ${tijdNl(nu[id].sinds)})`),
      ...weerOnline.map(id => `🟢 ${vorig[id].titel} is weer online`)
    ];
    const titel = nieuwOffline.length ? (nieuwOffline.length === 1 ? "Een scherm is offline" : nieuwOffline.length + " schermen zijn offline") : "Schermen weer online";
    await stuurMelding(env, titel, regels, env.SITE_URL || null);
  }
  /* buiten kantoortijd onthouden we niets nieuws, zodat de melding 's ochtends alsnog komt */
  if (melden) await env.KV.put("ablesign:offline", JSON.stringify(nu));
  return { offline: Object.values(nu).map(x => x.titel), nieuwOffline: nieuwOffline.length, weerOnline: weerOnline.length, gemeld: melden };
}
