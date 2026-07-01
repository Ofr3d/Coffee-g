const KEY_PROFILES        = 'coffeeg:profiles';
const KEY_CURRENT_ID      = 'coffeeg:current_profile_id';
const KEY_SESSIONS        = 'coffeeg:sessions';
const KEY_DISMISSED_CARDS = 'coffeeg:dismissed_cards';
const KEY_SAVED_RECIPES   = 'coffeeg:saved_recipes';

// ── Profiles ────────────────────────────────────────────────────────────────

export function getProfiles() {
  const raw = localStorage.getItem(KEY_PROFILES);
  return raw ? JSON.parse(raw) : [];
}

export function getProfile(id) {
  const profiles = getProfiles();
  return id ? profiles.find(p => p.id === id) ?? null : null;
}

export function getCurrentProfile() {
  const id = localStorage.getItem(KEY_CURRENT_ID);
  return id ? getProfile(id) : null;
}

export function setCurrentProfile(id) {
  localStorage.setItem(KEY_CURRENT_ID, id);
}

export function createProfile({ name, pinHash = null }) {
  const profiles = getProfiles();
  const profile = {
    id: crypto.randomUUID(),
    name,
    pin_hash: pinHash,
    tier: 'user',
    discovery_level: 'conservative',
    gear: [],            // hardware library — the single source of truth (Brew draws from here)
    beans: [],           // bean bank
    setups: [],          // favorites: named gear + bean + params combos, by id
    taste_identity: {},  // descriptor tally
    verdict_tally: {},    // enjoyed / not_enjoyed / enjoyed_but counts
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(KEY_PROFILES, JSON.stringify([...profiles, profile]));
  return profile;
}

export function updateProfile(id, changes) {
  const profiles = getProfiles().map(p => p.id === id ? { ...p, ...changes } : p);
  localStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
}

export function deleteProfile(id) {
  const profiles = getProfiles().filter(p => p.id !== id);
  localStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
  if (localStorage.getItem(KEY_CURRENT_ID) === id) {
    localStorage.removeItem(KEY_CURRENT_ID);
  }
}

// ── Gear library ──────────────────────────────────────────────────────────────
// All hardware lives on the profile — the single source of truth. Brew only
// DRAWS from here; it never stores gear of its own. Retire, don't delete, so a
// saved setup that referenced a shelved item can be made whole again.

export function getGear(profileId, { activeOnly = false } = {}) {
  const gear = getProfile(profileId)?.gear || [];
  return activeOnly ? gear.filter(g => g.status !== 'retired') : gear;
}

export function addGear(profileId, { category, name, method = null }) {
  const profile = getProfile(profileId);
  if (!profile) return null;
  const item = {
    id: crypto.randomUUID(),
    category,                    // 'grinder' | 'brewer' | 'kettle' | 'scale' | 'milk'
    name,
    method: method || null,      // brewers may carry a method; others stay null
    status: 'active',
    created_at: new Date().toISOString(),
  };
  updateProfile(profileId, { gear: [...(profile.gear || []), item] });
  return item;
}

export function updateGear(profileId, id, changes) {
  const profile = getProfile(profileId);
  if (!profile) return;
  const gear = (profile.gear || []).map(g => g.id === id ? { ...g, ...changes } : g);
  updateProfile(profileId, { gear });
}

export function retireGear(profileId, id)   { updateGear(profileId, id, { status: 'retired' }); }
export function unretireGear(profileId, id) { updateGear(profileId, id, { status: 'active' }); }

// True permanent delete — rare, and the UI must warn how many setups it drops.
export function deleteGear(profileId, id) {
  const profile = getProfile(profileId);
  if (!profile) return;
  updateProfile(profileId, { gear: (profile.gear || []).filter(g => g.id !== id) });
}

// ── Bean bank ──────────────────────────────────────────────────────────────────
// Beans are reused across the ~20 brews from one bag. process + roast_level are
// exactly what the flaw-vs-preference fork reasons on. Edit/delete allowed (typo fix).

export function getBeans(profileId) {
  return getProfile(profileId)?.beans || [];
}

export function addBean(profileId, { name, origin = '', farm = '', process = '', roast_level = '' }) {
  const profile = getProfile(profileId);
  if (!profile) return null;
  const bean = {
    id: crypto.randomUUID(),
    name, origin, farm, process, roast_level,
    created_at: new Date().toISOString(),
  };
  updateProfile(profileId, { beans: [...(profile.beans || []), bean] });
  return bean;
}

export function updateBean(profileId, id, changes) {
  const profile = getProfile(profileId);
  if (!profile) return;
  const beans = (profile.beans || []).map(b => b.id === id ? { ...b, ...changes } : b);
  updateProfile(profileId, { beans });
}

export function deleteBean(profileId, id) {
  const profile = getProfile(profileId);
  if (!profile) return;
  updateProfile(profileId, { beans: (profile.beans || []).filter(b => b.id !== id) });
}

// ── Setups (favorites) ─────────────────────────────────────────────────────────
// A favorite = a named { gear ids + bean id + dialed params } combo — the two-flick
// recall door. References gear/beans by id so retiring or editing them never breaks
// a saved favorite. Ordered by recency of use so this morning's setup floats up.

export function getSetups(profileId) {
  const setups = getProfile(profileId)?.setups || [];
  return [...setups].sort((a, b) =>
    (b.last_used_at || b.created_at || '').localeCompare(a.last_used_at || a.created_at || ''));
}

export function addSetup(profileId, { name, gear_ids = [], bean_id = null, method = null, params = {} }) {
  const profile = getProfile(profileId);
  if (!profile) return null;
  const now = new Date().toISOString();
  const setup = {
    id: crypto.randomUUID(),
    name, gear_ids, bean_id, method, params,
    created_at: now,
    last_used_at: now,
  };
  updateProfile(profileId, { setups: [...(profile.setups || []), setup] });
  return setup;
}

export function updateSetup(profileId, id, changes) {
  const profile = getProfile(profileId);
  if (!profile) return;
  const setups = (profile.setups || []).map(s => s.id === id ? { ...s, ...changes } : s);
  updateProfile(profileId, { setups });
}

export function touchSetup(profileId, id) {
  updateSetup(profileId, id, { last_used_at: new Date().toISOString() });
}

export function deleteSetup(profileId, id) {
  const profile = getProfile(profileId);
  if (!profile) return;
  updateProfile(profileId, { setups: (profile.setups || []).filter(s => s.id !== id) });
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function getSessions(profileId) {
  const raw = localStorage.getItem(`${KEY_SESSIONS}:${profileId}`);
  return raw ? JSON.parse(raw) : [];
}

export function addSession(profileId, session) {
  const sessions = getSessions(profileId);
  const next = [
    { ...session, id: crypto.randomUUID(), profile_id: profileId, timestamp: new Date().toISOString() },
    ...sessions,
  ];
  localStorage.setItem(`${KEY_SESSIONS}:${profileId}`, JSON.stringify(next));

  // Update taste identity from the impression: a descriptor tally (the palate) +
  // a verdict tally (enjoyed / not / enjoyed-but). Legacy sessions carried a single
  // `outcome` string — still counted so old logs don't vanish from the bars.
  const profile = getProfile(profileId);
  if (profile) {
    const imp = session.impression || {};
    const identity = { ...(profile.taste_identity || {}) };
    (imp.descriptors || []).forEach(word => { identity[word] = (identity[word] || 0) + 1; });
    const verdict_tally = { ...(profile.verdict_tally || {}) };
    if (imp.verdict) verdict_tally[imp.verdict] = (verdict_tally[imp.verdict] || 0) + 1;
    if (!imp.verdict && (imp.descriptors == null) && session.outcome) {
      identity[session.outcome] = (identity[session.outcome] || 0) + 1;
    }
    updateProfile(profileId, { taste_identity: identity, verdict_tally });
  }

  return next;
}

// ── Train cards ───────────────────────────────────────────────────────────────

export function getDismissedCards() {
  const id = localStorage.getItem(KEY_CURRENT_ID);
  if (!id) return [];
  const raw = localStorage.getItem(`${KEY_DISMISSED_CARDS}:${id}`);
  return raw ? JSON.parse(raw) : [];
}

export function dismissCard(cardId) {
  const id = localStorage.getItem(KEY_CURRENT_ID);
  if (!id) return;
  const dismissed = getDismissedCards();
  if (!dismissed.includes(cardId)) {
    localStorage.setItem(`${KEY_DISMISSED_CARDS}:${id}`, JSON.stringify([...dismissed, cardId]));
  }
}

// ── Saved recipes ─────────────────────────────────────────────────────────────

export function getSavedRecipes() {
  const id = localStorage.getItem(KEY_CURRENT_ID);
  if (!id) return [];
  const raw = localStorage.getItem(`${KEY_SAVED_RECIPES}:${id}`);
  return raw ? JSON.parse(raw) : [];
}

export function toggleSavedRecipe(recipeId) {
  const id = localStorage.getItem(KEY_CURRENT_ID);
  if (!id) return;
  const saved = getSavedRecipes();
  const next = saved.includes(recipeId)
    ? saved.filter(r => r !== recipeId)
    : [...saved, recipeId];
  localStorage.setItem(`${KEY_SAVED_RECIPES}:${id}`, JSON.stringify(next));
  return next;
}

// ── Simple PIN hash (not cryptographic — just obfuscation for privacy) ────────

export function hashPin(pin) {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = ((hash << 5) - hash) + pin.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export function checkPin(profile, pin) {
  if (!profile.pin_hash) return true;
  return hashPin(pin) === profile.pin_hash;
}
