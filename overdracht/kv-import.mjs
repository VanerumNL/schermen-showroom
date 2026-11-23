// Zet kv-export.json in de KV van het NIEUWE account.
// Gebruik:  CF_ACCOUNT_ID=... CF_API_TOKEN=... KV_ID=<nieuwe namespace-id> node overdracht/kv-import.mjs
// Token: "Workers KV Storage: Bewerken" op het nieuwe account.
import { readFileSync } from "node:fs";
const { CF_ACCOUNT_ID: acc, CF_API_TOKEN: tok, KV_ID: ns } = process.env;
if (!acc || !tok || !ns) { console.error("Zet CF_ACCOUNT_ID, CF_API_TOKEN en KV_ID."); process.exit(1); }
const alles = JSON.parse(readFileSync("overdracht/kv-export.json", "utf8"));
const url = `https://api.cloudflare.com/client/v4/accounts/${acc}/storage/kv/namespaces/${ns}/bulk`;
let blok = [], grootte = 0, totaal = 0;
async function stuur() {
  if (!blok.length) return;
  const r = await (await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify(blok) })).json();
  if (!r.success) { console.error(JSON.stringify(r.errors)); process.exit(1); }
  totaal += blok.length; blok = []; grootte = 0;
}
for (const i of alles) {
  if (blok.length >= 5000 || grootte + i.value.length > 50e6) await stuur();
  blok.push(i); grootte += i.value.length;
}
await stuur();
console.log(`${totaal} sleutels geïmporteerd.`);
