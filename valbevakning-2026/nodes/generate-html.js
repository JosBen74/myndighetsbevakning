// Generate HTML Email (Val 2026) — fyra tema-kort + trafikljus + kontinuitet + källkritik.
// Ersätter "Generate HTML Email". Table-baserad layout, LST grafisk profil (samma som
// civiltforsvar-/beredskapssektorer-breven). Returnerar {html, subject, shouldSendEmail, debug}.

const data = $json;
const insights = data.aiInsights || {};
const config = $('Detect Execution Mode').first().json;

const executiveSummary = insights.executiveSummary || 'Ingen sammanfattning tillgänglig.';
const themes = insights.themes || [];
const narrativeFlags = insights.narrativeFlags || [];
const keyItems = insights.keyItems || [];
const upcoming = insights.upcomingWeek || [];
const osakerhet = insights.osakerhet || '';

let unavailableSources = [];
try { unavailableSources = $('Aggregate All Results').first().json.unavailableSources || []; } catch (e) {}

// === Färgpalett (LST-profil) ===
const C = {
  primary: '#004B87', gold: '#E4B363', bg: '#EAEEF2', white: '#FFFFFF',
  cardBg: '#F0F4F8', text: '#1a1a1a', textMuted: '#555555', textLight: '#999999',
  border: '#E0E0E0',
  gron: '#2E7D32', gul: '#F57F17', rod: '#C62828', lila: '#6A1B9A', gra: '#777777',
};
const serif = "Georgia,'Times New Roman',serif";
const sans = "Arial,Helvetica,sans-serif";

function sectionHeader(num, title, count) {
  const countHtml = count !== undefined
    ? ` <span style="font-family:${sans};font-size:12px;color:${C.textLight};">(${count})</span>` : '';
  return `
    <tr><td style="padding:36px 40px 0 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="height:1px;background-color:${C.border};font-size:1px;line-height:1px;">&nbsp;</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 40px 16px 40px;">
      <span style="font-family:${serif};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.primary};">${String(num).padStart(2,'0')}</span>
      <span style="font-family:${serif};font-size:11px;letter-spacing:2px;color:${C.textLight};"> — </span>
      <span style="font-family:${serif};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.primary};">${title}</span>${countHtml}
    </td></tr>`;
}
function emptySection(text) {
  return `<p style="font-family:${sans};font-size:14px;color:${C.textLight};font-style:italic;margin:0;padding:4px 0;">${text}</p>`;
}
function linkButton(url, text) {
  if (url && url.indexOf('//') === 0) url = 'https:' + url;
  return `<a href="${url}" target="_blank" style="font-family:${sans};font-size:13px;color:${C.primary};text-decoration:none;border-bottom:1px solid ${C.primary};">${text} &#8594;</a>`;
}
function badge(color, bg, text) {
  return `<span style="display:inline-block;font-family:${sans};font-size:10px;letter-spacing:1px;font-weight:600;color:${color};background-color:${bg};padding:2px 8px;margin-left:6px;">${text}</span>`;
}
function vgBadge(flag) { return flag ? badge('#013452', C.gold, 'VG') : ''; }

// Trafikljus → färg + symbol
function trafik(v) {
  const t = (v || '').toLowerCase();
  if (t === 'röd' || t === 'rod' || t === 'red') return { color: C.rod, dot: '&#128308;', label: 'RÖD' };
  if (t === 'gul' || t === 'yellow') return { color: C.gul, dot: '&#128993;', label: 'GUL' };
  return { color: C.gron, dot: '&#128994;', label: 'GRÖN' };
}
function kontBadge(k) {
  return (k === 'fortsättning' || k === 'fortsattning')
    ? badge('#FFFFFF', C.lila, '&#8634; FORTSÄTTNING')
    : badge('#FFFFFF', C.primary, 'NYTT');
}
// Konfidens → badge (källkritik)
function konfBadge(k) {
  const map = {
    'HÖG': [C.gron, '#E6F4EA'], 'HOG': [C.gron, '#E6F4EA'],
    'MEDEL': [C.gul, '#FFF3D9'], 'LÅG': [C.gra, '#EEEEEE'], 'LAG': [C.gra, '#EEEEEE'],
    'FLAGGA': ['#FFFFFF', C.rod],
  };
  const key = (k || '').toUpperCase();
  const [color, bg] = map[key] || [C.gra, '#EEEEEE'];
  const prefix = key === 'FLAGGA' ? '&#9888; ' : '';
  return `<span style="display:inline-block;font-family:${sans};font-size:10px;letter-spacing:1px;font-weight:700;color:${color};background-color:${bg};padding:2px 8px;">${prefix}${key || 'OKÄND'}</span>`;
}

const TITLES = {
  valsystemet: 'Valsystemet – framställning och förtroende',
  rostrakningen: 'Rösträkningen – säkerhet och tillförlitlighet',
  myndigheternas_roll: 'Myndigheternas roll i valet',
  demokratinarrativ: 'Narrativ om demokratin som system',
};

