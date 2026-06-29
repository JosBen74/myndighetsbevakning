# Deploy — valbevakning-2026 → n8n cloud

Förutsättning: `python verify.py` → 0 fel (nu 15 OK). Deploy sker mot
josben.app.n8n.cloud via `deploy.py` (POST första gången → sparar id i `deploy.json`,
PUT därefter). Workflowet skapas **inaktivt** — du aktiverar efter granskning.

## 0. Före deploy (rekommenderat, ej blockerande)

- **Token → credential (säkerhet):** Notion-token ligger hårdkodad i headern på
  `Fetch Previous Themes` + `Archive to Notion`, och Anthropic-nyckeln i `Call Synthesis AI`.
  De funkar som de är (samma n8n-instans), men flytta gärna till n8n-credentials
  (HTTP Header Auth) i UI:t efter import. Gmail/Sheets-credentials ärvs via id från klonen.
- Bekräfta att klonens credential-id:n finns på instansen (de gör det — klon av befintligt
  workflow på samma instans).

## 1. Deploya (skapar inaktivt workflow)

```
python deploy.py
```
Skriver ut nytt workflow-id (sparas i `deploy.json`), kör live-verifiering av markörer
(webhook-path, fyra teman, källkritik, dagligt läge, Notion-koppling, Riksdag-KW) och
visar webhook-URL + aktiveringskommando.

## 2. Testa DATA före aktivering (JSON, skickar inget mail)

Aktivera workflowet tillfälligt (webhook måste vara live för att svara), eller testa via
"Execute workflow" i UI:t. JSON-läge returnerar `aiInsights` utan att mejla/arkivera:
```
curl -X POST https://josben.app.n8n.cloud/webhook/valbevakning-2026 \
  -H "Content-Type: application/json" \
  -d '{"mode":"export-json","dateFrom":"2026-06-22","dateTo":"2026-06-29"}'
```
Granska: fyra `themes` (med trafikljus/kontinuitet), ev. `narrativeFlags` med `konfidens`,
`keyItems` med `vgRelevans`, `osakerhet`. Kontrollera mot OSINT-källkritikramen att
flaggade narrativ är rimliga och att inga källor fabricerats.

## 3. Testa skarp körning (HTML-mail + Notion-arkiv)

```
curl -X POST https://josben.app.n8n.cloud/webhook/valbevakning-2026 \
  -H "Content-Type: application/json" \
  -d '{"dateFrom":"2026-06-22","dateTo":"2026-06-29"}'
```
Kontrollera: (a) HTML-mailet renderar fyra tema-kort + badges i Gmail/Outlook,
(b) en rad skapas i Notion-databasen **Val2026-Teman** (Datum/Sammanfattning/Teman ifyllda).
Andra körningen ska visa kontinuitet (`fortsättning` + "Sedan förra perioden").

## 4. Mottagare + schemaläggning

- Sätt mottagare i `Send Weekly Report Email` (start: Marcus Dittmer, Malin Winald, VG-valorg).
- **Veckoschema:** befintlig Schedule Trigger (söndag) — justera tid vid behov.
- **Dagligt intensivläge (aktiveras ~3 v före valdag 2026-09-13):** lägg till i n8n:
  Schedule Trigger (t.ex. 08:00) → HTTP Request POST `…/webhook/valbevakning-2026`
  body `{"mode":"daily"}` (självanrop). Stäng av efter slutlig rösträkning.

## 5. Aktivera

UI: toggla workflowet aktivt. Eller API: `POST /api/v1/workflows/<id>/activate`.

## 6. Rollback

- Avaktivera workflowet i UI, eller
- `deploy.json` har id:t → PUT tillbaka en tidigare version, eller radera workflowet i UI.
- Lokala backuper: `valbevakning-2026.json.backup-pre-valpatch` (= ren klon före val-patch).

## Iterera efter deploy

Ändra `nodes/*.js` → `python patch.py` → `python deploy.py` (PUT, samma id) →
`python deploy.py --verify`.
