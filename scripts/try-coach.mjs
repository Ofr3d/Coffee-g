// Throwaway: exercise the REAL coach end-to-end (engine → Gemini) with the two-cup
// acceptance test from COMPASS. Reads GEMINI_API_KEY from .env; never prints the key.
//   run:  node scripts/try-coach.mjs
import { readFileSync } from 'node:fs';
import { buildCoachMessages } from '../src/core/coach.js';

// --- load GEMINI_API_KEY from .env (gitignored), without echoing it ---
let key = process.env.GEMINI_API_KEY;
if (!key) {
  try {
    const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    const m = env.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/m);
    if (m) key = m[1].replace(/^["']|["']$/g, '');
  } catch { /* no .env */ }
}
if (!key) {
  console.error('No GEMINI_API_KEY found (set it in .env or the environment). Aborting.');
  process.exit(1);
}

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function ask(label, session) {
  const { system, user } = buildCoachMessages({ session });
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    }),
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('').trim();
  console.log(`\n━━━ ${label} ━━━`);
  if (!res.ok) { console.log('HTTP', res.status, JSON.stringify(data).slice(0, 300)); return; }
  console.log(text || `(no text — finishReason: ${data?.candidates?.[0]?.finishReason || '?'})`);
}

// CUP 1 — a flaw: sour AND ground coarse on a V60 → should diagnose under-extraction + give a fix.
await ask('CUP 1 — sour + coarse (expect: fix it)', {
  bean: { name: 'Torebadiya', origin: 'Ethiopia', process: 'Washed' },
  method: 'V60', vessel: 'V60-02',
  parameters: { dose: '15', temp: '93', grind: '32', grind_device: 'Comandante', total_yield: 250 },
  impression: { verdict: 'enjoyed_but', descriptors: ['sour', 'sharp', 'hollow'], disliked: 'sharp and a bit hollow' },
});

// CUP 2 — a preference: sensible in-range espresso, user dislikes a bright/acidic note →
// should say it's likely the bean, not a mistake, and NOT invent a fix.
await ask('CUP 2 — in-range but disliked (expect: it\'s the bean, not you)', {
  bean: { name: 'Kayon Mountain', origin: 'Ethiopia', process: 'Natural' },
  method: 'Espresso',
  parameters: { dose: '18', yield: '36', time: '28', grind: '12', grind_device: 'Niche Zero' },
  impression: { verdict: 'not_enjoyed', descriptors: ['citrusy', 'berry'], disliked: 'pulled well and even, but I just don\'t enjoy this bright berry acidity' },
});

console.log('');
