import { useState, useEffect } from 'react';
import { getSessions, addSession, getCurrentProfile, updateProfile, getProfile } from '../lib/storage';
import { OUTCOME_TIPS } from '../lib/tips';

// ── Method catalogue ─────────────────────────────────────────────────────────

const METHODS = [
  { id: 'V60',            type: 'pour-over'  },
  { id: 'Kalita Wave',    type: 'pour-over'  },
  { id: 'Chemex',         type: 'pour-over'  },
  { id: 'Pour-Over',      type: 'pour-over'  },
  { id: 'Espresso',       type: 'espresso'   },
  { id: 'AeroPress',      type: 'aeropress'  },
  { id: 'French Press',   type: 'immersion'  },
  { id: 'Clever Dripper', type: 'immersion'  },
  { id: 'Moka Pot',       type: 'simple'     },
  { id: 'Cold Brew',      type: 'simple'     },
];

const METHOD_TYPE = Object.fromEntries(METHODS.map(m => [m.id, m.type]));

const PROCESSES = [
  'Washed', 'Natural', 'Honey', 'Anaerobic Natural',
  'Anaerobic Washed', 'Carbonic Maceration', 'Wet-Hulled',
];

const OUTCOMES = [
  { id: 'balanced',   label: 'Balanced',   color: 'var(--green)'      },
  { id: 'sour',       label: 'Sour',       color: 'var(--amber)'      },
  { id: 'bitter',     label: 'Bitter',     color: 'var(--amber)'      },
  { id: 'weak',       label: 'Weak',       color: 'var(--text-muted)' },
  { id: 'strong',     label: 'Strong',     color: 'var(--text-muted)' },
  { id: 'astringent', label: 'Astringent', color: 'var(--red)'        },
  { id: 'muddled',    label: 'Muddled',    color: 'var(--red)'        },
];

