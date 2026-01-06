# n8n + Claude Code demo

Det här projektet visar ett enkelt flöde: ta fritext → skapa en n8n-workflow JSON (mock via Claude Code-stub) → exportera till n8n Cloud (om du har API-uppgifter) → trigga och hämta resultat.

Snabbstart

1. Kopiera `.env.example` till `.env` och fyll i `N8N_BASE_URL` och `N8N_API_KEY` om du vill prova mot din n8n Cloud-installation.

2. Installera beroenden:

```powershell
npm install
```

3. Kör demo (genererar workflow och sparar lokalt):

```powershell
npm start
```

Följ instruktionen och skriv ett fritext-behov.

4. För att även försöka exportera och trigga workflow mot n8n Cloud (om du angett env-variabler):

```powershell
npm run export
```

Notera
- `src/claude_client.js` innehåller idag en mock-implementation. Ersätt med verklig Claude Code-integration där du skickar prompt och tolkar svaret som n8n-workflow JSON.
- n8n Cloud API:er kan variera. `src/n8n_client.js` gör ett försök att posta till `/workflows` och flera vanliga trigger-endpoints, men du kan behöva anpassa endpoints och auth-header enligt din installation.

Filer
- `src/claude_client.js`: Claude Code-stub (mock)
- `src/generator.js`: Wrapper som genererar och sparar workflow JSON
- `src/n8n_client.js`: Export + trigger (simulerar när env saknas)
- `index.js`: Enkel CLI för demo
