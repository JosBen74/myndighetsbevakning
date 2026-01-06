# Länsstyrelsen AI Insights System - Användardokumentation

**Version**: 1.0
**Senast uppdaterad**: 2025-12-07
**System**: n8n Cloud Workflow + Claude Sonnet 4.5

## Innehållsförteckning

1. [Översikt](#översikt)
2. [Hur det fungerar](#hur-det-fungerar)
3. [Användning](#användning)
4. [Installation och Konfiguration](#installation-och-konfiguration)
5. [Anpassning](#anpassning)
6. [Felsökning](#felsökning)
7. [Kostnader](#kostnader)

---

## Översikt

### Vad gör systemet?

Länsstyrelsen AI Insights är ett automatiserat system som:
- **Samlar** information från FOI-rapporter, Carl Heath's blogg, och Ethan Mollicks blogg (One Useful Thing)
- **Filtrerar** innehåll från senaste veckan (7 dagar)
- **Analyserar** med AI (Claude Sonnet 4.5) för relevans till civilförsvar och AI-säkerhet
- **Genererar** en strukturerad PM med insikter, teman, och rekommendationer
- **Levererar** via email varje måndag morgon kl. 08:00

### Vem är systemet för?

- Länsstyrelsen i Västra Götaland
- Arbetsgrupper inom civilförsvar och krishantering
- Beslutsfattare som behöver veckovisa insikter om AI-säkerhet och totalförsvar

### Problem som löses

- ✅ Eliminerar manuell bevakning av flera källor
- ✅ Filtrerar bort irrelevant information automatiskt
- ✅ Sammanfattar innehåll till konkreta åtgärder
- ✅ Sparar 3-5 timmar research-tid per vecka

---

## Hur det fungerar

### Arbetsflöde (18 noder)

```
┌─────────────────────────────────────────────────────────┐
│ TRIGGER LAYER (Noder 1-4)                              │
│ • Webhook trigger (on-demand)                           │
│ • Schedule trigger (måndag 08:00)                       │
│ • Execution mode detection                              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ DATA COLLECTION LAYER (Noder 5-12)                     │
│ • FOI Reports (via befintlig workflow webhook)          │
│ • Carl Heath Blog (HTTP fetch)                          │
│ • One Useful Thing Blog (HTTP fetch)                    │
│ • Merge & aggregate all sources                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ AI SYNTHESIS LAYER (Noder 13-16)                       │
│ • Prepare Claude API request                            │
│ • Call Claude Sonnet 4.5 via HTTP                       │
│ • Parse AI response (strip markdown)                    │
│ • Extract themes, quotes, recommendations               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ OUTPUT LAYER (Noder 17-20)                             │
│ • Generate HTML email                                    │
│ • Route based on execution mode                          │
│   - Webhook → JSON response                             │
│   - Scheduled → Gmail delivery                           │
└─────────────────────────────────────────────────────────┘
```

### Datumfiltrering

- **FOI Reports**: Filtrerar på `<lastmod>` datum i XML sitemap
- **Bloggposter**: Hämtar senaste inlägg från homepage (datum-oberoende för MVP)
- **Tidsram**: Senaste 7 dagarna (konfigurerbar)

### AI-analys Strategi

**System Prompt** (Svenska):
```
Du är en strategisk analytiker för Länsstyrelsen i Västra Götaland
med expertis inom civilförsvar, krishantering och AI-teknologi.
```

**Fokusområden**:
- Civilförsvar och totalförsvar
- AI-säkerhet och robusthet
- Krishantering och samhällsskydd
- Desinformation och informationssäkerhet
- Kritisk infrastruktur
- Beredskap och resiliens

**Output-struktur** (JSON):
```json
{
  "executiveSummary": "Kort sammanfattning (3-5 meningar)",
  "themes": [
    {
      "title": "Temats namn",
      "insight": "Huvudinsikt",
      "relevanceForLansstyrelsen": "Varför detta är viktigt"
    }
  ],
  "keyQuotes": [
    {
      "quote": "Citat från källan",
      "source": "Källans namn",
      "context": "Kontext och relevans"
    }
  ],
  "recommendations": [
    "Konkret åtgärd 1",
    "Konkret åtgärd 2"
  ]
}
```

---

## Användning

### Metod 1: Automatisk schemalagd körning

**När**: Varje måndag kl. 08:00
**Vad händer**:
1. Workflow körs automatiskt
2. Samlar data från senaste veckan
3. Genererar AI-analys
4. Skickar email till `josef.bengtson@lansstyrelsen.se`

**Ingen åtgärd krävs** - systemet kör automatiskt.

### Metod 2: On-demand via webhook

**Webhook URL**:
```
https://josben.app.n8n.cloud/webhook/lansstyrelsen-insights
```

**Exempel (Standard, senaste 7 dagarna)**:
```bash
curl -X POST "https://josben.app.n8n.cloud/webhook/lansstyrelsen-insights" \
  -H "Content-Type: application/json" \
  -d '{"mode": "test"}'
```

**Exempel (Anpassat datumintervall)**:
```bash
curl -X POST "https://josben.app.n8n.cloud/webhook/lansstyrelsen-insights" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "test",
    "dateFrom": "2025-11-01",
    "dateTo": "2025-12-01"
  }'
```

**Parametrar**:
- `mode`: `"test"` för JSON-svar (ingen email), `"live"` för email
- `dateFrom`: Start-datum (YYYY-MM-DD), default = 7 dagar sedan
- `dateTo`: Slut-datum (YYYY-MM-DD), default = idag

**Svar** (JSON):
```json
{
  "success": true,
  "executionTime": "2025-12-07T19:34:09.494Z",
  "sourceData": {
    "foi": [...],
    "carlHeath": [...],
    "oneUsefulThing": [...]
  },
  "aiInsights": {
    "executiveSummary": "...",
    "themes": [...],
    "keyQuotes": [...],
    "recommendations": [...]
  },
  "emailHtml": "<!DOCTYPE html>...",
  "emailSubject": "Veckorapport Civilförsvar & AI - ...",
  "metadata": {
    "model": "claude-sonnet-4-20250514",
    "tokensUsed": {...}
  }
}
```

### Metod 3: Via Claude Desktop (MCP Tool) - Kommer snart

```
get_lansstyrelsen_insights(days=7, format="markdown")
```

Returnerar rapporten i markdown-format för direkt läsning i Claude Desktop.

---

## Installation och Konfiguration

### Förutsättningar

1. **n8n Cloud-konto**: https://josben.app.n8n.cloud
2. **Claude API-nyckel**: Anthropic API access
3. **Gmail-konto**: För att skicka veckorapporter
4. **Befintlig FOI workflow**: Multi-Source Scanner workflow (för FOI-rapporter)

### Steg 1: Konfigurera Gmail

1. Öppna n8n Cloud: https://josben.app.n8n.cloud
2. Gå till **Settings** → **Credentials**
3. Klicka **Add Credential**
4. Välj **Gmail OAuth2**
5. Följ OAuth2-flödet för att auktorisera ditt Gmail-konto
6. Spara och notera **Credential ID**

### Steg 2: Uppdatera Workflow-filen

Öppna `lansstyrelsen-insights-v2.json` och ersätt:

```json
"credentials": {
  "gmailOAuth2": {
    "id": "PLACEHOLDER_GMAIL_CREDENTIAL_ID",  // <-- Ersätt denna
    "name": "Gmail account"
  }
}
```

Med ditt faktiska Credential ID.

### Steg 3: Importera Workflow

**Metod A: Via n8n UI**
1. Öppna n8n Cloud
2. Klicka **Import from file**
3. Välj `C:\Users\josef\n8n_test\workflows\lansstyrelsen-insights-v2.json`
4. Bekräfta import
5. Aktivera workflow

**Metod B: Copy-Paste**
1. Öppna workflow i n8n Cloud
2. Klicka **...** → **Import from JSON**
3. Kopiera innehållet från `lansstyrelsen-insights-v2.json`
4. Klistra in och importera
5. Spara och aktivera

### Steg 4: Testa Workflow

```bash
curl -X POST "https://josben.app.n8n.cloud/webhook/lansstyrelsen-insights" \
  -H "Content-Type: application/json" \
  -d '{"mode": "test", "dateFrom": "2025-11-01", "dateTo": "2025-12-07"}' \
  -o test-response.json
```

**Förväntat resultat**:
- HTTP 200
- `success: true`
- `aiInsights.themes` har 2+ items
- `aiInsights.recommendations` har 4+ items

### Steg 5: Aktivera Schemalagd Körning

1. I n8n workflow, gå till **Schedule Trigger**-noden
2. Bekräfta cron-uttryck: `0 8 * * 1` (Måndag 08:00)
3. Aktivera workflow
4. Första körningen: Nästa måndag kl. 08:00

---

## Anpassning

### Ändra Email-mottagare

**Fil**: `lansstyrelsen-insights-v2.json`
**Nod**: "Send Weekly Report Email" (node 19)

```json
"parameters": {
  "sendTo": "ny.adress@lansstyrelsen.se",  // <-- Ändra här
  "subject": "={{ $json.emailSubject }}",
  "message": "={{ $json.emailHtml }}"
}
```

### Ändra Schema

**Fil**: `lansstyrelsen-insights-v2.json`
**Nod**: "Schedule Trigger (Monday 8 AM)" (node 2)

**Exempel - Ändra till fredag kl. 16:00**:
```json
"parameters": {
  "rule": {
    "interval": [
      {
        "field": "cronExpression",
        "expression": "0 16 * * 5"  // Fredag 16:00
      }
    ]
  }
}
```

**Cron-format**:
```
┌─── Minut (0-59)
│ ┌─── Timme (0-23)
│ │ ┌─── Dag i månaden (1-31)
│ │ │ ┌─── Månad (1-12)
│ │ │ │ ┌─── Dag i veckan (0-7, 0=söndag, 1=måndag)
│ │ │ │ │
0 8 * * 1  // Måndag 08:00
```

### Justera AI-prompt

**Fil**: `lansstyrelsen-insights-v2.json`
**Nod**: "Prepare AI Request" (node 14)

Hitta `systemPrompt` variabeln och anpassa:

```javascript
const systemPrompt = `Du är en strategisk analytiker för Länsstyrelsen...

FOKUSOMRÅDEN:
- Civilförsvar och totalförsvar
- [LÄGG TILL DINA EGNA FOKUSOMRÅDEN HÄR]
- AI-säkerhet och robusthet

INSTRUKTIONER:
- Sammanfatta i max 3 meningar
- [LÄGG TILL DINA EGNA INSTRUKTIONER HÄR]
- Fokusera på åtgärbara insikter
`;
```

### Lägga till fler källor

**Exempel: Lägg till MSB-nyheter**

1. Lägg till ny "Fetch MSB" HTTP Request-nod efter node 11
2. Konfigurera URL: `https://www.msb.se/sv/aktuellt/` (eller RSS-feed)
3. Uppdatera "Merge All Sources" (node 12) för att inkludera MSB-data
4. Justera AI-prompts för att nämna MSB som källa

---

## Felsökning

### Problem: "Email skickas inte"

**Diagnos**:
1. Kontrollera Gmail credentials i n8n
2. Verifiera att workflow är aktiverad
3. Kör test via webhook och kontrollera `executionMode` i svaret

**Lösning**:
- Se till att Gmail OAuth2-flödet är komplett
- Kontrollera att "Send Weekly Report Email"-noden har rätt credential ID

### Problem: "AI-analys returnerar 0 teman"

**Diagnos**:
1. Läs test-response.json
2. Kontrollera om `_rawResponse` finns i `aiInsights`
3. Om den finns, är det ett parsing-problem

**Lösning**:
- Bekräfta att markdown-stripping fungerar (node 16)
- Kontrollera Claude API-nyckel
- Verifiera att Claude returnerar valid JSON

**Debug-kommando**:
```bash
python test-markdown-strip.py
```

### Problem: "Inga FOI-rapporter hittas"

**Diagnos**:
- FOI webhook kanske inte är aktiv
- Datum-filtrering kanske är för strikt

**Lösning**:
1. Testa FOI webhook manuellt
2. Bredda datumfilter (öka `dateFrom` bakåt)

### Problem: "Workflow timeout"

**Symptom**: Execution tar >120 sekunder

**Lösning**:
- Öka timeout i n8n Cloud settings (max 300s)
- Reducera antal källor eller datumintervall
- Optimera AI-prompt (kortare)

---

## Kostnader

### Per Execution

| Komponent | Kostnad | Anteckning |
|-----------|---------|------------|
| Claude API | ~$0.03 | 15K input + 3K output tokens |
| n8n Cloud | $0 | Inkluderat i plan |
| Gmail | $0 | Gratis |
| **Total** | **~$0.03** | Per körning |

### Månadsvis

| Scenario | Executions/månad | Kostnad |
|----------|------------------|---------|
| **Endast schemalagt** | 4 (varje måndag) | ~$0.12 |
| **Schemalagt + tester** | 12 (4 scheduled + 8 ad-hoc) | ~$0.36 |
| **Daglig användning** | 30 | ~$0.90 |

### Optimeringsmöjligheter

- **Reducera tokens**: Förkorta system prompt (-20% kostnad)
- **Cache homepage HTML**: Implementera 6h cache (~30% färre HTTP calls)
- **Filtrera före AI**: Endast skicka relevanta artiklar till Claude (-40% tokens)

---

## Support och Utveckling

### Nästa Steg (Roadmap)

- [ ] **MCP Tool Integration**: Anropa från Claude Desktop
- [ ] **Slack-notifieringar**: Real-time alerts för kritiska ämnen
- [ ] **PDF Export**: Spara veckorapporter som PDF
- [ ] **Dashboard**: Visualisera trender över tid
- [ ] **Fler källor**: MSB, EU AI Act Updates, NATO

### Kontakt

**Utvecklare**: Josef Bengtson
**Organisation**: Länsstyrelsen i Västra Götaland
**Email**: josef.bengtson@lansstyrelsen.se

### Versionshistorik

- **v1.0** (2025-12-07): Initial release
  - 18-nods workflow
  - Dual-trigger (webhook + scheduled)
  - AI synthesis med Claude Sonnet 4.5
  - Gmail delivery
  - HTML email med svensk design

---

## Bilagor

### A. Email Template Preview

Veckorapporten innehåller:

```
┌─────────────────────────────────────────────────┐
│ 📋 Veckorapport: Civilförsvar & AI             │
│ Insikter från FOI, Carl Heath och One Useful    │
│ Thing                                            │
├─────────────────────────────────────────────────┤
│                                                  │
│ SAMMANFATTNING                                   │
│ [3-5 meningar om veckans huvudinsikter]          │
│                                                  │
│ 🎯 HUVUDTEMAN                                    │
│ • Tema 1: [Titel]                                │
│   [Insikt]                                       │
│   Relevans: [Varför detta är viktigt]            │
│                                                  │
│ 💬 VIKTIGA CITAT                                 │
│ • "[Citat från expert]"                          │
│   — [Källa och kontext]                          │
│                                                  │
│ ✅ REKOMMENDATIONER                              │
│ • [Konkret åtgärd 1]                             │
│ • [Konkret åtgärd 2]                             │
│                                                  │
├─────────────────────────────────────────────────┤
│ 🤖 Automatiskt genererad av Länsstyrelsens AI    │
│ Insights System                                  │
│ Powered by Claude Sonnet 4.5 & n8n              │
└─────────────────────────────────────────────────┘
```

### B. Workflow Node Reference

| Node # | Namn | Typ | Syfte |
|--------|------|-----|-------|
| 1 | Webhook Trigger | Trigger | On-demand execution |
| 2 | Schedule Trigger | Trigger | Måndag 08:00 |
| 3 | Merge Triggers | Merge | Kombinera triggers |
| 4 | Detect Execution Mode | Code | Identifiera webhook vs scheduled |
| 5 | Prepare FOI Source | Code | Skapa FOI request config |
| 6 | Fetch FOI Reports | HTTP | Anropa FOI workflow |
| 7 | Parse FOI Results | Code | Filtrera FOI efter datum |
| 8 | Prepare Carl Heath Source | Code | Konfigurera Carl Heath fetch |
| 9 | Fetch Carl Heath Blog | HTTP | Hämta blogg-HTML |
| 10 | Prepare One Useful Thing | Code | Konfigurera One Useful Thing |
| 11 | Fetch One Useful Thing | HTTP | Hämta blogg-HTML |
| 12 | Merge All Sources | Merge | Kombinera alla källor |
| 13 | Aggregate Results | Code | Sammanställ data för AI |
| 14 | Prepare AI Request | Code | Bygg Claude API request |
| 15 | Call Claude API | HTTP | POST till Anthropic API |
| 16 | Parse AI Response | Code | Extrahera JSON (strip markdown) |
| 17 | Generate HTML Email | Code | Skapa HTML email template |
| 18 | Check Execution Mode | IF | Route baserat på mode |
| 19 | Return JSON Response | Respond | Webhook-svar |
| 20 | Send Weekly Report Email | Gmail | Skicka email (scheduled) |

### C. JSON Schema för AI Output

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["executiveSummary", "themes", "keyQuotes", "recommendations"],
  "properties": {
    "executiveSummary": {
      "type": "string",
      "maxLength": 500,
      "description": "3-5 meningar sammanfattning"
    },
    "themes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["title", "insight", "relevanceForLansstyrelsen"],
        "properties": {
          "title": {"type": "string"},
          "insight": {"type": "string"},
          "relevanceForLansstyrelsen": {"type": "string"}
        }
      },
      "minItems": 2,
      "maxItems": 4
    },
    "keyQuotes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["quote", "source"],
        "properties": {
          "quote": {"type": "string"},
          "source": {"type": "string"},
          "context": {"type": "string"}
        }
      }
    },
    "recommendations": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 2,
      "maxItems": 6
    }
  }
}
```

---

**Slutet på dokumentation**
