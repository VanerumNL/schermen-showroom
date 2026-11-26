# Feestthema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Feestrand + optioneel feestmoment op tv-schermindelingen, automatisch volgens kalender (Sinterklaas) en verjaardagenlijst.

**Architecture:** Nieuw `public/feest.js` (puur, zonder DOM-afhankelijkheid in de logica) levert feestdefinities en `actiefFeest`. `scherm.html` tekent een niet-klikbare laag en een feestmoment; `index.html` krijgt een blok "Feestdagen". Opslag in `s.feest` per indeling; geen backend-wijziging.

**Tech Stack:** Vanilla JS/HTML/SVG, Cloudflare Worker (ongewijzigd), `node --test` voor logica, Playwright voor schermafbeeldingen.

**Spec:** `docs/superpowers/specs/2026-11-26-feestthema-design.md`

## Global Constraints
- Huisstijl: geel #fbb900, zwart #1e1e1e, Montserrat; Sinterklaasrood #c8102e.
- Geen animaties over het hele scherm in de feestrand; licht voor trage tv-boxen.
- Sinterklaas: `van: "11-12"`, `tot: "12-05"` (MM-DD, inclusief).
- Verjaardag: alleen `datum: "MM-DD"`, nooit jaartal.
- Feestmoment: elke 10 min, 8 s.
- Standaard: `{ aan: true, moment: false, verjaardagen: [] }`; ontbrekend `s.feest` = standaard.

## Review Focus
- Bestaande indelingen zonder `s.feest` → feestrand verschijnt in seizoen, niets crasht.
- Verjaardag op 29-02 in een niet-schrikkeljaar → toont niet; geen fout.
- Lege of half ingevulde verjaardagregel (naam leeg of datum leeg) → genegeerd.
- Naam met `<`/`&` → ge-escaped weergegeven.
- Staand scherm en sjabloon Welkom → rand past binnen 1080×1920 en dekt geen klok/logo af.

---

### Task 1: Feestlogica (`public/feest.js`)

**Files:** Create `public/feest.js`, `test/feest.test.js`

**Interfaces — Produces:**
- `window.VF` (en `module.exports` in Node) met:
  - `FEESTEN: Array<{ id, naam, van, tot, kleur, accent, rand(staand:boolean):string /*SVG-markup*/, moment(naam?:string):{kop,tekst} }>` — nu `sinterklaas`.
  - `VERJAARDAG`: zelfde vorm zonder `van/tot`, `id: "verjaardag"`.
  - `FEEST_STD(): { aan:true, moment:false, verjaardagen:[] }`
  - `actiefFeest(datum: Date, f?: object, forceer?: string): { feest, naam? } | null` — volgorde: `forceer` (id) → `f.aan===false` → null → verjaardag van vandaag (eerste geldige) → kalenderfeest. Periode mag over de jaarwisseling lopen (`van > tot`).

- [ ] Step 1: tests in `test/feest.test.js` (`node:test`, `assert`): 
  - `actiefFeest(new Date(2026,10,26))?.feest.id === "sinterklaas"`; 12-11 en 05-12 ook; 11-11 en 06-12 → `null`.
  - `actiefFeest(d, {aan:false})` → `null`.
  - verjaardag `{naam:"Sarah", datum:"11-26"}` op 26-11 → `feest.id==="verjaardag"`, `naam==="Sarah"`.
  - regels `{naam:"",datum:"11-26"}` en `{naam:"X",datum:""}` → genegeerd (dus sinterklaas).
  - `{naam:"Y",datum:"02-29"}` op 2027-02-28 → `null`.
  - `forceer:"sinterklaas"` op 2026-07-01 → sinterklaas; `forceer:"verjaardag"` → verjaardag met naam `"Voorbeeld"`.
  - testfeest met `van:"12-27", tot:"01-02"`: via interne helper `binnen("01-01","12-27","01-02") === true`.
- [ ] Step 2: `node --test test/` → FAIL.
- [ ] Step 3: implementeer; SVG's: Sint = vlaggetjesslinger (rood/geel/wit) bovenaan + mijter en 3 pepernoten rechtsonder; verjaardag = slinger + 3 ballonnen linksonder. Ook `binnen` exporteren.
- [ ] Step 4: `node --test test/` → PASS.
- [ ] Step 5: commit.

### Task 2: Weergave (`public/scherm.html`)

**Consumes:** `VF.actiefFeest`, `feest.rand(staand)`, `feest.moment(naam)`.

- [ ] Step 1: `<script src="/feest.js">` toevoegen; in `teken(s)` na het tekenen `tekenFeest(s)`: `.feest`-laag (`position:absolute; inset:0; pointer-events:none; z-index` boven vakken, onder tussendoor-kaart) met rand-SVG; bij verjaardag een klein label "Fijne verjaardag, <naam>!" (ge-escaped). Bij actief feest krijgen `.str`-streepjes een feestkleurfilter of vervangende rode/gele streepjes.
- [ ] Step 2: uurlijkse check (`setInterval` 60 min, in `opruimen` gewist): als feest-id/naam wisselt → `teken(huidig)`.
- [ ] Step 3: feestmoment: als `s.feest.moment` en feest actief → elke 10 min 8 s een volledige kaart (hergebruik stijl `.tussendoor`), met kleine eenmalige CSS-animatie (pepernoten/confetti vallen 1 keer, max 12 elementen).
- [ ] Step 4: URL-parameter `?feest=<id>` forceert (voor editorvoorbeeld) — preview-iframe geeft dit mee.
- [ ] Step 5: Playwright: screenshots liggend, staand, welkom, thema donker en geel, met `?feest=sinterklaas` en `?feest=verjaardag`; controleer visueel dat klok/logo vrij blijven. Commit.

### Task 3: Editor (`public/index.html`)

**Consumes:** `VF.FEEST_STD`, `VF.FEESTEN`.

- [ ] Step 1: `<script src="/feest.js">`; bij laden `if (!s.feest) s.feest = VF.FEEST_STD()`.
- [ ] Step 2: blok "Feestdagen" (ook bij sjabloon Welkom): vinkje "Feestthema volgens kalender" (`aan`), vinkje "Feestmoment elke 10 minuten" (`moment`), regel met de kalender ("Sinterklaas: 12 nov – 5 dec"), lijst verjaardagen (naam-tekstveld + dag-select 1–31 + maand-select, verwijderknop, "+ Verjaardag"), knoppen Voorbeeld (Geen / Sinterklaas / Verjaardag) die alleen de preview beïnvloeden (niet opgeslagen).
- [ ] Step 3: lokaal testen met wrangler dev + Playwright: wijziging opslaan, herladen, waarden blijven. Commit.

### Task 4: Afronden
- [ ] README/`claude/schermen-overzicht.md` bijwerken met Feestdagen + hoe een feest toevoegen. Push naar `main`.