// === Bygg HTML ===
let html = `<!DOCTYPE html>
<html lang="sv" xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Valbevakning 2026</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]--></head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:${serif};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${C.bg};">
  <tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;width:100%;background-color:${C.white};">
    <!-- HEADER -->
    <tr><td style="background-color:${C.primary};padding:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="height:4px;background-color:${C.gold};font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="padding:32px 40px 10px 40px;"><span style="font-family:${serif};font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:${C.gold};">Länsstyrelsen — valorganisationen</span></td></tr>
        <tr><td style="padding:0 40px 6px 40px;">
          <span style="font-family:${serif};font-size:28px;font-weight:bold;color:${C.white};line-height:1.2;">Valbevakning 2026</span>
          <span style="font-family:${serif};font-size:28px;color:rgba(255,255,255,0.45);"> — </span>
          <span style="font-family:${serif};font-size:28px;font-style:italic;color:rgba(255,255,255,0.85);">${config.dailyMode ? 'daglig radar' : 'lägesbild'}</span>
        </td></tr>
        <tr><td style="padding:0 40px 28px 40px;"><span style="font-family:${sans};font-size:14px;color:rgba(255,255,255,0.55);">${config.dailyMode ? 'Dygnsfönster' : 'Period'}: ${config.dateFrom} — ${config.dateTo}</span></td></tr>
      </table>
    </td></tr>`;

// 01 SAMMANFATTNING
html += `
    <tr><td style="padding:32px 40px 0 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="padding-bottom:16px;">
          <span style="font-family:${serif};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.primary};">01</span>
          <span style="font-family:${serif};font-size:11px;letter-spacing:2px;color:${C.textLight};"> — </span>
          <span style="font-family:${serif};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.primary};">Sammanfattning</span>
        </td></tr>
        <tr><td style="background-color:${C.cardBg};border-left:4px solid ${C.primary};padding:24px 28px;">
          <p style="font-family:${serif};font-size:16px;line-height:1.7;color:${C.text};margin:0;">${executiveSummary}</p>
        </td></tr>
      </table>
    </td></tr>`;

// 02 DE FYRA TEMANA
html += sectionHeader(2, 'De fyra temana', themes.length);
html += `<tr><td style="padding:0 40px;">`;
if (themes.length > 0) {
  themes.forEach(t => {
    const tl = trafik(t.trafikljus);
    const title = t.title || TITLES[t.id] || t.id || 'Tema';
    const utv = (t.utveckling && t.utveckling !== 'null')
      ? `<p style="font-family:${sans};font-size:13px;color:${C.textMuted};margin:8px 0 0 0;"><strong>Sedan förra perioden:</strong> ${t.utveckling}</p>` : '';
    html += `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
      <tr><td style="border-left:4px solid ${tl.color};background-color:${C.cardBg};padding:16px 20px;">
        <span style="font-size:15px;">${tl.dot}</span>
        <span style="font-family:${serif};font-size:17px;font-weight:bold;color:${C.text};">${title}</span>
        ${kontBadge(t.kontinuitet)}${vgBadge(t.vgRelevans)}
        <p style="font-family:${serif};font-size:15px;line-height:1.6;color:${C.text};margin:10px 0 0 0;">${t.lagesbild || ''}</p>
        ${utv}
      </td></tr>
    </table>`;
  });
} else {
  html += emptySection('Inga teman genererade denna period.');
}
html += `</td></tr>`;

// 03 KÄLLKRITIK / FLAGGADE NARRATIV
html += sectionHeader(3, 'Källkritik — flaggade narrativ', narrativeFlags.length);
html += `<tr><td style="padding:0 40px;">`;
if (narrativeFlags.length > 0) {
  narrativeFlags.forEach(f => {
    const isFlag = (f.konfidens || '').toUpperCase() === 'FLAGGA';
    const bc = isFlag ? C.rod : C.gold;
    html += `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
      <tr><td style="border-left:4px solid ${bc};background-color:${C.cardBg};padding:16px 20px;">
        ${konfBadge(f.konfidens)}
        <p style="font-family:${serif};font-size:15px;font-weight:bold;color:${C.text};margin:8px 0 6px 0;">${f.pastaende || ''}</p>
        <p style="font-family:${sans};font-size:13px;color:${C.textMuted};margin:0 0 4px 0;"><strong>Spridning:</strong> ${f.spridning || 'okänd'} &nbsp;·&nbsp; <strong>Tema:</strong> ${TITLES[f.tema] || f.tema || '—'}</p>
        <p style="font-family:${sans};font-size:13px;color:${C.textMuted};margin:0 0 4px 0;"><strong>Bedömning:</strong> ${f.konfidensMotivering || ''}</p>
        ${f.kommentar ? `<p style="font-family:${sans};font-size:13px;color:${C.text};margin:0 0 6px 0;">${f.kommentar}</p>` : ''}
        ${f.kalla ? linkButton(f.kalla, 'Källa') : ''}
      </td></tr>
    </table>`;
  });
} else {
  html += emptySection('Inga vilseledande narrativ flaggade denna period.');
}
html += `</td></tr>`;