const OUTCOME_DOT = {
  balanced: 'var(--green)', sour: 'var(--amber)', bitter: 'var(--amber)',
  weak: 'var(--text-muted)', strong: 'var(--text-muted)',
  astringent: 'var(--red)', muddled: 'var(--red)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyPour() { return { time: '', weight: '' }; }

function calcRatio(dose, totalWeight) {
  const d = parseFloat(dose);
  const w = parseFloat(totalWeight);
  if (!d || !w || d === 0) return '—';
  return `1:${(w / d).toFixed(1)}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Brew({ profile, onSessionLogged }) {
  const [view, setView] = useState('dialer');

  // Bean
  const [beanName,    setBeanName]    = useState('');
  const [beanOrigin,  setBeanOrigin]  = useState('');
  const [beanFarm,    setBeanFarm]    = useState('');
  const [beanProcess, setBeanProcess] = useState('');

  // Method + vessel
  const [method,  setMethod]  = useState('V60');
  const [vessel,  setVessel]  = useState('');
  const methodType = METHOD_TYPE[method] || 'simple';

  // Grinder (shared)
  const [grindDev, setGrindDev] = useState('');
  const [grind,    setGrind]    = useState('');

  // Pour-over
  const [pours, setPours] = useState([emptyPour()]);
  const [temp,  setTemp]  = useState('');
  const [dose,  setDose]  = useState('');
  const totalPourWeight = pours.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0);

  // Espresso
  const [espDose,     setEspDose]     = useState('');
  const [espYield,    setEspYield]    = useState('');
  const [preInfusion, setPreInfusion] = useState('');
  const [shotTime,    setShotTime]    = useState('');

  // AeroPress
  const [apStyle,    setApStyle]    = useState('Standard');
  const [apDose,     setApDose]     = useState('');
  const [apWater,    setApWater]    = useState('');
  const [steepTime,  setSteepTime]  = useState('');
  const [bypass,     setBypass]     = useState('');

  // Immersion / simple
  const [imDose,  setImDose]  = useState('');
  const [imWater, setImWater] = useState('');
  const [imTime,  setImTime]  = useState('');

  // Outcome + notes
  const [outcome, setOutcome] = useState(null);
  const [notes,   setNotes]   = useState('');

  // Post-log
  const [sessions,      setSessions]      = useState([]);
  const [tip,           setTip]           = useState(null);
  const [agentMsg,      setAgentMsg]      = useState(null);
  const [agentLoading,  setAgentLoading]  = useState(false);

  useEffect(() => {
    if (profile?.id) setSessions(getSessions(profile.id));
  }, [profile]);

  // Apply preset when profile loads
  useEffect(() => {
    const preset = profile?.gear_presets?.[0];
    if (preset) applyPreset(preset);
  }, [profile]);

  function applyPreset(preset) {
    if (preset.method)       setMethod(preset.method);
    if (preset.vessel)       setVessel(preset.vessel);
    if (preset.grind_device) setGrindDev(preset.grind_device);
    if (preset.temp)         setTemp(String(preset.temp));
  }

  // Ratio display
  const ratio = (() => {
    if (methodType === 'espresso')  return calcRatio(espDose, espYield);
    if (methodType === 'pour-over') return calcRatio(dose, totalPourWeight);
    if (methodType === 'aeropress') return calcRatio(apDose, parseFloat(apWater) + parseFloat(bypass || 0));
    if (methodType === 'immersion') return calcRatio(imDose, imWater);
    return '—';
  })();

  function buildSessionParams() {
    if (methodType === 'espresso') return { dose: espDose, yield: espYield, pre_infusion: preInfusion, time: shotTime, grind, grind_device: grindDev };
    if (methodType === 'pour-over') return { dose, pours, total_yield: totalPourWeight, temp, grind, grind_device: grindDev };
    if (methodType === 'aeropress') return { style: apStyle, dose: apDose, water: apWater, bypass, steep_time: steepTime, grind, grind_device: grindDev };
    if (methodType === 'immersion') return { dose: imDose, water: imWater, time: imTime, grind, grind_device: grindDev };
    return { dose: imDose, yield: imWater, time: imTime };
  }

  async function handleLog() {
    if (!outcome) return;
    const session = {
      bean: { name: beanName, origin: beanOrigin, farm: beanFarm, process: beanProcess },
      method,
      vessel,
      parameters: buildSessionParams(),
      outcome,
      notes,
    };
    const next = addSession(profile.id, session);
    setSessions(next);
    onSessionLogged?.();
    setTip(OUTCOME_TIPS[outcome]);
    // The coach is summoned, never pushed — no auto-fire here. See handleDialMeIn.

    // Reset form fields (keep method/vessel/grinder/temp)
    setBeanName(''); setBeanOrigin(''); setBeanFarm(''); setBeanProcess('');
    setPours([emptyPour()]); setDose('');
    setEspDose(''); setEspYield(''); setPreInfusion(''); setShotTime('');
    setApDose(''); setApWater(''); setSteepTime(''); setBypass('');
    setImDose(''); setImWater(''); setImTime('');
    setOutcome(null); setNotes('');
  }

  async function handleDialMeIn() {
    if (!navigator.onLine) return;
    const session = {
      bean: { name: beanName, origin: beanOrigin, farm: beanFarm, process: beanProcess },
      method,
      vessel,
      parameters: buildSessionParams(),
      outcome,            // may be null — coach gives a pre-brew read
      notes,
    };
    setAgentLoading(true);
    setAgentMsg(null);
    try {
      const res = await fetch('/.netlify/functions/dial-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, tasteIdentity: profile?.taste_identity || {}, recentSessions: sessions.slice(0, 5) }),
      });
      const data = await res.json();
      setAgentMsg(data.suggestion);
    } catch { setAgentMsg(null); }
    finally { setAgentLoading(false); }
  }

  function getTrend() {
    if (sessions.length < 3) return null;
    const recent = sessions.slice(0, 5);
    const counts = {};
    recent.forEach(s => { counts[s.outcome] = (counts[s.outcome] || 0) + 1; });
    const [top, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top === 'balanced' || count < 3) return null;
    return `Your last ${recent.length} brews trended ${top}.`;
  }

  // ── Shots view ──────────────────────────────────────────────────────────────

  if (view === 'shots') {
    const trend = getTrend();
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setView('dialer')} style={{ color: 'var(--accent)', fontSize: 20 }}>‹</button>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Shots ({sessions.length})</h2>
        </div>
        {trend && (
          <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--amber)' }}>
            {trend}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No brews logged yet.</div>
            : sessions.map(s => <ShotRow key={s.id} session={s} />)
          }
        </div>
      </div>
    );
  }

  // ── Dialer view ─────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 16px 32px' }}>

      {/* Learning-loop tip (after a log) */}
      {tip && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, position: 'relative' }}>
          <button onClick={() => setTip(null)} style={{ position: 'absolute', top: 10, right: 12, color: 'var(--text-muted)', fontSize: 18 }}>×</button>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, paddingRight: 20 }}>{tip.headline}</div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{tip.body}</p>
        </div>
      )}

      {/* Coach card — only when summoned */}
      {(agentLoading || agentMsg) && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--accent)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, position: 'relative' }}>
          {agentMsg && (
            <button onClick={() => setAgentMsg(null)} style={{ position: 'absolute', top: 10, right: 12, color: 'var(--text-muted)', fontSize: 18 }}>×</button>
          )}
          <div style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Your coach</div>
          {agentLoading
            ? <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Reading your cup…</p>
            : <p style={{ fontSize: 15, lineHeight: 1.6, paddingRight: 20 }}>{agentMsg}</p>}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Brew</h2>
        <button onClick={() => setView('shots')} style={{ fontSize: 13, color: 'var(--accent)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px' }}>
          Shots ({sessions.length})
        </button>
      </div>

      {/* Coach trigger — summoned, never pushed */}
      <button
        onClick={handleDialMeIn}
        disabled={!navigator.onLine || agentLoading}
        style={{
          width: '100%', padding: '13px 0', borderRadius: 12, fontWeight: 600, fontSize: 15,
          marginBottom: 8,
          background: navigator.onLine ? 'var(--accent)' : 'var(--surface-2)',
          color: navigator.onLine ? '#fff' : 'var(--text-muted)',
          border: navigator.onLine ? 'none' : '1px solid var(--border)',
          opacity: agentLoading ? 0.7 : 1,
        }}
      >
        ☕ {agentLoading ? 'Reading your cup…' : 'Dial me in'}
      </button>
      {!navigator.onLine && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textAlign: 'center' }}>
          The coach needs a connection — your brews still log offline.
        </p>
      )}

      {/* Preset quick-switch */}
      {profile?.gear_presets?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
          {profile.gear_presets.map(p => (
            <button key={p.id} onClick={() => applyPreset(p)} style={{ whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: 20, fontSize: 13, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--accent)' }}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Ratio */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>{ratio}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ratio</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Bean section ──────────────────────────────────────────────── */}
        <SectionLabel>Bean</SectionLabel>
        <Row label="Name">
          <input value={beanName} onChange={e => setBeanName(e.target.value)} placeholder="e.g. Torebadiya" />
        </Row>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Row label="Origin">
            <input value={beanOrigin} onChange={e => setBeanOrigin(e.target.value)} placeholder="e.g. Ethiopia" />
          </Row>
          <Row label="Farm / Producer">
            <input value={beanFarm} onChange={e => setBeanFarm(e.target.value)} placeholder="e.g. Torebadiya" />
          </Row>
        </div>
        <Row label="Process">
          <select value={beanProcess} onChange={e => setBeanProcess(e.target.value)}>
            <option value="">Select process…</option>
            {PROCESSES.map(p => <option key={p}>{p}</option>)}
          </select>
        </Row>

        {/* ── Method section ────────────────────────────────────────────── */}
        <SectionLabel>Method</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Row label="Method">
            <select value={method} onChange={e => setMethod(e.target.value)}>
              {METHODS.map(m => <option key={m.id}>{m.id}</option>)}
            </select>
          </Row>
          <Row label="Vessel / Model">
            <input value={vessel} onChange={e => setVessel(e.target.value)} placeholder="e.g. V60-02" />
          </Row>
        </div>

        {/* ── Grinder (always shown) ───────────────────────────────────── */}
        <SectionLabel>Grinder</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Row label="Grinder">
            <input value={grindDev} onChange={e => setGrindDev(e.target.value)} placeholder="e.g. Comandante" />
          </Row>
          <Row label="Grind #">
            <input type="number" inputMode="decimal" value={grind} onChange={e => setGrind(e.target.value)} placeholder="20" />
          </Row>
        </div>

        {/* ── Method-aware parameters ──────────────────────────────────── */}
        <SectionLabel>Parameters</SectionLabel>

        {methodType === 'pour-over' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Row label="Dose (g)">
                <input type="number" inputMode="decimal" value={dose} onChange={e => setDose(e.target.value)} placeholder="15" />
              </Row>
              <Row label="Temp (°C)">
                <input type="number" inputMode="decimal" value={temp} onChange={e => setTemp(e.target.value)} placeholder="93" />
              </Row>
            </div>
            <PourSequence pours={pours} onChange={setPours} totalWeight={totalPourWeight} />
          </>
        )}

        {methodType === 'espresso' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Row label="Dose (g)">
                <input type="number" inputMode="decimal" value={espDose} onChange={e => setEspDose(e.target.value)} placeholder="18" />
              </Row>
              <Row label="Yield (g)">
                <input type="number" inputMode="decimal" value={espYield} onChange={e => setEspYield(e.target.value)} placeholder="36" />
              </Row>
              <Row label="Pre-infusion (s)">
                <input type="number" inputMode="decimal" value={preInfusion} onChange={e => setPreInfusion(e.target.value)} placeholder="5" />
              </Row>
              <Row label="Shot time (s)">
                <input type="number" inputMode="decimal" value={shotTime} onChange={e => setShotTime(e.target.value)} placeholder="28" />
              </Row>
            </div>
          </div>
        )}

        {methodType === 'aeropress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Row label="Style">
              <select value={apStyle} onChange={e => setApStyle(e.target.value)}>
                <option>Standard</option>
                <option>Inverted</option>
                <option>Zero Bypass</option>
              </select>
            </Row>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Row label="Dose (g)">
                <input type="number" inputMode="decimal" value={apDose} onChange={e => setApDose(e.target.value)} placeholder="17" />
              </Row>
              <Row label="Water (ml)">
                <input type="number" inputMode="decimal" value={apWater} onChange={e => setApWater(e.target.value)} placeholder="200" />
              </Row>
              <Row label="Steep time">
                <input value={steepTime} onChange={e => setSteepTime(e.target.value)} placeholder="2:00" />
              </Row>
              <Row label="Bypass (ml)">
                <input type="number" inputMode="decimal" value={bypass} onChange={e => setBypass(e.target.value)} placeholder="0" />
              </Row>
            </div>
          </div>
        )}

        {(methodType === 'immersion' || methodType === 'simple') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Row label="Dose (g)">
              <input type="number" inputMode="decimal" value={imDose} onChange={e => setImDose(e.target.value)} placeholder="30" />
            </Row>
            <Row label="Water (ml)">
              <input type="number" inputMode="decimal" value={imWater} onChange={e => setImWater(e.target.value)} placeholder="500" />
            </Row>
            <Row label="Time">
              <input value={imTime} onChange={e => setImTime(e.target.value)} placeholder="4:00" />
            </Row>
          </div>
        )}

        {/* ── Notes ──────────────────────────────────────────────────────── */}
        <Row label="Notes (optional)">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tasting notes, observations…" rows={3} style={{ resize: 'none' }} />
        </Row>

        {/* ── Outcome chips ───────────────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>How did it taste?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {OUTCOMES.map(o => (
              <button key={o.id} onClick={() => setOutcome(outcome === o.id ? null : o.id)} style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500,
                border: `1px solid ${outcome === o.id ? o.color : 'var(--border)'}`,
                background: outcome === o.id ? o.color + '22' : 'var(--surface-2)',
                color: outcome === o.id ? o.color : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>{o.label}</button>
            ))}
          </div>
        </div>

        <button onClick={handleLog} disabled={!outcome} style={{
          marginTop: 8, padding: '15px 0', borderRadius: 12, fontWeight: 600, fontSize: 16,
          background: outcome ? 'var(--accent)' : 'var(--surface-2)',
          color: outcome ? '#fff' : 'var(--text-muted)',
          transition: 'all 0.2s',
        }}>
          Log this brew
        </button>
      </div>
    </div>
  );
}

// ── Pour sequence component ───────────────────────────────────────────────────

function PourSequence({ pours, onChange, totalWeight }) {
  function update(i, field, val) {
    const next = pours.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
    onChange(next);
  }
  function addPour() { onChange([...pours, emptyPour()]); }
  function removePour(i) { onChange(pours.filter((_, idx) => idx !== i)); }

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Pour sequence</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pours.map((pour, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 20, flexShrink: 0 }}>{i + 1}</span>
            <input
              value={pour.time}
              onChange={e => update(i, 'time', e.target.value)}
              placeholder="0:30"
              style={{ flex: 1, padding: '8px 10px', fontSize: 14 }}
            />
            <input
              type="number"
              inputMode="decimal"
              value={pour.weight}
              onChange={e => update(i, 'weight', e.target.value)}
              placeholder="g"
              style={{ flex: 1, padding: '8px 10px', fontSize: 14 }}
            />
            {pours.length > 1 && (
              <button onClick={() => removePour(i)} style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0, width: 28 }}>×</button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button onClick={addPour} style={{ fontSize: 13, color: 'var(--accent)' }}>+ Add pour</button>
        {totalWeight > 0 && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total: {totalWeight}g</span>
        )}
      </div>
    </div>
  );
}

// ── Shot row ─────────────────────────────────────────────────────────────────

function ShotRow({ session }) {
  const bean = session.bean?.name || session.bean || 'Unknown bean';
  const farm = session.bean?.farm;
  const process = session.bean?.process;
  const p = session.parameters || {};

  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: OUTCOME_DOT[session.outcome] || 'var(--text-muted)', marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {bean}{farm ? ` · ${farm}` : ''}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {session.method}{session.vessel ? ` · ${session.vessel}` : ''} · {session.outcome}
          {process ? ` · ${process}` : ''}
        </div>
        {p.pours?.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {p.pours.length} pours · {p.total_yield}g total
          </div>
        )}
        {session.notes && <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-muted)' }}>{session.notes}</p>}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(session.timestamp).toLocaleDateString()}</div>
      </div>
    </div>
  );
}

// ── Tiny layout helpers ───────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
      {children}
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
