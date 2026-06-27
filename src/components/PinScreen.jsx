import { useState } from 'react';
import { checkPin } from '../lib/storage';

export default function PinScreen({ profile, onSuccess, onCancel }) {
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (checkPin(profile, pin)) {
      onSuccess();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '80px 24px 32px', gap: 32, alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{profile?.name}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Enter your PIN to continue</p>
      </div>

      <input
        type="password"
        inputMode="numeric"
        value={pin}
        onChange={e => { setError(''); setPin(e.target.value.replace(/\D/g, '').slice(0, 8)); }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="PIN"
        autoFocus
        style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: 22, maxWidth: 200 }}
      />

      {error && <p style={{ color: 'var(--red)', fontSize: 14 }}>{error}</p>}

      <button
        onClick={handleSubmit}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          padding: '14px 48px',
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        Unlock
      </button>

      {onCancel && (
        <button onClick={onCancel} style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Switch profile
        </button>
      )}
    </div>
  );
}
