import { useState } from 'react';
import { updateProfile, hashPin, getSessions, deleteProfile, getProfiles } from '../lib/storage';

const DISCOVERY_LEVELS = [
  { id: 'conservative', label: 'Conservative', desc: 'Only what closely matches your taste' },
  { id: 'moderate',     label: 'Moderate',     desc: 'Some exploration beyond your comfort zone' },
  { id: 'open',         label: 'Open',         desc: 'Show me everything worth trying' },
];

const METHODS = [
  'V60', 'Kalita Wave', 'Chemex', 'Pour-Over', 'Espresso',
  'AeroPress', 'French Press', 'Clever Dripper', 'Moka Pot', 'Cold Brew',
];

function emptyPreset() {
  return { id: crypto.randomUUID(), name: '', method: 'V60', vessel: '', grind_device: '', temp: '' };
}

export default function Me({ profile, onUpdate, onSwitch }) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName]               = useState(profile?.name || '');

  const [editingPin,  setEditingPin]  = useState(false);
  const [currentPin,  setCurrentPin]  = useState('');
  const [newPin,      setNewPin]      = useState('');
  const [confirmPin,  setConfirmPin]  = useState('');
  const [pinError,    setPinError]    = useState('');
  const [pinSuccess,  setPinSuccess]  = useState('');

  // Gear presets
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [draftPreset,     setDraftPreset]     = useState(null);

  const sessions = profile ? getSessions(profile.id) : [];
  const identity = profile?.taste_identity || {};
  const presets  = profile?.gear_presets || [];

  function saveName() {
    if (!name.trim()) return;
    updateProfile(profile.id, { name: name.trim() });
    onUpdate({ ...profile, name: name.trim() });
    setEditingName(false);
  }

  function savePin() {
    setPinError(''); setPinSuccess('');
    if (profile.pin_hash && hashPin(currentPin) !== profile.pin_hash) {
      setPinError('Current PIN incorrect'); return;
    }
    if (newPin && newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    if (newPin !== confirmPin) { setPinError("PINs don't match"); return; }
    const pinHash = newPin ? hashPin(newPin) : null;
    updateProfile(profile.id, { pin_hash: pinHash });
    onUpdate({ ...profile, pin_hash: pinHash });
    setPinSuccess(newPin ? 'PIN updated.' : 'PIN removed.');
    setCurrentPin(''); setNewPin(''); setConfirmPin('');
    setEditingPin(false);
  }

  function startAddPreset() {
    const p = emptyPreset();
    setDraftPreset(p);
    setEditingPresetId(p.id);
  }

  function startEditPreset(p) {
    setDraftPreset({ ...p });
    setEditingPresetId(p.id);
  }

  function cancelPreset() {
    setEditingPresetId(null);
    setDraftPreset(null);
  }

  function savePreset() {
    if (!draftPreset.name.trim()) return;
    const exists = presets.find(p => p.id === draftPreset.id);
    const next = exists
      ? presets.map(p => p.id === draftPreset.id ? { ...draftPreset, temp: Number(draftPreset.temp) || null } : p)
      : [...presets, { ...draftPreset, temp: Number(draftPreset.temp) || null }];
    updateProfile(profile.id, { gear_presets: next });
    onUpdate({ ...profile, gear_presets: next });
    cancelPreset();
  }

  function deletePreset(id) {
    const next = presets.filter(p => p.id !== id);
    updateProfile(profile.id, { gear_presets: next });
    onUpdate({ ...profile, gear_presets: next });
  }

  function saveDiscoveryLevel(level) {
    updateProfile(profile.id, { discovery_level: level });
    onUpdate({ ...profile, discovery_level: level });
  }

  const OUTCOME_ORDER = ['balanced', 'sour', 'bitter', 'weak', 'strong', 'astringent', 'muddled'];
  const maxCount = Math.max(...Object.values(identity), 1);

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
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          Brews logged: {sessions.length}
        </div>
      </Section>

      {/* Taste identity */}
      {sessions.length > 0 && (
        <Section title="Taste identity">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {OUTCOME_ORDER.filter(o => identity[o]).map(o => (
              <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 80, textTransform: 'capitalize' }}>{o}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(identity[o] / maxCount) * 100}%`,
                    background: o === 'balanced' ? 'var(--green)' : o === 'sour' || o === 'bitter' ? 'var(--amber)' : 'var(--red)',
                    borderRadius: 3, transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>{identity[o]}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Gear presets */}
      <Section title="Gear setups">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {presets.map(p => (
            <div key={p.id}>
              {editingPresetId === p.id ? (
                <PresetForm
                  draft={draftPreset}
                  onChange={setDraftPreset}
                  onSave={savePreset}
                  onCancel={cancelPreset}
                />
              ) : (
                <div style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.method}{p.vessel ? ` · ${p.vessel}` : ''}{p.grind_device ? ` · ${p.grind_device}` : ''}{p.temp ? ` · ${p.temp}°C` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => startEditPreset(p)} style={{ fontSize: 13, color: 'var(--accent)' }}>Edit</button>
                    <button onClick={() => deletePreset(p.id)} style={{ fontSize: 13, color: 'var(--red)' }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {editingPresetId && !presets.find(p => p.id === editingPresetId) ? (
            <PresetForm
              draft={draftPreset}
              onChange={setDraftPreset}
              onSave={savePreset}
              onCancel={cancelPreset}
            />
          ) : (
            <button onClick={startAddPreset} style={{ fontSize: 14, color: 'var(--accent)', textAlign: 'left', paddingTop: 4 }}>
              + Add setup
            </button>
          )}
        </div>
      </Section>

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
              <button onClick={savePin} style={{ flex: 1, background: 'var(--accent)', color: '#fff', padding: '10px', borderRadius: 10, fontWeight: 600 }}>Save</button>
              <button onClick={() => { setEditingPin(false); setPinError(''); }} style={{ flex: 1, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '10px', borderRadius: 10, border: '1px solid var(--border)' }}>Cancel</button>
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
        <button
          onClick={() => {
            if (window.confirm(`Delete profile "${profile?.name}"? This cannot be undone.`)) {
              deleteProfile(profile?.id);
              onSwitch();
            }
          }}
          style={{ width: '100%', marginTop: 8, padding: '13px 0', borderRadius: 12, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 14 }}
        >
          Delete this profile
        </button>
      )}
    </div>
  );
}

function PresetForm({ draft, onChange, onSave, onCancel }) {
  const set = (k, v) => onChange(d => ({ ...d, [k]: v }));
  return (
    <div style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--accent)44', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FieldLabel label="Setup name">
        <input value={draft.name} onChange={e => set('name', e.target.value)} placeholder="e.g. V60 Morning" autoFocus />
      </FieldLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FieldLabel label="Method">
          <select value={draft.method} onChange={e => set('method', e.target.value)}>
            {['V60','Kalita Wave','Chemex','Pour-Over','Espresso','AeroPress','French Press','Clever Dripper','Moka Pot','Cold Brew'].map(m => <option key={m}>{m}</option>)}
          </select>
        </FieldLabel>
        <FieldLabel label="Vessel / Model">
          <input value={draft.vessel} onChange={e => set('vessel', e.target.value)} placeholder="e.g. V60-02" />
        </FieldLabel>
        <FieldLabel label="Grinder">
          <input value={draft.grind_device} onChange={e => set('grind_device', e.target.value)} placeholder="e.g. Comandante" />
        </FieldLabel>
        <FieldLabel label="Temp (°C)">
          <input type="number" value={draft.temp} onChange={e => set('temp', e.target.value)} placeholder="93" />
        </FieldLabel>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onSave} disabled={!draft.name.trim()} style={{ flex: 1, background: draft.name.trim() ? 'var(--accent)' : 'var(--surface-2)', color: draft.name.trim() ? '#fff' : 'var(--text-muted)', padding: '10px', borderRadius: 10, fontWeight: 600 }}>Save</button>
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '10px', borderRadius: 10, border: '1px solid var(--border)' }}>Cancel</button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function FieldLabel({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
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
