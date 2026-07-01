import { useState, useEffect } from 'react';
import {
  getSessions, addSession, getProfile,
  getGear, addGear, getBeans, addBean,
  getSetups, addSetup, touchSetup,
} from '../lib/storage';
import { LEXICON, LEXICON_GROUPS } from '../lib/lexicon';
import { FLAW_TIPS } from '../lib/tips';

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

const ROAST_LEVELS = ['Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'];

const VERDICTS = [
  { id: 'enjoyed',     label: 'Enjoyed it',   color: 'var(--green)' },
  { id: 'enjoyed_but', label: 'Enjoyed, but…', color: 'var(--amber)' },
  { id: 'not_enjoyed', label: "Didn't enjoy", color: 'var(--red)'   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// Pour-over is split into at least three named phases. Bloom is structurally the
// start, so 0:00 is a real default; the other times are greyed suggestions only —
// nothing is saved unless the user actually types it (blank means blank).
function seededPours() {
  return [
    { label: 'Bloom',    time: '0:00', weight: '' },
    { label: '1st pour', time: '',     weight: '' },
    { label: 'End',      time: '',     weight: '' },
  ];
}

function pourHint(label) {
  if (label === 'Bloom')    return '0:00';
  if (label === '1st pour') return '0:45';
  if (label === 'End')      return '2:00';
  return '0:30';
}

function calcRatio(dose, totalWeight) {
  const d = parseFloat(dose);
  const w = parseFloat(totalWeight);
  if (!d || !w || d === 0) return '—';
  return `1:${(w / d).toFixed(1)}`;
}

function describeBean(b) {
  if (!b) return '';
  return [b.name, b.farm ? ` · ${b.farm}` : '', b.process ? ` · ${b.process}` : '']
    .filter(Boolean).join('');
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Brew({ profile, onUpdate, onSessionLogged }) {
  const [view, setView] = useState('dialer');

  const refresh = () => onUpdate?.(getProfile(profile.id));

  // Libraries (drawn from the profile — the single source of truth)
  const grinders = getGear(profile.id, { activeOnly: true }).filter(g => g.category === 'grinder');
  const brewers  = getGear(profile.id, { activeOnly: true }).filter(g => g.category === 'brewer');
  const beans    = getBeans(profile.id);
  const setups   = getSetups(profile.id);

  // Selections
  const [grinderId, setGrinderId] = useState('');
  const [brewerId,  setBrewerId]  = useState('');
  const [beanId,    setBeanId]    = useState('');

  // Method + params — all BLANK until chosen/typed
  const [method, setMethod] = useState('');
  const methodType = METHOD_TYPE[method] || null;
  const [grind, setGrind]   = useState('');

  // Pour-over
  const [pours, setPours] = useState(seededPours());
  const [temp,  setTemp]  = useState('');
  const [dose,  setDose]  = useState('');
  const totalPourWeight = pours.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0);

  // Espresso
  const [espDose, setEspDose]         = useState('');
  const [espYield, setEspYield]       = useState('');
  const [preInfusion, setPreInfusion] = useState('');
  const [shotTime, setShotTime]       = useState('');

  // AeroPress
  const [apStyle, setApStyle]     = useState('');
  const [apDose, setApDose]       = useState('');
  const [apWater, setApWater]     = useState('');
  const [steepTime, setSteepTime] = useState('');
  const [bypass, setBypass]       = useState('');

  // Immersion / simple
  const [imDose, setImDose]   = useState('');
  const [imWater, setImWater] = useState('');
  const [imTime, setImTime]   = useState('');

  // Impression (the conclusion)
  const [verdict, setVerdict]         = useState(null);
  const [descriptors, setDescriptors] = useState([]);
  const [customWord, setCustomWord]   = useState('');
  const [liked, setLiked]             = useState('');
  const [disliked, setDisliked]       = useState('');
  const [showDetail, setShowDetail]   = useState(false);

  // Add-new sub-forms
  const [addingBean, setAddingBean] = useState(false);
  const [newBean, setNewBean]       = useState({ name: '', origin: '', farm: '', process: '', roast_level: '' });

  // Save-as-favorite
  const [savingFav, setSavingFav] = useState(false);
  const [favName, setFavName]     = useState('');
  const [favSaved, setFavSaved]   = useState(false);

  // Post-log / coach
  const [sessions, setSessions]         = useState([]);
  const [tip, setTip]                   = useState(null);
  const [agentMsg, setAgentMsg]         = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);

  useEffect(() => {
    if (profile?.id) setSessions(getSessions(profile.id));
  }, [profile]);
  // NOTE: no auto-apply of any preset on mount — the form starts blank on purpose.

  const selectedBean = beans.find(b => b.id === beanId) || null;
  const gearFloorMet = !!grinderId && !!brewerId;   // ≥1 grinder + 1 brewer, drawn from profile
  const canDial = gearFloorMet && !!method;
  const canLog  = canDial && !!verdict;

  // ── Snapshot / restore for favorites ────────────────────────────────────────
  function snapshotForm() {
    return { method, grind, dose, temp, pours,
      espDose, espYield, preInfusion, shotTime,
      apStyle, apDose, apWater, steepTime, bypass,
      imDose, imWater, imTime };
  }
  function restoreForm(p = {}) {
    if (p.grind != null) setGrind(p.grind);
    if (p.dose != null) setDose(p.dose);
    if (p.temp != null) setTemp(p.temp);
    if (Array.isArray(p.pours)) setPours(p.pours);
    if (p.espDose != null) setEspDose(p.espDose);
    if (p.espYield != null) setEspYield(p.espYield);
    if (p.preInfusion != null) setPreInfusion(p.preInfusion);
    if (p.shotTime != null) setShotTime(p.shotTime);
    if (p.apStyle != null) setApStyle(p.apStyle);
    if (p.apDose != null) setApDose(p.apDose);
    if (p.apWater != null) setApWater(p.apWater);
    if (p.steepTime != null) setSteepTime(p.steepTime);
    if (p.bypass != null) setBypass(p.bypass);
    if (p.imDose != null) setImDose(p.imDose);
    if (p.imWater != null) setImWater(p.imWater);
    if (p.imTime != null) setImTime(p.imTime);
  }

  function applySetup(setup) {
    if (setup.method) setMethod(setup.method);
    const activeIds = new Set(grinders.concat(brewers).map(g => g.id));
    const g = (setup.gear_ids || []).find(id => grinders.some(x => x.id === id));
    const b = (setup.gear_ids || []).find(id => brewers.some(x => x.id === id));
    setGrinderId(g && activeIds.has(g) ? g : '');
    setBrewerId(b && activeIds.has(b) ? b : '');
    setBeanId(setup.bean_id && beans.some(x => x.id === setup.bean_id) ? setup.bean_id : '');
    restoreForm(setup.params);
    touchSetup(profile.id, setup.id);
    refresh();
  }

  // ── Gear / bean add ──────────────────────────────────────────────────────────
  function handleAddGear(category, name) {
    const item = addGear(profile.id, { category, name });
    if (category === 'grinder') setGrinderId(item.id);
    if (category === 'brewer')  setBrewerId(item.id);
    refresh();
  }

  function handleAddBean() {
    if (!newBean.name.trim()) return;
    const bean = addBean(profile.id, { ...newBean, name: newBean.name.trim() });
    setBeanId(bean.id);
    setNewBean({ name: '', origin: '', farm: '', process: '', roast_level: '' });
    setAddingBean(false);
    refresh();
  }

  function handleSaveFavorite() {
    if (!favName.trim()) return;
    addSetup(profile.id, {
      name: favName.trim(),
      gear_ids: [grinderId, brewerId].filter(Boolean),
      bean_id: beanId || null,
      method,
      params: snapshotForm(),
    });
    setFavName('');
    setSavingFav(false);
    setFavSaved(true);
    refresh();
  }

  // ── Descriptor toggle ─────────────────────────────────────────────────────────
  function toggleWord(word) {
    setDescriptors(d => d.includes(word) ? d.filter(w => w !== word) : [...d, word]);
  }
  function addCustomWord() {
    const w = customWord.trim().toLowerCase();
    if (w && !descriptors.includes(w)) setDescriptors(d => [...d, w]);
    setCustomWord('');
  }

  // ── Ratio ──────────────────────────────────────────────────────────────────
  const ratio = (() => {
    if (methodType === 'espresso')  return calcRatio(espDose, espYield);
    if (methodType === 'pour-over') return calcRatio(dose, totalPourWeight);
    if (methodType === 'aeropress') return calcRatio(apDose, parseFloat(apWater || 0) + parseFloat(bypass || 0));
    if (methodType === 'immersion') return calcRatio(imDose, imWater);
    return '—';
  })();

  function buildSessionParams() {
    const grinderName = grinders.find(g => g.id === grinderId)?.name || '';
    const base = { grind, grind_device: grinderName };
    if (methodType === 'espresso') return { dose: espDose, yield: espYield, pre_infusion: preInfusion, time: shotTime, ...base };
    if (methodType === 'pour-over') return { dose, pours: pours.filter(p => p.time || p.weight), total_yield: totalPourWeight, temp, ...base };
    if (methodType === 'aeropress') return { style: apStyle, dose: apDose, water: apWater, bypass, steep_time: steepTime, ...base };
    if (methodType === 'immersion') return { dose: imDose, water: imWater, time: imTime, ...base };
    return { dose: imDose, yield: imWater, time: imTime, ...base };
  }

  function buildSession() {
    const brewerName = brewers.find(b => b.id === brewerId)?.name || '';
    return {
      bean: selectedBean
        ? { name: selectedBean.name, origin: selectedBean.origin, farm: selectedBean.farm, process: selectedBean.process, roast_level: selectedBean.roast_level }
        : null,
      method,
      vessel: brewerName,
      parameters: buildSessionParams(),
      impression: { verdict, liked, disliked, descriptors },
    };
  }

  function resetImpression() {
    setVerdict(null); setDescriptors([]); setCustomWord('');
    setLiked(''); setDisliked(''); setShowDetail(false);
  }

  function handleLog() {
    if (!canLog) return;
    const next = addSession(profile.id, buildSession());
    setSessions(next);
    onSessionLogged?.();
    refresh();

    // Post-log tip: only if a known flaw-word was named (else the coach is the helper).
    const flaw = descriptors.find(d => FLAW_TIPS[d]);
    setTip(flaw ? FLAW_TIPS[flaw] : null);

    // Reset the taste-specific fields; keep gear/method/bean for the next cup.
    setPours(seededPours()); setDose('');
    setEspDose(''); setEspYield(''); setPreInfusion(''); setShotTime('');
    setApDose(''); setApWater(''); setSteepTime(''); setBypass('');
    setImDose(''); setImWater(''); setImTime('');
    resetImpression();
    setFavSaved(false);
  }

  async function handleDialMeIn() {
    if (!navigator.onLine || !canDial) return;
    setAgentLoading(true);
    setAgentMsg(null);
    try {
      const res = await fetch('/.netlify/functions/dial-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: buildSession(), tasteIdentity: profile?.taste_identity || {}, recentSessions: sessions.slice(0, 5) }),
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
    recent.forEach(s => {
      const v = s.impression?.verdict || s.outcome;
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!top || top[0] === 'enjoyed' || top[0] === 'balanced' || top[1] < 3) return null;
    return `Your last ${recent.length} brews trended ${top[0].replace('_', ' ')}.`;
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

      {/* Favorites — the two-flick door */}
      {setups.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your favorites</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {setups.map(su => (
              <button key={su.id} onClick={() => applySetup(su)} style={{ whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 20, fontSize: 13, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--accent)' }}>
                ☆ {su.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Coach trigger — summoned, never pushed */}
      <button
        onClick={handleDialMeIn}
        disabled={!navigator.onLine || agentLoading || !canDial}
        style={{
          width: '100%', padding: '13px 0', borderRadius: 12, fontWeight: 600, fontSize: 15, marginBottom: 8,
          background: (navigator.onLine && canDial) ? 'var(--accent)' : 'var(--surface-2)',
          color: (navigator.onLine && canDial) ? '#fff' : 'var(--text-muted)',
          border: (navigator.onLine && canDial) ? 'none' : '1px solid var(--border)',
          opacity: agentLoading ? 0.7 : 1,
        }}
      >
        ☕ {agentLoading ? 'Reading your cup…' : 'Dial me in'}
      </button>
      {!navigator.onLine ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textAlign: 'center' }}>
          The coach needs a connection — your brews still log offline.
        </p>
      ) : !canDial && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textAlign: 'center' }}>
          Pick your grinder, brewer and method first.
        </p>
      )}

      {/* Ratio */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>{ratio}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ratio</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Bean ──────────────────────────────────────────────────────── */}
        <SectionLabel>Bean</SectionLabel>
        <ChipPicker
          items={beans.map(b => ({ id: b.id, label: describeBean(b) }))}
          valueId={beanId}
          onSelect={id => { setBeanId(id === beanId ? '' : id); setAddingBean(false); }}
          addLabel="＋ Add bean"
          onAddClick={() => { setAddingBean(a => !a); }}
          adding={addingBean}
          emptyHint="No beans yet — add one to your bank."
        />
        {addingBean && (
          <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--accent)44', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={newBean.name} onChange={e => setNewBean({ ...newBean, name: e.target.value })} placeholder="Bean name (e.g. Torebadiya)" autoFocus />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input value={newBean.origin} onChange={e => setNewBean({ ...newBean, origin: e.target.value })} placeholder="Origin" />
              <input value={newBean.farm} onChange={e => setNewBean({ ...newBean, farm: e.target.value })} placeholder="Farm / Producer" />
              <select value={newBean.process} onChange={e => setNewBean({ ...newBean, process: e.target.value })}>
                <option value="">Process…</option>
                {PROCESSES.map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={newBean.roast_level} onChange={e => setNewBean({ ...newBean, roast_level: e.target.value })}>
                <option value="">Roast level…</option>
                {ROAST_LEVELS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAddBean} disabled={!newBean.name.trim()} style={{ flex: 1, background: newBean.name.trim() ? 'var(--accent)' : 'var(--surface-2)', color: newBean.name.trim() ? '#fff' : 'var(--text-muted)', padding: 10, borderRadius: 10, fontWeight: 600 }}>Save bean</button>
              <button onClick={() => setAddingBean(false)} style={{ flex: 1, background: 'var(--surface-2)', color: 'var(--text-muted)', padding: 10, borderRadius: 10, border: '1px solid var(--border)' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Gear (drawn from your profile) ─────────────────────────────── */}
        <SectionLabel>Gear</SectionLabel>
        <Row label="Grinder">
          <GearPicker category="grinder" items={grinders} valueId={grinderId}
            onSelect={id => setGrinderId(id === grinderId ? '' : id)}
            onAdd={name => handleAddGear('grinder', name)}
            placeholder="e.g. Comandante C40"
            emptyHint="No grinder yet — add yours (it lives in your profile)." />
        </Row>
        <Row label="Brewer">
          <GearPicker category="brewer" items={brewers} valueId={brewerId}
            onSelect={id => setBrewerId(id === brewerId ? '' : id)}
            onAdd={name => handleAddGear('brewer', name)}
            placeholder="e.g. Hario V60-02"
            emptyHint="No brewer yet — add yours (it lives in your profile)." />
        </Row>

        {/* ── Method ─────────────────────────────────────────────────────── */}
        <SectionLabel>Method</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Row label="Method">
            <select value={method} onChange={e => setMethod(e.target.value)}>
              <option value="">Select method…</option>
              {METHODS.map(m => <option key={m.id}>{m.id}</option>)}
            </select>
          </Row>
          <Row label="Grind #">
            <input type="number" inputMode="decimal" value={grind} onChange={e => setGrind(e.target.value)} placeholder="e.g. 20" />
          </Row>
        </div>

        {/* ── Method-aware parameters ──────────────────────────────────── */}
        {methodType && <SectionLabel>Parameters</SectionLabel>}

        {methodType === 'pour-over' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Row label="Dose (g)">
                <input type="number" inputMode="decimal" value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 15" />
              </Row>
              <Row label="Temp (°C)">
                <input type="number" inputMode="decimal" value={temp} onChange={e => setTemp(e.target.value)} placeholder="e.g. 93" />
              </Row>
            </div>
            <PourSequence pours={pours} onChange={setPours} totalWeight={totalPourWeight} />
          </>
        )}

        {methodType === 'espresso' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Row label="Dose (g)"><input type="number" inputMode="decimal" value={espDose} onChange={e => setEspDose(e.target.value)} placeholder="e.g. 18" /></Row>
            <Row label="Yield (g)"><input type="number" inputMode="decimal" value={espYield} onChange={e => setEspYield(e.target.value)} placeholder="e.g. 36" /></Row>
            <Row label="Pre-infusion (s)"><input type="number" inputMode="decimal" value={preInfusion} onChange={e => setPreInfusion(e.target.value)} placeholder="e.g. 5" /></Row>
            <Row label="Shot time (s)"><input type="number" inputMode="decimal" value={shotTime} onChange={e => setShotTime(e.target.value)} placeholder="e.g. 28" /></Row>
          </div>
        )}

        {methodType === 'aeropress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Row label="Style">
              <select value={apStyle} onChange={e => setApStyle(e.target.value)}>
                <option value="">Select style…</option>
                <option>Standard</option><option>Inverted</option><option>Zero Bypass</option>
              </select>
            </Row>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Row label="Dose (g)"><input type="number" inputMode="decimal" value={apDose} onChange={e => setApDose(e.target.value)} placeholder="e.g. 17" /></Row>
              <Row label="Water (ml)"><input type="number" inputMode="decimal" value={apWater} onChange={e => setApWater(e.target.value)} placeholder="e.g. 200" /></Row>
              <Row label="Steep time"><input value={steepTime} onChange={e => setSteepTime(e.target.value)} placeholder="e.g. 2:00" /></Row>
              <Row label="Bypass (ml)"><input type="number" inputMode="decimal" value={bypass} onChange={e => setBypass(e.target.value)} placeholder="e.g. 0" /></Row>
            </div>
          </div>
        )}

        {(methodType === 'immersion' || methodType === 'simple') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Row label="Dose (g)"><input type="number" inputMode="decimal" value={imDose} onChange={e => setImDose(e.target.value)} placeholder="e.g. 30" /></Row>
            <Row label="Water (ml)"><input type="number" inputMode="decimal" value={imWater} onChange={e => setImWater(e.target.value)} placeholder="e.g. 500" /></Row>
            <Row label="Time"><input value={imTime} onChange={e => setImTime(e.target.value)} placeholder="e.g. 4:00" /></Row>
          </div>
        )}

        {/* ── Conclusion: the impression ─────────────────────────────────── */}
        <SectionLabel>How was it?</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {VERDICTS.map(v => (
            <button key={v.id} onClick={() => setVerdict(verdict === v.id ? null : v.id)} style={{
              padding: '9px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500,
              border: `1px solid ${verdict === v.id ? v.color : 'var(--border)'}`,
              background: verdict === v.id ? v.color + '22' : 'var(--surface-2)',
              color: verdict === v.id ? v.color : 'var(--text-muted)',
            }}>{v.label}</button>
          ))}
        </div>

        {verdict && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Any words that fit? (optional — tap what feels right)
            </div>
            {LEXICON_GROUPS.map(group => (
              <div key={group.hint} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{group.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {LEXICON.filter(w => w.hint === group.hint).map(w => (
                    <button key={w.word} onClick={() => toggleWord(w.word)} style={{
                      padding: '5px 12px', borderRadius: 16, fontSize: 13,
                      border: `1px solid ${descriptors.includes(w.word) ? 'var(--accent)' : 'var(--border)'}`,
                      background: descriptors.includes(w.word) ? 'var(--accent)22' : 'var(--surface-2)',
                      color: descriptors.includes(w.word) ? 'var(--accent)' : 'var(--text-muted)',
                    }}>{w.word}</button>
                  ))}
                </div>
              </div>
            ))}
            {/* custom words the user typed themselves */}
            {descriptors.filter(d => !LEXICON.some(w => w.word === d)).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {descriptors.filter(d => !LEXICON.some(w => w.word === d)).map(d => (
                  <button key={d} onClick={() => toggleWord(d)} style={{ padding: '5px 12px', borderRadius: 16, fontSize: 13, border: '1px solid var(--accent)', background: 'var(--accent)22', color: 'var(--accent)' }}>{d} ×</button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={customWord} onChange={e => setCustomWord(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomWord(); } }} placeholder="…or your own word" style={{ flex: 1 }} />
              <button onClick={addCustomWord} style={{ color: 'var(--accent)', fontWeight: 600, padding: '0 12px' }}>Add</button>
            </div>

            <button onClick={() => setShowDetail(d => !d)} style={{ fontSize: 13, color: 'var(--accent)', textAlign: 'left' }}>
              {showDetail ? '− Less' : '＋ Say more (optional)'}
            </button>
            {showDetail && (
              <>
                <Row label="What was good?">
                  <textarea value={liked} onChange={e => setLiked(e.target.value)} rows={2} placeholder="What you liked…" style={{ resize: 'none' }} />
                </Row>
                <Row label="What didn't you like?">
                  <textarea value={disliked} onChange={e => setDisliked(e.target.value)} rows={2} placeholder="What felt off…" style={{ resize: 'none' }} />
                </Row>
              </>
            )}
          </>
        )}

        {/* ── Log ────────────────────────────────────────────────────────── */}
        <button onClick={handleLog} disabled={!canLog} style={{
          marginTop: 8, padding: '15px 0', borderRadius: 12, fontWeight: 600, fontSize: 16,
          background: canLog ? 'var(--accent)' : 'var(--surface-2)',
          color: canLog ? '#fff' : 'var(--text-muted)',
        }}>
          Log this brew
        </button>
        {!canLog && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            {!gearFloorMet ? 'Pick a grinder and a brewer to log.' : !method ? 'Choose a method to log.' : 'Say how it was to log.'}
          </p>
        )}

        {/* Save as favorite */}
        {canDial && (
          savingFav ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={favName} onChange={e => setFavName(e.target.value)} placeholder="Name this favorite (e.g. V60 · Yrg bliss)" autoFocus style={{ flex: 1 }} />
              <button onClick={handleSaveFavorite} disabled={!favName.trim()} style={{ color: favName.trim() ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, padding: '0 12px' }}>Save</button>
              <button onClick={() => setSavingFav(false)} style={{ color: 'var(--text-muted)', padding: '0 8px' }}>×</button>
            </div>
          ) : (
            <button onClick={() => { setSavingFav(true); setFavSaved(false); }} style={{ fontSize: 13, color: favSaved ? 'var(--green)' : 'var(--accent)', textAlign: 'center' }}>
              {favSaved ? '☆ Saved to favorites' : '☆ Save as favorite'}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ── Chip picker (beans) ─────────────────────────────────────────────────────
function ChipPicker({ items, valueId, onSelect, addLabel, onAddClick, adding, emptyHint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.length === 0 && !adding && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{emptyHint}</div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {items.map(it => (
          <button key={it.id} onClick={() => onSelect(it.id)} style={{
            padding: '7px 14px', borderRadius: 20, fontSize: 13,
            border: `1px solid ${valueId === it.id ? 'var(--accent)' : 'var(--border)'}`,
            background: valueId === it.id ? 'var(--accent)22' : 'var(--surface-2)',
            color: valueId === it.id ? 'var(--accent)' : 'var(--text)',
          }}>{it.label}</button>
        ))}
        <button onClick={onAddClick} style={{ padding: '7px 12px', fontSize: 13, color: 'var(--accent)' }}>{addLabel}</button>
      </div>
    </div>
  );
}

// ── Gear picker (grinder / brewer) — draws from the profile library ─────────
function GearPicker({ items, valueId, onSelect, onAdd, placeholder, emptyHint }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  function submit() {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
    setAdding(false);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.length === 0 && !adding && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{emptyHint}</div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {items.map(it => (
          <button key={it.id} onClick={() => onSelect(it.id)} style={{
            padding: '7px 14px', borderRadius: 20, fontSize: 13,
            border: `1px solid ${valueId === it.id ? 'var(--accent)' : 'var(--border)'}`,
            background: valueId === it.id ? 'var(--accent)22' : 'var(--surface-2)',
            color: valueId === it.id ? 'var(--accent)' : 'var(--text)',
          }}>{it.name}</button>
        ))}
        {!adding && <button onClick={() => setAdding(true)} style={{ padding: '7px 12px', fontSize: 13, color: 'var(--accent)' }}>＋ Add</button>}
      </div>
      {adding && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }} placeholder={placeholder} autoFocus style={{ flex: 1 }} />
          <button onClick={submit} disabled={!name.trim()} style={{ color: name.trim() ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, padding: '0 12px' }}>Add</button>
          <button onClick={() => { setAdding(false); setName(''); }} style={{ color: 'var(--text-muted)', padding: '0 8px' }}>×</button>
        </div>
      )}
    </div>
  );
}

// ── Pour sequence — labeled phases, "+" beside the last row ─────────────────
function PourSequence({ pours, onChange, totalWeight }) {
  function update(i, field, val) {
    onChange(pours.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  }
  function addPour() { onChange([...pours, { label: `Pour ${pours.length + 1}`, time: '', weight: '' }]); }
  function removePour(i) { onChange(pours.filter((_, idx) => idx !== i)); }

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Pour sequence</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pours.map((pour, i) => {
          const isLast = i === pours.length - 1;
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 62, flexShrink: 0 }}>{pour.label || `Pour ${i + 1}`}</span>
              <input value={pour.time} onChange={e => update(i, 'time', e.target.value)} placeholder={pourHint(pour.label)} style={{ flex: 1, padding: '8px 10px', fontSize: 14 }} />
              <input type="number" inputMode="decimal" value={pour.weight} onChange={e => update(i, 'weight', e.target.value)} placeholder="g" style={{ flex: 1, padding: '8px 10px', fontSize: 14 }} />
              {isLast
                ? <button onClick={addPour} title="Add a phase" style={{ color: 'var(--accent)', fontSize: 22, flexShrink: 0, width: 28 }}>＋</button>
                : <span style={{ width: 28, flexShrink: 0 }} />}
              {pours.length > 1 && (
                <button onClick={() => removePour(i)} title="Remove" style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0, width: 24 }}>×</button>
              )}
            </div>
          );
        })}
      </div>
      {totalWeight > 0 && (
        <div style={{ textAlign: 'right', marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>Total: {totalWeight}g</div>
      )}
    </div>
  );
}

// ── Shot row ─────────────────────────────────────────────────────────────────
function ShotRow({ session }) {
  const bean = session.bean?.name || (typeof session.bean === 'string' ? session.bean : null) || 'No bean';
  const farm = session.bean?.farm;
  const process = session.bean?.process;
  const p = session.parameters || {};
  const imp = session.impression || {};
  const verdict = imp.verdict || session.outcome;
  const dot = verdict === 'enjoyed' ? 'var(--green)'
    : verdict === 'enjoyed_but' ? 'var(--amber)'
    : verdict === 'not_enjoyed' ? 'var(--red)'
    : 'var(--text-muted)';
  const verdictLabel = { enjoyed: 'Enjoyed', enjoyed_but: 'Enjoyed, but…', not_enjoyed: "Didn't enjoy" }[verdict] || verdict || '—';

  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: dot, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {bean}{farm ? ` · ${farm}` : ''}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {session.method}{session.vessel ? ` · ${session.vessel}` : ''} · {verdictLabel}
          {process ? ` · ${process}` : ''}
        </div>
        {imp.descriptors?.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{imp.descriptors.join(', ')}</div>
        )}
        {p.pours?.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.pours.length} pours · {p.total_yield}g total</div>
        )}
        {(imp.liked || imp.disliked) && (
          <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-muted)' }}>
            {imp.liked && `＋ ${imp.liked}`}{imp.liked && imp.disliked ? '  ' : ''}{imp.disliked && `− ${imp.disliked}`}
          </p>
        )}
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
