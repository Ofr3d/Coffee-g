import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCoachMessages, SYSTEM_PROMPT, DESCRIPTOR_MEANING } from './coach.js';

// These assert the deterministic CONTRACT the LLM relies on: that the engine
// encodes the fork mandate and the brew facts correctly. The fork JUDGMENT itself
// is the model's — covered by the manual two-cup acceptance test in the COMPASS.

test('system prompt mandates the flaw-vs-preference fork', () => {
  assert.match(SYSTEM_PROMPT, /FIXABLE BREWING FLAW/);
  assert.match(SYSTEM_PROMPT, /GENUINE PREFERENCE/);
  // objective competence must lead; "change nothing" must be allowed
  assert.match(SYSTEM_PROMPT, /objective competence/);
  assert.match(SYSTEM_PROMPT, /change nothing/);
  // the verdict-vs-words distinction and "no history ≠ novice" guard
  assert.match(SYSTEM_PROMPT, /enjoyed-but/);
  assert.match(SYSTEM_PROMPT, /never treat a lack of logged history as inexperience/);
});

test('a sour cup carries the under-extraction-vs-bright-bean framing', () => {
  const { system, user } = buildCoachMessages({
    session: {
      bean: { name: 'Torebadiya', origin: 'Ethiopia', process: 'Washed' },
      method: 'V60',
      parameters: { dose: '15', temp: '93', grind: '30', grind_device: 'Comandante' },
      impression: { verdict: 'enjoyed_but', descriptors: ['sour'] },
    },
  });
  assert.equal(system, SYSTEM_PROMPT);
  assert.match(user, /Torebadiya, Ethiopia, Washed process/);
  assert.match(user, /Comandante/);
  assert.match(user, /enjoyed it BUT something felt off/);
  assert.match(user, /Words they used: sour/);
  // the fork hint must be present: sour is NOT auto-assumed a flaw
  assert.match(user, /can also be a bright, acidic bean/);
});

test('a character word is framed as likely the bean, not a mistake', () => {
  const { user } = buildCoachMessages({
    session: {
      method: 'Espresso',
      parameters: { dose: '18', yield: '36' },
      impression: { verdict: 'not_enjoyed', descriptors: ['fruity'], disliked: 'too bright for me' },
    },
  });
  assert.match(user, /did NOT enjoy/);
  assert.match(user, /the bean's character, not a mistake/);
  assert.match(user, /What they didn't like: too bright for me/);
});

test('an enjoyed cup invites "change nothing"', () => {
  const { user } = buildCoachMessages({
    session: { method: 'Espresso', parameters: { dose: '18', yield: '36' }, impression: { verdict: 'enjoyed' } },
  });
  assert.match(user, /They ENJOYED this cup/);
});

test('no verdict yet → a pre-brew read, never a fake diagnosis', () => {
  const { user } = buildCoachMessages({
    session: { method: 'AeroPress', parameters: { dose: '17', water: '200' } },
  });
  assert.match(user, /Not tasted yet/);
});

test('only filled parameters reach the model (blank means blank)', () => {
  const { user } = buildCoachMessages({
    session: { method: 'V60', parameters: { dose: '15', temp: '', grind: null, grind_device: 'Comandante' } },
  });
  assert.match(user, /dose: 15/);
  assert.match(user, /grind_device: Comandante/);
  assert.doesNotMatch(user, /temp:/);
  assert.doesNotMatch(user, /grind:/);
});

test('pour sequences render readably for the model', () => {
  const { user } = buildCoachMessages({
    session: {
      method: 'V60',
      parameters: { dose: '15', pours: [{ time: '0:00', weight: '30' }, { time: '0:45', weight: '200' }] },
      impression: { verdict: 'enjoyed_but', descriptors: ['weak'] },
    },
  });
  assert.match(user, /pours: #1 0:00→30g, #2 0:45→200g/);
});

test('history and taste pattern are encoded, no "novice" wording', () => {
  const { user } = buildCoachMessages({
    session: { method: 'V60', parameters: {}, impression: { verdict: 'not_enjoyed', descriptors: ['bitter'] } },
    tasteIdentity: { fruity: 4, chocolatey: 1 },
    recentSessions: [{ impression: { verdict: 'enjoyed_but' } }, { impression: { verdict: 'enjoyed' } }],
  });
  assert.match(user, /Recent verdicts: enjoyed_but, enjoyed/);
  assert.match(user, /fruity \(4x\)/);
});

test('empty history reads as neutral (experienced brewer), never "first brew"', () => {
  const { user } = buildCoachMessages({
    session: { method: 'V60', parameters: {}, impression: { verdict: 'enjoyed' } },
  });
  assert.match(user, /may be an experienced brewer/);
  assert.doesNotMatch(user, /first brew/);
});

test('empty payload degrades to a sane pre-brew message, no throw', () => {
  const { user, system } = buildCoachMessages();
  assert.equal(system, SYSTEM_PROMPT);
  assert.match(user, /unknown bean/);
  assert.match(user, /Not tasted yet/);
});

test('legacy outcome-only session still resolves its fork hint', () => {
  const { user } = buildCoachMessages({ session: { method: 'V60', parameters: {}, outcome: 'sour' } });
  assert.match(user, /Words they used: sour/);
  assert.match(user, /can also be a bright, acidic bean/);
  assert.ok(DESCRIPTOR_MEANING.sour);
});
