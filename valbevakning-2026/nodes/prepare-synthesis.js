// Prepare Synthesis Request (Val 2026) — fyra fasta valteman + källkritik + tema-kontinuitet.
// Ersätter "Prepare Synthesis Request" i den klonade workflowen.
// Läser Aggregate (Val 2026) → s.<källa>, samt s.previousWeeks ur Notion-arkivet.
// Domänkontext bakas in INLINE (ingen Google Sheet-beroende som i civiltforsvar).
// Output-JSON konsumeras av Parse Synthesis Response (generisk) och webhook export-json.

const aggregatedData = $('Aggregate All Results').first().json;
const config = $('Detect Execution Mode').first().json;
const s = aggregatedData.sources;

// === Generisk källistrenderare ===
function renderList(label, arr, opts) {
  opts = opts || {};
  arr = arr || [];
  if (opts.skipEmpty && arr.length === 0) return '';
  let out = '\n' + label + ' (' + arr.length + '):\n';
  arr.forEach((item, i) => {
    out += (i + 1) + '. ' + (item.title || item.titel || '') + '\n';
    if (item.date || item.datum) out += '   Datum: ' + (item.date || item.datum) + '\n';
    if (item.url) out += '   URL: ' + item.url + '\n';
    if (item.excerpt) out += '   Utdrag: ' + item.excerpt + '\n';
    if (item.vgFlagga) out += '   [VG-FLAGGA: trolig Västra Götaland-koppling]\n';
    out += '\n';
  });
  return out;
}

// === Underlag ===
let contentSummary = 'Datumintervall: ' + config.dateFrom + ' till ' + config.dateTo + '\n\n';
contentSummary += '=== NYHETSMEDIER ===';
contentSummary += renderList('SVT NYHETER', s.svt, { skipEmpty: true });
contentSummary += renderList('SVT VÄSTNYTT', s.svtvast, { skipEmpty: true });
contentSummary += renderList('GÖTEBORGS-POSTEN', s.gp, { skipEmpty: true });
contentSummary += '\n=== OFFICIELL VALMYNDIGHET ===';
contentSummary += renderList('VALMYNDIGHETEN', s.valmyndigheten, { skipEmpty: true });
contentSummary += '\n=== SÄKERHET & PÅVERKANSBEVAKNING ===';
contentSummary += renderList('MYNDIGHETEN FÖR PSYKOLOGISKT FÖRSVAR (MPF)', s.mpf, { skipEmpty: true });
contentSummary += renderList('MSB', s.msb, { skipEmpty: true });
contentSummary += renderList('SÄKERHETSPOLISEN', s.sapo, { skipEmpty: true });
contentSummary += renderList('FOI', s.foi, { skipEmpty: true });
contentSummary += renderList('CERT-SE (CYBERINCIDENTER)', s.certse, { skipEmpty: true });
contentSummary += renderList('EUVSDISINFO (INTERNATIONELL PÅVERKAN)', s.euvsdisinfo, { skipEmpty: true });

// Riksdagsdokument — prioritera valrelaterade (_kwHit) först, ta topp 10.
const rdDocs = (s.riksdagDocuments || [])
  .slice()
  .sort((a, b) => (b._kwHit ? 1 : 0) - (a._kwHit ? 1 : 0))
  .slice(0, 10);
if (rdDocs.length) {
  contentSummary += '\n=== RIKSDAGSDOKUMENT (vallag/demokrati prioriterat) ===\n';
  rdDocs.forEach((d, i) => {
    contentSummary += (i + 1) + '. [' + (d.doktyp || '').toUpperCase() + ' ' + (d.beteckning || '') + '] ' + (d.titel || '') + '\n' +
      '   Datum: ' + (d.datum || '') + ' | URL: ' + (d.url || '') + (d._kwHit ? '\n   [VAL-RELEVANT]' : '') + '\n' +
      (d.excerpt ? '   Utdrag: ' + d.excerpt + '\n' : '') + '\n';
  });
}

// Riksdagens kalender (kommande 7 dagar) — underlag för upcomingWeek
const rdCal = (s.riksdagCalendar || []).slice(0, 15);
if (rdCal.length) {
  contentSummary += '\n=== RIKSDAGENS KALENDER (kommande, för "inkommande") ===\n';
  rdCal.forEach((c, i) => {
    contentSummary += (i + 1) + '. ' + (c.datum || '') + ' — ' + (c.organ || '') + ': ' + (c.aktivitet || '') + (c.summary ? ' — ' + c.summary : '') + '\n';
  });
}

