# CLAUDE.md - Myndighetsbevakning

## Projektöversikt

AI-driven bevakning av svenska myndigheter för Länsstyrelsen. Samlar in och analyserar information från 10 källor.

## Tech Stack

- **n8n** - Workflow automation
- **Claude AI** - Analys och sammanfattning
- **Gmail/Google Sheets** - Leverans och lagring

## Projektstruktur

```
workflows/     - n8n workflow JSON-filer (19 st)
docs/          - Guider och status
scripts/       - Test- och importskript
outputs/       - Genererade resultat
```

## Bevakade källor

### Kategori 1: Sektorsansvariga
- PTS - `https://pts.se/nyheter-och-pressmeddelanden/`
- MSB - `https://www.msb.se/sv/rss-floden/rss-alla-nyheter-fran-msb/`
- Försvarsmakten - `https://www.forsvarsmakten.se/sv/om-forsvarsmakten/dokument/`

### Kategori 2: Regeringen & Riksdagen
- Propositioner - `data.riksdagen.se` RSS
- SOU - `data.riksdagen.se` RSS
- Ds - `data.riksdagen.se` RSS
- Betänkanden - `data.riksdagen.se` RSS

### Expertkällor
- FOI (Totalförsvarets forskningsinstitut)
- Carl Heath (blogg)
- One Useful Thing (AI-blogg)

## Huvudworkflows

| Workflow | Webhook | Syfte |
|----------|---------|-------|
| category-1-sektorsansvariga-mini-v2 | `/category-1-mini-v2` | PTS, MSB, FM |
| category-2-regeringen | `/category-2-regeringen` | Riksdagen RSS |
| lansstyrelsen-insights-v2 | `/lansstyrelsen-insights` | AI-sammanfattning |
| myndighetsbevakning-curated-gmail | (Gmail trigger) | Manuell insamling |

## Vanliga kommandon

### Testa workflow
```bash
curl -X POST "https://josben.app.n8n.cloud/webhook/category-1-mini-v2" \
  -H "Content-Type: application/json" \
  -d '{"dateFrom": "2025-01-01", "dateTo": "2025-01-06"}'
```

### Importera workflow till n8n
```bash
node scripts/import-workflows.js
```

## Output-format

Alla kategori-workflows returnerar:
```json
{
  "success": true,
  "category": "Sektorsansvariga",
  "items": [
    {
      "source": "MSB",
      "type": "news",
      "title": "...",
      "url": "...",
      "date": "2025-01-06",
      "excerpt": "..."
    }
  ],
  "totalItems": 15,
  "sources": { "pts": 5, "msb": 8, "fm": 2 }
}
```

## AI-prompt (Länsstyrelsen Insights)

Systemet använder Claude Sonnet för att:
1. Identifiera gemensamma teman
2. Extrahera viktiga citat
3. Ge rekommendationer för Länsstyrelsen
4. Skriva sammanfattning på svenska

## Credentials som krävs

- Gmail OAuth2
- Google Sheets OAuth2
- Anthropic API Key (HTTP Header Auth)

## Schemaläggning

- Länsstyrelsen Insights: Måndag 08:00
- Övriga: Manuell trigger via webhook

## Felsökning

### Workflow returnerar tomma items
- Kontrollera att datumintervallet innehåller publiceringar
- Verifiera att externa API:er svarar

### Gmail-leverans misslyckas
- Kontrollera OAuth2-token (kan ha gått ut)
- Verifiera mottagaradress i workflow

### AI-analys returnerar fel
- Kontrollera Anthropic API-nyckel
- Se till att markdown-stripping fungerar (```json wrapper)
