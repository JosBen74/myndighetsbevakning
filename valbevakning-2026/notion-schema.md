# Notion-arkiv: Val2026-Teman

Speglar civiltforsvar-arkivets schema så `Fetch/Parse Previous Themes` fungerar oförändrat.
Arkivet ger analyslagret ("analys av svepet utifrån tidigare rapportering" — Malins önskemål):
varje körning läser de senaste 3 perioderna och klassar teman `nytt`/`fortsättning`.

## Databasfält (exakt dessa namn — Parse Previous Themes läser dem hårt)

| Fält | Typ | Innehåll |
|------|-----|----------|
| `Datum` | Date | Periodens slutdatum (`dateTo`). Sorteras `descending` vid läsning. |
| `Sammanfattning` | Rich text | `executiveSummary` från körningen. |
| `Teman` | Multi-select | De fyra tema-titlarna + ev. flaggade narrativ (för kontinuitetsjämförelse). |
| `Vecka` | Number | ISO-veckonummer. |
| `Period` | Rich text | T.ex. "2026-08-31 – 2026-09-06" eller "dagligt 2026-09-12". |

## Skapa arkivet

Två vägar:
- **Notion MCP** (snabbast): skapa databas under en lämplig hub-sida med fälten ovan.
  Be Claude: "skapa Notion-databasen Val2026-Teman enligt notion-schema.md under sidan <parent>".
- **Manuellt** i Notion, kopiera databas-id (32 hex utan bindestreck) ur URL:en.

## Koppla in (efter att DB skapats)

Byt databas-id `2f4a50aab0bd80769fa8f27ba962369f` → nytt id i:
- `Fetch Previous Themes` → `parameters.url` (`.../v1/databases/<id>/query`)
- `Archive to Notion` → `parameters.url`/`jsonBody` (`parent.database_id`)

Notion-token: civiltforsvar-workflowet bär en integrationstoken i `Authorization`-headern.
Återanvänd samma integration (dela Val2026-Teman med den) eller skapa ny och rotera. Lägg
helst token i n8n-credential i stället för hårdkodad header (säkerhetsförbättring, se BUILD.md).

## Seed eller nollstart

- **Nollstart:** första körningarna saknar kontinuitet → `previousWeeks` tomt → ingen
  bortfallsmarkör (kontinuitet är förbättring, inte källa). Helt OK.
- **Seed:** kör 2–3 perioder bakåt manuellt (webhook med `dateFrom`/`dateTo`) och arkivera,
  så analyslagret har historik direkt vid skarp start. Öppen fråga i planen.
