import { useState } from 'react';
import { createProfile, hashPin } from '../lib/storage';

export default function SetupScreen({ onDone }) {
  const [name, setName]       = useState('');
  const [pin, setPin]         = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError]     = useState('');

  function handleCreate() {
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (pin && pin.length < 4) { setError('PIN must be at least 4 digits.'); return; }
    if (pin && pin !== pinConfirm) { setError('PINs don\'t match.'); return; }
    const profile = createProfile({ name: name.trim(), pinHash: pin ? hashPin(pin) : null });
    onDone(profile);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '40px 24px 32px', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>Coffee G</h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Your personal coffee companion. Let's set up your profile.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your name</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Alex"
            autoFocus
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PIN (optional)</span>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Leave blank for no lock"
          />
        </label>

        {pin.length > 0 && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirm PIN</span>
            <input
              type="password"
              inputMode="numeric"
              value={pinConfirm}
              onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="Repeat PIN"
            />
          </label>
        )}

        {error && <p style={{ color: 'var(--red)', fontSize: 14 }}>{error}</p>}
      </div>

      <button
        onClick={handleCreate}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          padding: '14px 0',
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        Start brewing
      </button>
    </div>
  );
}
