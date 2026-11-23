# Vanerum Schermen (schermen-showroom): context voor Claude

Eigenaar: Paul Westerhout (accountmanager Vanerum, IJsselstein). Taal: Nederlands, kort en praktisch, geen terugblik op stappen. Gebruik de Vanerum-huisstijl (geel #fbb900, zwart #1e1e1e, wit, vier streepjes, Montserrat) voor alles wat zichtbaar is.

## Wat het is
Cloudflare Worker + statische assets, live op https://schermen-showroom.paul-westerhout.workers.dev. Push naar `main` deployt automatisch (±1 minuut). Hosting en GitHub-repo (VanerumNL/schermen-showroom) blijven ongewijzigd.
- Editor voor tv-schermindelingen (AbleSign-playlistwebsites, Android box/smart tv): `public/index.html`; weergave: `public/scherm.html` (vast 1920x1080, geschaald).
- Aanraakschermen/kiosk voor de NOT-beurs: `aanraakscherm.html` (editor), `kiosk.html` (weergave), `kiosk-gedeeld.js` (standaardtegels), `demos.js` (demo-catalogus), demo's in `public/demos/` (zelfde-origin iframes, lokale libs in `public/demos/lib/`).
- Startschermen (tegels, bv. Isselwaerde): `startscherm*.html`. Zie README.md.
- Backend: `src/worker.js`, `src/ablesign.js` (cron elk kwartier: tv's online?), `src/openbeelden.js`.

## Data en inloggen
KV-sleutels: scherm:<id>, kiosk:<id>, media:<id>, instelling:ww, instelling:ww_uit, nieuws:<hash>, gebruiker:<sleutel>, sessie:<hash>, poging:<hash>.
Header `x-wachtwoord` = gedeeld wachtwoord (secret WACHTWOORD) of sessietoken `vs1.<hex>`. Accounts per collega (rollen beheerder/redacteur), PBKDF2, 8 pogingen per 15 min. Wie niet meer kan inloggen: KV-sleutel `instelling:ww_uit` verwijderen. Secrets staan in Cloudflare (WACHTWOORD, ABLESIGN_*, MELDING_WEBHOOK, SITE_URL), niet in de repo.

## Werkwijze
- Testen lokaal: `npx wrangler dev --port 8787 --ip 127.0.0.1 --var WACHTWOORD:testtest1`; daarna `pkill -f "wrangler dev"; pkill -f workerd; rm -rf .wrangler/state`. Playwright voor schermafbeeldingen; de sandbox kan de live workers.dev-site niet met curl bereiken (Claude in Chrome wel).
- Open schermen halen nieuwe code binnen via /api/versie (elke 5 min).
- Geen offline-meldingen tussen 17.00 en 8.30 uur.
- Films/demo's licht houden: de tv-boxen zijn traag.
- Nieuwe Opti+-pagina's komen als Claude-artifacts; die worden naar `public/demos/<naam>/index.html` gekopieerd (zie opti-move-tafel).

- Uitgebreid overzicht (onderdelen, blokken, demo's, secrets) staat in het Claude-project "Vanerum Schermen": `claude/schermen-overzicht.md`.

## Openstaande punten
Citaat-bronnen in `public/gedeeld.js` (Plutarchus, Ford, Chinees gezegde) controleren; NOT-data 19–23 januari 2027 (Jaarbeurs Utrecht) met de organisator bevestigen; QR-wifi is alleen op korte afstand scanbaar.