// === Tema-kontinuitet: föregående perioders teman ur Notion-arkivet ===
let continuityInstruction = '';
try {
  const prevWeeks = s.previousWeeks || [];
  if (prevWeeks.length > 0) {
    let block = '\n\n=== FÖREGÅENDE PERIODERS LÄGE (kontinuitetskontext ur arkivet) ===\n';
    prevWeeks.forEach(w => {
      block += 'Vecka ' + (w.vecka || '?') + (w.period ? ' (' + w.period + ')' : '') + ':\n';
      if (w.themes && w.themes.length) block += '  Teman/signaler: ' + w.themes.join(' · ') + '\n';
      if (w.summary) block += '  Sammanfattning: ' + w.summary + '\n';
      block += '\n';
    });
    contentSummary += block;
    continuityInstruction = '\n\nVIKTIGT — TEMA-KONTINUITET:\n' +
      'Underlaget innehåller FÖREGÅENDE PERIODERS LÄGE ur arkivet. Analysera svepet i ljuset av detta.\n' +
      'Sätt för vart och ett av de fyra temana:\n' +
      '- "kontinuitet": "fortsättning" om temat förekommit de senaste perioderna (sakligt, inte ordagrant), annars "nytt".\n' +
      '- "utveckling": för fortsättning exakt 1 mening om vad som ÄNDRATS sedan förra perioden (eskalering, nytt narrativ, nytt beslut, dämpning). För nytt: null.\n' +
      'Använd kontinuiteten i executiveSummary där relevant ("fortsatt", "trappas upp", "tredje veckan i rad").';
  }
} catch (e) {
  console.log('Kontinuitets-injektion misslyckades:', e.message);
}

// === Inline domänkontext: valorganisationens behov ===
const domainContext = `=== DOMÄNKONTEXT: LÄNSSTYRELSERNAS VALORGANISATION ===
Mottagare är de som arbetar med valgenomförandet vid landets länsstyrelser (regional
valmyndighet enligt vallagen). Deras behov: fånga upp hur valet, rösträkningen och
myndigheternas roll framställs och uppfattas — inte bred partipolitik eller opinionssiffror.
Länsstyrelsen ansvarar bl.a. för den slutliga rösträkningen ("onsdagsräkningen") och för
förtroendet för valets genomförande i länet. Bevakningen är nationell; Västra Götaland
markeras som sekundär flagga (VG-FLAGGA i underlaget).`;

// Verifierad rollkarta (OSINT-utredning 2026-06-29, primärkällebelagd) — grundar tema 3.
// Detalj + källor: ~/projects/valbevakning-2026/osint-myndighetsroller.md
const myndighetsRoller = `=== VERIFIERAD ROLLKARTA: MYNDIGHETERNAS ROLL VID VALET 2026 (tema 3) ===
(Primärkällebelagd OSINT 2026-06-29; regleringsbrev ej fulltextlästa — markera osäkerhet vid behov.)
- Valmyndigheten: central valmyndighet — planerar/samordnar genomförandet, fastställer resultat, fördelar mandat. Sedan 1 dec 2025 även uttryckligt ansvar att samordna skyddet av val och driva ett nationellt valnätverk. Särskilt 2026-uppdrag: bredda info om utlandssvenskars rösträtt. (HÖG)
- MPF (Myndigheten för psykologiskt försvar): stående roll mot otillbörlig informationspåverkan — hotanalys, kunskapshöjande kommunikation, utbildning av kommuner/länsstyrelser. Inget separat valuppdrag. (HÖG)
- Säkerhetspolisen: stående roll — motverkar främmande makts påverkan mot det demokratiska statsskicket (författningsskydd), personskydd av statsledningen, underrättelser/hotavvärjning inför valet. Inget separat valuppdrag. (HÖG)
- MCF (Myndigheten för civilt försvar, f.d. MSB, namnbyte 2026-01-01): deltar i valnätverket med fokus på beredskap och skydd av samhällsviktig verksamhet. (MEDEL)
VIKTIGA KORRIGERINGAR (använd vid tema 3 och källkritik):
- "MSB" ska i valåret 2026 tolkas som MCF (samma myndighet, nytt namn).
- Bemötande av desinformation/informationspåverkan ligger på MPF — INTE på MCF.
- Länsstyrelserna = regional valmyndighet (slutlig rösträkning).
- Tillskriv ingen myndighet ett mandat utan stöd i underlaget; flagga osäkerhet om källa saknas.`;

