// ─────────────────────────────────────────────────────────────────────────────
// Coffee G — the descriptor word bank (impression layer, item 4.3)
//
// OUR OWN curated list of plain sensory words, offered for when a taster can't
// find the words themselves. The WCR Lexicon / SCA Flavor Wheel are REFERENCE
// ONLY — they carry a no-derivatives license, so we seed our own vocabulary and
// never ship theirs verbatim. (See memory: reference_flavor_lexicon_sources.)
//
// Each word carries an INTERNAL `hint`, used ONLY by the coach engine to reason
// about the flaw-vs-preference fork. It is never shown to the user, and the user
// is never asked to classify their own words — that classification IS the coach's
// job, and handing it to the beginner would betray the whole product. The user
// just picks the words that fit; the coach decides what they mean.
//
//   flaw      → usually points to a fixable brewing problem (when brewed off-range)
//   character → usually the bean being itself, not a mistake
//   body      → mouthfeel / texture (neutral; meaning depends on context)
// ─────────────────────────────────────────────────────────────────────────────

export const LEXICON = [
  // taste (flaw-leaning)
  { word: 'sour',       hint: 'flaw' },
  { word: 'sharp',      hint: 'flaw' },
  { word: 'bitter',     hint: 'flaw' },
  { word: 'harsh',      hint: 'flaw' },
  { word: 'astringent', hint: 'flaw' },
  { word: 'drying',     hint: 'flaw' },
  { word: 'weak',       hint: 'flaw' },
  { word: 'watery',     hint: 'flaw' },
  { word: 'flat',       hint: 'flaw' },
  { word: 'hollow',     hint: 'flaw' },
  { word: 'muddled',    hint: 'flaw' },
  { word: 'ashy',       hint: 'flaw' },

  // body / mouthfeel (neutral)
  { word: 'thin',       hint: 'body' },
  { word: 'thick',      hint: 'body' },
  { word: 'heavy',      hint: 'body' },
  { word: 'juicy',      hint: 'body' },
  { word: 'creamy',     hint: 'body' },
  { word: 'clean',      hint: 'body' },
  { word: 'silky',      hint: 'body' },

  // character / notes (bean identity)
  { word: 'fruity',     hint: 'character' },
  { word: 'berry',      hint: 'character' },
  { word: 'citrusy',    hint: 'character' },
  { word: 'floral',     hint: 'character' },
  { word: 'winey',      hint: 'character' },
  { word: 'chocolatey', hint: 'character' },
  { word: 'nutty',      hint: 'character' },
  { word: 'caramel',    hint: 'character' },
  { word: 'earthy',     hint: 'character' },
  { word: 'spicy',      hint: 'character' },
  { word: 'herbal',     hint: 'character' },
  { word: 'tropical',   hint: 'character' },
];

// Neutral display groupings for the picker UI — the labels the USER sees.
// These say nothing about flaw vs. character; they just help the eye scan.
export const LEXICON_GROUPS = [
  { hint: 'flaw',      label: 'Taste' },
  { hint: 'body',      label: 'Body' },
  { hint: 'character', label: 'Notes' },
];

const HINT_BY_WORD = Object.fromEntries(LEXICON.map(e => [e.word, e.hint]));

// Internal — the coach's read of a word. Unknown / free-typed words return null,
// and the coach simply reasons from the raw word + brew context instead.
export function hintFor(word) {
  if (!word) return null;
  return HINT_BY_WORD[String(word).toLowerCase()] || null;
}