// 04 NYCKELPOSTER
html += sectionHeader(4, 'Nyckelposter', keyItems.length);
html += `<tr><td style="padding:0 40px;">`;
if (keyItems.length > 0) {
  keyItems.forEach(it => {
    html += `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:10px;">
      <tr><td style="border-left:4px solid ${C.primary};background-color:${C.cardBg};padding:14px 18px;">
        <span style="font-family:${serif};font-size:15px;font-weight:bold;color:${C.text};">${it.title || ''}</span>${vgBadge(it.vgRelevans)}
        <p style="font-family:${sans};font-size:12px;color:${C.textLight};margin:4px 0 6px 0;">${it.source || ''}${it.date ? ' · ' + it.date : ''}${it.tema ? ' · ' + (TITLES[it.tema] || it.tema) : ''}</p>
        ${it.note ? `<p style="font-family:${sans};font-size:13px;color:${C.text};margin:0 0 6px 0;">${it.note}</p>` : ''}
        ${it.url ? linkButton(it.url, 'Läs') : ''}
      </td></tr>
    </table>`;
  });
} else {
  html += emptySection('Inga nyckelposter denna period.');
}
html += `</td></tr>`;

// 05 INKOMMANDE
html += sectionHeader(5, 'Inkommande', upcoming.length);
html += `<tr><td style="padding:0 40px;">`;
if (upcoming.length > 0) {
  upcoming.forEach(ev => {
    html += `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
      <tr><td style="border-left:4px solid ${C.gold};background-color:#FFF8E1;padding:16px 20px;">
        <span style="display:inline-block;font-family:${serif};font-size:14px;font-weight:bold;color:${C.text};background:#FFFFFF;padding:2px 10px;">${ev.datum || ''}</span>
        <span style="font-family:${sans};font-size:15px;color:${C.text};padding-left:12px;">${ev.händelse || ev.handelse || ''}</span>
        <p style="font-family:${sans};font-size:12px;color:${C.textLight};margin:6px 0 0 0;font-style:italic;">${ev.källa || ev.kalla || ''}</p>
      </td></tr>
    </table>`;
  });
} else {
  html += emptySection('Inga kända händelser kommande period.');
}
html += `</td></tr>`;

// 06 OSÄKERHET (REPORT-VALIDATOR)
html += sectionHeader(6, 'Osäkerhet', undefined);
html += `<tr><td style="padding:0 40px;">`;
html += `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="border-left:4px solid ${C.gra};background-color:#F5F5F5;padding:16px 20px;">
  <p style="font-family:${sans};font-size:13px;line-height:1.6;color:${C.textMuted};margin:0;">${osakerhet || 'Ingen särskild osäkerhet noterad.'}</p>
</td></tr></table>`;
html += `</td></tr>`;

// FOOTER + AI-deklaration
const unavailNotice = unavailableSources.length
  ? `<p style="font-family:${sans};font-size:12px;color:${C.gold};margin:0 0 8px 0;">&#9888; Källor otillgängliga denna period: ${unavailableSources.join(', ')}</p>` : '';
html += `
    <tr><td style="padding:40px 40px 0 40px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="height:1px;background-color:${C.border};font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr>
    <tr><td style="background-color:${C.primary};padding:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="height:3px;background-color:${C.gold};font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="padding:24px 40px;">
        ${unavailNotice}<p style="font-family:${sans};font-size:12px;color:rgba(255,255,255,0.6);margin:0 0 4px 0;">AI-genererad lägesbild — fyra teman, källkritik enligt OSINT-ram. Verifiera mot primärkälla före vidare spridning.</p>
        <p style="font-family:${sans};font-size:12px;color:rgba(255,255,255,0.4);margin:0;">${new Date().toLocaleString('sv-SE')} · Modell: ${(data.metadata && data.metadata.model) || 'Claude'} · Valbevakning 2026</p>
      </td></tr></table>
    </td></tr>
  </table>
  </td></tr>
</table>
</body>
</html>`;

return [{
  json: {
    html: html,
    subject: config.dailyMode
      ? `Valbevakning 2026 — daglig radar ${config.dateTo}`
      : `Valbevakning 2026 — ${config.dateFrom} till ${config.dateTo}`,
    shouldSendEmail: config.shouldSendEmail,
    debug: {
      themesCount: themes.length,
      narrativeFlagsCount: narrativeFlags.length,
      keyItemsCount: keyItems.length,
      upcomingCount: upcoming.length,
    },
  },
}];