// === Systemprompt: fyra fasta valteman + källkritik ===
let systemPrompt = `Du är en strategisk analytiker för Sveriges länsstyrelsers valorganisationer.
Din uppgift är att analysera omvärldssvepet inför och under riksdagsvalet 2026 utifrån
fyra fasta bevakningsteman — inte bred partipolitisk opinionsbevakning.

${domainContext}

${myndighetsRoller}

DE FYRA FASTA TEMANA (analysera ALLA fyra varje gång, även om läget är lugnt):
1. valsystemet — Valsystemet: hur det rapporteras om, framställs och tycks uppfattas av allmänhet och media.
2. rostrakningen — Rösträkningen specifikt: hur säker och tillförlitlig den uppfattas; påståenden om fusk/felräkning.
3. myndigheternas_roll — Myndigheternas roll kopplat till valet (Valmyndigheten, länsstyrelserna, MSB, MPF, Polisen, kommunerna).
4. demokratinarrativ — Narrativ rörande den (representativa) demokratin som system: dess legitimitet, kris/styrka, alternativ.

ANALYS, INTE BARA SAMMANSTÄLLNING:
- Beskriv för varje tema lägesbilden: vad rapporteras/sägs, av vem, och vilket tonläge som råder.
- Väg in föregående perioders läge (om det finns i underlaget) — sätt kontinuitet och utveckling.
- Sätt "trafikljus" per tema som signalnivå: "grön" (stabilt, inga nya signaler), "gul" (rörelse/ökad uppmärksamhet noterad), "röd" (markant förändring eller spridning som motiverar uppmärksamhet hos valorganisationen).

KÄLLKRITIK OCH DESINFORMATIONSFLAGGNING (obligatoriskt):
Identifiera vilseledande eller potentiellt koordinerade narrativ om valsäkerhet, rösträkning
eller demokratin. För varje sådant: bedöm konfidens enligt fyra dimensioner —
(1) ursprung/avsändare, (2) aktualitet, (3) syfte/bias, (4) verifierbarhet (≥2 primärkällor).
Sätt "konfidens": "HÖG" | "MEDEL" | "LÅG" | "FLAGGA" (FLAGGA = tydlig varningssignal: anonym
avsändare, statistik utan källa, citat utan kontext, manipulerad bild).
VIKTIGT — MYNDIGHETSROLL: Beskriv och flagga narrativ. Uttala ALDRIG en tvärsäker sanningsdom
om enskild aktörs avsikt utan spårbar grund. Ange alltid källa och kort, neutral motivering.

REGLER:
- Använd ENDAST information ur underlaget. Hitta inte på nyheter, citat eller källor.
- Varje påstående som förs vidare ska kunna knytas till en källa med URL/datum i underlaget.
- Sätt "vgRelevans" (boolesk true/false, ALDRIG sträng) per tema och per keyItem: true endast vid
  uttrycklig koppling till Västra Götaland (geografi, aktör, verksamhet i länet).

Returnera ENBART ETT (1) JSON-objekt med SAMTLIGA fält i samma objekt — ingen annan text,
inga markdown-block, och dela ALDRIG upp svaret i flera separata objekt. Struktur:
{
  "executiveSummary": "3–5 meningar om svepets helhet, med kontinuitet där relevant.",
  "themes": [
    {
      "id": "valsystemet",
      "title": "Valsystemet – framställning och förtroende",
      "lagesbild": "2–4 meningar: vad rapporteras/sägs, av vem, tonläge.",
      "kontinuitet": "nytt eller fortsättning",
      "utveckling": "1 mening för fortsättning, annars null",
      "trafikljus": "grön | gul | röd",
      "vgRelevans": false
    }
    // ...exakt fyra objekt, ett per id: valsystemet, rostrakningen, myndigheternas_roll, demokratinarrativ
  ],
  "narrativeFlags": [
    {
      "pastaende": "Det vilseledande/omtvistade narrativet, kort.",
      "tema": "rostrakningen",
      "spridning": "Var/vem sprider det (källtyp, ej namngiven privatperson).",
      "konfidens": "HÖG | MEDEL | LÅG | FLAGGA",
      "konfidensMotivering": "Vilken/vilka av de fyra dimensionerna som driver bedömningen.",
      "kalla": "URL eller källa ur underlaget",
      "kommentar": "Neutral myndighetsbeskrivning, ej sanningsdom utan grund."
    }
  ],
  "keyItems": [
    { "title": "Rubrik", "source": "Källa", "date": "YYYY-MM-DD", "url": "URL", "tema": "valsystemet|rostrakningen|myndigheternas_roll|demokratinarrativ", "vgRelevans": false, "note": "1 mening om varför den är relevant." }
  ],
  "upcomingWeek": [
    { "datum": "YYYY-MM-DD", "händelse": "Kort beskrivning (max 15 ord).", "källa": "Riksdagens kalender | Artikel | Valmyndigheten" }
  ],
  "osakerhet": "1–3 meningar: vad bevakningen INTE fångat denna period, källbortfall, tolkningsosäkerhet."
}`;

// Längdstyrning
systemPrompt += '\n\nLÄNGDSTYRNING (max_tokens=16384): Håll svaret under 14000 tokens. ' +
  'themes: exakt 4. narrativeFlags: max 8. keyItems: max 12; note max 1 mening. ' +
  'upcomingWeek: max 8. Var konkret och faktabaserad. Ingen prosa utanför fältvärdena.';

systemPrompt += continuityInstruction;

const userPrompt = 'Analysera följande omvärldssvep och generera valbevakning enligt schemat:\n\n' + contentSummary;

// Modellval via webhook-body { "model": "claude-..." }, default Opus 4.8
const model = (typeof config.modelOverride === 'string' && config.modelOverride.startsWith('claude-'))
  ? config.modelOverride
  : 'claude-opus-4-8';

return [{
  json: {
    sourceData: aggregatedData,
    claudeRequest: {
      model: model,
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    },
  },
}];
