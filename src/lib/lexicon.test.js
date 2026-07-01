import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEXICON, LEXICON_GROUPS, hintFor } from './lexicon.js';

test('every word is unique and carries a valid hint', () => {
  const words = LEXICON.map(e => e.word);
  assert.equal(new Set(words).size, words.length, 'no duplicate words');
  const validHints = new Set(LEXICON_GROUPS.map(g => g.hint));
  for (const { word, hint } of LEXICON) {
    assert.ok(word && typeof word === 'string', `word present: ${JSON.stringify(word)}`);
    assert.ok(validHints.has(hint), `${word} has a hint that maps to a display group`);
  }
});

test('hintFor resolves known words case-insensitively, null otherwise', () => {
  assert.equal(hintFor('sour'), 'flaw');
  assert.equal(hintFor('SOUR'), 'flaw');
  assert.equal(hintFor('fruity'), 'character');
  assert.equal(hintFor('thin'), 'body');
  assert.equal(hintFor('rutabaga'), null); // free-typed word the coach reasons about raw
  assert.equal(hintFor(''), null);
  assert.equal(hintFor(undefined), null);
});

test('the fork is representable: both flaw and character words exist', () => {
  const hints = new Set(LEXICON.map(e => e.hint));
  assert.ok(hints.has('flaw'));
  assert.ok(hints.has('character'));
});
