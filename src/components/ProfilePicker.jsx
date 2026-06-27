import { getProfiles } from '../lib/storage';

export default function ProfilePicker({ onPick, onNew }) {
  const profiles = getProfiles();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '48px 24px 32px', gap: 32 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Who's brewing?</h2>
        <p style={{ color: 'var(--text-muted)' }}>Select your profile to continue.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => onPick(p)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 17 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {p.pin_hash ? '🔒 PIN protected' : 'No PIN'}
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>›</span>
          </button>
        ))}
      </div>

      <button
        onClick={onNew}
        style={{
          color: 'var(--accent)',
          fontSize: 15,
          padding: '12px 0',
          borderTop: '1px solid var(--border)',
        }}
      >
        + Add new profile
      </button>
    </div>
  );
}
