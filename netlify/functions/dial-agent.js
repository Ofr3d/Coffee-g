export default async (req) => {
  const { session, tasteIdentity, recentSessions } = await req.json();

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ suggestion: null }), { status: 200 });
  }

  const outcomeDescriptions = {
    sour:       'underextracted — acids extracted, sugars not fully dissolved',
    bitter:     'overextracted — too many bitter compounds pulled',
    weak:       'under-dosed or too coarse — not enough coffee or contact time',
    strong:     'over-dosed or too fine — too much coffee or over-concentrated',
    astringent: 'very overextracted or too hot — mouth-puckering dryness',
    muddled:    'uneven extraction — inconsistent particle size or poor distribution',
    balanced:   'well-extracted — hit the sweet spot',
  };

  const recentOutcomes = recentSessions.slice(0, 5).map(s => s.outcome).join(', ');
  const identitySummary = Object.entries(tasteIdentity)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${v}x)`)
    .join(', ');

  const prompt = `You are a precise, warm coffee dialing coach. Give ONE specific, actionable suggestion for the user's next brew. Be direct — name the exact adjustment (e.g. "grind 2 clicks finer", "drop to 91°C", "extend to 3:30"). No more than 2 sentences.

Current brew:
- Bean: ${session.bean || 'unknown'}
- Method: ${session.method}
- Dose: ${session.parameters.dose || '?'}g, Yield: ${session.parameters.yield || '?'}${session.method === 'Espresso' ? 'g' : 'ml'}, Time: ${session.parameters.time || '?'}
- Grind: ${session.parameters.grind || '?'} on ${session.parameters.grind_device || 'unknown grinder'}
- Temp: ${session.parameters.temp || '?'}°C
- Outcome: ${session.outcome} — ${outcomeDescriptions[session.outcome] || ''}
- Notes: ${session.notes || 'none'}

User history: recent outcomes — ${recentOutcomes || 'first brew'}
Taste pattern: ${identitySummary || 'no history yet'}`;

  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await res.json();
    const suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    return new Response(JSON.stringify({ suggestion }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ suggestion: null }), { status: 200 });
  }
};

export const config = { path: '/.netlify/functions/dial-agent' };
