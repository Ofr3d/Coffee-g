import { useState, useEffect } from 'react';
import { getSessions, addSession, getCurrentProfile, getProfile } from '../lib/storage';
import { OUTCOME_TIPS } from '../lib/tips';

const METHODS = ['V60', 'Espresso', 'AeroPress', 'French Press', 'Chemex', 'Kalita', 'Moka Pot', 'Cold Brew'];

const OUTCOMES = [
  { id: 'balanced',   label: 'Balanced',   color: 'var(--green)' },
  { id: 'sour',       label: 'Sour',       color: 'var(--amber)' },
  { id: 'bitter',     label: 'Bitter',     color: 'var(--amber)' },
  { id: 'weak',       label: 'Weak',       color: 'var(--text-muted)' },
  { id: 'strong',     label: 'Strong',     color: 'var(--text-muted)' },
  { id: 'astringent', label: 'Astringent', color: 'var(--red)' },
  { id: 'muddled',    label: 'Muddled',    color: 'var(--red)' },
];

const OUTCOME_DOT = {
  balanced: 'var(--green)',
  sour: 'var(--amber)',
  bitter: 'var(--amber)',
  weak: 'var(--text-muted)',
  strong: 'var(--text-muted)',
  astringent: 'var(--red)',
  muddled: 'var(--red)',
};

