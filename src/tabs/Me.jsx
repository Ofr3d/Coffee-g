import { useState } from 'react';
import { updateProfile, hashPin, getSessions, deleteProfile, getProfiles } from '../lib/storage';

const DISCOVERY_LEVELS = [
  { id: 'conservative', label: 'Conservative', desc: 'Only what closely matches your taste' },
  { id: 'moderate',     label: 'Moderate',     desc: 'Some exploration beyond your comfort zone' },
  { id: 'open',         label: 'Open',         desc: 'Show me everything worth trying' },
];

const METHODS = ['V60', 'Espresso', 'AeroPress', 'French Press', 'Chemex', 'Kalita', 'Moka Pot'];

export default function Me({ profile, onUpdate, onSwitch }) {
  const [editingName, setEditingName]   = useState(false);
  const [name, setName]                 = useState(profile?.name || '');
  const [editingPin, setEditingPin]     = useState(false);
  const [currentPin, setCurrentPin]     = useState('');
  const [newPin, setNewPin]             = useState('');
  const [confirmPin, setConfirmPin]     = useState('');
  const [pinError, setPinError]         = useState('');
  const [pinSuccess, setPinSuccess]     = useState('');
  const [editingPreset, setEditingPreset] = useState(false);
  const [preset, setPreset]             = useState({
    method: profile?.gear_presets?.[0]?.method || 'V60',
    grind_device: profile?.gear_presets?.[0]?.grind_device || '',
    temp: profile?.gear_presets?.[0]?.temp || '',
  });

  const sessions = profile ? getSessions(profile.id) : [];
  const identity = profile?.taste_identity || {};

  function saveName() {
    if (!name.trim()) return;
    const updated = { ...profile, name: name.trim() };
    updateProfile(profile.id, { name: name.trim() });
    onUpdate(updated);
    setEditingName(false);
  }

  function savePin() {
    setPinError('');
    setPinSuccess('');
    if (profile.pin_hash && hashPin(currentPin) !== profile.pin_hash) {
      setPinError('Current PIN incorrect'); return;
    }
    if (newPin && newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    if (newPin !== confirmPin) { setPinError('PINs don\'t match'); return; }
    const pinHash = newPin ? hashPin(newPin) : null;
    updateProfile(profile.id, { pin_hash: pinHash });
    onUpdate({ ...profile, pin_hash: pinHash });
    setPinSuccess(newPin ? 'PIN updated.' : 'PIN removed.');
    setCurrentPin(''); setNewPin(''); setConfirmPin('');
    setEditingPin(false);
  }

  function savePreset() {
    const presets = [{ method: preset.method, grind_device: preset.grind_device, temp: Number(preset.temp) || null }];
    updateProfile(profile.id, { gear_presets: presets });
    onUpdate({ ...profile, gear_presets: presets });
    setEditingPreset(false);
  }

  function saveDiscoveryLevel(level) {
    updateProfile(profile.id, { discovery_level: level });
    onUpdate({ ...profile, discovery_level: level });
  }

  // Taste identity bars
  const OUTCOME_ORDER = ['balanced', 'sour', 'bitter', 'weak', 'strong', 'astringent', 'muddled'];
  const maxCount = Math.max(...Object.values(identity), 1);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 16px 32px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Me</h2>

      {/* Profile name */}
      <Section title="Profile">
        {editingName ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1 }} autoFocus />
            <button onClick={saveName} style={{ color: 'var(--accent)', fontWeight: 600, padding: '0 4px' }}>Save</button>
            <button onClick={() => setEditingName(false)} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>Cancel</button>
          </div>
        ) : (
          <Row label="Name" value={profile?.name} onEdit={() => setEditingName(true)} />
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
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>{identity[o]}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Gear preset */}
      <Section title="Default gear setup">
        {editingPreset ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Method</span>
              <select value={preset.method} onChange={e => setPreset(p => ({ ...p, method: e.target.value }))}>
                {METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grinder</span>
              <input value={preset.grind_device} onChange={e => setPreset(p => ({ ...p, grind_device: e.target.value }))} placeholder="e.g. Comandante C40" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Default temp (°C)</span>
              <input type="number" value={preset.temp} onChange={e => setPreset(p => ({ ...p, temp: e.target.value }))} placeholder="93" />
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={savePreset} style={{ flex: 1, background: 'var(--accent)', color: '#fff', padding: '10px', borderRadius: 10, fontWeight: 600 }}>Save</button>
              <button onClick={() => setEditingPreset(false)} style={{ flex: 1, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: '10px', borderRadius: 10, border: '1px solid var(--border)' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            {profile?.gear_presets?.[0] ? (
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
                {profile.gear_presets[0].method} · {profile.gear_presets[0].grind_device || '—'} · {profile.gear_presets[0].temp ? `${profile.gear_presets[0].temp}°C` : '—'}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>No preset saved. Brew will pre-fill from your setup.</p>
            )}
            <button onClick={() => setEditingPreset(true)} style={{ fontSize: 14, color: 'var(--accent)' }}>
              {profile?.gear_presets?.[0] ? 'Edit preset' : 'Add preset'}
            </button>
          </div>
        )}
      </Section>

      {/* Discovery level */}
      <Section title="Discovery level">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DISCOVERY_LEVELS.map(level => (
            <button
              key={level.id}
              onClick={() => saveDiscoveryLevel(level.id)}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${profile?.discovery_level === level.id ? 'var(--accent)' : 'var(--border)'}`,
                background: profile?.discovery_level === level.id ? 'var(--accent)22' : 'var(--surface-2)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
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

      {/* Switch profile */}
      <button
        onClick={onSwitch}
        style={{
          width: '100%',
          marginTop: 8,
          padding: '13px 0',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--surface-2)',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        Switch profile
      </button>

      {/* Delete profile — only shown when more than one exists */}
      {getProfiles().length > 1 && (
        <button
          onClick={() => {
            if (window.confirm(`Delete profile "${profile?.name}"? This cannot be undone.`)) {
              deleteProfile(profile?.id);
              onSwitch();
            }
          }}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '13px 0',
            borderRadius: 12,
            border: '1px solid var(--red)',
            background: 'transparent',
            color: 'var(--red)',
            fontSize: 14,
          }}
        >
          Delete this profile
        </button>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, onEdit }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}: </span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
      </div>
      {onEdit && (
        <button onClick={onEdit} style={{ fontSize: 13, color: 'var(--accent)' }}>Edit</button>
      )}
    </div>
  );
}
