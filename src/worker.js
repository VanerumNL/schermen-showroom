/* Vanerum Schermen: opslag en API voor de schermindelingen.
   KV-sleutels:
     scherm:<id>      JSON van één scherm
     kiosk:<id>       JSON van één aanraakscherm (bijv. de NOT-stand)
     start:<id>       JSON van één startscherm met tegels (bijv. een touchscreen in de zorg)
     media:<id>       geüploade afbeelding of filmpje (metadata: type, naam)
     instelling:ww    gehasht gedeeld wachtwoord (als er geen secret WACHTWOORD is); instelling:ww_uit zet het gedeelde wachtwoord uit
     gebruiker:<naam> eigen account per collega; sessie:<hash> ingelogde sessie; poging:<hash> teller verkeerde wachtwoorden
   AbleSign-koppeling en offline-melding: zie src/ablesign.js */

import { ableSignAan, overzicht, zetOpTv, haalVanTv, controleer, stuurMelding, AbleSignFout } from "./ablesign.js";
import { verzamel, selectie } from "./openbeelden.js";

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

/* Inloggen: per collega een eigen account (gebruiker:<sleutel>), met een sessie van 30 dagen (sessie:<hash>).
   Het oude gedeelde wachtwoord (secret WACHTWOORD of instelling:ww) werkt door tot een beheerder het uitzet (instelling:ww_uit). */
