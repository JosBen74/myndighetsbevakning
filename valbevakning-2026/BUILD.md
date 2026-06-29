# Valbevakning 2026 — byggstatus och kvarvarande steg

Reviderad valbevakning enligt Marcus/Malins inspel (2026-04-27): fyra fasta teman,
nationell + VG-flagga, skalbar frekvens, analys av svepet, aktiv källkritik.
Bygger på en **klon av `veckorapport-civiltforsvar-ai.json`** — analyslagret
(tema-kontinuitet via Notion-arkiv) återanvänds oförändrat.

Plan: `~/.claude/plans/jag-har-tidigare-bett-quirky-leaf.md`.

## Repo = source of truth

```
~/projects/valbevakning-2026/
  nodes/source-config.js       # Source Config (Val 2026)  — 7 valkällor
  nodes/aggregate.js           # Aggregate (Val 2026)       — källkeys + VG-flagga + previousWeeks
  nodes/prepare-synthesis.js   # Prepare Synthesis Request  — 4 teman + källkritik + kontinuitet
  patch.py                     # injicerar nodkroppar + identitet i workflow-JSON
  verify.py                    # strukturell verifiering (kör utan n8n)
  notion-schema.md             # Val2026-Teman-schema
  BUILD.md                     # denna fil
```
Deployad/redigerad JSON: `~/myndighetsbevakning/workflows/valbevakning-2026.json`
(backup: `valbevakning-2026.json.backup-pre-valpatch`).

Workflow: redigera `nodes/*.js` → `python patch.py` → `python verify.py`.

## KLART (verifierat strukturellt, `verify.py` → 0 fel)

- [x] Klon + identitet (namn, webhook-path `valbevakning-2026`).
- [x] Valspecifik källista (11 källor): medier (SVT, SVT Västnytt, GP), Riksdagen-RSS,
      Valmyndigheten, samt säkerhet/påverkan (MPF, MSB, Säpo, FOI, CERT-SE, EUvsDisinfo).
- [x] Fyra-tema-syntesprompt med inline domänkontext, trafikljus och tema-kontinuitet.
- [x] Aktiv källkritik: `narrativeFlags` med konfidens HÖG/MEDEL/LÅG/FLAGGA + neutral myndighetsroll.
- [x] VG-flagga parametriserbar (`vgTerms` i aggregate.js — byt lista för annat län).
- [x] Datapath sammanhängande: Source Config → Parse Sources (Fas 3) → Aggregate → Synthesis.
      Webhook `export-json`-läge returnerar `aiInsights` direkt → **JSON är testbart före deploy**.
- [x] **HTML-mall ombyggd** (`generate-html.js`): 4 tema-kort med trafikljus-färg (grön/gul/röd) +
      kontinuitets-badge (nytt/fortsättning), källkritik-sektion med konfidens-badge
      (HÖG/MEDEL/LÅG/⚠FLAGGA), nyckelposter, inkommande, osäkerhetsavsnitt, AI-deklaration.
      LST grafisk profil återanvänd. Alla 5 nodkroppar node --check-rena.
- [x] **Notion-arkiv förberett** (`prepare-notion-archive.js` skriver Datum/Sammanfattning/Teman/
      Vecka/Period; `create_notion_db.py` + schema klara). BLOCKERAT på delad föräldersida — se nedan.
- [x] **Riksdag-sökord omriktade** (`parse-riksdag-documents.js`): KW-regex från försvar →
      val/demokrati (vallag, rösträkning, valmyndighet, förtidsröstning, desinformation, m.fl.).
      Syntesen prioriterar val-relevanta dokument (_kwHit) och matar kalendern till "inkommande".
- [x] **Dagligt intensivläge** (`detect-execution-mode.js` + `generate-html.js`): mode `daily`
      ger 24h-fönster (`config.dailyMode`) + radar-rubrik/ämne. SAMMA workflow, ingen andra klon —
      fyra-tema-trafikljuset ÄR radarvyn. Trigger = schemalagt webhook-anrop (deploy-steg, se nedan).
- [x] **Notion-arkiv Val2026-Teman** skapat + inkopplat (DB `38ea50aab0bd81a08d80d5778ce4f265`,
      query verifierad). `verify.py` → 15 OK · 0 fel.

## KVARSTÅR före skarp drift

1. ~~**Verifiera käll-URL:er**~~ — KLART (curl-testat 2026-06-29). Alla 10 källor svarar 200:
   - RSS OK: SVT (`rss.xml`), **SVT Västnytt** (rättad → `.../vast/rss.xml`), GP (gzip text/xml),
     CERT-SE, EUvsDisinfo.
   - jina OK (mål-sida 200): Valmyndigheten (val.se), MPF, MSB, **Säpo** (rättad → `/aktuellt.html`),
     **FOI** (bytt från död RSS → jina på `/nyheter-och-press.html`).
   - **Borttaget:** `riksdagnyh` — riksdagen.se/sv/rss → 404, ingen nyhets-RSS finns; Riksdagen
     täcks redan av Fetch/Parse Riksdag Documents + Calendar (data.riksdagen.se).
   - Kvarstående osäkerhet: jina-källor beror på `r.jina.ai`-proxyn (beprövad i civiltforsvar)
     och kan ge tomhet om sidan är JS-renderad (särskilt Säpo). Tomhet bryter inte flödet.

   ~~**Regeringsuppdrag 2026**~~ — KLART (OSINT 2026-06-29, adversariellt verifierat). Rollkarta i
   `osint-myndighetsroller.md`, inbakad som domänkontext i `prepare-synthesis.js` (tema 3).
   Nyckelkorrigeringar: MSB→MCF (2026-01-01); desinformation ligger på MPF, ej MCF; Valmyndigheten
   har 2026-uppdrag (utlandssvenskar). Kvar att stänga: regleringsbreven 2026 i fulltext.

