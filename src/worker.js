/* Vanerum Schermen: opslag en API voor de schermindelingen.
   KV-sleutels:
     scherm:<id>      JSON van één scherm
     kiosk:<id>       JSON van één aanraakscherm (bijv. de NOT-stand)
     media:<id>       geüploade afbeelding (metadata: type, naam)
     instelling:ww    gehasht wachtwoord (als er geen secret WACHTWOORD is)
   AbleSign-koppeling en offline-melding: zie src/ablesign.js */

import { ableSignAan, overzicht, zetOpTv, haalVanTv, controleer, stuurMelding, AbleSignFout } from "./ablesign.js";

const JSON_H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_H });
const fout = (msg, status = 400) => json({ fout: msg }, status);
const ID = /^[a-z0-9][a-z0-9-]{0,40}$/;

async function sha(text) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function gelijk(a, b) {
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/* Wachtwoord: een secret WACHTWOORD in Cloudflare gaat voor; anders het wachtwoord dat bij de eerste keer in de editor is gekozen. */
async function wachtwoordStatus(env) {
  if (env.WACHTWOORD) return { ingesteld: true, bron: "secret" };
  const h = await env.KV.get("instelling:ww");
  return { ingesteld: !!h, bron: h ? "kv" : null };
}
async function magBewerken(req, env) {
  const ww = req.headers.get("x-wachtwoord") || "";
  if (!ww) return false;
  if (env.WACHTWOORD) return gelijk(ww, env.WACHTWOORD);
  const h = await env.KV.get("instelling:ww");
  return !!h && gelijk(await sha("vanerum-schermen:" + ww), h);
}

/* Nieuws: RSS of Atom ophalen en omzetten naar een lijst koppen */
function tekst(s) {
  return (s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, " ").trim();
}
function leesFeed(xml) {
  const items = [];
  const re = /<(item|entry)\b[\s\S]*?<\/\1>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < 25) {
    const b = m[0];
    const titel = tekst((b.match(/<title\b[^>]*>([\s\S]*?)<\/title>/) || [])[1]);
    const datum = (b.match(/<(pubDate|published|updated|dc:date)\b[^>]*>([\s\S]*?)<\/\1>/) || [])[2] || "";
    if (titel) items.push({ titel, datum: tekst(datum) });
  }
  const bron = tekst((xml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/) || [])[1]);
  return { bron, items };
}
/* Een feed ophalen. Lukt het niet direct, dan nog een keer met een andere browser-aanduiding;
   is het adres een gewone website, dan zoeken we de RSS-link op die pagina of op /feed en /rss. */
