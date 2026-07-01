import { useState } from 'react';
import {
  updateProfile, hashPin, getSessions, deleteProfile, getProfiles, getProfile,
  getGear, addGear, updateGear, retireGear, unretireGear, deleteGear,
  getBeans, addBean, updateBean, deleteBean,
  getSetups, updateSetup, deleteSetup,
} from '../lib/storage';
import { hintFor } from '../lib/lexicon';

const DISCOVERY_LEVELS = [
  { id: 'conservative', label: 'Conservative', desc: 'Only what closely matches your taste' },
  { id: 'moderate',     label: 'Moderate',     desc: 'Some exploration beyond your comfort zone' },
  { id: 'open',         label: 'Open',         desc: 'Show me everything worth trying' },
];

const GEAR_CATEGORIES = [
  { id: 'grinder', label: 'Grinders' },
  { id: 'brewer',  label: 'Brewers' },
  { id: 'kettle',  label: 'Kettles' },
  { id: 'scale',   label: 'Scales' },
  { id: 'milk',    label: 'Milk gear' },
];

const PROCESSES = ['Washed', 'Natural', 'Honey', 'Anaerobic Natural', 'Anaerobic Washed', 'Carbonic Maceration', 'Wet-Hulled'];
const ROAST_LEVELS = ['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'];

const VERDICT_LABEL = { enjoyed: 'Enjoyed', enjoyed_but: 'Enjoyed, but…', not_enjoyed: "Didn't enjoy" };