2. ~~**Notion-arkiv Val2026-Teman**~~ — KLART (2026-06-29). DB skapad under sidan
   "Valbevakning 2026" (delad med integrationen `n8n Veckorapport`). Databas-id
   `38ea50aab0bd81a08d80d5778ce4f265` (i `notion.json`). `Fetch Previous Themes` + arkivnoden
   inkopplade; query verifierad (200, schema Datum/Sammanfattning/Teman/Vecka/Period/Namn).

3. ~~**Riksdag-sökord**~~ — KLART (`parse-riksdag-documents.js`). Dokumenten hämtas brett
   (bet,prop) och rankas på val/demokrati-KW i syntesen.

4. ~~**HTML-leverans (`Generate HTML Email`)**~~ — KLART (`generate-html.js`). Återstår: visuell
   granskning i mailklient efter första skarpa körningen (rendering i Gmail/Outlook).

5. **Dagligt intensivläge** — KAPACITET KLAR (mode `daily` → 24h-fönster + radar-rubrik).
   Återstår vid deploy: en **daglig trigger** under valperioden. Rekommenderad n8n-koppling:
   Schedule Trigger (t.ex. 08:00) → HTTP Request som POSTar egen webhook `/valbevakning-2026`
   med `{"mode":"daily"}` (självanrop, behåller body-driven logik). Alternativt extern cron.
   Aktivera ~3 v före valdag; stäng av efter slutlig rösträkning.

6. **Pruning (städning, ej blockerande)** — de defensspecifika fetch/parse-noderna (FOI, MTFA,
   Omni, Hormuz/Brent/TTF/Urea, category-1, ElevenLabs TTS) körs men ignoreras av Aggregate.
   Inaktivera/ta bort för renare körning och lägre kostnad. Lämnas kvar nu för minimal risk.

7. **Säkerhet** — flytta hårdkodad Notion-token till n8n-credential.

8. **Deploy + skarp test** — KLART (2026-06-29). Workflow på josben.app.n8n.cloud, **INAKTIVT**,
   id `Np5C5UDIkqj9b5Y4` (i `deploy.json`). 7 live-markörer verifierade. Iterera: `patch.py` →
   `deploy.py` (PUT samma id) → `deploy.py --verify`.
   - **Export-json-test körd live** (date 2026-06-22..29): 96 poster från alla 10 källor (inget
     bortfall), Claude `end_turn`, 4 teman renderade (trafikljus 3 grön/1 gul), keyItems 5,
     narrativeFlags 0 (lugn period — fabricerar inte), inget mail skickat. Förhandsvisning:
     `~/output/valbevakning-2026_preview_2026-06-29.html`.
   - **BUGFIX:** Claude delade ibland svaret i flera top-level JSON-objekt (`}\n{`) → ärvd
     parser failade. Ny `parse-synthesis.js` slår ihop balanserade top-level-objekt (verifierat
     mot det faktiska felsvaret). Prompten skärpt att kräva ETT objekt. OBS: civiltforsvar-workflowet
     har samma sårbarhet i sin Parse-nod — överväg samma fix där.

9. **Före aktivering (kvar):**
   - Sätt mottagare i `Send Weekly Report Email` (Marcus, Malin, VG-valorg — ärver nu
     civiltforsvar-mottagaren). Annars går söndagsutskicket fel.
   - Testa data: UI "Execute workflow", eller aktivera tillfälligt och kör
     `curl -d '{"mode":"export-json","dateFrom":"2026-06-22","dateTo":"2026-06-29"}'`.
     Granska fyra teman/narrativeFlags/källkritik mot OSINT-ramen.
   - Token → n8n-credential (säkerhet). Daglig trigger inför valperioden (DEPLOY.md steg 4).
   - Aktivera: UI-toggle eller `POST /api/v1/workflows/Np5C5UDIkqj9b5Y4/activate`.

## Frekvensmodell (från planen)

| Läge | Period (prel.) | Frekvens | Format |
|------|----------------|----------|--------|
| Baslinje | nu → ~3 v före valdag | varannan vecka → veckovis | HTML-veckorapport, 4 teman + utveckling |
| Intensiv | ~3 v före valdag → valdag | dagligen | trafikljus per tema |
| Rösträkning | valdag → slutlig rösträkning | dagligen, förstärkt | trafikljus + fördjupad källkritik |

Valdatum: **söndag 13 september 2026** (bekräftat). Prel. resultat från kl 21 på valkvällen,
slutligt veckan efter (länsstyrelsernas slutliga rösträkning) → motiverar intensiv-/rösträkningsläget.

## Medvetet utanför scope (Malins avgränsning)

Bred opinionsbevakning hålls utanför flödet: SCB:s partisympatiundersökning (PSU),
Valforskningsprogrammet/SOM-institutet (GU), poll-of-polls/sammanvägningar. Hämtas vid behov
manuellt från **primärkälla** (ej mediers sammanfattningar — varierar kraftigt mellan institut).
Faktagranskning (Källkritikbyrån/Faktiskt/AFP) används **reaktivt** vid verifiering per
OSINT-arbetsflödet, inte som löpande feed. Internt regionalt läge (länets valfunktion +
kommunernas valnämnder) tillförs manuellt för VG-dimensionen.
