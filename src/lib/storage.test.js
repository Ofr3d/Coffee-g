import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// storage.js talks to localStorage (a browser global). Give it a tiny in-memory
// shim BEFORE importing the module, so the pure data logic can be unit-tested in
// Node with no browser and no new deps.
class MemStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
}
globalThis.localStorage = new MemStorage();
if (!globalThis.crypto) globalThis.crypto = {};
if (!globalThis.crypto.randomUUID) {
  let n = 0;
  globalThis.crypto.randomUUID = () => `id-${++n}`;
}

const {
  createProfile, setCurrentProfile,
  getGear, addGear, updateGear, retireGear, unretireGear, deleteGear,
  getBeans, addBean, updateBean, deleteBean,
  getSetups, addSetup, updateSetup, touchSetup, deleteSetup,
  addSession, getSessions, getProfile,
} = await import('./storage.js');

let profile;
beforeEach(() => {
  globalThis.localStorage.clear();
  profile = createProfile({ name: 'Ofer' });
  setCurrentProfile(profile.id);
});

test('a new profile starts with empty gear / beans / setups', () => {
  const p = getProfile(profile.id);
  assert.deepEqual(p.gear, []);
  assert.deepEqual(p.beans, []);
  assert.deepEqual(p.setups, []);
});

test('gear: add, activeOnly filter, retire/unretire, delete', () => {
  const grinder = addGear(profile.id, { category: 'grinder', name: 'Comandante' });
  const brewer  = addGear(profile.id, { category: 'brewer', name: 'V60-02', method: 'V60' });
  assert.equal(getGear(profile.id).length, 2);
  assert.equal(grinder.status, 'active');
  assert.equal(brewer.method, 'V60');

  retireGear(profile.id, grinder.id);
  assert.equal(getGear(profile.id, { activeOnly: true }).length, 1);
  assert.equal(getGear(profile.id).length, 2, 'retired gear is kept, not lost');

  unretireGear(profile.id, grinder.id);
  assert.equal(getGear(profile.id, { activeOnly: true }).length, 2);

  updateGear(profile.id, grinder.id, { name: 'Comandante C40' });
  assert.equal(getGear(profile.id).find(g => g.id === grinder.id).name, 'Comandante C40');

  deleteGear(profile.id, brewer.id);
  assert.equal(getGear(profile.id).length, 1);
});

test('beans: add, edit, delete', () => {
  const bean = addBean(profile.id, { name: 'Torebadiya', origin: 'Ethiopia', process: 'Washed', roast_level: 'Light' });
  assert.equal(getBeans(profile.id).length, 1);
  assert.equal(bean.roast_level, 'Light');

  updateBean(profile.id, bean.id, { name: 'Torebadiya Lot 3' });
  assert.equal(getBeans(profile.id)[0].name, 'Torebadiya Lot 3');

  deleteBean(profile.id, bean.id);
  assert.equal(getBeans(profile.id).length, 0);
});

test('setups: reference gear + bean by id, ordered by recency, touch bumps to front', () => {
  const grinder = addGear(profile.id, { category: 'grinder', name: 'Comandante' });
  const brewer  = addGear(profile.id, { category: 'brewer', name: 'V60' });
  const bean    = addBean(profile.id, { name: 'Torebadiya' });

  const a = addSetup(profile.id, { name: 'Yrg bliss', gear_ids: [grinder.id, brewer.id], bean_id: bean.id, method: 'V60' });
  const b = addSetup(profile.id, { name: 'Dark espresso', gear_ids: [grinder.id], bean_id: null });

  assert.equal(getSetups(profile.id).length, 2);
  assert.deepEqual(getSetups(profile.id).find(s => s.id === a.id).gear_ids, [grinder.id, brewer.id]);
  assert.equal(getSetups(profile.id).find(s => s.id === b.id).bean_id, null);

  // Deterministic recency: explicit timestamps (wall-clock ties within the same ms).
  updateSetup(profile.id, a.id, { last_used_at: '2020-01-02T00:00:00.000Z' });
  updateSetup(profile.id, b.id, { last_used_at: '2020-01-01T00:00:00.000Z' });
  assert.equal(getSetups(profile.id)[0].id, a.id, 'more recent last_used_at sorts first');

  touchSetup(profile.id, b.id); // real now (far later than 2020) → floats to front
  assert.equal(getSetups(profile.id)[0].id, b.id, 'touched setup floats to the front');

  updateSetup(profile.id, a.id, { name: 'Yrg morning' });
  assert.equal(getSetups(profile.id).find(s => s.id === a.id).name, 'Yrg morning');

  deleteSetup(profile.id, b.id);
  assert.equal(getSetups(profile.id).length, 1);
});

test('addSession tallies descriptors and verdict from the impression', () => {
  addSession(profile.id, {
    method: 'V60',
    impression: { verdict: 'enjoyed_but', liked: 'sweet', disliked: 'a bit sharp', descriptors: ['sharp', 'fruity'] },
  });
  addSession(profile.id, {
    method: 'V60',
    impression: { verdict: 'enjoyed', descriptors: ['fruity'] },
  });
  const p = getProfile(profile.id);
  assert.equal(p.taste_identity.fruity, 2);
  assert.equal(p.taste_identity.sharp, 1);
  assert.equal(p.verdict_tally.enjoyed_but, 1);
  assert.equal(p.verdict_tally.enjoyed, 1);
  assert.equal(getSessions(profile.id).length, 2);
});

test('addSession still counts a legacy outcome-only session', () => {
  addSession(profile.id, { method: 'V60', outcome: 'sour' });
  assert.equal(getProfile(profile.id).taste_identity.sour, 1);
});
