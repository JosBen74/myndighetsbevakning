// Aggregate (Val 2026) — samlar valbevakningskällor + Riksdag + tema-kontinuitet.
// Ersätter "Aggregate All Results" i den klonade workflowen.
// Läser DIREKT från Parse-noderna (undviker n8n Merge typeVersion 3.2-buggen).
// Källkeys måste matcha sourceKey i Source Config (Val 2026).
const unavailableSources = [];

const readSource = (nodeName) => {
  try {
    const items = $(nodeName).all().map(i => i.json).filter(j => j);
    items.forEach(j => {
      if (j.sourceUnavailable && !unavailableSources.includes(j.sourceUnavailable)) {
        unavailableSources.push(j.sourceUnavailable);
      }
    });
    return items.filter(j => !j.isEmpty);
  } catch (e) {
    console.log(`Kunde inte lasa fran ${nodeName}: ${e.message}`);
    return [];
  }
};

const fas3 = readSource('Parse Sources (Fas 3)');
const byKey = (k) => fas3.filter(j => j.sourceKey === k);

const response = {
  success: true,
  executionTime: new Date().toISOString(),
  sources: {
    // Nyhetsmedier
    svt:            byKey('svt'),
    svtvast:        byKey('svtvast'),
    gp:             byKey('gp'),
    // Officiell valmyndighet
    valmyndigheten: byKey('valmynd'),
    // Säkerhet & påverkansbevakning
    mpf:            byKey('mpf'),
    msb:            byKey('msb'),
    sapo:           byKey('sapo'),
    foi:            byKey('foi'),
    certse:         byKey('certse'),
    euvsdisinfo:    byKey('euvsdisinfo'),
    // Riksdagsdokument/voteringar/kalender — befintliga noder, söksträngar omriktade
    // mot vallag/demokrati (se BUILD.md, Compute Riksdag Date Range / Fetch Riksdag Documents).
    riksdagDocuments: readSource('Parse Riksdag Documents'),
    riksdagVotes:     readSource('Parse Riksdag Votes'),
    riksdagCalendar:  readSource('Parse Riksdag Calendar'),
    // Tema-kontinuitet 2026 — föregående perioders arkiverade teman (Notion Val2026-Teman)
    previousWeeks:    readSource('Parse Previous Themes').filter(j => j.type === 'previous_week'),
  },
  totalItems: 0,
  unavailableSources,
};

response.totalItems = Object.values(response.sources)
  .reduce((sum, arr) => sum + arr.length, 0);

// VG-flagga: deterministisk geografisk märkning (samma termlista som beredskapssektorer-brevet).
// Nationell bevakning → VG markeras som sekundär flagga. Parametrisera vgTerms för annat län.
const normalizeUrl = (u) => (typeof u === 'string' && u.startsWith('//')) ? 'https:' + u : u;
const vgTerms = ['västra götaland','göteborg','trollhättan','vänersborg','borås','skövde',
  'uddevalla','mariestad','lidköping','civilområde väst','civo v','sjuhärad','skaraborg',
  'bohuslän','dalsland','vänern','stenungsund','lysekil','landvetter','göta älv','strömstad'];
let vgFlaggedCount = 0;
Object.values(response.sources).forEach(arr => arr.forEach(item => {
  if (item && typeof item === 'object') {
    if (item.url) item.url = normalizeUrl(item.url);
    if (typeof item.title === 'string') item.title = item.title.trim();
    const blob = ((item.title || '') + ' ' + (item.excerpt || '') + ' ' + (item.fulltext || '') + ' ' + (item.titel || '')).toLowerCase();
    if (blob.trim() && vgTerms.some(t => blob.includes(t))) {
      item.vgFlagga = true;
      vgFlaggedCount++;
    }
  }
}));
response.vgFlaggedCount = vgFlaggedCount;

return [{ json: response }];
