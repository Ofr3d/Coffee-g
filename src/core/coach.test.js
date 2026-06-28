import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCoachMessages, SYSTEM_PROMPT, OUTCOME_MEANING } from './coach.js';

// These assert the deterministic CONTRACT the LLM relies on: that the engine
// encodes the fork mandate and the brew facts correctly. The fork JUDGMENT itself
// is the model's — covered by the manual two-cup acceptance test in the COMPASS.

test('system prompt mandates the flaw-vs-preference fork', () => {
  assert.match(SYSTEM_PROMPT, /FIXABLE BREWING FLAW/);
  assert.match(SYSTEM_PROMPT, /GENUINE PREFERENCE/);
  // objective competence must lead; "change nothing" must be allowed
  assert.match(SYSTEM_PROMPT, /objective competence/);
  assert.match(SYSTEM_PROMPT, /change nothing/);
});

test('a sour cup carries the under-extraction-vs-bright-bean framing', () => {
  const { system, user } = buildCoachMessages({
    session: {
      bean: { name: 'Torebadiya', origin: 'Ethiopia', process: 'Washed' },
      method: 'V60',
      parameters: { dose: '15', temp: '93', grind: '30', grind_device: 'Comandante' },
      outcome: 'sour',
    },
  });
  assert.equal(system, SYSTEM_PROMPT);
  assert.match(user, /Torebadiya, Ethiopia, Washed process/);
  assert.match(user, /Comandante/);
  assert.match(user, new RegExp(OUTCOME_MEANING.sour.slice(0, 20)));
  // the fork hint must be present: sour is NOT auto-assumed a flaw
  assert.match(user, /can also be a bright, acidic bean/);
});

test('a balanced cup is framed as good, inviting "change nothing"', () => {
  const { user } = buildCoachMessages({
    session: { method: 'Espresso', parameters: { dose: '18', yield: '36' }, outcome: 'balanced' },
  });
  assert.match(user, /the cup is good/);
});

test('no outcome yet → a pre-brew read, never a fake diagnosis', () => {
  const { user } = buildCoachMessages({
    session: { method: 'AeroPress', parameters: { dose: '17', water: '200' } },
  });
  assert.match(user, /Not tasted yet/);
});

test('pour sequences render readably for the model', () => {
  const { user } = buildCoachMessages({
    session: {
      method: 'V60',
      parameters: { dose: '15', pours: [{ time: '0:30', weight: '50' }, { time: '1:15', weight: '200' }] },
      outcome: 'weak',
    },
  });
  assert.match(user, /pours: #1 0:30→50g, #2 1:15→200g/);
});

test('history and taste pattern are encoded', () => {
  const { user } = buildCoachMessages({
    session: { method: 'V60', parameters: {}, outcome: 'bitter' },
    tasteIdentity: { fruity: 4, chocolatey: 1 },
    recentSessions: [{ outcome: 'sour' }, { outcome: 'balanced' }],
  });
  assert.match(user, /Recent outcomes: sour, balanced/);
  assert.match(user, /fruity \(4x\)/);
});

test('empty payload degrades to a sane pre-brew message, no throw', () => {
  const { user, system } = buildCoachMessages();
  assert.equal(system, SYSTEM_PROMPT);
  assert.match(user, /unknown bean/);
  assert.match(user, /Not tasted yet/);
});
