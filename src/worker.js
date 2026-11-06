/* Vanerum Schermen: opslag en API voor de schermindelingen.
   KV-sleutels:
     scherm:<id>      JSON van één scherm
     media:<id>       geüploade afbeelding (metadata: type, naam)
     instelling:ww    gehasht wachtwoord (als er geen secret WACHTWOORD is) */

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
      if (s) uit.push({ id: s.id, naam: s.naam, sjabloon: s.sjabloon, bijgewerkt: s.bijgewerkt });
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

  /* Afbeeldingen */
  if (p === "/api/media" && m === "POST") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    const type = req.headers.get("content-type") || "";
    if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(type)) return fout("Alleen afbeeldingen (png, jpg, webp, gif, svg)");
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 8 * 1024 * 1024) return fout("Afbeelding is groter dan 8 MB; maak hem eerst kleiner");
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const naam = decodeURIComponent(req.headers.get("x-naam") || "afbeelding").slice(0, 80);
    await env.KV.put("media:" + id, buf, { metadata: { type, naam, grootte: buf.byteLength } });
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
    const cache = caches.default, sleutel = new Request("https://nieuws.cache/" + encodeURIComponent(feed));
    let r = await cache.match(sleutel);
    if (!r) {
      let xml;
      try {
        const res = await fetch(feed, { headers: { "user-agent": "VanerumSchermen/1.0", accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" }, cf: { cacheTtl: 600 } });
        if (!res.ok) return fout("Nieuwsbron gaf een fout (" + res.status + ")", 502);
        xml = await res.text();
      } catch (e) { return fout("Nieuwsbron niet bereikbaar", 502); }
      r = new Response(JSON.stringify(leesFeed(xml)), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=600" } });
      ctx.waitUntil(cache.put(sleutel, r.clone()));
    }
    return new Response(r.body, { headers: JSON_H });
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
    return env.ASSETS.fetch(req);
  }
};