export default function Me({ profile, onUpdate, onSwitch }) {
  const refresh = () => onUpdate(getProfile(profile.id));

  const [editingName, setEditingName] = useState(false);
  const [name, setName]               = useState(profile?.name || '');

  const [editingPin, setEditingPin]   = useState(false);
  const [currentPin, setCurrentPin]   = useState('');
  const [newPin, setNewPin]           = useState('');
  const [confirmPin, setConfirmPin]   = useState('');
  const [pinError, setPinError]       = useState('');
  const [pinSuccess, setPinSuccess]   = useState('');

  const sessions = profile ? getSessions(profile.id) : [];
  const identity = profile?.taste_identity || {};
  const verdicts = profile?.verdict_tally || {};
  const gear     = getGear(profile.id);
  const beans    = getBeans(profile.id);
  const setups   = getSetups(profile.id);

  function saveName() {
    if (!name.trim()) return;
    updateProfile(profile.id, { name: name.trim() });
    refresh();
    setEditingName(false);
  }

  function savePin() {
    setPinError(''); setPinSuccess('');
    if (profile.pin_hash && hashPin(currentPin) !== profile.pin_hash) { setPinError('Current PIN incorrect'); return; }
    if (newPin && newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    if (newPin !== confirmPin) { setPinError("PINs don't match"); return; }
    updateProfile(profile.id, { pin_hash: newPin ? hashPin(newPin) : null });
    refresh();
    setPinSuccess(newPin ? 'PIN updated.' : 'PIN removed.');
    setCurrentPin(''); setNewPin(''); setConfirmPin('');
    setEditingPin(false);
  }

  function saveDiscoveryLevel(level) {
    updateProfile(profile.id, { discovery_level: level });
    refresh();
  }

  // Descriptor bars — the palate, sorted by frequency.
  const topDescriptors = Object.entries(identity).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCount = Math.max(...topDescriptors.map(([, c]) => c), 1);
  const barColor = (word) => {
    const h = hintFor(word);
    return h === 'character' ? 'var(--green)' : h === 'flaw' ? 'var(--amber)' : 'var(--text-muted)';
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 16px 32px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Profile</h2>

      {/* Name */}
      <Section title="Profile">
        {editingName ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1 }} autoFocus />
            <button onClick={saveName} style={{ color: 'var(--accent)', fontWeight: 600 }}>Save</button>
            <button onClick={() => setEditingName(false)} style={{ color: 'var(--text-muted)' }}>Cancel</button>
          </div>
        ) : (
          <InfoRow label="Name" value={profile?.name} onEdit={() => setEditingName(true)} />
        )}
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>Brews logged: {sessions.length}</div>
      </Section>

      {/* Taste identity */}
      {topDescriptors.length > 0 && (
        <Section title="Taste identity">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topDescriptors.map(([word, count]) => (
              <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 84, textTransform: 'capitalize' }}>{word}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxCount) * 100}%`, background: barColor(word), borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
          {Object.keys(verdicts).length > 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              {Object.entries(verdicts).map(([v, c]) => `${VERDICT_LABEL[v] || v}: ${c}`).join('  ·  ')}
            </div>
          )}
        </Section>
      )}

      {/* Gear library — the authoritative home for all hardware */}
      <Section title="Gear (your hardware)">
        <GearManager gear={gear} setups={setups} profileId={profile.id} onChange={refresh} />
      </Section>

      {/* Bean bank */}
      <Section title="Beans">
        <BeanManager beans={beans} profileId={profile.id} onChange={refresh} />
      </Section>

      {/* Favorites */}
      {setups.length > 0 && (
        <Section title="Favorites (saved setups)">
          <FavoritesManager setups={setups} gear={gear} beans={beans} profileId={profile.id} onChange={refresh} />
        </Section>
      )}

      {/* Discovery level */}
      <Section title="Discovery level">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DISCOVERY_LEVELS.map(level => (
            <button key={level.id} onClick={() => saveDiscoveryLevel(level.id)} style={{
              padding: '12px 14px', borderRadius: 10, textAlign: 'left',
              border: `1px solid ${profile?.discovery_level === level.id ? 'var(--accent)' : 'var(--border)'}`,
              background: profile?.discovery_level === level.id ? 'var(--accent)22' : 'var(--surface-2)',
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: profile?.discovery_level === level.id ? 'var(--accent)' : 'var(--text)' }}>{level.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{level.desc}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* PIN */}
      <Section title="Security">
        {pinSuccess && <p style={{ color: 'var(--green)', fontSize: 14, marginBottom: 8 }}>{pinSuccess}</p>}
        {editingPin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profile?.pin_hash && (
              <input type="password" inputMode="numeric" value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))} placeholder="Current PIN" />
            )}
            <input type="password" inputMode="numeric" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="New PIN (leave blank to remove)" />
            {newPin.length > 0 && (
              <input type="password" inputMode="numeric" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="Confirm new PIN" />
            )}
            {pinError && <p style={{ color: 'var(--red)', fontSize: 13 }}>{pinError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={savePin} style={{ flex: 1, background: 'var(--accent)', color: '#fff', padding: 10, borderRadius: 10, fontWeight: 600 }}>Save</button>
              <button onClick={() => { setEditingPin(false); setPinError(''); }} style={{ flex: 1, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: 10, borderRadius: 10, border: '1px solid var(--border)' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setEditingPin(true); setPinSuccess(''); }} style={{ fontSize: 14, color: 'var(--accent)' }}>
            {profile?.pin_hash ? 'Change or remove PIN' : 'Set a PIN'}
          </button>
        )}
      </Section>

      <button onClick={onSwitch} style={{ width: '100%', marginTop: 8, padding: '13px 0', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 14 }}>
        Switch profile
      </button>

      {getProfiles().length > 1 && (
        <button onClick={() => { if (window.confirm(`Delete profile "${profile?.name}"? This cannot be undone.`)) { deleteProfile(profile?.id); onSwitch(); } }}
          style={{ width: '100%', marginTop: 8, padding: '13px 0', borderRadius: 12, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 14 }}>
          Delete this profile
        </button>
      )}
    </div>
  );
}

// ── Gear manager ──────────────────────────────────────────────────────────────
function GearManager({ gear, setups, profileId, onChange }) {
  const [addingCat, setAddingCat] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [editId, setEditId]       = useState(null);
  const [editName, setEditName]   = useState('');

  function submitAdd(category) {
    if (!draftName.trim()) return;
    addGear(profileId, { category, name: draftName.trim() });
    setDraftName(''); setAddingCat(null); onChange();
  }
  function submitEdit(id) {
    if (!editName.trim()) return;
    updateGear(profileId, id, { name: editName.trim() });
    setEditId(null); onChange();
  }
  function handleDelete(item) {
    const affected = setups.filter(s => (s.gear_ids || []).includes(item.id)).length;
    const warn = affected > 0 ? `\n\nThis drops ${affected} saved favorite${affected > 1 ? 's' : ''}.` : '';
    if (window.confirm(`Delete "${item.name}" permanently?${warn}\n\n(Tip: "Retire" keeps it and your favorites safe.)`)) {
      deleteGear(profileId, item.id); onChange();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {GEAR_CATEGORIES.map(cat => {
        const items = gear.filter(g => g.category === cat.id);
        return (
          <div key={cat.id}>
            <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>{cat.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(item => (
                <div key={item.id} style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', opacity: item.status === 'retired' ? 0.55 : 1 }}>
                  {editId === item.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1 }} autoFocus />
                      <button onClick={() => submitEdit(item.id)} style={{ color: 'var(--accent)', fontWeight: 600 }}>Save</button>
                      <button onClick={() => setEditId(null)} style={{ color: 'var(--text-muted)' }}>×</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{item.name}{item.status === 'retired' ? ' · retired' : ''}</span>
                      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        <button onClick={() => { setEditId(item.id); setEditName(item.name); }} style={{ fontSize: 12, color: 'var(--accent)' }}>Edit</button>
                        {item.status === 'retired'
                          ? <button onClick={() => { unretireGear(profileId, item.id); onChange(); }} style={{ fontSize: 12, color: 'var(--green)' }}>Bring back</button>
                          : <button onClick={() => { retireGear(profileId, item.id); onChange(); }} style={{ fontSize: 12, color: 'var(--text-muted)' }}>Retire</button>}
                        <button onClick={() => handleDelete(item)} style={{ fontSize: 12, color: 'var(--red)' }}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {addingCat === cat.id ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={draftName} onChange={e => setDraftName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitAdd(cat.id); } }} placeholder={`Add a ${cat.id}`} autoFocus style={{ flex: 1 }} />
                  <button onClick={() => submitAdd(cat.id)} style={{ color: 'var(--accent)', fontWeight: 600 }}>Add</button>
                  <button onClick={() => { setAddingCat(null); setDraftName(''); }} style={{ color: 'var(--text-muted)' }}>×</button>
                </div>
              ) : (
                <button onClick={() => { setAddingCat(cat.id); setDraftName(''); }} style={{ fontSize: 13, color: 'var(--accent)', textAlign: 'left' }}>＋ Add {cat.label.toLowerCase().replace(/s$/, '')}</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Bean manager ──────────────────────────────────────────────────────────────
function emptyBean() { return { name: '', origin: '', farm: '', process: '', roast_level: '' }; }

function BeanManager({ beans, profileId, onChange }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [draft, setDraft]   = useState(emptyBean());

  function save() {
    if (!draft.name.trim()) return;
    if (editId) updateBean(profileId, editId, { ...draft, name: draft.name.trim() });
    else addBean(profileId, { ...draft, name: draft.name.trim() });
    setDraft(emptyBean()); setAdding(false); setEditId(null); onChange();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {beans.map(b => (
        editId === b.id ? (
          <BeanForm key={b.id} draft={draft} onChange={setDraft} onSave={save} onCancel={() => { setEditId(null); setDraft(emptyBean()); }} />
        ) : (
          <div key={b.id} style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {[b.origin, b.farm, b.process, b.roast_level].filter(Boolean).join(' · ') || '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={() => { setEditId(b.id); setDraft({ name: b.name || '', origin: b.origin || '', farm: b.farm || '', process: b.process || '', roast_level: b.roast_level || '' }); }} style={{ fontSize: 12, color: 'var(--accent)' }}>Edit</button>
              <button onClick={() => { if (window.confirm(`Delete "${b.name}"?`)) { deleteBean(profileId, b.id); onChange(); } }} style={{ fontSize: 12, color: 'var(--red)' }}>Delete</button>
            </div>
          </div>
        )
      ))}

      {adding ? (
        <BeanForm draft={draft} onChange={setDraft} onSave={save} onCancel={() => { setAdding(false); setDraft(emptyBean()); }} />
      ) : (
        <button onClick={() => { setAdding(true); setDraft(emptyBean()); }} style={{ fontSize: 13, color: 'var(--accent)', textAlign: 'left', paddingTop: 2 }}>＋ Add bean</button>
      )}
    </div>
  );
}

function BeanForm({ draft, onChange, onSave, onCancel }) {
  const set = (k, v) => onChange({ ...draft, [k]: v });
  return (
    <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--accent)44', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={draft.name} onChange={e => set('name', e.target.value)} placeholder="Bean name" autoFocus />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input value={draft.origin} onChange={e => set('origin', e.target.value)} placeholder="Origin" />
        <input value={draft.farm} onChange={e => set('farm', e.target.value)} placeholder="Farm / Producer" />
        <select value={draft.process} onChange={e => set('process', e.target.value)}>
          <option value="">Process…</option>
          {PROCESSES.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={draft.roast_level} onChange={e => set('roast_level', e.target.value)}>
          <option value="">Roast level…</option>
          {ROAST_LEVELS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onSave} disabled={!draft.name.trim()} style={{ flex: 1, background: draft.name.trim() ? 'var(--accent)' : 'var(--surface-2)', color: draft.name.trim() ? '#fff' : 'var(--text-muted)', padding: 10, borderRadius: 10, fontWeight: 600 }}>Save</button>
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: 10, borderRadius: 10, border: '1px solid var(--border)' }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Favorites manager ─────────────────────────────────────────────────────────
function FavoritesManager({ setups, gear, beans, profileId, onChange }) {
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const gearName = id => gear.find(g => g.id === id)?.name;
  const beanName = id => beans.find(b => b.id === id)?.name;

  function saveName(id) {
    if (!editName.trim()) return;
    updateSetup(profileId, id, { name: editName.trim() });
    setEditId(null); onChange();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {setups.map(s => {
        const parts = [
          s.method,
          ...(s.gear_ids || []).map(gearName).filter(Boolean),
          beanName(s.bean_id),
        ].filter(Boolean);
        return (
          <div key={s.id} style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
            {editId === s.id ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1 }} autoFocus />
                <button onClick={() => saveName(s.id)} style={{ color: 'var(--accent)', fontWeight: 600 }}>Save</button>
                <button onClick={() => setEditId(null)} style={{ color: 'var(--text-muted)' }}>×</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>☆ {s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{parts.join(' · ') || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  <button onClick={() => { setEditId(s.id); setEditName(s.name); }} style={{ fontSize: 12, color: 'var(--accent)' }}>Rename</button>
                  <button onClick={() => { if (window.confirm(`Delete favorite "${s.name}"?`)) { deleteSetup(profileId, s.id); onChange(); } }} style={{ fontSize: 12, color: 'var(--red)' }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, onEdit }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}: </span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
      </div>
      {onEdit && <button onClick={onEdit} style={{ fontSize: 13, color: 'var(--accent)' }}>Edit</button>}
    </div>
  );
}
