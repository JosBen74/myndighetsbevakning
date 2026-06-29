// Parse Synthesis Response (Val 2026) — robust mot att modellen delar svaret i flera
// top-level JSON-objekt (`}\n{`). Ersätter "Parse Synthesis Response".
// Strategi: 1) JSON.parse rakt av. 2) annars extrahera alla balanserade top-level-objekt
// och Object.assign:a ihop dem. 3) annars fallback. Defaultar val-fälten.
const claudeResponse = $json;
const sourceData = $('Prepare Synthesis Request').first().json.sourceData;

// Hitta alla balanserade top-level {...}-objekt (strängmedveten brace-scan).
function extractObjects(text) {
  const objs = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') { depth--; if (depth === 0 && start >= 0) { objs.push(text.slice(start, i + 1)); start = -1; } }
  }
  return objs;
}

try {
  let aiText = claudeResponse.content[0].text.trim();
  if (aiText.startsWith('```')) aiText = aiText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

  let insights = null;
  try {
    insights = JSON.parse(aiText);
  } catch (e) {
    // Modellen kan ha delat svaret i flera top-level-objekt → slå ihop dem.
    const parts = extractObjects(aiText);
    if (parts.length) {
      const merged = {};
      let any = false;
      for (const p of parts) {
        try { Object.assign(merged, JSON.parse(p)); any = true; } catch (e2) { /* hoppa trasig del */ }
      }
      if (any) insights = merged;
    }
  }
  if (!insights || typeof insights !== 'object') {
    insights = { executiveSummary: 'Kunde inte parsa AI-svaret korrekt.' };
  }

  // Default val-fälten
  insights.themes = insights.themes || [];
  insights.narrativeFlags = insights.narrativeFlags || [];
  insights.keyItems = insights.keyItems || [];
  insights.upcomingWeek = insights.upcomingWeek || [];
  insights.osakerhet = insights.osakerhet || '';

  // Tvinga vgRelevans till äkta boolesk (AI kan returnera strängen "false").
  ['themes', 'keyItems'].forEach(k => (insights[k] || []).forEach(it => {
    if (it && typeof it === 'object') it.vgRelevans = it.vgRelevans === true || it.vgRelevans === 'true';
  }));

  return [{
    json: {
      success: true,
      executionTime: sourceData.executionTime,
      sourceData: sourceData.sources,
      aiInsights: insights,
      metadata: {
        model: claudeResponse.model || 'claude-opus-4-8',
        stopReason: claudeResponse.stop_reason,
        tokensUsed: claudeResponse.usage,
      },
    },
  }];
} catch (error) {
  return [{
    json: {
      success: false,
      error: error.message,
      executionTime: sourceData.executionTime,
      sourceData: sourceData.sources,
      aiInsights: {
        executiveSummary: 'Fel vid AI-analys: ' + error.message,
        themes: [], narrativeFlags: [], keyItems: [], upcomingWeek: [], osakerhet: '',
      },
    },
  }];
}
