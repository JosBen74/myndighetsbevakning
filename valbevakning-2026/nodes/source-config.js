// Source Config (Val 2026) — konsoliderade valbevakningskällor.
// Ersätter "Source Config (Fas 3)" i den klonade workflowen.
// NY KÄLLA = EN RAD HÄR. parser: 'jina' (markdown-skrap) | 'rss' (RSS/Atom) | 'hybridcoe' (HTML-kort).
// sourceKey används i "Aggregate All Results" för gruppering.
// Alla källor är nationella. VG-relevans sätts av VG-flaggan (termmatch) i Aggregate,
// inte per källa — bevakningen är nationell med VG som sekundär flagga.
//
// VERIFIERA myndighets-URL:erna med curl före deploy (CLAUDE-regel 02/03). Döda URL:er
// ger tyst tomhet (onError: continueRegularOutput) — bryter inte flödet, men ger inget värde.
const sources = [
  // --- Nyhetsmedier (rikstäckande + VG) — RSS bekräftade ---
  { sourceKey: 'svt',        label: 'SVT Nyheter',      parser: 'rss', url: 'https://www.svt.se/nyheter/rss.xml',              maxItems: 25 },
  { sourceKey: 'svtvast',    label: 'SVT Västnytt',     parser: 'rss', url: 'https://www.svt.se/nyheter/lokalt/vast/rss.xml', maxItems: 15 },
  { sourceKey: 'gp',         label: 'Göteborgs-Posten', parser: 'rss', url: 'https://www.gp.se/rss',                           maxItems: 20 },

  // Riksdag/regering: ingen separat nyhets-RSS finns (riksdagen.se/sv/rss → 404). Riksdagen
  // täcks i stället av Fetch/Parse Riksdag Documents + Calendar (data.riksdagen.se). Ingen rad här.

  // --- Officiella valmyndigheter (genomförande, regler, resultat) ---
  // VERIFIERA URL före deploy (val.se publicerar prel. resultat från kl 21 på valkvällen):
  { sourceKey: 'valmynd',    label: 'Valmyndigheten', parser: 'jina', url: 'https://r.jina.ai/https://www.val.se/',                         maxItems: 12, maxUndated: 6, urlInclude: '/(nyheter|aktuellt|press)/.' },

  // --- Säkerhet & påverkansbevakning (kärnan i uppdraget — stödjer tema 2 + 4 + källkritik) ---
  { sourceKey: 'mpf',        label: 'Myndigheten för psykologiskt försvar', parser: 'jina', url: 'https://r.jina.ai/https://www.mpf.se/aktuellt/', maxItems: 12, maxUndated: 6 },
  { sourceKey: 'msb',        label: 'MSB',            parser: 'jina', url: 'https://r.jina.ai/https://www.msb.se/sv/aktuellt/nyheter/',      maxItems: 12, maxUndated: 6, urlInclude: '/nyheter/' },
  // Säpo: aktuellt-sida (curl-verifierad 200). JS-rendering kan dock ge tomhet via jina.
  { sourceKey: 'sapo',       label: 'Säkerhetspolisen', parser: 'jina', url: 'https://r.jina.ai/https://www.sakerhetspolisen.se/aktuellt.html', maxItems: 10, maxUndated: 6, urlInclude: '/(nyheter|aktuellt|pressrum)/.' },
  // FOI: ingen RSS (foi.se/rss → 404). Skrapar nyhets-/pressidan via jina (curl-verifierad 200).
  { sourceKey: 'foi',        label: 'FOI',            parser: 'jina', url: 'https://r.jina.ai/https://www.foi.se/nyheter-och-press.html', maxItems: 12, maxUndated: 6, urlInclude: '/nyheter' },
  { sourceKey: 'certse',     label: 'CERT-SE',        parser: 'rss', url: 'https://www.cert.se/feed.rss',   maxItems: 10 },
  // EUvsDisinfo (EEAS East StratCom) — internationella påverkansnätverk. VERIFIERA feed-URL:
  { sourceKey: 'euvsdisinfo',label: 'EUvsDisinfo',    parser: 'rss', url: 'https://euvsdisinfo.eu/feed/',  maxItems: 12 },
];
// EJ webbflöden (manuellt/internt underlag — dokumenterat i BUILD.md):
//  - Länsstyrelsens egna regionala valfunktion + kommunernas valnämnder (internt VG-läge).
//  - Faktagranskning (Källkritikbyrån/Faktiskt/AFP) används REAKTIVT vid verifiering per OSINT-arbetsflödet.
//  - Bred opinion (SCB PSU, Valforskningsprogrammet GU, poll of polls) — medvetet utanför scope
//    (Malins avgränsning). Hämta vid behov från primärkälla, inte mediers sammanvägningar.
return sources.map(s => ({ json: s }));
