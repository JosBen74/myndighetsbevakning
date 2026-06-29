// Detect Execution Mode (Val 2026) — lägger till dagligt intensivläge.
// Lägen via webhook-body.mode: 'test' | 'export-json' | 'daily' (annars veckovis/schemalagt).
// 'daily' = 24h-fönster + radar-format i HTML (config.dailyMode). Behåller dateFrom/dateTo-override.
const items = $input.all();

const isWebhook = items.some(item => item.json.headers !== undefined);
const mode = isWebhook ? 'webhook' : 'scheduled';
const body = (isWebhook && items[0].json.body) ? items[0].json.body : {};

const dailyMode = body.mode === 'daily' || body.mode === 'dagligt';

let dateFrom = body.dateFrom;
let dateTo = body.dateTo;

if (!dateFrom || !dateTo) {
  const now = new Date();
  const back = new Date(now);
  back.setDate(back.getDate() - (dailyMode ? 1 : 7));  // dagligt = 24h, annars 7 dagar
  dateFrom = back.toISOString().split('T')[0];
  dateTo = now.toISOString().split('T')[0];
}

const testMode = body.mode === 'test';
const exportMode = body.mode === 'export-json';
const shouldSendEmail = !testMode && !exportMode;
const modelOverride = (typeof body.model === 'string') ? body.model : undefined;

return [{
  json: {
    mode,
    testMode,
    exportMode,
    dailyMode,
    shouldSendEmail,
    modelOverride,
    dateFrom,
    dateTo,
    executionTime: new Date().toISOString(),
  },
}];
