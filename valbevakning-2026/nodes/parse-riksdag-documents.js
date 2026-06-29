// Parse Riksdag Documents (Val 2026) — betänkanden + propositioner senaste 7 dagar.
// Ersätter "Parse Riksdag Documents". KW-regexen omriktad från försvar till val/demokrati:
// dokumenten hämtas brett (bet,prop) och rankas på _kwHit i syntesen.
const r = $json || {};
const list = (r.dokumentlista && r.dokumentlista.dokument) || [];
// Valrelaterade nyckelord (undviker bara "val" som matchar för brett).
const KW = /vallag|riksdagsval|allmänna val|valdag|valsedel|valsedlar|valdistrikt|valnämnd|valmyndighet|valfusk|valsäkerhet|valdeltagande|valrörelse|valhemlighet|valobservat|valresultat|valpåverkan|rösträkn|rösträtt|röstning|röstmottag|förtidsröst|valbarhet|demokrat|partistöd|partibidrag|desinformation|påverkanskampanj|informationspåverkan/i;
const items = list.map(x => {
  const titel = x.titel || x.notisrubrik || '';
  const summary = x.summary || x.notis || '';
  return {
    dokId: x.id || x.dok_id,
    doktyp: (x.doktyp || '').toLowerCase(),
    beteckning: x.beteckning || '',
    titel: titel,
    datum: (x.datum || '').slice(0, 10),
    url: (function (u) { return (u && u.indexOf('//') === 0) ? 'https:' + u : u; })(x.dokument_url_html || x.dokument_url_text || ''),
    excerpt: (summary || '').replace(/<[^>]+>/g, '').trim().slice(0, 400),
    _kwHit: KW.test(titel + ' ' + summary),
  };
}).filter(d => d.titel);
return items.length > 0 ? items.map(d => ({ json: d })) : [{ json: { source: 'Riksdag-docs', isEmpty: true } }];
