# Vanerum Schermen

Zelf indelingen maken voor de tv-schermen (AbleSign): klok, logo, mededelingen, weer, nieuws, Vimo, foto's, video en tekst, in de Vanerum-huisstijl.

- **Editor:** `https://<adres>/` — inloggen met het gedeelde wachtwoord.
- **Scherm:** `https://<adres>/s/<naam-van-scherm>` — dit adres zet u in AbleSign (**Websites → Add website**, daarna in de playlist).

Wijzigingen die u in de editor opslaat, verschijnen binnen een minuut op het scherm. Valt het internet weg, dan blijft het scherm de laatste indeling tonen.

## Koppeling met AbleSign

Met de koppeling zet u een indeling vanuit de editor op een tv, zonder AbleSign te openen. Rechts onder het voorbeeld staat dan **Op de tv**: alle tv's uit AbleSign, of ze online zijn en welke indeling ze tonen. Vink een of meer tv's aan en kies:

- **Erbij zetten**: de indeling komt vooraan in de playlist; wat er al stond, blijft staan.
- **Alleen deze indeling tonen**: de playlist van die tv bevat daarna alleen deze indeling.

Met **Haal eraf** gaat de indeling weer van een tv; de rest van de playlist blijft staan. Zit een tv in een schermgroep, dan geldt het voor de hele groep.

Instellen in Cloudflare, bij deze Worker onder **Settings → Variables and Secrets**:

| Naam | Soort | Wat |
|---|---|---|
| `ABLESIGN_KEY` | secret | API-sleutel uit AbleSign (**Account → API Keys**), begint met `ak_` |
| `ABLESIGN_WORKSPACE` | tekst, optioneel | Nummer van de workspace, alleen als u er meer dan één hebt |
| `MELDING_WEBHOOK` | secret, optioneel | Webhook-adres van een Teams-kanaal voor offline-meldingen |
| `SITE_URL` | tekst, optioneel | Adres van de editor, voor de knop in de melding |

### Melding als een tv offline gaat

Elk kwartier kijkt de Worker in AbleSign wanneer elke tv zich voor het laatst meldde. Is een tv 20 minuten stil, dan komt er een bericht in Teams; komt hij terug, dan ook. Meldingen gaan alleen op werkdagen tussen 8.00 en 18.00 uur; gaat een tv 's nachts uit, dan komt de melding de volgende ochtend als hij dan nog uit staat.

Teams-webhook maken: in het kanaal **⋯ → Workflows → "Post to a channel when a webhook request is received"**, en het adres dat u krijgt als secret `MELDING_WEBHOOK` zetten. In de editor staat daarna een link **Stuur een testmelding**.

## Aanraakscherm (NOT)

Voor een touchscreen op de beurs: een presentatie die vanzelf loopt (foto's van projecten, producten, filmpjes en Vimo). Tikt iemand op het scherm, dan verschijnt een overzicht met de producten (Motion Cubes, Agili tafels, Opti+ Move tafels en stoelen). Elke tegel opent de 3D-productpagina, en van daaruit gaat u door naar het lab. Na een tijd zonder aanraking gaat het scherm vanzelf terug naar de presentatie.

- **Instellingen:** `https://<adres>/aanraakscherm` (zelfde wachtwoord). Hier uploadt u foto's, zet u de dia's op volgorde en kiest u de kleuren, de producten en de labs.
- **Scherm:** `https://<adres>/k/<naam>`, bijvoorbeeld `/k/not`.
- **Windows-pc:** open het adres één keer met internet; daarna bewaart de pc alles en werkt het scherm ook zonder wifi. Volledig scherm met een snelkoppeling naar `msedge --kiosk https://<adres>/k/not --edge-kiosk-type=fullscreen --no-first-run`.

## Staand (gekanteld) scherm

Kies in de editor bij **Stand van het scherm** voor **Staand**. De indelingen worden dan staand (1080 × 1920).
Geeft het apparaat nog een liggend beeld, dan draait het scherm de indeling zelf een kwartslag; staat alles op zijn kop, kies dan bij **Draairichting** de andere kant. Draait AbleSign of de tv het beeld al zelf, dan merkt het scherm dat vanzelf.

## Hoe het werkt

| Bestand | Wat |
|---|---|
| `public/index.html` | De editor |
| `public/scherm.html` | Het scherm zelf (1920 × 1080, schaalt naar elk 16:9-scherm) |
| `public/gedeeld.js` | Sjablonen, achtergronden, blokken en nieuwsbronnen |
| `public/vimo2d.js` | Vimo |
| `public/kiosk.html` | Het aanraakscherm (presentatie, overzicht, productpagina en lab) |
| `public/aanraakscherm.html` | Instellingen van het aanraakscherm |
| `public/kiosk-gedeeld.js` | Standaardinstellingen en kleuren van het aanraakscherm |
| `public/kiosk-sw.js` | Bewaart alles op de pc, zodat het aanraakscherm ook offline werkt |
| `src/worker.js` | Opslag (Cloudflare KV), wachtwoord, foto-upload en nieuws (RSS) |
| `src/ablesign.js` | Koppeling met AbleSign en de offline-melding (elk kwartier) |
| `wrangler.jsonc` | Cloudflare-instellingen, met de KV-opslag `vanerum-schermen` |

## Wachtwoord

De eerste keer dat u de editor opent, kiest u een wachtwoord. Geef dat aan de collega's die ook schermen mogen aanpassen.
Wachtwoord vergeten of wijzigen? Zet in Cloudflare bij de Worker onder **Settings → Variables and Secrets** een secret `WACHTWOORD`; dat gaat dan altijd voor.

## Weer en nieuws

Het weer komt van Open-Meteo (gratis, geen sleutel nodig). Nieuws komt uit RSS-feeds; in `public/gedeeld.js` staat de lijst met vaste bronnen, en in de editor kunt u ook een eigen RSS-adres invullen.

## Lokaal testen

```
npm install
npx wrangler dev
```