export default function Brew({ profile, onSessionLogged }) {
  const [view, setView] = useState('dialer'); // dialer | shots

  // Dialer state
  const [bean,       setBean]       = useState('');
  const [method,     setMethod]     = useState('V60');
  const [dose,       setDose]       = useState('');
  const [yieldVal,   setYieldVal]   = useState('');
  const [time,       setTime]       = useState('');
  const [grind,      setGrind]      = useState('');
  const [grindDev,   setGrindDev]   = useState('');
  const [temp,       setTemp]       = useState('');
  const [outcome,    setOutcome]    = useState(null);
  const [notes,      setNotes]      = useState('');

  const [sessions,   setSessions]   = useState([]);
  const [tip,        setTip]        = useState(null);
  const [agentMsg,   setAgentMsg]   = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);

  useEffect(() => {
    const profileId = profile?.id || getCurrentProfile()?.id;
    if (profileId) setSessions(getSessions(profileId));
  }, [profile]);

  // Pre-fill from gear presets
  useEffect(() => {
    const presets = profile?.gear_presets;
    if (presets?.length) {
      const p = presets[0];
      if (p.grind_device) setGrindDev(p.grind_device);
      if (p.method)       setMethod(p.method);
      if (p.temp)         setTemp(String(p.temp));
    }
  }, [profile]);

  const ratio = dose && yieldVal && !isNaN(dose) && !isNaN(yieldVal)
    ? `1:${(parseFloat(yieldVal) / parseFloat(dose)).toFixed(1)}`
    : '—';

  async function handleLog() {
    if (!outcome) return;
    const session = { bean, method, parameters: { dose, yield: yieldVal, time, grind, grind_device: grindDev, temp }, outcome, notes };
    const profileId = profile?.id;
    const next = addSession(profileId, session);
    setSessions(next);
    onSessionLogged?.();

    // Show contextual tip
    setTip(OUTCOME_TIPS[outcome]);

    // Fire dial agent if online
    if (navigator.onLine) {
      setAgentLoading(true);
      setAgentMsg(null);
      try {
        const res = await fetch('/.netlify/functions/dial-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session, tasteIdentity: profile?.taste_identity || {}, recentSessions: next.slice(0, 5) }),
        });
        const data = await res.json();
        setAgentMsg(data.suggestion);
      } catch {
        // silent — offline or function unavailable
      } finally {
        setAgentLoading(false);
      }
    }

    // Reset form
    setOutcome(null);
    setNotes('');
    setBean('');
    setDose('');
    setYieldVal('');
    setTime('');
    setGrind('');
    setView('dialer');
  }

  const sessionCount = sessions.length;

  // Trend detection — last 5 sessions
  function getTrend() {
    if (sessions.length < 3) return null;
    const recent = sessions.slice(0, 5);
    const counts = {};
    recent.forEach(s => { counts[s.outcome] = (counts[s.outcome] || 0) + 1; });
    const [top, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top === 'balanced' || count < 3) return null;
    return `Your last ${recent.length} brews trended ${top}.`;
  }

  if (view === 'shots') {
    const trend = getTrend();
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setView('dialer')} style={{ color: 'var(--accent)', fontSize: 20 }}>‹</button>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Shots ({sessionCount})</h2>
        </div>

        {trend && (
          <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 14, color: 'var(--amber)' }}>
            {trend}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No brews logged yet.</div>
          ) : sessions.map(s => (
            <div key={s.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: OUTCOME_DOT[s.outcome] || 'var(--text-muted)',
                marginTop: 5, flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{s.bean || 'Unknown bean'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.method} · {s.outcome}
                  {s.parameters?.dose && ` · ${s.parameters.dose}g`}
                  {s.parameters?.yield && ` → ${s.parameters.yield}${s.method === 'Espresso' ? 'g' : 'ml'}`}
                </div>
                {s.notes && <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-muted)' }}>{s.notes}</p>}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {new Date(s.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 16px 32px' }}>
      {/* Tip card */}
      {tip && (
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--accent)',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 20,
          position: 'relative',
        }}>
          <button
            onClick={() => { setTip(null); setAgentMsg(null); }}
            style={{ position: 'absolute', top: 10, right: 12, color: 'var(--text-muted)', fontSize: 18 }}
          >×</button>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, paddingRight: 20 }}>{tip.headline}</div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{tip.body}</p>

          {agentLoading && (
            <p style={{ fontSize: 13, color: 'var(--accent)', marginTop: 12 }}>Dialing in your next brew…</p>
          )}
          {agentMsg && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Dial suggestion
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{agentMsg}</p>
            </div>
          )}
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Brew</h2>
        <button
          onClick={() => setView('shots')}
          style={{ fontSize: 13, color: 'var(--accent)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px' }}
        >
          Shots ({sessionCount})
        </button>
      </div>

      {/* Ratio display */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>{ratio}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ratio</div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Row label="Bean">
          <input value={bean} onChange={e => setBean(e.target.value)} placeholder="e.g. Ethiopian Yirgacheffe" />
        </Row>

        <Row label="Method">
          <select value={method} onChange={e => setMethod(e.target.value)}>
            {METHODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </Row>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Row label="Dose (g)">
            <input type="number" inputMode="decimal" value={dose} onChange={e => setDose(e.target.value)} placeholder="18" />
          </Row>
          <Row label={method === 'Espresso' ? 'Yield (g)' : 'Yield (ml)'}>
            <input type="number" inputMode="decimal" value={yieldVal} onChange={e => setYieldVal(e.target.value)} placeholder="250" />
          </Row>
          <Row label="Time (m:ss)">
            <input value={time} onChange={e => setTime(e.target.value)} placeholder="3:00" />
          </Row>
          <Row label="Temp (°C)">
            <input type="number" inputMode="decimal" value={temp} onChange={e => setTemp(e.target.value)} placeholder="93" />
          </Row>
          <Row label="Grind #">
            <input type="number" inputMode="decimal" value={grind} onChange={e => setGrind(e.target.value)} placeholder="20" />
          </Row>
          <Row label="Grinder">
            <input value={grindDev} onChange={e => setGrindDev(e.target.value)} placeholder="e.g. Comandante" />
          </Row>
        </div>

        {/* Notes */}
        <Row label="Notes (optional)">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Tasting notes, observations…"
            rows={3}
            style={{ resize: 'none' }}
          />
        </Row>

        {/* Outcome chips */}
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            How did it taste?
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {OUTCOMES.map(o => (
              <button
                key={o.id}
                onClick={() => setOutcome(outcome === o.id ? null : o.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 500,
                  border: `1px solid ${outcome === o.id ? o.color : 'var(--border)'}`,
                  background: outcome === o.id ? o.color + '22' : 'var(--surface-2)',
                  color: outcome === o.id ? o.color : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleLog}
          disabled={!outcome}
          style={{
            marginTop: 8,
            padding: '15px 0',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 16,
            background: outcome ? 'var(--accent)' : 'var(--surface-2)',
            color: outcome ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          Log this brew
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
  );
}
