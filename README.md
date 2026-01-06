# Myndighetsbevakning

AI-driven bevakning av svenska myndigheter, regeringsbeslut och expertanalyser för Länsstyrelsen i Västra Götaland.

## Översikt

Automatiserad insamling och AI-analys av information från:
- **Sektorsansvariga myndigheter** (PTS, MSB, Försvarsmakten)
- **Regeringen & Riksdagen** (Propositioner, SOU, Ds, Betänkanden)
- **Expertkällor** (FOI, bloggar om AI och beredskap)

## Bevakade källor (10 st)

| Kategori | Källa | Typ |
|----------|-------|-----|
| Sektorsansvariga | PTS | Nyheter (HTML) |
| Sektorsansvariga | MSB | RSS-flöde |
| Sektorsansvariga | Försvarsmakten | Dokument |
| Regeringen | Propositioner | Riksdagen RSS |
| Regeringen | SOU | Riksdagen RSS |
| Regeringen | Ds | Riksdagen RSS |
| Regeringen | Betänkanden | Riksdagen RSS |
| Expert | FOI | Rapporter |
| Expert | Carl Heath | Blogg |
| Expert | One Useful Thing | AI-blogg |

## Projektstruktur

```
myndighetsbevakning/
├── workflows/              # n8n workflow JSON-filer
│   ├── category-1-sektorsansvariga-mini-v2.json
│   ├── category-2-regeringen.json
│   ├── lansstyrelsen-insights-v2.json
│   ├── foi-reports-workflow.json
│   ├── myndighetsbevakning-curated-gmail.json
│   └── orchestrator-workflow.json
│
├── docs/                   # Dokumentation
│   ├── LANSSTYRELSEN-INSIGHTS-GUIDE.md
│   ├── PROJECT-STATUS.md
│   └── README.md
│
├── scripts/                # Test- och importskript
│   ├── test-lansstyrelsen-workflow.bat
│   ├── import-workflows.js
│   └── index.js
│
├── outputs/                # Genererade resultat
├── package.json
└── .env.example
```

## Workflows

### Kategori 1: Sektorsansvariga myndigheter
**Fil**: `category-1-sektorsansvariga-mini-v2.json`

Hämtar nyheter och dokument från:
- PTS (Post- och telestyrelsen)
- MSB (Myndigheten för samhällsskydd och beredskap)
- Försvarsmakten

### Kategori 2: Regeringen & Riksdagen
**Fil**: `category-2-regeringen.json`

Hämtar från Riksdagens öppna data:
- Propositioner
- Statens offentliga utredningar (SOU)
- Departementsserien (Ds)
- Utskottsbetänkanden

### Länsstyrelsen AI Insights
**Fil**: `lansstyrelsen-insights-v2.json`

Veckovis AI-sammanfattning:
- Samlar data från alla kategorier
- Claude AI analyserar och identifierar teman
- Genererar HTML-mail med insikter
- Schemalagd körning måndag kl 08:00

### Gmail-insamling
**Fil**: `myndighetsbevakning-curated-gmail.json`

Manuell kuraterad insamling via email:
- Triggas av email med URL
- Sparar till Google Sheets

## Installation

### Förutsättningar
- n8n Cloud-konto eller lokal n8n-instans
- Gmail OAuth2-credentials
- Google Sheets OAuth2-credentials
- Anthropic API-nyckel (för Claude)

### Steg

1. **Importera workflows till n8n**
   - Öppna n8n
   - Gå till Settings → Import from File
   - Välj workflow-fil från `workflows/`

2. **Konfigurera credentials**
   - Gmail OAuth2
   - Google Sheets OAuth2
   - HTTP Header Auth för Anthropic API

3. **Aktivera workflows**
   - Aktivera manuellt i n8n UI

## Användning

### Manuell körning via webhook

```bash
# Testa Category 1 (Sektorsansvariga)
curl -X POST "https://your-n8n-instance/webhook/category-1-mini-v2" \
  -H "Content-Type: application/json" \
  -d '{"dateFrom": "2025-01-01", "dateTo": "2025-01-06"}'

# Testa Category 2 (Regeringen)
curl -X POST "https://your-n8n-instance/webhook/category-2-regeringen" \
  -H "Content-Type: application/json"

# Testa Länsstyrelsen Insights
curl -X POST "https://your-n8n-instance/webhook/lansstyrelsen-insights" \
  -H "Content-Type: application/json" \
  -d '{"mode": "test"}'
```

### Schemalagd körning

Länsstyrelsen Insights körs automatiskt varje måndag kl 08:00 och skickar AI-sammanfattning via email.

## Kostnad

- ~$0.03 per körning (Claude API)
- ~$0.36/månad vid veckokörning
- Uppskattad tidsbesparing: 3-5 timmar/vecka

## Utveckling

### Köra tester lokalt

```bash
cd scripts
node test-category1.js
```

### Lägga till nya källor

1. Skapa ny fetch-node i relevant workflow
2. Lägg till parse-logik
3. Koppla till Merge-noden
4. Testa med webhook

## Licens

Internt projekt för Länsstyrelsen i Västra Götaland.

## Kontakt

Josef Bengtson - josef.bengtson@lansstyrelsen.se
