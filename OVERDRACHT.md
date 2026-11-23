# Overdracht naar een ander account

Het project bestaat uit drie dingen: **de code** (GitHub), **de site** (Cloudflare Worker) en **de data** (Cloudflare KV: schermen, kiosken, foto's/media, collega-accounts, instellingen).

## 1. Code (GitHub)
Repo `VanerumNL/schermen-showroom`. Kies één:
- **Overdragen:** Settings > General > Danger Zone > *Transfer ownership* naar de nieuwe gebruiker/organisatie (geschiedenis blijft behouden, oude URL stuurt door).
- **Kopie:** nieuwe lege repo maken en `git remote set-url origin <nieuwe-url> && git push -u origin main`.

## 2. Cloudflare (nieuw account)
1. KV-namespace maken: Workers & Pages > KV > *Create* (naam bv. `schermen-showroom`). Noteer de **id**.
   Voor previews eventueel een tweede, lege namespace.
2. In `wrangler.jsonc` de `id` onder `kv_namespaces` (en `previews`) vervangen door de nieuwe id(s).
3. Worker koppelen aan de repo: Workers & Pages > *Create* > *Import a repository* > de (nieuwe) repo kiezen, branch `main`. Build-opdracht leeg, deploy-opdracht `npx wrangler deploy`. Elke push naar `main` deployt daarna vanzelf.
4. Secrets/variabelen (Settings > Variables and secrets) van de worker. Waarden staan niet in de repo; haal ze uit het oude account (of maak nieuwe):
   - `WACHTWOORD` (gedeeld beheerderswachtwoord, noodtoegang)
   - `ABLESIGN_API`, `ABLESIGN_KEY`, `ABLESIGN_WORKSPACE` (AbleSign-koppeling voor de online-controle)
   - `MELDING_WEBHOOK` (melding als een tv offline is)
   - `SITE_URL` (het nieuwe adres, zonder slash aan het eind)
5. De cron (elk kwartier) staat in `wrangler.jsonc` en komt vanzelf mee.

## 3. Data meenemen
Op een computer met Node 18+, in de map van het project:
```
# oud account (token met "Workers KV Storage: Lezen")
CF_ACCOUNT_ID=<oud> CF_API_TOKEN=<token> KV_ID=05c361f4095f468bbc181136e5870919 node overdracht/kv-export.mjs
# nieuw account (token met "Workers KV Storage: Bewerken")
CF_ACCOUNT_ID=<nieuw> CF_API_TOKEN=<token> KV_ID=<nieuwe id> node overdracht/kv-import.mjs
```
`kv-export.json` bevat ook de wachtwoord-hashes van de collega's: niet delen en niet committen (staat in `.gitignore`). Inlogsessies worden bewust niet meegenomen: iedereen logt één keer opnieuw in. Collega-accounts en hun wachtwoorden blijven werken.

## 4. Adres wijzigen
Het nieuwe adres wordt `https://schermen-showroom.<nieuwe-subdomein>.workers.dev` (of een eigen domein onder Workers > Settings > Domains & Routes). Daarna aanpassen op de plekken waar het oude adres staat:
- **AbleSign:** de playlist-websites van elke tv (`/s/<naam>`).
- **Kiosken / touchscreens:** de snelkoppeling of startpagina (`/k/<naam>`, `/t/<naam>`), bv. Isselwaerde.
- Eventuele QR-codes of links in mails en documenten.
Tip: laat het oude account nog even draaien tot alle tv's en schermen op het nieuwe adres staan.

## 5. Controle
- `/api/versie` geeft een versienummer.
- Inloggen in de editor met je account, een scherm openen en een kiosk (`/k/...`) bekijken.
- Foto's in de fotobibliotheek zichtbaar (media is meegekomen).
- AbleSign-status klopt (secrets goed gezet).
