# Vanerum Schermen

Zelf indelingen maken voor de tv-schermen (AbleSign): klok, logo, mededelingen, weer, nieuws, Vimo, foto's, video en tekst, in de Vanerum-huisstijl.

- **Editor:** `https://<adres>/` — inloggen met het gedeelde wachtwoord.
- **Scherm:** `https://<adres>/s/<naam-van-scherm>` — dit adres zet u in AbleSign (**Websites → Add website**, daarna in de playlist).

Wijzigingen die u in de editor opslaat, verschijnen binnen een minuut op het scherm. Valt het internet weg, dan blijft het scherm de laatste indeling tonen.

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
| `src/worker.js` | Opslag (Cloudflare KV), wachtwoord, foto-upload en nieuws (RSS) |
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
