// Prepare Notion Archive (Val 2026) — arkiverar periodens lägesbild till Val2026-Teman.
// Ersätter "Prepare Notion Archive". Skriver Datum/Sammanfattning/Teman/Vecka/Period så att
// "Parse Previous Themes" kan läsa kontinuitet nästa körning. DATABASE_ID sätts av patch.py.
try {
  const _mode = $('Detect Execution Mode').first().json;
  if (_mode && _mode.shouldSendEmail === false) { return []; }  // hoppa i test-/exportläge
} catch (e) {}

const config = $('Detect Execution Mode').first().json;
const synthesisData = $('Parse Synthesis Response').first().json;
const insights = synthesisData.aiInsights || {};

function getWeekNumber(dateStr) {
  const d = new Date(dateStr);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil((((t - y) / 86400000) + 1) / 7);
}
const weekNumber = getWeekNumber(config.dateTo);
const year = new Date(config.dateTo).getFullYear();

// Teman för kontinuitet: tema-titlar + flaggade narrativ (kort)
const themeNames = (insights.themes || []).map(t => t.title).filter(Boolean);
const flagNames = (insights.narrativeFlags || [])
  .filter(f => (f.konfidens || '').toUpperCase() === 'FLAGGA')
  .map(f => 'FLAGGA: ' + (f.pastaende || '').substring(0, 70));
const teman = [...themeNames, ...flagNames].slice(0, 10);

// === DATABASE_ID sätts automatiskt av patch.py från notion.json ===
const DATABASE_ID = '__VAL2026_TEMAN_DB_ID__';

const children = [];
children.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'Sammanfattning' } }] } });
children.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: (insights.executiveSummary || 'Ingen sammanfattning.').substring(0, 2000) } }] } });

// Fyra teman
(insights.themes || []).forEach(t => {
  const rt = [{ type: 'text', text: { content: (t.title || t.id || 'Tema') + ' [' + (t.trafikljus || '') + ', ' + (t.kontinuitet || '') + ']' }, annotations: { bold: true } }];
  if (t.lagesbild) rt.push({ type: 'text', text: { content: '\n' + t.lagesbild } });
  if (t.utveckling && t.utveckling !== 'null') rt.push({ type: 'text', text: { content: '\nSedan förra: ' + t.utveckling } });
  children.push({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: rt } });
});

// Flaggade narrativ
const flags = insights.narrativeFlags || [];
if (flags.length > 0) {
  children.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'Källkritik — flaggade narrativ (' + flags.length + ')' } }] } });
  flags.forEach(f => {
    const rt = [{ type: 'text', text: { content: '[' + (f.konfidens || '?') + '] ' + (f.pastaende || '') }, annotations: { bold: true } }];
    if (f.konfidensMotivering) rt.push({ type: 'text', text: { content: '\n' + f.konfidensMotivering } });
    children.push({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: rt } });
  });
}

children.push({ object: 'block', type: 'divider', divider: {} });
children.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Genererad: ' + new Date().toLocaleString('sv-SE') + ' | Valbevakning 2026 | Arkiverad automatiskt' }, annotations: { italic: true, color: 'gray' } }] } });

return [{
  json: {
    parent: { database_id: DATABASE_ID },
    properties: {
      'Namn': { title: [{ text: { content: 'Vecka ' + weekNumber + ', ' + year + ' — Valbevakning' } }] },
      'Vecka': { number: weekNumber },
      'Period': { rich_text: [{ text: { content: config.dateFrom + ' – ' + config.dateTo } }] },
      'Datum': { date: { start: config.dateTo } },
      'Sammanfattning': { rich_text: [{ text: { content: (insights.executiveSummary || '').substring(0, 2000) } }] },
      'Teman': { multi_select: teman.map(t => ({ name: t.substring(0, 100) })) },
    },
    children: children.slice(0, 100),
  },
}];
