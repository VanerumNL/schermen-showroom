// Haalt alle data (schermen, kiosken, media, accounts, instellingen) uit de KV van het OUDE account.
// Gebruik:  CF_ACCOUNT_ID=... CF_API_TOKEN=... KV_ID=05c361f4095f468bbc181136e5870919 node overdracht/kv-export.mjs
// Token: Cloudflare > Mijn profiel > API-tokens > "Workers KV Storage: Lezen" op het oude account.
import { writeFileSync } from "node:fs";
const { CF_ACCOUNT_ID: acc, CF_API_TOKEN: tok, KV_ID: ns } = process.env;
if (!acc || !tok || !ns) { console.error("Zet CF_ACCOUNT_ID, CF_API_TOKEN en KV_ID."); process.exit(1); }
const base = `https://api.cloudflare.com/client/v4/accounts/${acc}/storage/kv/namespaces/${ns}`;
const h = { Authorization: `Bearer ${tok}` };
const SLA_OVER = /^(sessie:|poging:)/; // inlogsessies en pogingen hoeven niet mee
const keys = []; let cursor = "";
do {
  const r = await (await fetch(`${base}/keys?limit=1000${cursor ? "&cursor=" + cursor : ""}`, { headers: h })).json();
  if (!r.success) { console.error(JSON.stringify(r.errors)); process.exit(1); }
  keys.push(...r.result); cursor = r.result_info?.cursor || "";
} while (cursor);
const uit = [];
for (const k of keys) {
  if (SLA_OVER.test(k.name)) continue;
  const v = await fetch(`${base}/values/${encodeURIComponent(k.name)}`, { headers: h });
  if (!v.ok) { console.error("mislukt:", k.name, v.status); continue; }
  const item = { key: k.name, value: Buffer.from(await v.arrayBuffer()).toString("base64"), base64: true };
  if (k.expiration) item.expiration = k.expiration;
  uit.push(item);
}
writeFileSync("overdracht/kv-export.json", JSON.stringify(uit));
console.log(`${uit.length} sleutels bewaard in overdracht/kv-export.json (bevat wachtwoord-hashes: niet delen of committen).`);
