// Thin transport shell for the coach. Its only jobs: guard the API key, call the
// LLM, return the text. All coffee judgment lives in the shared engine (src/core/coach.js),
// which is provider-agnostic — so swapping the LLM provider only touches THIS file.
import { buildCoachMessages } from '../../src/core/coach.js';

// The hard flaw-vs-preference call deserves the capable tier. Flip to 'gemini-2.5-flash'
// for cost; a true cheap/premium router stays deferred until there's volume (see COMPASS).
const MODEL = 'gemini-2.5-pro';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const ok   = (suggestion) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suggestion }) });
const fail = (statusCode) => ({ statusCode, body: JSON.stringify({ suggestion: null }) });

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail(405);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return ok(null); // no key configured → degrade quietly, never crash

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return fail(400);
  }
  if (!payload.session) return ok(null);

  const { system, user } = buildCoachMessages(payload);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        // Headroom for 2.5's thinking tokens; the prompt itself keeps the answer to ~3 sentences.
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      }),
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text).filter(Boolean).join('').trim();
    return ok(text || null); // blocked/empty candidate → quiet null, the UI handles it
  } catch {
    return ok(null); // network/LLM hiccup → quiet null
  }
};
