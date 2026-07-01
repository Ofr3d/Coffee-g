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

// The coach's read of a taste word FOR THE FORK. Flaw-leaning words carry their
// "classic cause BUT could be the bean" framing so the model never auto-assumes a
// flaw; character words are flagged as usually the bean, not a mistake. This is the
// engine's own judgment (kept here, not imported) — the UI lexicon's hint is separate.
export const DESCRIPTOR_MEANING = {
  // taste (flaw-leaning) — always paired with the "could be the bean" escape hatch
  sour:       'sour/sharp — classically under-extraction, BUT can also be a bright, acidic bean tasting exactly as it should',
  sharp:      'sharp/acidic — often under-extraction, BUT can be a bright bean showing its natural acidity',
  bitter:     'bitter — classically over-extraction, BUT some dark roasts simply read bitter to certain palates',
  harsh:      'harsh — usually over-extraction or water too hot, occasionally just a very dark roast',
  astringent: 'mouth-drying/puckering — usually over-extraction or water too hot',
  drying:     'drying — usually over-extraction or too-hot water',
  weak:       'weak — usually under-dosed, ground too coarse, or too little contact time',
  watery:     'watery/thin — usually under-dosed or ground too coarse',
  flat:       'flat/lifeless — often stale beans or uneven extraction',
  hollow:     'hollow — often under-developed extraction',
  muddled:    'muddled/unclear — usually uneven extraction (inconsistent grind or distribution)',
  ashy:       'ashy — over-extraction, or a very dark/roasty bean',
  // body / mouthfeel (neutral — context decides)
  thin:       'thin body — can be under-extraction/low dose, or simply a light, delicate bean',
  // character — usually the bean being itself, not a mistake
  fruity:     'fruity — typically the bean\'s character, not a mistake',
  berry:      'berry notes — the bean\'s character',
  citrusy:    'citrusy — the bean\'s bright character, not necessarily a flaw',
  floral:     'floral — the bean\'s character',
  winey:      'winey — typical of natural process / some varietals; the bean\'s character',
  chocolatey: 'chocolatey — the bean\'s character (common in Latin American and darker roasts)',
  nutty:      'nutty — the bean\'s character',
  caramel:    'caramel/sweet — usually a sign of good extraction and/or the bean\'s character',
  earthy:     'earthy — the bean\'s character (some naturals, wet-hulled Sumatrans, etc.)',
  spicy:      'spicy — the bean\'s character',
  herbal:     'herbal — the bean\'s character',
  tropical:   'tropical fruit — the bean\'s character',
};

// How the enjoyment verdict frames the whole read.
export const VERDICT_LINE = {
  enjoyed:     'They ENJOYED this cup.',
  not_enjoyed: 'They did NOT enjoy this cup.',
  enjoyed_but: 'They enjoyed it BUT something felt off — THE key case: decide whether that "off" is a fixable flaw or simply the bean\'s character.',
};

export const SYSTEM_PROMPT = `You are Coffee G's dialing coach — a warm, honest friend who knows coffee. Your one job is to help the user tell whether what they taste is a FIXABLE BREWING FLAW or a GENUINE PREFERENCE about the bean. Getting this fork right is everything.

Think in this order:
1. First judge whether the brewing parameters already sit in a SENSIBLE RANGE for this method (grind relative to the named grinder, dose, ratio, temperature, contact time). Reason about the grinder by its name and character — never quote absolute click numbers you cannot know.
2. If a parameter is clearly off and explains the taste → name the ONE specific, concrete adjustment that fixes it ("grind a few clicks finer", "drop to 91°C", "extend the bloom"). This is objective competence — lead with it, because it earns trust.
3. If the parameters already look sensible and the cup still isn't to their liking → say so honestly: this is most likely brewed correctly, and the flavour is probably the bean's character, not a mistake of theirs. Gently suggest a different bean/roast rather than chasing a fix that isn't there. This is the moment that saves them money and frustration.
4. If they enjoyed it (or it reads balanced/good) → tell them to change nothing and enjoy it. Do NOT invent an experiment. Only suggest exploring further if their history shows they clearly want to push.

You are given an enjoyment verdict (enjoyed / didn't enjoy / enjoyed-but) and, optionally, the plain words they used and what they liked/disliked. Those words may be FLAWS or the bean's CHARACTER — telling them apart is your job, never theirs. "Enjoyed but…" is the case that matters most.

Hard rules:
- Be honest about certainty. If you're inferring from general coffee knowledge rather than their real data, say so plainly. Never fake precision.
- Judge only what they actually gave you. Do not assume unstated parameters, and never treat a lack of logged history as inexperience — they may be a seasoned brewer new to the app.
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
  const imp = s.impression || {};

  // Recent enjoyment pattern (verdict, falling back to a legacy outcome word).
  const recentVerdicts = (recentSessions || [])
    .slice(0, 5).map(r => r.impression?.verdict || r.outcome).filter(Boolean).join(', ');
  const identitySummary = Object.entries(tasteIdentity || {})
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} (${v}x)`)
    .join(', ');

  // Descriptors: from the impression, or a legacy single outcome word.
  const descriptors = (imp.descriptors || (s.outcome ? [s.outcome] : [])).filter(Boolean);
  const descriptorLines = descriptors
    .map(d => DESCRIPTOR_MEANING[String(d).toLowerCase()])
    .filter(Boolean)
    .map(m => `\n  · ${m}`)
    .join('');
  const descriptorBlock = descriptors.length
    ? `\nWords they used: ${descriptors.join(', ')}${descriptorLines}`
    : '';

  const verdict = imp.verdict
    ? `\nHow they felt: ${VERDICT_LINE[imp.verdict] || imp.verdict}`
    : (descriptors.length ? '' : '\nNot tasted yet — they want a read before brewing.');

  const liked    = imp.liked    ? `\nWhat they liked: ${imp.liked}`       : '';
  const disliked = imp.disliked ? `\nWhat they didn't like: ${imp.disliked}` : '';

  const user = `Bean: ${describeBean(s.bean)}
Method: ${s.method || 'unknown'}${s.vessel ? ` (${s.vessel})` : ''}
Parameters:
${renderParams(s.parameters) || '(none given)'}${verdict}${descriptorBlock}${liked}${disliked}
${s.notes ? `Their notes: ${s.notes}` : ''}

Recent verdicts: ${recentVerdicts || 'none logged in this app yet (they may be an experienced brewer)'}
Their taste pattern so far: ${identitySummary || 'none logged in this app yet'}

Give your one warm, honest read.`;

  return { system: SYSTEM_PROMPT, user };
}
