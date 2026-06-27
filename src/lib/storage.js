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
    gear_presets: [],
    taste_identity: {},
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

  // Update taste identity
  const profile = getProfile(profileId);
  if (profile && session.outcome) {
    const identity = { ...profile.taste_identity };
    identity[session.outcome] = (identity[session.outcome] || 0) + 1;
    updateProfile(profileId, { taste_identity: identity });
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