const UA = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 VanerumSchermen/1.0",
  "VanerumSchermen/1.0 (+https://www.vanerum.nl)"
];
async function haalTekst(u) {
  let laatste = 0;
  for (const ua of UA) {
    const res = await fetch(u, { redirect: "follow", headers: { "user-agent": ua, accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5", "accept-language": "nl-NL,nl;q=0.9" }, cf: { cacheTtl: 600 } });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const kop = (res.headers.get("content-type") || "").match(/charset=([\w-]+)/i);
      let tekst = new TextDecoder("utf-8").decode(buf);
      const decl = (kop && kop[1]) || (tekst.slice(0, 300).match(/encoding=["']([\w-]+)["']/i) || [])[1];
      if (decl && !/utf-?8/i.test(decl)) { try { tekst = new TextDecoder(decl).decode(buf); } catch (e) {} }
      return { tekst, url: res.url || u };
    }
    laatste = res.status;
    if (![401, 403, 406, 429].includes(res.status)) break;
  }
  throw new Error(laatste === 404 ? "Nieuwsbron niet gevonden (404). Klopt het adres?" : laatste === 403 ? "Deze website weigert nieuws te delen (403). Kies een andere bron." : "Nieuwsbron gaf een fout (" + laatste + ")");
}
async function haalFeed(feed) {
  let eerste;
  try { eerste = await haalTekst(feed); } catch (e) { eerste = { fout: e }; }
  if (eerste.tekst) {
    const d = leesFeed(eerste.tekst);
    if (d.items.length) return Object.assign(d, { feed: eerste.url });
  }
  /* zoeken naar de echte feed */
  const kandidaten = [];
  if (eerste.tekst && /<html/i.test(eerste.tekst)) {
    const re = /<link\b[^>]*>/gi; let m;
    while ((m = re.exec(eerste.tekst))) {
      const tag = m[0];
      if (/rel=["']?alternate/i.test(tag) && /application\/(rss|atom)\+xml/i.test(tag)) {
        const h = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
        if (h) kandidaten.push(new URL(h.replace(/&amp;/g, "&"), eerste.url).href);
      }
    }
  }
  try {
    const basis = new URL(feed);
    for (const pad of ["/feed/", "/rss", "/rss.xml", "/feed.xml"]) kandidaten.push(new URL(pad, basis.origin).href);
  } catch (e) {}
  for (const k of [...new Set(kandidaten)].filter(k => k !== feed).slice(0, 5)) {
    try {
      const t = await haalTekst(k), d = leesFeed(t.tekst);
      if (d.items.length) return Object.assign(d, { feed: t.url });
    } catch (e) {}
  }
  if (eerste.fout) throw eerste.fout;
  throw new Error("Op dit adres staat geen nieuws (RSS) dat we kunnen lezen");
}

function feedsVan(scherm) {
  const f = [];
  for (const v of Object.values(scherm.vakken || {})) if (v && v.type === "nieuws" && v.feed) f.push(v.feed);
  if (scherm.band && scherm.band.feed) f.push(scherm.band.feed);
  return f;
}

async function api(req, env, url, ctx) {
  const p = url.pathname.replace(/\/+$/, "");
  const m = req.method;

  if (p === "/api/status") return json(await wachtwoordStatus(env));
  /* versie van de site: schermen herladen zichzelf als die verandert */
  if (p === "/api/versie") return json({ versie: (env.CF_VERSION_METADATA && env.CF_VERSION_METADATA.id) || "" });

  if (p === "/api/wachtwoord" && m === "POST") {
    const st = await wachtwoordStatus(env);
    const body = await req.json().catch(() => ({}));
    if (st.ingesteld && !(await magBewerken(req, env))) return fout("Wachtwoord klopt niet", 401);
    if (st.bron === "secret") return fout("Het wachtwoord staat vast in Cloudflare (WACHTWOORD).", 409);
    const nieuw = String(body.nieuw || "");
    if (nieuw.length < 6) return fout("Kies een wachtwoord van minstens 6 tekens");
    await env.KV.put("instelling:ww", await sha("vanerum-schermen:" + nieuw));
    return json({ ok: true });
  }

  if (p === "/api/login" && m === "POST") {
    return (await magBewerken(req, env)) ? json({ ok: true }) : fout("Wachtwoord klopt niet", 401);
  }

  /* Schermen */
  if (p === "/api/schermen" && m === "GET") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    const lijst = await env.KV.list({ prefix: "scherm:" });
    const uit = [];
    for (const k of lijst.keys) {
      const s = await env.KV.get(k.name, "json");
      if (s) uit.push({ id: s.id, naam: s.naam, sjabloon: s.sjabloon, stand: s.stand || "liggend", bijgewerkt: s.bijgewerkt });
    }
    uit.sort((a, b) => (a.naam || "").localeCompare(b.naam || "", "nl"));
    return json(uit);
  }

  let mm = p.match(/^\/api\/scherm\/([^/]+)$/);
  if (mm) {
    const id = mm[1];
    if (!ID.test(id)) return fout("Ongeldige naam voor het scherm");
    if (m === "GET") {
      const s = await env.KV.get("scherm:" + id, "json");
      return s ? json(s) : fout("Dit scherm bestaat niet", 404);
    }
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    if (m === "PUT") {
      const s = await req.json().catch(() => null);
      if (!s || typeof s !== "object") return fout("Geen geldige indeling");
      const tekst = JSON.stringify(s);
      if (tekst.length > 200000) return fout("De indeling is te groot");
      s.id = id; s.bijgewerkt = new Date().toISOString();
      await env.KV.put("scherm:" + id, JSON.stringify(s));
      return json(s);
    }
    if (m === "DELETE") { await env.KV.delete("scherm:" + id); return json({ ok: true }); }
  }

  /* Aanraakschermen (kiosk): presentatie + productoverzicht, bijv. voor de NOT */
  if (p === "/api/kiosks" && m === "GET") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    const lijst = await env.KV.list({ prefix: "kiosk:" });
    const uit = [];
    for (const k of lijst.keys) {
      const s = await env.KV.get(k.name, "json");
      if (s) uit.push({ id: s.id, naam: s.naam, bijgewerkt: s.bijgewerkt });
    }
    uit.sort((a, b) => (a.naam || "").localeCompare(b.naam || "", "nl"));
    return json(uit);
  }
  let mk = p.match(/^\/api\/kiosk\/([^/]+)$/);
  if (mk) {
    const id = mk[1];
    if (!ID.test(id)) return fout("Ongeldige naam voor het scherm");
    if (m === "GET") {
      const s = await env.KV.get("kiosk:" + id, "json");
      return s ? json(s) : fout("Dit scherm bestaat niet", 404);
    }
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    if (m === "PUT") {
      const s = await req.json().catch(() => null);
      if (!s || typeof s !== "object") return fout("Geen geldige instellingen");
      if (JSON.stringify(s).length > 200000) return fout("De instellingen zijn te groot");
      s.id = id; s.bijgewerkt = new Date().toISOString();
      await env.KV.put("kiosk:" + id, JSON.stringify(s));
      return json(s);
    }
    if (m === "DELETE") { await env.KV.delete("kiosk:" + id); return json({ ok: true }); }
  }

  /* Afbeeldingen */
  if (p === "/api/media" && m === "GET") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    const uit = []; let cursor;
    do {
      const l = await env.KV.list({ prefix: "media:", cursor });
      l.keys.forEach(k => uit.push({ id: k.name.slice(6), url: "/media/" + k.name.slice(6), naam: (k.metadata || {}).naam || "", grootte: (k.metadata || {}).grootte || 0, datum: (k.metadata || {}).datum || "" }));
      cursor = l.list_complete ? null : l.cursor;
    } while (cursor);
    uit.sort((a, b) => (b.datum || "").localeCompare(a.datum || ""));
    return json(uit);
  }
  let mmed = p.match(/^\/api\/media\/([a-f0-9]{16})$/);
  if (mmed && m === "DELETE") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    await env.KV.delete("media:" + mmed[1]);
    return json({ ok: true });
  }
  if (p === "/api/media" && m === "POST") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    const type = req.headers.get("content-type") || "";
    if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(type)) return fout("Alleen afbeeldingen (png, jpg, webp, gif, svg)");
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 8 * 1024 * 1024) return fout("Afbeelding is groter dan 8 MB; maak hem eerst kleiner");
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const naam = decodeURIComponent(req.headers.get("x-naam") || "afbeelding").slice(0, 80);
    await env.KV.put("media:" + id, buf, { metadata: { type, naam, grootte: buf.byteLength, datum: new Date().toISOString() } });
    return json({ id, url: "/media/" + id, naam });
  }

  /* Nieuws, alleen voor feeds die in een opgeslagen scherm staan */
  if (p === "/api/nieuws" && m === "GET") {
    const id = url.searchParams.get("scherm") || "", feed = url.searchParams.get("feed") || "";
    if (!ID.test(id)) return fout("Ongeldig scherm");
    const s = await env.KV.get("scherm:" + id, "json");
    const toegestaan = s ? feedsVan(s) : [];
    const voorbeeld = (await magBewerken(req, env)) && /^https?:\/\//.test(feed);
    if (!toegestaan.includes(feed) && !voorbeeld) return fout("Deze nieuwsbron hoort niet bij dit scherm", 403);
    const cache = caches.default, sleutel = new Request("https://nieuws.cache/v2/" + encodeURIComponent(feed));
    let r = await cache.match(sleutel);
    if (!r) {
      const reserve = "nieuws:" + (await sha(feed)).slice(0, 24);
      let d;
      try { d = await haalFeed(feed); }
      catch (e) {
        /* bron even onbereikbaar: laatste goede versie gebruiken */
        const oud = await env.KV.get(reserve, "json");
        if (oud) return json(Object.assign(oud, { oud: true }));
        return fout(e.message, 502);
      }
      ctx.waitUntil(env.KV.put(reserve, JSON.stringify(d), { expirationTtl: 3 * 86400 }));
      r = new Response(JSON.stringify(d), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=600" } });
      ctx.waitUntil(cache.put(sleutel, r.clone()));
    }
    return new Response(r.body, { headers: JSON_H });
  }

  /* AbleSign: tv's bekijken, een indeling erop zetten of eraf halen */
  if (p.startsWith("/api/ablesign/")) {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    if (p === "/api/ablesign/status") return json({ gekoppeld: ableSignAan(env), melding: !!env.MELDING_WEBHOOK });
    if (!ableSignAan(env)) return fout("AbleSign is nog niet gekoppeld: zet in Cloudflare het secret ABLESIGN_KEY.", 409);
    try {
      if (p === "/api/ablesign/schermen" && m === "GET") return json(await overzicht(env, url.origin));
      const body = m === "POST" ? await req.json().catch(() => ({})) : {};
      if (p === "/api/ablesign/zet" && m === "POST") {
        if (!ID.test(body.id || "")) return fout("Ongeldige indeling");
        const s = await env.KV.get("scherm:" + body.id, "json");
        if (!s) return fout("Sla de indeling eerst op", 404);
        if (!Array.isArray(body.schermen) || !body.schermen.length) return fout("Kies minstens één tv");
        return json(await zetOpTv(env, url.origin, { id: body.id, naam: s.naam, schermen: body.schermen.slice(0, 50), alleen: !!body.alleen, seconden: body.seconden }));
      }
      if (p === "/api/ablesign/haalweg" && m === "POST") {
        if (!ID.test(body.id || "") || !Number.isInteger(+body.scherm)) return fout("Ongeldig verzoek");
        return json(await haalVanTv(env, { id: body.id, scherm: +body.scherm }));
      }
      if (p === "/api/ablesign/testmelding" && m === "POST") {
        if (!env.MELDING_WEBHOOK) return fout("Er is nog geen MELDING_WEBHOOK ingesteld", 409);
        await stuurMelding(env, "Testmelding van Vanerum Schermen", ["Als u dit leest, komen meldingen over offline schermen hier binnen."], env.SITE_URL || url.origin);
        return json({ ok: true });
      }
      if (p === "/api/ablesign/controleer" && m === "POST") return json(await controleer(env));
    } catch (e) {
      if (e instanceof AbleSignFout) return fout(e.message, e.status);
      throw e;
    }
  }

  return fout("Onbekend adres", 404);
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await api(req, env, url, ctx); }
      catch (e) { return fout("Er ging iets mis: " + (e && e.message || e), 500); }
    }
    const mm = url.pathname.match(/^\/media\/([a-f0-9]{16})$/);
    if (mm) {
      const { value, metadata } = await env.KV.getWithMetadata("media:" + mm[1], "arrayBuffer");
      if (!value) return new Response("Niet gevonden", { status: 404 });
      return new Response(value, { headers: { "content-type": (metadata && metadata.type) || "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" } });
    }
    /* /s/<id> is een kort adres voor AbleSign */
    const kort = url.pathname.match(/^\/s\/([a-z0-9-]+)\/?$/);
    if (kort) return env.ASSETS.fetch(new Request(url.origin + "/scherm", req));
    /* /k/<id> is het adres van een aanraakscherm (kiosk) */
    const kiosk = url.pathname.match(/^\/k\/([a-z0-9-]+)\/?$/);
    if (kiosk) return env.ASSETS.fetch(new Request(url.origin + "/kiosk", req));
    return env.ASSETS.fetch(req);
  },
  /* elk kwartier: kijken of er tv's offline zijn (zie "triggers" in wrangler.jsonc) */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(controleer(env).catch(e => console.error("AbleSign-controle mislukt:", e && e.message || e)));
  }
};
