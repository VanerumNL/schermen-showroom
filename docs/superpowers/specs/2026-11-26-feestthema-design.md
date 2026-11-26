# Feestthema voor tv-schermindelingen — ontwerp

## Waarom
Paul wil de tv-schermen een feestelijk tintje geven rond feestdagen (eerst Sinterklaas, later kerst e.d.) en als iemand jarig is. Zichtbaar, maar niet overheersend; het blijft een Vanerum-scherm.

## Doelen
- Feestthema gaat vanzelf aan en uit via een kalender (geen Sint meer in januari).
- Per indeling uit te zetten.
- Nieuwe feestdag toevoegen = één nieuw item in een lijst, plus de versiering.
- Verjaardagen: lijst met naam + datum; alleen op die dag zichtbaar.

## Niet-doelen / anti-doelen
- Geen sneeuwval of bewegende lichtjes over het hele scherm (oogt amateuristisch, belast trage tv-boxen).
- Geen eigen achtergrondkleuren per feest; de gekozen achtergrond (Lichtblauw/Wit/Antraciet/Geel) blijft.
- Startschermen (zorg) en kiosk vallen hier buiten.

## Aanpakken (overwogen)
- **A. Feestrand** — dunne versiering langs de rand, streepjes in feestkleur, stilstaand. *Gekozen.*
- **B. Feestachtergrond** — patroon op ±8%: valt weg op wit, te druk op geel.
- **C. Feestmoment** — elke 10 min 8 s een volledige feestkaart. *Gekozen als optionele aanvulling (vinkje).*
Paul koos A + C als vinkje.

## Ontwerp
- `public/feest.js` (nieuw, gedeeld): `FEESTEN`-lijst met per feest `id`, `naam`, `van`/`tot` (MM-DD), kleuren en een functie die de SVG-versiering levert. Functie `actiefFeest(datum, instelling)` geeft verjaardag (voorrang) of kalenderfeest terug.
- Sinterklaas: 12-11 t/m 05-12. Rood #c8102e + Vanerum-geel. Slinger met vlaggetjes bovenaan, mijter en pepernoten in een hoek, streepjes rood/geel.
- Verjaardag: slingers + ballonnen; feestbalkje "Fijne verjaardag, <naam>!".
- `scherm.html`: tekent een laag (`.feest`, `pointer-events:none`) boven het scherm; checkt elk uur of het feest wisselt. Feestmoment loopt via het bestaande tussendoor-mechanisme (eigen kaart, 8 s, elke 10 min). Werkt liggend en staand, ook bij sjabloon Welkom.
- `index.html`: blok "Feestdagen" met vinkjes *Feestthema volgens kalender* (standaard aan), *Feestmoment elke 10 minuten* (standaard uit), lijst verjaardagen (naam + dag/maand) en een knop *Voorbeeld* om een feest te forceren in de preview.
- Opslag: per indeling in `s.feest = { aan, moment, verjaardagen:[{naam, datum:"MM-DD"}] }`. Geen backend-wijziging.

## Mijn keuzes (te controleren)
- Verjaardagen per indeling, niet centraal (geen backend nodig; bij behoefte later centraal).
- Sinterklaasperiode 12 nov – 5 dec.
- Alleen dag + maand, geen geboortejaar of leeftijd (privacy).

## Aan de bouwer
Exacte vormgeving van de SVG's, binnen de huisstijl en licht voor de tv-boxen.
