// ─────────────────────────────────────────────────────────────────────────────
// Coffee G — THE COACH ENGINE
//
// This is the coach's brain: the flaw-vs-preference fork that IS the product.
// It is PURE and dependency-free (no network, no Node, no DOM) so the SAME engine
// powers the serverless coach, the tests, and any future client-side intent.
// One engine, three faces — never fragment this per feature.
//
// Transport (the Netlify function) depends on this. This depends on nothing.
// ─────────────────────────────────────────────────────────────────────────────

export const OUTCOME_MEANING = {
  sour:       'tastes sour/sharp — classically under-extraction, BUT can also be a bright, acidic bean tasting exactly as it should',
  bitter:     'tastes bitter — classically over-extraction, BUT some dark roasts simply read bitter to certain palates',
  weak:       'tastes weak/watery — usually under-dosed, ground too coarse, or too little contact time',
  strong:     'tastes too strong/intense — usually over-dosed or ground too fine',
  astringent: 'mouth-drying/puckering — usually over-extraction or water too hot',
  muddled:    'muddled/unclear — usually uneven extraction (inconsistent grind or poor distribution)',
  balanced:   'tasted balanced — the cup is good',
};

export const SYSTEM_PROMPT = `You are Coffee G's dialing coach — a warm, honest friend who knows coffee. Your one job is to help the user tell whether what they taste is a FIXABLE BREWING FLAW or a GENUINE PREFERENCE about the bean. Getting this fork right is everything.

Think in this order:
1. First judge whether the brewing parameters already sit in a SENSIBLE RANGE for this method (grind relative to the named grinder, dose, ratio, temperature, contact time). Reason about the grinder by its name and character — never quote absolute click numbers you cannot know.
2. If a parameter is clearly off and explains the taste → name the ONE specific, concrete adjustment that fixes it ("grind a few clicks finer", "drop to 91°C", "extend the bloom"). This is objective competence — lead with it, because it earns trust.
3. If the parameters already look sensible and the cup still isn't to their liking → say so honestly: this is most likely brewed correctly, and the flavour is probably the bean's character, not a mistake of theirs. Gently suggest a different bean/roast rather than chasing a fix that isn't there. This is the moment that saves them money and frustration.
4. If the cup is balanced/good → tell them to change nothing and enjoy it. Do NOT invent an experiment. Only suggest exploring further if their history shows they clearly want to push.

Hard rules:
- Be honest about certainty. If you're inferring from general coffee knowledge rather than their real data, say so plainly. Never fake precision.
- Warm, calm, never salesy or naggy. You are on the user's side — happy to tell them to change nothing, or to spend less.
- At most 3 short sentences. Speak rarely and well.`;

function renderParams(parameters) {
  const p = parameters || {};
  return Object.entries(p)
    .filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => {
      if (k === 'pours' && Array.isArray(v)) {
        return `pours: ${v.map((x, i) => `#${i + 1} ${x.time || '?'}→${x.weight || '?'}g`).join(', ')}`;
      }
      return `${k}: ${v}`;
    })
    .join('\n');
}

function describeBean(bean) {
  if (!bean) return 'unknown bean';
  if (typeof bean === 'string') return bean;
  if (!bean.name) return 'unknown bean';
  return [
    bean.name,
    bean.origin ? `, ${bean.origin}` : '',
    bean.process ? `, ${bean.process} process` : '',
  ].join('');
}

// Pure: given the request payload, produce the { system, user } messages for the LLM.
// The serverless transport sends these as-is; tests assert on them directly.
export function buildCoachMessages({ session, tasteIdentity, recentSessions } = {}) {
  const s = session || {};
  const recentOutcomes = (recentSessions || [])
    .slice(0, 5).map(r => r.outcome).filter(Boolean).join(', ');
  const identitySummary = Object.entries(tasteIdentity || {})
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${v}x)`)
    .join(', ');

  const tasted = s.outcome
    ? `\nHow it tasted: ${s.outcome} — ${OUTCOME_MEANING[s.outcome] || ''}`
    : '\nNot tasted yet — they want a read before brewing.';

  const user = `Bean: ${describeBean(s.bean)}
Method: ${s.method || 'unknown'}${s.vessel ? ` (${s.vessel})` : ''}
Parameters:
${renderParams(s.parameters) || '(none given)'}${tasted}
${s.notes ? `Their notes: ${s.notes}` : ''}

Recent outcomes: ${recentOutcomes || 'first brew'}
Their taste pattern so far: ${identitySummary || 'no history yet'}

Give your one warm, honest read.`;

  return { system: SYSTEM_PROMPT, user };
}