const enc = t => new TextEncoder().encode(t);
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
const vanHex = h => Uint8Array.from(h.match(/../g) || [], x => parseInt(x, 16));
async function pbkdf2(ww, zout) {
  const k = await crypto.subtle.importKey("raw", enc(ww), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: vanHex(zout), iterations: 100000 }, k, 256));
}
const sleutelVan = naam => String(naam || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const gebruiker = (env, sleutel) => sleutel ? env.KV.get("gebruiker:" + sleutel, "json") : null;
async function alleGebruikers(env) {
  const l = await env.KV.list({ prefix: "gebruiker:" }), uit = [];
  for (const k of l.keys) { const g = await env.KV.get(k.name, "json"); if (g) uit.push(g); }
  return uit;
}
async function gedeeldGebruik(env) {
  if (await env.KV.get("instelling:ww_uit")) return false;
  return !!env.WACHTWOORD || !!(await env.KV.get("instelling:ww"));
}
async function wachtwoordStatus(env) {
  const gedeeld = await gedeeldGebruik(env);
  const gebruikers = (await env.KV.list({ prefix: "gebruiker:", limit: 1 })).keys.length > 0;
  return { ingesteld: gedeeld || gebruikers, gedeeld, gebruikers, bron: env.WACHTWOORD ? "secret" : (gedeeld ? "kv" : null) };
}
/* geeft de ingelogde persoon terug ({ naam, sleutel, rol }) of false */
async function magBewerken(req, env) {
  const ww = req.headers.get("x-wachtwoord") || "";
  if (!ww) return false;
  if (ww.startsWith("vs1.")) {
    const sessie = await env.KV.get("sessie:" + (await sha(ww)), "json");
    if (!sessie) return false;
    const g = await gebruiker(env, sessie.u);
    if (!g || !g.actief || (g.v || 0) !== (sessie.v || 0)) return false;
    return { naam: g.naam, sleutel: g.sleutel, rol: g.rol };
  }
  if (!(await gedeeldGebruik(env))) return false;
  let goed;
  if (env.WACHTWOORD) goed = gelijk(ww, env.WACHTWOORD);
  else { const h = await env.KV.get("instelling:ww"); goed = !!h && gelijk(await sha("vanerum-schermen:" + ww), h); }
  return goed ? { naam: "Gedeeld wachtwoord", sleutel: "", rol: "beheerder", gedeeld: true } : false;
}
async function maakGebruiker(env, naam, wachtwoord, rol) {
  naam = String(naam || "").trim().slice(0, 40);
  const sleutel = sleutelVan(naam);
  if (naam.length < 2 || !ID.test(sleutel)) return "Kies een naam van minstens 2 tekens";
  if (String(wachtwoord || "").length < 8) return "Kies een wachtwoord van minstens 8 tekens";
  if (await gebruiker(env, sleutel)) return "Er bestaat al iemand met deze naam";
  const zout = hex(crypto.getRandomValues(new Uint8Array(16)));
  await env.KV.put("gebruiker:" + sleutel, JSON.stringify({ naam, sleutel, rol: rol === "beheerder" ? "beheerder" : "redacteur", actief: true, zout, hash: await pbkdf2(wachtwoord, zout), v: 0, aangemaakt: new Date().toISOString() }));
  return null;
}
const publiek = g => ({ naam: g.naam, sleutel: g.sleutel, rol: g.rol, actief: g.actief, aangemaakt: g.aangemaakt });
/* blijft er na een wijziging nog iemand over die gebruikers kan beheren? */
async function beheerderOver(env, wijziging) {
  if (await gedeeldGebruik(env)) return true;
  const alle = await alleGebruikers(env);
  return alle.map(g => wijziging(g)).filter(g => g && g.actief && g.rol === "beheerder").length > 0;
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
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.wachtwoord === "string") {
      const sl = sleutelVan(body.naam);
      const teller = "poging:" + (await sha(sl + "|" + (req.headers.get("cf-connecting-ip") || "")));
      const n = +(await env.KV.get(teller)) || 0;
      if (n >= 8) return fout("Te vaak een verkeerd wachtwoord. Probeer het over een kwartier opnieuw.", 429);
      const g = await gebruiker(env, sl);
      if (!g || !g.actief || !gelijk(await pbkdf2(body.wachtwoord, g.zout), g.hash)) {
        await env.KV.put(teller, String(n + 1), { expirationTtl: 900 });
        return fout("Naam of wachtwoord klopt niet", 401);
      }
      await env.KV.delete(teller);
      const token = "vs1." + hex(crypto.getRandomValues(new Uint8Array(32)));
      await env.KV.put("sessie:" + (await sha(token)), JSON.stringify({ u: sl, v: g.v || 0 }), { expirationTtl: 30 * 86400 });
      return json({ ok: true, token, naam: g.naam, rol: g.rol });
    }
    const u = await magBewerken(req, env);
    return u ? json({ ok: true, naam: u.naam, rol: u.rol, gedeeld: !!u.gedeeld }) : fout("Wachtwoord klopt niet", 401);
  }

  /* het allereerste account (alleen zolang er nog geen enkele inlog bestaat) */
  if (p === "/api/eerste-account" && m === "POST") {
    if ((await wachtwoordStatus(env)).ingesteld) return fout("Er is al een inlog ingesteld", 409);
    const body = await req.json().catch(() => ({}));
    const f = await maakGebruiker(env, body.naam, body.wachtwoord, "beheerder");
    return f ? fout(f) : json({ ok: true });
  }

  /* eigen wachtwoord wijzigen */
  if (p === "/api/mijn-wachtwoord" && m === "POST") {
    const wie = await magBewerken(req, env);
    if (!wie) return fout("Niet ingelogd", 401);
    if (wie.gedeeld) return fout("Met het gedeelde wachtwoord heeft u geen eigen account", 409);
    const body = await req.json().catch(() => ({}));
    const g = await gebruiker(env, wie.sleutel);
    if (!gelijk(await pbkdf2(String(body.oud || ""), g.zout), g.hash)) return fout("Het huidige wachtwoord klopt niet", 403);
    if (String(body.nieuw || "").length < 8) return fout("Kies een wachtwoord van minstens 8 tekens");
    g.zout = hex(crypto.getRandomValues(new Uint8Array(16))); g.hash = await pbkdf2(body.nieuw, g.zout); g.v = (g.v || 0) + 1;
    await env.KV.put("gebruiker:" + g.sleutel, JSON.stringify(g));
    /* andere apparaten moeten opnieuw inloggen; dit apparaat krijgt meteen een nieuwe sessie */
    const token = "vs1." + hex(crypto.getRandomValues(new Uint8Array(32)));
    await env.KV.put("sessie:" + (await sha(token)), JSON.stringify({ u: g.sleutel, v: g.v }), { expirationTtl: 30 * 86400 });
    return json({ ok: true, token });
  }

  /* gebruikers beheren (alleen beheerders) */
  if (p === "/api/gebruikers" || p.startsWith("/api/gebruikers/") || p === "/api/gedeeld-wachtwoord") {
    const wie = await magBewerken(req, env);
    if (!wie) return fout("Niet ingelogd", 401);
    if (wie.rol !== "beheerder") return fout("Alleen een beheerder mag gebruikers beheren", 403);
    if (p === "/api/gebruikers" && m === "GET") {
      const alle = (await alleGebruikers(env)).map(publiek).sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
      return json({ gebruikers: alle, gedeeld: await gedeeldGebruik(env), gedeeldBron: env.WACHTWOORD ? "secret" : "kv" });
    }
    if (p === "/api/gebruikers" && m === "POST") {
      const body = await req.json().catch(() => ({}));
      const f = await maakGebruiker(env, body.naam, body.wachtwoord, body.rol);
      return f ? fout(f) : json({ ok: true });
    }
    if (p === "/api/gedeeld-wachtwoord" && m === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.aan) { await env.KV.delete("instelling:ww_uit"); return json({ ok: true }); }
      if (!(await alleGebruikers(env)).some(g => g.actief && g.rol === "beheerder")) return fout("Maak eerst een account met rol beheerder aan, anders kan niemand meer inloggen", 409);
      await env.KV.put("instelling:ww_uit", "1");
      return json({ ok: true });
    }
    const mg = p.match(/^\/api\/gebruikers\/([a-z0-9-]+)$/);
    if (mg) {
      const g = await gebruiker(env, mg[1]);
      if (!g) return fout("Deze gebruiker bestaat niet", 404);
      if (m === "DELETE") {
        if (!(await beheerderOver(env, x => x.sleutel === g.sleutel ? null : x))) return fout("Er moet minstens één beheerder overblijven", 409);
        await env.KV.delete("gebruiker:" + g.sleutel);
        return json({ ok: true });
      }
      if (m === "PUT") {
        const body = await req.json().catch(() => ({}));
        const nieuw = Object.assign({}, g);
        if (body.rol === "beheerder" || body.rol === "redacteur") nieuw.rol = body.rol;
        if (typeof body.actief === "boolean") nieuw.actief = body.actief;
        if (body.wachtwoord !== undefined && body.wachtwoord !== "") {
          if (String(body.wachtwoord).length < 8) return fout("Kies een wachtwoord van minstens 8 tekens");
          nieuw.zout = hex(crypto.getRandomValues(new Uint8Array(16))); nieuw.hash = await pbkdf2(String(body.wachtwoord), nieuw.zout); nieuw.v = (g.v || 0) + 1;
        }
        if (!(await beheerderOver(env, x => x.sleutel === g.sleutel ? nieuw : x))) return fout("Er moet minstens één beheerder overblijven", 409);
        await env.KV.put("gebruiker:" + g.sleutel, JSON.stringify(nieuw));
        return json({ ok: true });
      }
    }
  }

  /* Schermen */
  if (p === "/api/schermen" && m === "GET") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    const lijst = await env.KV.list({ prefix: "scherm:" });
    const uit = [];
    for (const k of lijst.keys) {
      const s = await env.KV.get(k.name, "json");
      if (s) uit.push({ id: s.id, naam: s.naam, sjabloon: s.sjabloon, stand: s.stand || "liggend", bijgewerkt: s.bijgewerkt, bijgewerktDoor: s.bijgewerktDoor || "" });
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
      if (!s) return fout("Dit scherm bestaat niet", 404);
      if (!(await magBewerken(req, env))) delete s.bijgewerktDoor;   /* de tv hoeft niet te weten wie het deed */
      return json(s);
    }
    const wie = await magBewerken(req, env);
    if (!wie) return fout("Niet ingelogd", 401);
    if (m === "PUT") {
      const s = await req.json().catch(() => null);
      if (!s || typeof s !== "object") return fout("Geen geldige indeling");
      const tekst = JSON.stringify(s);
      if (tekst.length > 200000) return fout("De indeling is te groot");
      /* is het scherm intussen door iemand anders opgeslagen? */
      const bestaand = await env.KV.get("scherm:" + id, "json");
      const basis = req.headers.get("x-basis") || "";
      if (bestaand && basis && bestaand.bijgewerkt && bestaand.bijgewerkt !== basis && req.headers.get("x-forceer") !== "1")
        return json({ fout: "Dit scherm is intussen aangepast door " + (bestaand.bijgewerktDoor || "iemand anders") + ".", conflict: true, door: bestaand.bijgewerktDoor || "", op: bestaand.bijgewerkt }, 409);
      s.id = id; s.bijgewerkt = new Date().toISOString(); s.bijgewerktDoor = wie.naam;
      await env.KV.put("scherm:" + id, JSON.stringify(s));
      return json(s);
    }
    if (m === "DELETE") {
      if (wie.rol !== "beheerder") return fout("Alleen een beheerder mag schermen verwijderen", 403);
      await env.KV.delete("scherm:" + id); return json({ ok: true });
    }
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
    const wie = await magBewerken(req, env);
    if (!wie) return fout("Niet ingelogd", 401);
    if (m === "PUT") {
      const s = await req.json().catch(() => null);
      if (!s || typeof s !== "object") return fout("Geen geldige instellingen");
      if (JSON.stringify(s).length > 200000) return fout("De instellingen zijn te groot");
      s.id = id; s.bijgewerkt = new Date().toISOString(); s.bijgewerktDoor = wie.naam;
      await env.KV.put("kiosk:" + id, JSON.stringify(s));
      return json(s);
    }
    if (m === "DELETE") {
      if (wie.rol !== "beheerder") return fout("Alleen een beheerder mag schermen verwijderen", 403);
      await env.KV.delete("kiosk:" + id); return json({ ok: true });
    }
  }

  /* Startschermen: tegels die een website, filmpje, radio of fotoalbum openen (bijv. Isselwaerde) */
  if (p === "/api/startschermen" && m === "GET") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    const lijst = await env.KV.list({ prefix: "start:" });
    const uit = [];
    for (const k of lijst.keys) {
      const s = await env.KV.get(k.name, "json");
      if (s) uit.push({ id: s.id, naam: s.naam, bijgewerkt: s.bijgewerkt });
    }
    uit.sort((a, b) => (a.naam || "").localeCompare(b.naam || "", "nl"));
    return json(uit);
  }
  let mst = p.match(/^\/api\/startscherm\/([^/]+)$/);
  if (mst) {
    const id = mst[1];
    if (!ID.test(id)) return fout("Ongeldige naam voor het scherm");
    if (m === "GET") {
      const s = await env.KV.get("start:" + id, "json");
      if (!s) return fout("Dit scherm bestaat niet", 404);
      if (!(await magBewerken(req, env))) delete s.bijgewerktDoor;
      return json(s);
    }
    const wie = await magBewerken(req, env);
    if (!wie) return fout("Niet ingelogd", 401);
    if (m === "PUT") {
      const s = await req.json().catch(() => null);
      if (!s || typeof s !== "object" || !Array.isArray(s.tegels)) return fout("Geen geldige instellingen");
      if (JSON.stringify(s).length > 200000) return fout("De instellingen zijn te groot");
      s.id = id; s.bijgewerkt = new Date().toISOString(); s.bijgewerktDoor = wie.naam;
      await env.KV.put("start:" + id, JSON.stringify(s));
      return json(s);
    }
    if (m === "DELETE") {
      if (wie.rol !== "beheerder") return fout("Alleen een beheerder mag schermen verwijderen", 403);
      await env.KV.delete("start:" + id); return json({ ok: true });
    }
  }
  /* Oude journaals van Open Beelden (Beeld en Geluid) voor een startscherm-tegel; openbaar, het scherm is niet ingelogd */
  if (p === "/api/openbeelden" && m === "GET") {
    const jr = (k, d) => { const n = parseInt(url.searchParams.get(k), 10); return Number.isFinite(n) ? Math.min(2000, Math.max(1900, n)) : d; };
    let van = jr("van", 1950), tot = jr("tot", 1970);
    if (van > tot) [van, tot] = [tot, van];
    const aantal = Math.min(100, Math.max(1, parseInt(url.searchParams.get("aantal"), 10) || 60));
    try {
      const d = await selectie(env, van, tot, aantal);
      return new Response(JSON.stringify(d), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" } });
    } catch (e) { return fout("Open Beelden is nu niet bereikbaar: " + (e && e.message || e), 502); }
  }
  /* Stand van het ophalen (voor de editor) */
  if (p === "/api/openbeelden/stand" && m === "GET") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    return json((await env.KV.get("ob:stand", "json")) || { aantal: 0, klaar: false });
  }

  /* Mag deze website binnen het startscherm worden getoond? (X-Frame-Options en frame-ancestors) */
  if (p === "/api/insluitbaar" && m === "GET") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    let doel;
    try { doel = new URL(url.searchParams.get("url") || ""); } catch (e) { return fout("Dit is geen geldig adres"); }
    if (doel.protocol !== "https:") return json({ insluitbaar: false, reden: "Het adres moet met https:// beginnen" });
    let res;
    try { res = await fetch(doel.href, { redirect: "follow", headers: { "user-agent": UA[0], accept: "text/html,*/*;q=0.8", "accept-language": "nl-NL,nl;q=0.9" } }); }
    catch (e) { return json({ insluitbaar: null, reden: "De website reageerde niet" }); }
    const xfo = (res.headers.get("x-frame-options") || "").toLowerCase();
    const csp = (res.headers.get("content-security-policy") || "").toLowerCase();
    const fa = (csp.match(/frame-ancestors([^;]*)/) || [])[1];
    let insluitbaar = true, reden = "";
    if (fa !== undefined) {
      const bronnen = fa.trim().split(/\s+/).filter(Boolean);
      if (!bronnen.some(b => b === "*" || b === "https:" || b === url.origin.toLowerCase())) { insluitbaar = false; reden = "De website staat alleen zichzelf toe (frame-ancestors)"; }
    } else if (xfo.includes("deny") || xfo.includes("sameorigin")) { insluitbaar = false; reden = "De website staat dat niet toe (X-Frame-Options)"; }
    if (!res.ok && insluitbaar) return json({ insluitbaar: null, reden: "De website gaf een fout (" + res.status + ")", status: res.status });
    return json({ insluitbaar, reden, eindadres: res.url || doel.href });
  }

  /* Afbeeldingen */
  if (p === "/api/media" && m === "GET") {
    if (!(await magBewerken(req, env))) return fout("Niet ingelogd", 401);
    const uit = []; let cursor;
    do {
      const l = await env.KV.list({ prefix: "media:", cursor });
      l.keys.forEach(k => {
        const md = k.metadata || {}, video = /^video\//.test(md.type || "");
        if (video !== (url.searchParams.get("soort") === "video")) return;   /* standaard alleen afbeeldingen; ?soort=video voor filmpjes */
        uit.push({ id: k.name.slice(6), url: "/media/" + k.name.slice(6), naam: md.naam || "", grootte: md.grootte || 0, datum: md.datum || "", type: md.type || "" });
      });
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
    const isVideo = /^video\/(mp4|webm)$/.test(type);
    if (!isVideo && !/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(type)) return fout("Alleen afbeeldingen (png, jpg, webp, gif, svg) of filmpjes (mp4, webm)");
    const buf = await req.arrayBuffer();
    if (!isVideo && buf.byteLength > 8 * 1024 * 1024) return fout("Afbeelding is groter dan 8 MB; maak hem eerst kleiner");
    if (isVideo && buf.byteLength > 24 * 1024 * 1024) return fout("Filmpje is groter dan 24 MB; kies een kortere versie (een lus van 1 tot 3 minuten is genoeg)");
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
      const kop = { "content-type": (metadata && metadata.type) || "application/octet-stream", "cache-control": "public, max-age=31536000, immutable", "accept-ranges": "bytes" };
      /* filmpjes vragen stukjes op (Range); zo kan het scherm ze netjes in een lus afspelen */
      const rm = (req.headers.get("range") || "").match(/^bytes=(\d*)-(\d*)$/);
      if (rm && (rm[1] || rm[2])) {
        const n = value.byteLength;
        let van = rm[1] ? +rm[1] : Math.max(0, n - +rm[2]), tot = rm[1] && rm[2] ? Math.min(+rm[2], n - 1) : n - 1;
        if (van >= n || van > tot) return new Response(null, { status: 416, headers: { "content-range": `bytes */${n}` } });
        return new Response(value.slice(van, tot + 1), { status: 206, headers: Object.assign(kop, { "content-range": `bytes ${van}-${tot}/${n}`, "content-length": String(tot - van + 1) }) });
      }
      return new Response(value, { headers: kop });
    }
    /* /s/<id> is een kort adres voor AbleSign */
    const kort = url.pathname.match(/^\/s\/([a-z0-9-]+)\/?$/);
    if (kort) return env.ASSETS.fetch(new Request(url.origin + "/scherm", req));
    /* /k/<id> is het adres van een aanraakscherm (kiosk) */
    const kiosk = url.pathname.match(/^\/k\/([a-z0-9-]+)\/?$/);
    if (kiosk) return env.ASSETS.fetch(new Request(url.origin + "/kiosk", req));
    /* /t/<id> is het adres van een startscherm met tegels */
    const start = url.pathname.match(/^\/t\/([a-z0-9-]+)\/?$/);
    if (start) return env.ASSETS.fetch(new Request(url.origin + "/startscherm", req));
    return env.ASSETS.fetch(req);
  },
  /* elk kwartier: kijken of er tv's offline zijn (zie "triggers" in wrangler.jsonc) */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(controleer(env).catch(e => console.error("AbleSign-controle mislukt:", e && e.message || e)));
    /* en stap voor stap de lijst met oude journaals van Open Beelden bijwerken */
    ctx.waitUntil(verzamel(env).catch(e => console.error("Open Beelden ophalen mislukt:", e && e.message || e)));
  }
};
