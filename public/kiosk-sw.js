/* Offline-opslag voor het aanraakscherm (kiosk). Wordt alleen door /k/<id> aangemeld.
   - Pagina's, scripts en de instellingen: eerst internet (met korte wachttijd), anders de bewaarde versie.
   - Foto's (/media/) en vaste bibliotheken van een CDN: eerst de bewaarde versie, die verandert nooit.
   Andere adressen (de editor, /api behalve /api/kiosk, de gewone schermen) laat dit script met rust. */
const CACHE = "vanerum-kiosk-v1";
const VAST = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.gstatic\.com)\//;
const GOOGLE_CSS = /^https:\/\/fonts\.googleapis\.com\//;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

function hoortErbij(url) {
  if (url.origin !== self.location.origin) return VAST.test(url.href) || GOOGLE_CSS.test(url.href);
  const p = url.pathname;
  if (p.startsWith("/api/")) return p.startsWith("/api/kiosk/");
  if (p === "/" || p === "/index.html" || p.startsWith("/s/") || p.startsWith("/scherm")) return false;
  return true;
}

async function eerstBewaard(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req, { ignoreVary: true });
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok || r.type === "opaque") c.put(req, r.clone());
  return r;
}

async function eerstInternet(req, wacht) {
  const c = await caches.open(CACHE);
  const sleutel = new Request(new URL(req.url).href.split("#")[0].replace(/\?t=\d+$/, ""));
  try {
    const r = await Promise.race([
      fetch(req, { cache: "no-store" }),
      new Promise((_, nee) => setTimeout(() => nee(new Error("traag")), wacht))
    ]);
    if (r.ok) c.put(sleutel, r.clone());
    return r;
  } catch (e) {
    const hit = await c.match(sleutel, { ignoreSearch: sleutel.url.includes("/demos/"), ignoreVary: true });
    if (hit) return hit;
    throw e;
  }
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!hoortErbij(url)) return;
  if (VAST.test(url.href) || url.pathname.startsWith("/media/")) e.respondWith(eerstBewaard(req));
  else e.respondWith(eerstInternet(req, url.pathname.startsWith("/api/") ? 5000 : 6000));
});

/* het scherm stuurt een lijst met alles wat het nodig heeft; dat halen we alvast op */
self.addEventListener("message", e => {
  if (!e.data || e.data.type !== "bewaar" || !Array.isArray(e.data.urls)) return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    for (const u of e.data.urls.slice(0, 200)) {
      try {
        const url = new URL(u, self.location.origin);
        const req = new Request(url.href, url.origin === self.location.origin ? {} : { mode: "cors", credentials: "omit" });
        if (VAST.test(url.href) || url.pathname.startsWith("/media/")) { if (await c.match(req)) continue; }
        const r = await fetch(req, { cache: "no-store" });
        if (r.ok) await c.put(req, r);
      } catch (x) {}
    }
  })());
});
