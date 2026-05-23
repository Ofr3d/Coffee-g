import { useState, useEffect, useRef } from "react";

// ─── Logo ─────────────────────────────────────────────────────────────────────
const LOGO_URI = "/logo.png";

// ─── Storage helpers ───────────────────────────────────────────────────────
const sk = (uid, key) => `coffeeg:${uid}:${key}`;
const gset = async (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
const gget = async (key) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; } };

// ─── Constants ─────────────────────────────────────────────────────────────
const USERS_KEY = "coffeeg:users";
const ACTIVE_USER_KEY = "coffeeg:activeUser";
const FIRST_LAUNCH_KEY = "coffeeg:firstLaunch";
const RATE_KEY = "coffeeg:rate";

const makeUser = (name, pin) => ({
  id: Math.random().toString(36).slice(2),
  name, pin,
  identityEnabled: true,
  createdAt: Date.now(),
});

const makePreset = (name = "My Rig") => ({
  id: Math.random().toString(36).slice(2),
  name,
  grinder: "", burrs: "", apparatus: "", filter: "", water: "", customVars: [],
});

const BREW_METHODS = ["Espresso","Pour Over","French Press","Moka Pot","AeroPress","Cold Brew","Chemex","V60"];
const PRESET_VARS = ["Grinder","Burrs","Apparatus / Machine","Filter","Water (TDS/source)","Dose (g)","Yield (g)","Brew time","Grind size","Water temp (°C)","Pre-infusion","Tamping pressure","Roast level","Bean origin","Roast date"];
const TASTE_OPTIONS = ["Sour","Bitter","Sweet","Salty","Flat","Bright","Balanced","Harsh","Thin","Syrupy","Fruity","Nutty","Chocolatey","Ashy","Floral","Earthy"];

const CURRICULUM = [
  { level:"Beginner", color:"#7ec87e", lessons:[
    {id:"b1",title:"Sweet vs Sour",focus:"sweetness and acidity",challenge:"Find one sweet note and one sour note in your cup right now."},
    {id:"b2",title:"Bitter Basics",focus:"bitterness and roast character",challenge:"Notice where bitterness lands — front of tongue, back, or finish?"},
    {id:"b3",title:"Body & Weight",focus:"mouthfeel and body",challenge:"Is your cup thin like tea, or thick like cream? Describe the weight."},
    {id:"b4",title:"Aroma First",focus:"nose and fragrance",challenge:"Smell before you sip. What's the first thing your nose picks up?"},
    {id:"b5",title:"The Finish",focus:"aftertaste and finish length",challenge:"After swallowing, count how long the taste lingers. Short, medium, or long?"},
  ]},
  { level:"Intermediate", color:"#d4a45a", lessons:[
    {id:"i1",title:"Acidity Types",focus:"citric vs malic vs phosphoric acidity",challenge:"Is the acidity sharp like lemon, soft like apple, or clean and mineral?"},
    {id:"i2",title:"Fruit Families",focus:"identifying fruit notes",challenge:"Hunt for a fruit note. Is it citrus, stone fruit (peach/cherry), or berry?"},
    {id:"i3",title:"Roast Spectrum",focus:"light vs medium vs dark roast flavours",challenge:"Where on the spectrum does your cup sit? Floral/fruity → nutty/caramel → smoky/dark?"},
    {id:"i4",title:"Texture & Astringency",focus:"drying mouthfeel vs smooth",challenge:"Does the cup leave your mouth dry (astringent) or coated (smooth)?"},
    {id:"i5",title:"Balance",focus:"how elements integrate",challenge:"Does one element dominate, or do sweet/acid/bitter feel in harmony?"},
  ]},
  { level:"Advanced", color:"#c47a5a", lessons:[
    {id:"a1",title:"Terroir",focus:"origin characteristics by region",challenge:"Ethiopian tends floral/berry. Colombian tends caramel/red fruit. Can you taste origin in your cup?"},
    {id:"a2",title:"Process Flavours",focus:"washed vs natural vs honey process",challenge:"Does the cup taste clean and clear (washed) or fruity/funky/winey (natural)?"},
    {id:"a3",title:"Water Chemistry",focus:"how water affects extraction",challenge:"If you changed your water recently — can you taste the difference in clarity or flatness?"},
    {id:"a4",title:"Extraction Faults",focus:"under vs over extraction flavour signatures",challenge:"Identify one extraction fault in your last cup and name exactly what caused it."},
    {id:"a5",title:"Calibration",focus:"matching your palate to SCA standards",challenge:"Describe your cup using only SCA Flavour Wheel language. No generic words."},
  ]},
];

// ─── Tiny components ───────────────────────────────────────────────────────
function Grain() {
  return (
    <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",opacity:0.035,zIndex:0}}>
      <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#g)"/>
    </svg>
  );
}

function Steam({ delay=0 }) {
  return <span style={{display:"inline-block",width:2,height:16,borderRadius:4,background:"linear-gradient(to top,transparent,rgba(255,210,120,0.55))",marginRight:3,animation:`steam 1.9s ${delay}s ease-in-out infinite`}}/>;
}

function Bubble({ role, agent="DIAL", agentColor="#c4923a", children }) {
  return (
    <div style={{display:"flex",justifyContent:role==="user"?"flex-end":"flex-start",animation:"fadeUp 0.3s ease"}}>
      <div style={{
        maxWidth:"86%", padding:"10px 14px",
        borderRadius: role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: role==="user" ? "rgba(196,146,58,0.13)" : "rgba(255,255,255,0.045)",
        border: role==="user" ? "1px solid rgba(196,146,58,0.28)" : "1px solid rgba(255,255,255,0.07)",
        fontSize:15, lineHeight:1.58, color:"#f5e6c8",
      }}>
        {role==="assistant" && <div style={{fontSize:9,letterSpacing:3,color:agentColor,fontFamily:"Courier New",marginBottom:4}}>{agent}</div>}
        <div style={{whiteSpace:"pre-wrap"}}>{children}</div>
      </div>
    </div>
  );
}

function Thinking({ color="#c4923a", label="thinking" }) {
  return (
    <div style={{display:"flex"}}>
      <div style={{padding:"10px 14px",borderRadius:"16px 16px 16px 4px",background:"rgba(255,255,255,0.045)",border:"1px solid rgba(255,255,255,0.07)",opacity:0.7}}>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <Steam delay={0}/><Steam delay={0.25}/><Steam delay={0.5}/>
          <span style={{fontSize:11,color,marginLeft:4,fontFamily:"Courier New",letterSpacing:1}}>{label}…</span>
        </div>
      </div>
    </div>
  );
}


// ─── Bean Form Component ───────────────────────────────────────────────────
function BeanForm({ initial, onSave, onCancel, S, C }) {
  const [f, setF] = useState(initial || { name:"", roaster:"", origin:"", process:"", roastLevel:"", roastDate:"", tastingNotes:"", rating:3, wouldBuyAgain:true, buyLink:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const processes = ["Washed","Natural","Honey","Anaerobic","Wet-Hulled"];
  const roastLevels = ["Light","Light-Medium","Medium","Medium-Dark","Dark"];
  return (
    <div style={{animation:"fadeUp 0.3s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={onCancel} style={{background:"none",border:"none",color:C.gold,cursor:"pointer",fontSize:22,padding:0}}>‹</button>
        <div style={{fontSize:16,fontWeight:600,color:C.text}}>{initial?"Edit Bean":"Log a Bean"}</div>
      </div>
      {[["name","Bean / Blend Name","text",true],["roaster","Roaster","text",false],["origin","Origin (country/region)","text",false],["roastDate","Roast Date","text",false],["buyLink","Buy Link (affiliate)","url",false]].map(([k,ph,type,req])=>(
        <div key={k} style={{marginBottom:10}}>
          <label style={S.label}>{ph}{req&&" *"}</label>
          <input style={S.input} type={type} placeholder={ph} value={f[k]||""} onChange={e=>set(k,e.target.value)}/>
        </div>
      ))}
      <div style={{marginBottom:10}}>
        <label style={S.label}>Process</label>
        <div style={{...S.chipRow}}>
          {processes.map(p=><button key={p} style={S.chip(f.process===p)} onClick={()=>set("process",f.process===p?"":p)}>{p}</button>)}
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <label style={S.label}>Roast Level</label>
        <div style={S.chipRow}>
          {roastLevels.map(r=><button key={r} style={S.chip(f.roastLevel===r)} onClick={()=>set("roastLevel",f.roastLevel===r?"":r)}>{r}</button>)}
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <label style={S.label}>Tasting Notes</label>
        <textarea style={{...S.input,resize:"none",minHeight:72}} placeholder="What did you taste? Your words, no pressure…" value={f.tastingNotes||""} onChange={e=>set("tastingNotes",e.target.value)}/>
      </div>
      <div style={{marginBottom:10}}>
        <label style={S.label}>Rating</label>
        <div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(n=><span key={n} style={{fontSize:24,cursor:"pointer",color:n<=f.rating?C.goldLight:"rgba(212,164,90,0.18)"}} onClick={()=>set("rating",n)}>★</span>)}</div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={S.label}>Would you buy again?</label>
        <div style={{...S.row,gap:10}}>
          {[[true,"Yes ✓"],[false,"No ✗"]].map(([v,l])=>(
            <button key={String(v)} style={{...S.chip(f.wouldBuyAgain===v),flex:1,padding:"9px"}} onClick={()=>set("wouldBuyAgain",v)}>{l}</button>
          ))}
        </div>
      </div>
      <button style={S.btn()} onClick={()=>{ if(!f.name.trim()) return; onSave(f); }}>Save Bean</button>
      <div style={{height:16}}/>
    </div>
  );
}

// ─── Gear Form Component ───────────────────────────────────────────────────
function GearForm({ initial, onSave, onCancel, S, C }) {
  const [f, setF] = useState(initial || { name:"", brand:"", category:"", price:"", owned:true, review:"", rating:3, wouldRecommend:true, buyLink:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const categories = ["Grinder","Espresso Machine","Pour Over","French Press","AeroPress","Kettle","Scale","Tamper","Filter","Other"];
  return (
    <div style={{animation:"fadeUp 0.3s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={onCancel} style={{background:"none",border:"none",color:C.gold,cursor:"pointer",fontSize:22,padding:0}}>‹</button>
        <div style={{fontSize:16,fontWeight:600,color:C.text}}>{initial?"Edit Gear":"Log Gear"}</div>
      </div>
      {[["name","Product Name","text",true],["brand","Brand","text",false],["price","Price / Price Range","text",false],["buyLink","Buy Link (affiliate)","url",false]].map(([k,ph,type,req])=>(
        <div key={k} style={{marginBottom:10}}>
          <label style={S.label}>{ph}{req&&" *"}</label>
          <input style={S.input} type={type} placeholder={ph} value={f[k]||""} onChange={e=>set(k,e.target.value)}/>
        </div>
      ))}
      <div style={{marginBottom:10}}>
        <label style={S.label}>Category</label>
        <div style={S.chipRow}>
          {categories.map(c=><button key={c} style={S.chip(f.category===c)} onClick={()=>set("category",f.category===c?"":c)}>{c}</button>)}
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <label style={S.label}>Do you own it or just tried it?</label>
        <div style={{...S.row,gap:10}}>
          {[[true,"I own it"],[false,"Tried it"]].map(([v,l])=>(
            <button key={String(v)} style={{...S.chip(f.owned===v),flex:1,padding:"9px"}} onClick={()=>set("owned",v)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <label style={S.label}>Your Review</label>
        <textarea style={{...S.input,resize:"none",minHeight:72}} placeholder="What do you think of it? Build quality, taste impact, value…" value={f.review||""} onChange={e=>set("review",e.target.value)}/>
      </div>
      <div style={{marginBottom:10}}>
        <label style={S.label}>Rating</label>
        <div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(n=><span key={n} style={{fontSize:24,cursor:"pointer",color:n<=f.rating?C.goldLight:"rgba(212,164,90,0.18)"}} onClick={()=>set("rating",n)}>★</span>)}</div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={S.label}>Would you recommend it?</label>
        <div style={{...S.row,gap:10}}>
          {[[true,"Yes ✓"],[false,"No ✗"]].map(([v,l])=>(
            <button key={String(v)} style={{...S.chip(f.wouldRecommend===v),flex:1,padding:"9px"}} onClick={()=>set("wouldRecommend",v)}>{l}</button>
          ))}
        </div>
      </div>
      <button style={S.btn()} onClick={()=>{ if(!f.name.trim()) return; onSave(f); }}>Save Gear</button>
      <div style={{height:16}}/>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  // Auth state
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [screen, setScreen] = useState("loading"); // loading | intro | login | app
  const [showIntro, setShowIntro] = useState(false);
  const [loginMode, setLoginMode] = useState("pick"); // pick | create | pin
  const [pendingUser, setPendingUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPin2, setNewPin2] = useState("");
  const [createError, setCreateError] = useState("");

  // App state (per-user, loaded on login)
  const [tab, setTab] = useState("dial");
  const [presets, setPresets] = useState([]);
  const [activePresetId, setActivePresetId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [palette, setPalette] = useState({ completed:[], flavorMap:{} });
  const [identity, setIdentity] = useState({ traits:[], vocabulary:[], orders:[], log:[] });
  const [rateData, setRateData] = useState({ beans:[], gear:[] });
  const [rateSection, setRateSection] = useState("beans"); // beans | gear
  const [discoveryLevel, setDiscoveryLevel] = useState("adventurous"); // conservative | adventurous | funky
  const [showDiscoveryTooltip, setShowDiscoveryTooltip] = useState(false);
  const [discoveryTooltipSeen, setDiscoveryTooltipSeen] = useState(false);
  const [rateForm, setRateForm] = useState(null); // null | "bean" | "gear"
  const [rateEdit, setRateEdit] = useState(null); // item being edited

  // UI state
  const [newVar, setNewVar] = useState("");
  const [newPresetName, setNewPresetName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [sessionForm, setSessionForm] = useState({method:"Espresso",dose:"",yield:"",time:"",grindSize:"",waterTemp:"",notes:"",rating:3,taste:[]});
  const [sessionSaved, setSessionSaved] = useState(false);

  // Chat state — Dial
  const [dialHistory, setDialHistory] = useState([]);
  const [dialInput, setDialInput] = useState("");
  const [dialLoading, setDialLoading] = useState(false);
  const dialEnd = useRef(null);

  // Chat state — Train
  const [trainMode, setTrainMode] = useState("home");
  const [activeLesson, setActiveLesson] = useState(null);
  const [trainHistory, setTrainHistory] = useState([]);
  const [trainInput, setTrainInput] = useState("");
  const [trainLoading, setTrainLoading] = useState(false);
  const trainEnd = useRef(null);

  // Chat state — Scout (discovery)
  const [scoutHistory, setScoutHistory] = useState([]);
  const [scoutInput, setScoutInput] = useState("");
  const [scoutLoading, setScoutLoading] = useState(false);
  const scoutEnd = useRef(null);

  useEffect(() => { dialEnd.current?.scrollIntoView({behavior:"smooth"}); }, [dialHistory]);
  useEffect(() => { trainEnd.current?.scrollIntoView({behavior:"smooth"}); }, [trainHistory]);
  useEffect(() => { scoutEnd.current?.scrollIntoView({behavior:"smooth"}); }, [scoutHistory]);

  // Daily challenge
  const dailyChallenge = (() => {
    const all = CURRICULUM.flatMap(c => c.lessons);
    return all[Math.floor(Date.now()/86400000) % all.length];
  })();

  // ── Boot ──
  useEffect(() => {
    (async () => {
      const fl = await gget(FIRST_LAUNCH_KEY);
      if (!fl) { await gset(FIRST_LAUNCH_KEY, true); setShowIntro(true); }
      const u = await gget(USERS_KEY) || [];
      const aid = await gget(ACTIVE_USER_KEY);
      setUsers(u);
      if (u.length === 0) { setScreen("login"); setLoginMode("create"); return; }
      if (aid) {
        const found = u.find(x => x.id === aid);
        if (found) { await loadUser(found, u); return; }
      }
      setScreen("login"); setLoginMode("pick");
    })();
  }, []);

  const loadUser = async (user, userList) => {
    const uid = user.id;
    const pr = await gget(sk(uid,"presets")) || [makePreset("My Rig")];
    const ap = await gget(sk(uid,"activePreset")) || pr[0]?.id;
    const se = await gget(sk(uid,"sessions")) || [];
    const pa = await gget(sk(uid,"palette")) || { completed:[], flavorMap:{} };
    const id = await gget(sk(uid,"identity")) || { traits:[], vocabulary:[], orders:[], log:[] };
    setPresets(pr); setActivePresetId(ap); setSessions(se); setPalette(pa); setIdentity(id); setRateData(rd);
    setDiscoveryLevel(dl);
    setDiscoveryTooltipSeen(dts);
    if (!dts) setShowDiscoveryTooltip(true);
    setActiveUser(user);
    await gset(ACTIVE_USER_KEY, user.id);
    setScreen("app"); setTab("dial");
    setDialHistory([]); setTrainHistory([]); setScoutHistory([]); setTrainMode("home");
  };

  // ── User management ──
  const createUser = async () => {
    setCreateError("");
    if (!newName.trim()) return setCreateError("Enter a name");
    if (newPin.length < 4) return setCreateError("PIN must be 4 digits");
    if (newPin !== newPin2) return setCreateError("PINs don't match");
    const u = makeUser(newName.trim(), newPin);
    const updated = [...users, u];
    await gset(USERS_KEY, updated);
    setUsers(updated);
    setNewName(""); setNewPin(""); setNewPin2("");
    await loadUser(u, updated);
  };

  const attemptLogin = async () => {
    if (pinInput === pendingUser.pin) {
      setPinInput(""); setPinError("");
      await loadUser(pendingUser, users);
    } else {
      setPinError("Wrong PIN"); setPinInput("");
    }
  };

  const switchUser = () => {
    setActiveUser(null); setScreen("login"); setLoginMode("pick");
    setPinInput(""); setPendingUser(null);
  };

  const deleteUser = async (uid) => {
    const updated = users.filter(u => u.id !== uid);
    await gset(USERS_KEY, updated);
    setUsers(updated);
    if (updated.length === 0) { setLoginMode("create"); }
  };

  // ── Per-user saves ──
  const uid = activeUser?.id;
  const savePresets = async (p, aid) => { setPresets(p); await gset(sk(uid,"presets"),p); if(aid!==undefined){setActivePresetId(aid);await gset(sk(uid,"activePreset"),aid);} };
  const saveProfile = async (fields) => { const up = presets.map(p => p.id===profile.id ? {...p,...fields} : p); await savePresets(up); };
  const saveSessions = async (s) => { setSessions(s); await gset(sk(uid,"sessions"),s); };
  const savePalette = async (p) => { setPalette(p); await gset(sk(uid,"palette"),p); };
  const saveIdentity = async (id) => { setIdentity(id); await gset(sk(uid,"identity"),id); };
  const saveRateData = async (rd) => { setRateData(rd); await gset(sk(uid,"rate"), rd); };
  const saveDiscoveryLevel = async (level) => {
    setDiscoveryLevel(level);
    await gset(sk(uid,"discovery"), level);
  };
  const markDiscoveryTooltipSeen = async () => {
    setDiscoveryTooltipSeen(true);
    setShowDiscoveryTooltip(false);
    await gset(sk(uid,"discoveryTooltipSeen"), true);
  };

  const addRateItem = async (type, item) => {
    const list = [...(rateData[type]||[]), {...item, id:Math.random().toString(36).slice(2), ts:Date.now()}];
    await saveRateData({...rateData, [type]:list});
  };
  const deleteRateItem = async (type, id) => {
    const list = (rateData[type]||[]).filter(x=>x.id!==id);
    await saveRateData({...rateData, [type]:list});
  };

  const toggleIdentity = async () => {
    const updated = users.map(u => u.id===uid ? {...u,identityEnabled:!u.identityEnabled} : u);
    setUsers(updated); await gset(USERS_KEY,updated);
    setActiveUser(prev => ({...prev,identityEnabled:!prev.identityEnabled}));
  };

  const profile = presets.find(p => p.id===activePresetId) || presets[0] || makePreset();

  const logSession = async () => {
    const s = {...sessionForm,timestamp:Date.now(),id:Math.random().toString(36).slice(2),rigName:profile.name};
    await saveSessions([...sessions,s]);
    setSessionSaved(true); setTimeout(()=>setSessionSaved(false),2000);
    setSessionForm({method:"Espresso",dose:"",yield:"",time:"",grindSize:"",waterTemp:"",notes:"",rating:3,taste:[]});
    // Feed into identity
    if (activeUser?.identityEnabled && sessionForm.taste.length > 0) {
      appendIdentityLog("brew", `${sessionForm.method} | taste: ${sessionForm.taste.join(", ")} | rating: ${sessionForm.rating}/5`);
    }
  };

  const appendIdentityLog = async (type, note) => {
    const updated = { ...identity, log: [...(identity.log||[]), {type,note,ts:Date.now()}].slice(-50) };
    await saveIdentity(updated);
  };

  // ── AI calls ──
  const callAI = async (system, messages) => {
    const res = await fetch("/.netlify/functions/claude", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages }),
    });
    const data = await res.json();
    return data.content?.find(b=>b.type==="text")?.text || "Something went wrong.";
  };

  const buildDialSystem = () => {
    const vars = Object.entries(profile).filter(([k,v])=>k!=="customVars"&&k!=="id"&&k!=="name"&&v).map(([k,v])=>`${k}: ${v}`).join(", ");
    const custom = (profile.customVars||[]).filter(c=>c.value).map(c=>`${c.name}: ${c.value}`).join(", ");
    const recent = sessions.slice(-5).map((s,i)=>`#${i+1}(${s.method}) dose=${s.dose}g yield=${s.yield}g time=${s.time}s grind=${s.grindSize} rating=${s.rating}/5 taste=[${s.taste?.join(",")}]`).join("\n");
    const palateLevel = palette.completed.length;
    const idSummary = identity.traits?.join(", ") || "not yet built";
    return `You are Dial — an elite specialty coffee dialing-in expert and personal barista mentor. Calm, precise, knowledgeable.

USER: ${activeUser?.name}
RIG (${profile.name}): ${vars}${custom?", "+custom:""}
RECENT SESSIONS:\n${recent||"none yet"}
PALATE LEVEL: ${palateLevel} lessons completed
TASTE IDENTITY: ${idSummary}
DISCOVERY MODE: ${discoveryDesc}

RULES:
- Give ONE specific adjustment at a time
- Use the user's actual equipment and variables
- Reference their taste identity when relevant
- Use proper sensory language (astringency, brightness, mouthfeel, finish)
- End every response with a clear next action
- Be concise — max 4 sentences`;
  };

  const buildTrainSystem = (lesson) => {
    const done = palette.completed.length;
    const total = CURRICULUM.flatMap(c=>c.lessons).length;
    return `You are Palate — a patient sensory coach for specialty coffee. Warm, encouraging, precise.

STUDENT: ${activeUser?.name}
LESSON: "${lesson.title}" | FOCUS: ${lesson.focus}
CHALLENGE: ${lesson.challenge}
PROGRESS: ${done}/${total} lessons done

RULES:
- One question at a time, max 3 sentences per reply
- No jargon without explanation
- Validate all observations — no wrong answers
- After 4-6 exchanges: summarise insight and say exactly "LESSON COMPLETE: [one sentence insight]"`;
  };

  const buildScoutSystem = () => {
    const idSummary = identity.traits?.length ? identity.traits.join(", ") : "unknown so far";
    const vocab = identity.vocabulary?.length ? identity.vocabulary.join(", ") : "none yet";
    const scoutDiscovery = {
      conservative: "This user is CONSERVATIVE. Affirm and deepen what they already love. If a gentle suggestion ever fits naturally, frame it softly: 'since you seem to love X, you might just enjoy Y — worth knowing about.' Otherwise stay close to their comfort zone.",
      adventurous: "This user is ADVENTUROUS. Once you understand their preferences, occasionally drop a soft suggestion: 'based on what you've been describing, you might want to test...' or 'many people who share your taste for X have counted that Y is worth exploring — I think you'd like it because...'. Keep it woven into conversation, never a standalone pitch.",
      funky: "This user is FUNKY — open to anything, joyfully wide. Suggest freely but always subtly: 'based on your preferences you might want to test...' or 'a lot of people who love what you described have found that X is just brilliant — I think you'd enjoy it because...'. Use everyday flavour language. Make it feel like a joyful conversation, not a curated menu. Effortless always.",
    }[discoveryLevel] || "";
    return `You are Scout — a friendly, non-intimidating guide for people discovering specialty coffee. You help them put words to what they taste and build their personal coffee identity.

USER: ${activeUser?.name}
THEIR TASTE IDENTITY SO FAR: ${idSummary}
VOCABULARY THEY'VE BUILT: ${vocab}
DISCOVERY MODE: ${scoutDiscovery}
IDENTITY BUILDING: ${activeUser?.identityEnabled ? "ON" : "OFF"}

RULES:
- Zero assumptions — they may be total beginners
- Use everyday language first, introduce coffee terms gently with immediate plain-language translation
- Ask what they're drinking RIGHT NOW and guide them through it
- Help them name what they taste using their own words first, then map to proper terms
- After each discovery, update their identity by saying "IDENTITY UPDATE: [trait or vocab word discovered]"
- Build excitement — 3rd wave coffee is a world of flavour, not snobbery
- Max 3 sentences per reply, always end with one simple question`;
  };

  const sendDial = async (msg) => {
    if (!msg.trim()||dialLoading) return;
    const h = [...dialHistory,{role:"user",content:msg}];
    setDialHistory(h); setDialInput(""); setDialLoading(true);
    try {
      const reply = await callAI(buildDialSystem(), h);
      setDialHistory([...h,{role:"assistant",content:reply}]);
      if (activeUser?.identityEnabled) appendIdentityLog("dial", msg.slice(0,80));
    } catch { setDialHistory([...h,{role:"assistant",content:"Connection error."}]); }
    setDialLoading(false);
  };

  const startLesson = async (lesson) => {
    setActiveLesson(lesson); setTrainHistory([]); setTrainMode("lesson"); setTrainLoading(true);
    try {
      const reply = await callAI(buildTrainSystem(lesson), [{role:"user",content:"Start the lesson."}]);
      setTrainHistory([{role:"assistant",content:reply}]);
    } catch {}
    setTrainLoading(false);
  };

  const sendTrain = async (msg) => {
    if (!msg.trim()||trainLoading) return;
    const h = [...trainHistory,{role:"user",content:msg}];
    setTrainHistory(h); setTrainInput(""); setTrainLoading(true);
    try {
      const reply = await callAI(buildTrainSystem(activeLesson), h);
      if (reply.includes("LESSON COMPLETE:")) {
        const insight = reply.split("LESSON COMPLETE:")[1]?.trim()||"";
        const updated = { completed:[...new Set([...palette.completed,activeLesson.id])], flavorMap:{...palette.flavorMap,[activeLesson.id]:{notes:insight,date:Date.now()}} };
        await savePalette(updated);
        if (activeUser?.identityEnabled) appendIdentityLog("lesson",`${activeLesson.title}: ${insight}`);
      }
      setTrainHistory([...h,{role:"assistant",content:reply.replace("LESSON COMPLETE:","✓")}]);
    } catch { setTrainHistory([...h,{role:"assistant",content:"Connection error."}]); }
    setTrainLoading(false);
  };

  const sendScout = async (msg) => {
    if (!msg.trim()||scoutLoading) return;
    const h = [...scoutHistory,{role:"user",content:msg}];
    setScoutHistory(h); setScoutInput(""); setScoutLoading(true);
    try {
      const reply = await callAI(buildScoutSystem(), h);
      // Parse identity updates
      if (activeUser?.identityEnabled && reply.includes("IDENTITY UPDATE:")) {
        const update = reply.split("IDENTITY UPDATE:")[1]?.split("\n")[0]?.trim()||"";
        if (update) {
          const isVocab = update.toLowerCase().includes("word") || update.toLowerCase().includes("term") || update.length < 25;
          const updatedId = {
            ...identity,
            traits: isVocab ? identity.traits : [...new Set([...identity.traits, update])].slice(-20),
            vocabulary: isVocab ? [...new Set([...identity.vocabulary, update])].slice(-30) : identity.vocabulary,
            log: [...(identity.log||[]),{type:"scout",note:update,ts:Date.now()}].slice(-50),
          };
          await saveIdentity(updatedId);
        }
      }
      setScoutHistory([...h,{role:"assistant",content:reply.replace(/IDENTITY UPDATE:.*(\n|$)/g,"")}]);
    } catch { setScoutHistory([...h,{role:"assistant",content:"Connection error."}]); }
    setScoutLoading(false);
  };

  // Start Scout automatically
  const startScout = async () => {
    if (scoutHistory.length > 0) return;
    setScoutLoading(true);
    try {
      const reply = await callAI(buildScoutSystem(), [{role:"user",content:"Start the discovery session."}]);
      setScoutHistory([{role:"assistant",content:reply.replace(/IDENTITY UPDATE:.*(\n|$)/g,"")}]);
    } catch {}
    setScoutLoading(false);
  };

  // ── Styles ──
  const C = {
    bg: "#180d06", card: "rgba(255,255,255,0.042)", border: "rgba(212,164,90,0.13)",
    gold: "#c4923a", goldLight: "#d4a45a", text: "#f5e6c8", muted: "rgba(245,230,200,0.42)",
    green: "#7ec87e", teal: "#5ab8b0",
  };
  const S = {
    app:{fontFamily:"'Crimson Pro','Georgia',serif",background:`linear-gradient(160deg,${C.bg} 0%,#2a1608 45%,${C.bg} 100%)`,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto",position:"relative",paddingBottom:72},
    header:{padding:"24px 20px 14px",borderBottom:`1px solid ${C.border}`},
    nav:{display:"flex",borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,0.18)"},
    navBtn:(a)=>({flex:1,padding:"11px 2px",background:"none",border:"none",borderBottom:a?`2px solid ${C.gold}`:"2px solid transparent",color:a?C.goldLight:C.muted,fontSize:10,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",fontFamily:"'Courier New',monospace",transition:"all 0.2s"}),
    page:{padding:"18px 18px 0"},
    card:{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:14},
    label:{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:C.gold,fontFamily:"'Courier New',monospace",display:"block",marginBottom:6},
    input:{width:"100%",background:"rgba(0,0,0,0.22)",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:15,fontFamily:"'Crimson Pro',Georgia,serif",boxSizing:"border-box",outline:"none"},
    select:{width:"100%",background:"#180d06",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:15,fontFamily:"'Crimson Pro',Georgia,serif",boxSizing:"border-box",outline:"none"},
    row:{display:"flex",gap:10},
    half:{flex:1,background:"rgba(0,0,0,0.22)",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:15,fontFamily:"'Crimson Pro',Georgia,serif",boxSizing:"border-box",outline:"none"},
    btn:(col="#c4923a",col2="#a0721e")=>({width:"100%",padding:"13px",background:`linear-gradient(135deg,${col},${col2})`,border:"none",borderRadius:10,color:"#180d06",fontSize:12,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Courier New',monospace",cursor:"pointer",marginTop:6}),
    ghostBtn:{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,fontSize:11,padding:"7px 12px",cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:1},
    chip:(a)=>({padding:"5px 10px",borderRadius:20,fontSize:11,border:`1px solid ${a?C.gold:C.border}`,background:a?"rgba(196,146,58,0.18)":"transparent",color:a?C.goldLight:C.muted,cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:1}),
    chipRow:{display:"flex",flexWrap:"wrap",gap:6,marginTop:6},
    chatBar:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"10px 14px",background:"rgba(18,8,2,0.97)",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,boxSizing:"border-box",zIndex:100},
    sendBtn:(dis,col="#c4923a",col2="#a0721e")=>({padding:"10px 16px",background:dis?`rgba(196,146,58,0.14)`:`linear-gradient(135deg,${col},${col2})`,border:"none",borderRadius:8,color:dis?"rgba(196,146,58,0.4)":col==="#c4923a"?"#180d06":C.text,fontWeight:700,cursor:dis?"default":"pointer",fontSize:18,flexShrink:0}),
    star:(f)=>({fontSize:22,cursor:"pointer",color:f?C.goldLight:"rgba(212,164,90,0.18)",transition:"color 0.15s"}),
  };

  // ── Login screen ──
  if (screen==="loading") return (
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <Steam delay={0}/><Steam delay={0.3}/><Steam delay={0.6}/>
    </div>
  );

  if (showIntro) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap'); @keyframes steam{0%,100%{opacity:0;transform:translateY(0)}50%{opacity:1;transform:translateY(-10px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}} *{box-sizing:border-box}`}</style>
      <Grain/>
      <div style={{...S.app,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
        <div style={{animation:"fadeUp 0.6s ease"}}>
          <img src={LOGO_URI} alt="Coffee G" style={{height:120,objectFit:"contain",marginBottom:24,filter:"brightness(0.9)"}}/>
          <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid rgba(212,164,90,0.15)`,borderRadius:14,padding:"20px 24px",maxWidth:320,marginBottom:32}}>
            <div style={{fontSize:13,letterSpacing:2,color:C.gold,fontFamily:"Courier New",marginBottom:10,textTransform:"uppercase"}}>About the name</div>
            <p style={{fontSize:16,color:C.text,lineHeight:1.75,margin:0}}>
              <em>Coffee G</em> combines two things: the world of coffee, and <em>ji</em> — a Hindi honorific used as a warm term of respect and friendship.
            </p>
            <p style={{fontSize:14,color:C.muted,lineHeight:1.7,margin:"12px 0 0",fontStyle:"italic"}}>
              Like saying "coffee, my friend" — because that's what this is. A companion for your coffee journey, not a tool.
            </p>
          </div>
          <button
            style={{...S.btn(),maxWidth:280,margin:"0 auto",fontSize:13,letterSpacing:4}}
            onClick={() => setShowIntro(false)}
          >
            Let's Begin →
          </button>
        </div>
      </div>
    </>
  );

  if (screen==="login") return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap'); @keyframes steam{0%,100%{opacity:0;transform:translateY(0)}50%{opacity:1;transform:translateY(-10px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}} *{box-sizing:border-box}`}</style>
      <Grain/>
      <div style={{...S.app,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:9,letterSpacing:6,color:C.gold,fontFamily:"Courier New",marginBottom:6}}>☕ Coffee G</div>
          <div style={{fontSize:32,fontWeight:700,color:C.text}}>Welcome back<span style={{display:"inline-flex",marginLeft:8,verticalAlign:"bottom"}}><Steam delay={0}/><Steam delay={0.3}/><Steam delay={0.6}/></span></div>
          <div style={{fontSize:14,color:C.muted,fontStyle:"italic",marginTop:4}}>your personal coffee ji</div>
        </div>

        {loginMode==="pick" && (
          <div style={{width:"100%",maxWidth:340}}>
            <div style={{...S.label,marginBottom:12}}>Who's brewing?</div>
            {users.map(u => (
              <div key={u.id} style={{...S.card,display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:10}} onClick={()=>{setPendingUser(u);setLoginMode("pin");}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},#a0721e)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#180d06",flexShrink:0}}>{u.name[0].toUpperCase()}</div>
                <div style={{flex:1,fontSize:16,color:C.text}}>{u.name}</div>
                <div style={{color:C.muted,fontSize:18}}>›</div>
              </div>
            ))}
            <button style={{...S.btn(),marginTop:8}} onClick={()=>setLoginMode("create")}>+ New Profile</button>
          </div>
        )}

        {loginMode==="pin" && pendingUser && (
          <div style={{width:"100%",maxWidth:300,textAlign:"center"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},#a0721e)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:"#180d06",margin:"0 auto 16px"}}>{pendingUser.name[0].toUpperCase()}</div>
            <div style={{fontSize:20,color:C.text,marginBottom:4}}>{pendingUser.name}</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:20,fontStyle:"italic"}}>Enter your PIN</div>
            <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:16}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:14,height:14,borderRadius:"50%",background:i<pinInput.length?C.gold:`rgba(212,164,90,0.2)`,transition:"background 0.2s"}}/>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:240,margin:"0 auto"}}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
                <button key={i} onClick={()=>{
                  if(k==="⌫"){setPinInput(p=>p.slice(0,-1));setPinError("");}
                  else if(k!==""&&pinInput.length<4){
                    const next=pinInput+k;
                    setPinInput(next);
                    if(next.length===4){
                      if(next===pendingUser.pin){setPinError("");loadUser(pendingUser,users);}
                      else{setPinError("Wrong PIN");setTimeout(()=>setPinInput(""),300);}
                    }
                  }
                }} style={{padding:"14px",background:k===""?"transparent":"rgba(255,255,255,0.05)",border:k===""?"none":`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:18,cursor:k===""?"default":"pointer",fontFamily:"'Crimson Pro',Georgia,serif"}}>
                  {k}
                </button>
              ))}
            </div>
            {pinError && <div style={{color:"#e07070",fontSize:13,marginTop:12,fontFamily:"Courier New"}}>{pinError}</div>}
            <button onClick={()=>{setLoginMode("pick");setPinInput("");setPinError("");}} style={{...S.ghostBtn,marginTop:16}}>← Back</button>
          </div>
        )}

        {loginMode==="create" && (
          <div style={{width:"100%",maxWidth:320}}>
            <div style={{...S.label,marginBottom:16}}>Create your profile</div>
            <div style={{marginBottom:12}}>
              <label style={S.label}>Your name</label>
              <input style={S.input} placeholder="e.g. Ofer" value={newName} onChange={e=>setNewName(e.target.value)}/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={S.label}>4-digit PIN</label>
              <input style={S.input} type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,"").slice(0,4))}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={S.label}>Confirm PIN</label>
              <input style={S.input} type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={newPin2} onChange={e=>setNewPin2(e.target.value.replace(/\D/g,"").slice(0,4))}/>
            </div>
            {createError && <div style={{color:"#e07070",fontSize:13,marginBottom:10,fontFamily:"Courier New"}}>{createError}</div>}
            <button style={S.btn()} onClick={createUser}>Start My Journey →</button>
            {users.length>0 && <button onClick={()=>setLoginMode("pick")} style={{...S.ghostBtn,width:"100%",marginTop:10}}>← Back</button>}
          </div>
        )}
      </div>
    </>
  );

  // ── Main App ──
  const totalLessons = CURRICULUM.flatMap(c=>c.lessons).length;
  const doneLessons = palette.completed.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        @keyframes steam{0%,100%{opacity:0;transform:translateY(0) scaleX(1)}50%{opacity:1;transform:translateY(-10px) scaleX(1.3)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(212,164,90,0.18);border-radius:3px}
        input:focus,select:focus,textarea:focus{border-color:rgba(212,164,90,0.45)!important;outline:none}
      `}</style>
      <Grain/>
      <div style={S.app}>

        {/* Header */}
        <div style={S.header}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <img src={LOGO_URI} alt="Coffee G" style={{height:48,objectFit:"contain",display:"block",marginBottom:2,filter:"brightness(0.92)"}}/>

            </div>
            <button onClick={switchUser} style={{...S.ghostBtn,display:"flex",alignItems:"center",gap:6,padding:"6px 10px"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},#a0721e)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#180d06"}}>{activeUser?.name?.[0]?.toUpperCase()}</div>
              <span style={{fontSize:10}}>{activeUser?.name}</span>
            </button>
          </div>
        </div>

        {/* Nav */}
        {/* ── DISCOVERY LEVEL STRIP ── */}
        {(() => {
          const levels = [
            { id:"conservative", label:"Conservative", emoji:"🎯", desc:"Loves what it loves" },
            { id:"adventurous",  label:"Adventurous",  emoji:"🧭", desc:"Open to venture" },
            { id:"funky",        label:"Funky",        emoji:"🌀", desc:"Try everything" },
          ];
          return (
            <div style={{position:"relative"}}>
              {/* Tooltip — first time only */}
              {showDiscoveryTooltip && (
                <div style={{
                  position:"absolute", top:"100%", left:0, right:0, zIndex:200,
                  background:"#2a1608", border:`1px solid ${C.gold}`,
                  borderRadius:"0 0 12px 12px", padding:"14px 16px",
                  boxShadow:"0 8px 24px rgba(0,0,0,0.6)",
                }}>
                  <div style={{fontSize:12,color:C.goldLight,fontWeight:600,marginBottom:6}}>Your Discovery Level</div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.65,marginBottom:10}}>
                    This tells Coffee G how adventurous your recommendations should be — whether you want to stay in your comfort zone, explore nearby, or go completely off the map.
                  </div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:10,fontStyle:"italic"}}>You can change it anytime from the top bar.</div>
                  <button style={{...S.btn(),marginTop:0,fontSize:11,letterSpacing:2}} onClick={markDiscoveryTooltipSeen}>Got it →</button>
                </div>
              )}
              {/* Strip */}
              <div style={{
                display:"flex", alignItems:"center",
                background:"rgba(0,0,0,0.32)",
                borderBottom:`1px solid ${C.border}`,
                padding:"6px 12px", gap:6,
              }}>
                <span style={{fontSize:9,letterSpacing:2,color:C.muted,fontFamily:"Courier New",flexShrink:0,marginRight:4}}>DISCOVERY</span>
                {levels.map(l => (
                  <button key={l.id}
                    onClick={async () => { await saveDiscoveryLevel(l.id); if(!discoveryTooltipSeen) markDiscoveryTooltipSeen(); }}
                    style={{
                      flex:1, padding:"5px 4px",
                      background: discoveryLevel===l.id ? `linear-gradient(135deg,${C.gold},#a0721e)` : "rgba(255,255,255,0.04)",
                      border: discoveryLevel===l.id ? "none" : `1px solid ${C.border}`,
                      borderRadius:8,
                      color: discoveryLevel===l.id ? "#180d06" : C.muted,
                      fontSize:10, fontWeight: discoveryLevel===l.id ? 700 : 400,
                      fontFamily:"Courier New", letterSpacing:1,
                      cursor:"pointer", transition:"all 0.2s",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:1,
                    }}>
                    <span style={{fontSize:14}}>{l.emoji}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        <nav style={S.nav}>
          {[["dial","Dial"],["log","Log"],["sessions","Shots"],["train","Train"],["scout","Discover"],["rate","Rate"],["me","Me"]].map(([id,label])=>(
            <button key={id} style={S.navBtn(tab===id)} onClick={()=>{setTab(id);if(id==="scout")startScout();}}>{label}</button>
          ))}
        </nav>

        {/* ── YOUR SETUP STRIP ── */}
        {(() => {
          const coreVars = [
            ["Grinder", profile.grinder],
            ["Burrs", profile.burrs],
            ["Machine", profile.apparatus],
            ["Filter", profile.filter],
            ["Water", profile.water],
          ].filter(([,v]) => v);
          const customFilled = (profile.customVars || []).filter(cv => cv.value);
          const allVars = [...coreVars, ...customFilled.map(cv => [cv.name, cv.value])];
          return (
            <div
              onClick={() => setTab("me")}
              style={{
                borderBottom: `1px solid ${C.border}`,
                background: "rgba(0,0,0,0.28)",
                cursor: "pointer",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                padding: "7px 14px",
                minWidth: "max-content",
              }}>
                {/* Rig name badge */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  paddingRight: 12,
                  borderRight: `1px solid ${C.border}`,
                  marginRight: 12, flexShrink: 0,
                }}>
                  <span style={{fontSize: 9, color: C.gold, fontFamily: "Courier New", letterSpacing: 2, textTransform: "uppercase"}}>YOUR SETUP</span>
                  <span style={{fontSize: 11, color: C.goldLight, fontWeight: 600, fontFamily: "Courier New"}}>{profile.name}</span>
                </div>

                {/* Variables */}
                {allVars.length === 0 ? (
                  <span style={{fontSize: 11, color: C.muted, fontStyle: "italic"}}>Tap to add your gear →</span>
                ) : (
                  allVars.map(([k, v], i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "baseline", gap: 4,
                      paddingRight: 14,
                      borderRight: i < allVars.length - 1 ? `1px solid rgba(212,164,90,0.1)` : "none",
                      marginRight: i < allVars.length - 1 ? 14 : 0,
                      flexShrink: 0,
                    }}>
                      <span style={{fontSize: 9, color: C.muted, fontFamily: "Courier New", letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap"}}>{k}</span>
                      <span style={{fontSize: 12, color: C.text, whiteSpace: "nowrap"}}>{v}</span>
                    </div>
                  ))
                )}

                {/* Edit hint */}
                <div style={{paddingLeft: 12, marginLeft: allVars.length > 0 ? 2 : 0, flexShrink: 0}}>
                  <span style={{fontSize: 9, color: "rgba(212,164,90,0.25)", fontFamily: "Courier New"}}>✎</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── DIAL TAB ── */}
        {tab==="dial" && (
          <div style={{...S.page,paddingBottom:80}}>
            {dialHistory.length===0 && (
              <div style={{...S.card,marginTop:8,animation:"fadeUp 0.5s ease"}}>
                <div style={{fontSize:13,color:C.muted,lineHeight:1.75,fontStyle:"italic"}}>
                  Hi {activeUser?.name}. Tell me how your last shot tasted — sour, bitter, flat, running fast? I know your rig and your recent sessions. Let's dial it in.
                </div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {dialHistory.map((m,i)=><Bubble key={i} role={m.role} agent="DIAL" agentColor={C.gold}>{m.content}</Bubble>)}
              {dialLoading && <Thinking color={C.gold} label="tasting"/>}
              <div ref={dialEnd}/>
            </div>
          </div>
        )}
        {tab==="dial" && (
          <div style={S.chatBar}>
            <input style={{...S.input,flex:1}} placeholder="How did that taste?" value={dialInput} onChange={e=>setDialInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendDial(dialInput)}/>
            <button style={S.sendBtn(!dialInput.trim()||dialLoading)} onClick={()=>sendDial(dialInput)} disabled={!dialInput.trim()||dialLoading}>↑</button>
          </div>
        )}

        {/* ── LOG TAB ── */}
        {tab==="log" && (
          <div style={S.page}>
            <div style={S.card}>
              <label style={S.label}>Brew Method</label>
              <select style={S.select} value={sessionForm.method} onChange={e=>setSessionForm(f=>({...f,method:e.target.value}))}>
                {BREW_METHODS.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={S.card}>
              <label style={S.label}>Parameters</label>
              <div style={{...S.row,marginBottom:10}}>
                {[["dose","Dose (g)","18"],["yield","Yield (g)","36"]].map(([k,l,ph])=>(
                  <div key={k} style={{flex:1}}>
                    <div style={{fontSize:10,color:C.muted,marginBottom:4,fontFamily:"Courier New"}}>{l}</div>
                    <input style={S.half} type="number" placeholder={ph} value={sessionForm[k]} onChange={e=>setSessionForm(f=>({...f,[k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
              <div style={{...S.row,marginBottom:10}}>
                {[["time","Time (sec)","28"],["grindSize","Grind size","8.5"]].map(([k,l,ph])=>(
                  <div key={k} style={{flex:1}}>
                    <div style={{fontSize:10,color:C.muted,marginBottom:4,fontFamily:"Courier New"}}>{l}</div>
                    <input style={S.half} placeholder={ph} value={sessionForm[k]} onChange={e=>setSessionForm(f=>({...f,[k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,color:C.muted,marginBottom:4,fontFamily:"Courier New"}}>Water temp (°C)</div>
              <input style={S.input} placeholder="93" value={sessionForm.waterTemp} onChange={e=>setSessionForm(f=>({...f,waterTemp:e.target.value}))}/>
            </div>
            <div style={S.card}>
              <label style={S.label}>Taste</label>
              <div style={S.chipRow}>{TASTE_OPTIONS.map(t=><button key={t} style={S.chip(sessionForm.taste.includes(t))} onClick={()=>setSessionForm(f=>({...f,taste:f.taste.includes(t)?f.taste.filter(x=>x!==t):[...f.taste,t]}))}>{t}</button>)}</div>
            </div>
            <div style={S.card}>
              <label style={S.label}>Rating</label>
              <div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(n=><span key={n} style={S.star(n<=sessionForm.rating)} onClick={()=>setSessionForm(f=>({...f,rating:n}))}>★</span>)}</div>
            </div>
            <div style={S.card}>
              <label style={S.label}>Notes</label>
              <textarea style={{...S.input,resize:"none",minHeight:76}} placeholder="Any observations…" value={sessionForm.notes} onChange={e=>setSessionForm(f=>({...f,notes:e.target.value}))}/>
            </div>
            <button style={S.btn()} onClick={logSession}>{sessionSaved?"✓ Logged":"Log Session"}</button>
            {sessionSaved && <div style={{textAlign:"center",color:C.gold,fontSize:13,marginTop:10,fontStyle:"italic"}}>Saved — ask Dial to analyse it</div>}
            <div style={{height:20}}/>
          </div>
        )}

        {/* ── SESSIONS TAB ── */}
        {tab==="sessions" && (
          <div style={S.page}>
            {sessions.length===0 && <div style={{...S.card,textAlign:"center",padding:32}}><div style={{fontSize:32,marginBottom:8}}>☕</div><div style={{fontSize:14,color:C.muted,fontStyle:"italic"}}>No sessions yet.</div></div>}
            {[...sessions].reverse().map((s,i)=>(
              <div key={s.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:10,animation:`fadeUp ${0.05*i+0.1}s ease`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:600,color:C.goldLight}}>{s.method}{s.rigName&&<span style={{fontSize:10,color:C.muted,fontWeight:400}}> · {s.rigName}</span>}</span>
                  <span style={{fontSize:10,color:C.muted,fontFamily:"Courier New"}}>{new Date(s.timestamp).toLocaleDateString()}</span>
                </div>
                <div style={{display:"flex",gap:14,fontSize:13,marginBottom:5,flexWrap:"wrap"}}>
                  {s.dose&&<span><span style={{color:C.muted,fontSize:10}}>dose </span>{s.dose}g</span>}
                  {s.yield&&<span><span style={{color:C.muted,fontSize:10}}>yield </span>{s.yield}g</span>}
                  {s.time&&<span><span style={{color:C.muted,fontSize:10}}>time </span>{s.time}s</span>}
                  {s.grindSize&&<span><span style={{color:C.muted,fontSize:10}}>grind </span>{s.grindSize}</span>}
                </div>
                {s.taste?.length>0&&<div style={S.chipRow}>{s.taste.map(t=><span key={t} style={{...S.chip(true),cursor:"default",fontSize:10,padding:"3px 8px"}}>{t}</span>)}</div>}
                <div style={{marginTop:5,color:C.goldLight,fontSize:14}}>{"★".repeat(s.rating)}<span style={{color:"rgba(212,164,90,0.15)"}}>{"★".repeat(5-s.rating)}</span></div>
                {s.notes&&<div style={{marginTop:5,fontSize:13,color:"rgba(245,230,200,0.5)",fontStyle:"italic"}}>"{s.notes}"</div>}
              </div>
            ))}
            <div style={{height:20}}/>
          </div>
        )}

        {/* ── TRAIN TAB ── */}
        {tab==="train" && trainMode==="home" && (
          <div style={S.page}>
            <div style={S.card}>
              <label style={S.label}>Palate Progress</label>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:5,fontFamily:"Courier New"}}>
                <span>{doneLessons}/{totalLessons} lessons</span><span>{Math.round(doneLessons/totalLessons*100)}%</span>
              </div>
              <div style={{height:5,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
                <div style={{height:"100%",width:`${doneLessons/totalLessons*100}%`,background:`linear-gradient(90deg,${C.gold},${C.goldLight})`,borderRadius:3,transition:"width 0.5s"}}/>
              </div>
            </div>
            {dailyChallenge && (
              <div style={{...S.card,border:`1px solid rgba(196,146,58,0.28)`,background:"rgba(196,146,58,0.05)"}}>
                <label style={{...S.label,color:C.goldLight}}>☀ Today's Challenge</label>
                <div style={{fontSize:16,fontWeight:600,marginBottom:5}}>{dailyChallenge.title}</div>
                <div style={{fontSize:13,color:C.muted,fontStyle:"italic",lineHeight:1.65,marginBottom:10}}>{dailyChallenge.challenge}</div>
                <button style={S.btn()} onClick={()=>startLesson(dailyChallenge)}>Start with Palate →</button>
              </div>
            )}
            {CURRICULUM.map(sec=>(
              <div key={sec.level}>
                <div style={{fontSize:9,letterSpacing:3,color:sec.color,fontFamily:"Courier New",textTransform:"uppercase",margin:"14px 0 8px"}}>── {sec.level}</div>
                {sec.lessons.map(l=>{
                  const done=palette.completed.includes(l.id);
                  return (
                    <div key={l.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer",opacity:done?0.72:1}} onClick={()=>startLesson(l)}>
                      <div style={{fontSize:16,color:done?sec.color:"rgba(212,164,90,0.18)",flexShrink:0}}>{done?"✓":"○"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,color:C.text,fontWeight:done?400:600}}>{l.title}</div>
                        <div style={{fontSize:10,color:C.muted,fontFamily:"Courier New",marginTop:2}}>{l.focus}</div>
                      </div>
                      {done&&palette.flavorMap[l.id]&&<div style={{fontSize:10,color:sec.color,fontStyle:"italic",maxWidth:90,textAlign:"right",lineHeight:1.3}}>"{palette.flavorMap[l.id].notes?.slice(0,35)}…"</div>}
                      <div style={{color:C.muted,fontSize:18}}>›</div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{height:20}}/>
          </div>
        )}
        {tab==="train" && trainMode==="lesson" && activeLesson && (
          <div style={{...S.page,paddingBottom:80}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <button onClick={()=>setTrainMode("home")} style={{background:"none",border:"none",color:C.gold,cursor:"pointer",fontSize:22,padding:0}}>‹</button>
              <div>
                <div style={{fontSize:9,letterSpacing:3,color:C.green,fontFamily:"Courier New",textTransform:"uppercase"}}>Palate Training</div>
                <div style={{fontSize:18,fontWeight:600,color:C.text}}>{activeLesson.title}</div>
              </div>
              {palette.completed.includes(activeLesson.id)&&<div style={{marginLeft:"auto",fontSize:9,color:C.green,fontFamily:"Courier New",letterSpacing:2}}>✓ COMPLETE</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {trainHistory.map((m,i)=><Bubble key={i} role={m.role} agent="PALATE" agentColor={C.green}>{m.content}</Bubble>)}
              {trainLoading&&<Thinking color={C.green} label="sensing"/>}
              <div ref={trainEnd}/>
            </div>
          </div>
        )}
        {tab==="train" && trainMode==="lesson" && (
          <div style={S.chatBar}>
            <input style={{...S.input,flex:1}} placeholder="What do you taste?" value={trainInput} onChange={e=>setTrainInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendTrain(trainInput)}/>
            <button style={S.sendBtn(!trainInput.trim()||trainLoading,C.green,"#3d7a3d")} onClick={()=>sendTrain(trainInput)} disabled={!trainInput.trim()||trainLoading}>↑</button>
          </div>
        )}

        {/* ── DISCOVER TAB ── */}
        {tab==="scout" && (
          <div style={{...S.page,paddingBottom:80}}>
            {scoutHistory.length===0 && (
              <div style={{...S.card,marginTop:8,animation:"fadeUp 0.5s ease",border:`1px solid rgba(90,184,176,0.2)`,background:"rgba(90,184,176,0.04)"}}>
                <div style={{fontSize:13,color:C.muted,lineHeight:1.75,fontStyle:"italic"}}>
                  Scout helps you discover what you love about coffee — no expertise needed. Just grab a cup and describe what you taste in any words that come to mind.
                </div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {scoutHistory.map((m,i)=><Bubble key={i} role={m.role} agent="SCOUT" agentColor={C.teal}>{m.content}</Bubble>)}
              {scoutLoading&&<Thinking color={C.teal} label="discovering"/>}
              <div ref={scoutEnd}/>
            </div>
          </div>
        )}
        {tab==="scout" && (
          <div style={S.chatBar}>
            <input style={{...S.input,flex:1}} placeholder="Describe what you taste…" value={scoutInput} onChange={e=>setScoutInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendScout(scoutInput)}/>
            <button style={S.sendBtn(!scoutInput.trim()||scoutLoading,C.teal,"#3a8a84")} onClick={()=>sendScout(scoutInput)} disabled={!scoutInput.trim()||scoutLoading}>↑</button>
          </div>
        )}

        {/* ── RIG TAB ── */}
        {/* ── RATE TAB ── */}
        {tab==="rate" && (
          <div style={S.page}>

            {/* Section switcher */}
            <div style={{...S.row,marginBottom:14,gap:0,background:"rgba(0,0,0,0.2)",borderRadius:10,padding:3}}>
              {[["beans","☕ Beans"],["gear","⚙ Gear"]].map(([id,label])=>(
                <button key={id} style={{flex:1,padding:"9px",background:rateSection===id?`linear-gradient(135deg,${C.gold},#a0721e)`:"transparent",border:"none",borderRadius:8,color:rateSection===id?"#180d06":C.muted,fontSize:12,fontWeight:rateSection===id?700:400,letterSpacing:2,fontFamily:"Courier New",cursor:"pointer",transition:"all 0.2s"}}
                  onClick={()=>{setRateSection(id);setRateForm(null);setRateEdit(null);}}>
                  {label}
                </button>
              ))}
            </div>

            {/* Bean form */}
            {rateSection==="beans" && rateForm==="bean" && (
              <BeanForm
                initial={rateEdit}
                onSave={async (item) => {
                  if (rateEdit) {
                    const list = rateData.beans.map(b=>b.id===rateEdit.id?{...b,...item}:b);
                    await saveRateData({...rateData,beans:list});
                  } else { await addRateItem("beans",item); }
                  setRateForm(null); setRateEdit(null);
                }}
                onCancel={()=>{setRateForm(null);setRateEdit(null);}}
                S={S} C={C}
              />
            )}

            {/* Gear form */}
            {rateSection==="gear" && rateForm==="gear" && (
              <GearForm
                initial={rateEdit}
                onSave={async (item) => {
                  if (rateEdit) {
                    const list = rateData.gear.map(g=>g.id===rateEdit.id?{...g,...item}:g);
                    await saveRateData({...rateData,gear:list});
                  } else { await addRateItem("gear",item); }
                  setRateForm(null); setRateEdit(null);
                }}
                onCancel={()=>{setRateForm(null);setRateEdit(null);}}
                S={S} C={C}
              />
            )}

            {/* Beans list */}
            {rateSection==="beans" && !rateForm && (
              <>
                <button style={S.btn()} onClick={()=>{setRateForm("bean");setRateEdit(null);}}>+ Log a Bean</button>
                {rateData.beans.length===0 && (
                  <div style={{...S.card,textAlign:"center",padding:32,marginTop:14}}>
                    <div style={{fontSize:28,marginBottom:8}}>🫘</div>
                    <div style={{fontSize:13,color:C.muted,fontStyle:"italic"}}>No beans logged yet.</div>
                  </div>
                )}
                {[...rateData.beans].reverse().map(b=>(
                  <div key={b.id} style={{...S.card,marginTop:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div>
                        <div style={{fontSize:16,fontWeight:600,color:C.text}}>{b.name}</div>
                        {b.roaster&&<div style={{fontSize:12,color:C.muted,fontFamily:"Courier New"}}>{b.roaster}</div>}
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <div style={{color:C.goldLight,fontSize:13}}>{"★".repeat(b.rating)}<span style={{color:"rgba(212,164,90,0.15)"}}>{"★".repeat(5-b.rating)}</span></div>
                        <button onClick={()=>{setRateEdit(b);setRateForm("bean");}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:"0 2px"}}>✎</button>
                        <button onClick={()=>deleteRateItem("beans",b.id)} style={{background:"none",border:"none",color:"rgba(224,112,112,0.4)",cursor:"pointer",fontSize:16,padding:"0 2px"}}>×</button>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap",fontSize:12,color:C.muted,marginBottom:6,fontFamily:"Courier New"}}>
                      {b.origin&&<span>🌍 {b.origin}</span>}
                      {b.process&&<span>⚗ {b.process}</span>}
                      {b.roastLevel&&<span>🔥 {b.roastLevel}</span>}
                      {b.roastDate&&<span>📅 {b.roastDate}</span>}
                    </div>
                    {b.tastingNotes&&<div style={{fontSize:13,color:"rgba(245,230,200,0.6)",fontStyle:"italic",marginBottom:6}}>"{b.tastingNotes}"</div>}
                    {b.wouldBuyAgain!==undefined&&<div style={{fontSize:11,fontFamily:"Courier New",color:b.wouldBuyAgain?C.green:"#e07070",letterSpacing:1}}>{b.wouldBuyAgain?"✓ Would buy again":"✗ Wouldn't buy again"}</div>}
                    {b.buyLink&&<a href={b.buyLink} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:8,fontSize:11,color:C.gold,fontFamily:"Courier New",letterSpacing:1,textDecoration:"none",border:`1px solid rgba(196,146,58,0.3)`,borderRadius:6,padding:"4px 10px"}}>Buy → {b.buyLink.replace(/https?:\/\/(www\.)?/,"").slice(0,30)}</a>}
                  </div>
                ))}
              </>
            )}

            {/* Gear list */}
            {rateSection==="gear" && !rateForm && (
              <>
                <button style={S.btn()} onClick={()=>{setRateForm("gear");setRateEdit(null);}}>+ Log Gear</button>
                {rateData.gear.length===0 && (
                  <div style={{...S.card,textAlign:"center",padding:32,marginTop:14}}>
                    <div style={{fontSize:28,marginBottom:8}}>⚙️</div>
                    <div style={{fontSize:13,color:C.muted,fontStyle:"italic"}}>No gear logged yet.</div>
                  </div>
                )}
                {[...rateData.gear].reverse().map(g=>(
                  <div key={g.id} style={{...S.card,marginTop:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div>
                        <div style={{fontSize:16,fontWeight:600,color:C.text}}>{g.name}</div>
                        {g.brand&&<div style={{fontSize:12,color:C.muted,fontFamily:"Courier New"}}>{g.brand}</div>}
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <div style={{color:C.goldLight,fontSize:13}}>{"★".repeat(g.rating)}<span style={{color:"rgba(212,164,90,0.15)"}}>{"★".repeat(5-g.rating)}</span></div>
                        <button onClick={()=>{setRateEdit(g);setRateForm("gear");}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:"0 2px"}}>✎</button>
                        <button onClick={()=>deleteRateItem("gear",g.id)} style={{background:"none",border:"none",color:"rgba(224,112,112,0.4)",cursor:"pointer",fontSize:16,padding:"0 2px"}}>×</button>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap",fontSize:12,color:C.muted,marginBottom:6,fontFamily:"Courier New"}}>
                      {g.category&&<span>📦 {g.category}</span>}
                      {g.price&&<span>💰 {g.price}</span>}
                      {g.owned!==undefined&&<span>{g.owned?"✓ Own it":"◯ Tried it"}</span>}
                    </div>
                    {g.review&&<div style={{fontSize:13,color:"rgba(245,230,200,0.6)",fontStyle:"italic",marginBottom:6}}>"{g.review}"</div>}
                    {g.wouldRecommend!==undefined&&<div style={{fontSize:11,fontFamily:"Courier New",color:g.wouldRecommend?C.green:"#e07070",letterSpacing:1}}>{g.wouldRecommend?"✓ Would recommend":"✗ Wouldn't recommend"}</div>}
                    {g.buyLink&&<a href={g.buyLink} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:8,fontSize:11,color:C.gold,fontFamily:"Courier New",letterSpacing:1,textDecoration:"none",border:`1px solid rgba(196,146,58,0.3)`,borderRadius:6,padding:"4px 10px"}}>Buy → {g.buyLink.replace(/https?:\/\/(www\.)?/,"").slice(0,30)}</a>}
                  </div>
                ))}
              </>
            )}
            <div style={{height:20}}/>
          </div>
        )}

        {tab==="me" && (() => {
          // Show Rig sub-section inside Me tab — full preset management
          return null; // handled below
        })()}

        {/* ── ME TAB ── */}
        {tab==="me" && (
          <div style={S.page}>
            {/* Identity card */}
            <div style={{...S.card,border:`1px solid rgba(196,146,58,0.22)`,background:"rgba(196,146,58,0.04)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <label style={S.label}>Taste Identity</label>
                <button onClick={toggleIdentity} style={{...S.ghostBtn,fontSize:10,padding:"4px 10px",color:activeUser?.identityEnabled?C.green:"#e07070",borderColor:activeUser?.identityEnabled?"rgba(126,200,126,0.3)":"rgba(224,112,112,0.3)"}}>
                  {activeUser?.identityEnabled?"● Building":"○ Paused"}
                </button>
              </div>
              {identity.traits?.length===0 && identity.vocabulary?.length===0 ? (
                <div style={{fontSize:13,color:C.muted,fontStyle:"italic",lineHeight:1.65}}>
                  Your taste identity builds as you use Dial, Train, and Discover. Start a session to begin.
                </div>
              ) : (
                <>
                  {identity.traits?.length>0&&(
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:9,letterSpacing:3,color:C.gold,fontFamily:"Courier New",marginBottom:6}}>YOUR TRAITS</div>
                      <div style={S.chipRow}>{identity.traits.map((t,i)=><span key={i} style={{...S.chip(true),cursor:"default"}}>{t}</span>)}</div>
                    </div>
                  )}
                  {identity.vocabulary?.length>0&&(
                    <div>
                      <div style={{fontSize:9,letterSpacing:3,color:C.teal,fontFamily:"Courier New",marginBottom:6}}>YOUR VOCABULARY</div>
                      <div style={S.chipRow}>{identity.vocabulary.map((v,i)=><span key={i} style={{...S.chip(false),cursor:"default",borderColor:"rgba(90,184,176,0.3)",color:C.teal}}>{v}</span>)}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Stats */}
            <div style={{...S.row,gap:10,marginBottom:14}}>
              {[[sessions.length,"Sessions","shots logged"],[doneLessons,"Lessons","palate trained"],[identity.log?.length||0,"Moments","identity built"]].map(([n,l,sub])=>(
                <div key={l} style={{...S.card,flex:1,textAlign:"center",padding:"14px 8px",marginBottom:0}}>
                  <div style={{fontSize:26,fontWeight:700,color:C.goldLight}}>{n}</div>
                  <div style={{fontSize:9,letterSpacing:2,color:C.gold,fontFamily:"Courier New",textTransform:"uppercase"}}>{l}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2,fontStyle:"italic"}}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Gear Presets */}
            <div style={S.card}>
              <label style={S.label}>Gear Presets</label>
              <div style={S.chipRow}>
                {presets.map(p=>(
                  <button key={p.id} style={{...S.chip(p.id===profile.id),position:"relative",paddingRight:presets.length>1?24:10}}
                    onClick={()=>{setActivePresetId(p.id);gset(sk(uid,"activePreset"),p.id);}}>
                    {p.name}
                    {presets.length>1&&<span onClick={e=>{e.stopPropagation();const up=presets.filter(x=>x.id!==p.id);savePresets(up,up[0].id);}} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",fontSize:13,color:C.muted}}>×</span>}
                  </button>
                ))}
              </div>
              <div style={{...S.row,marginTop:10}}>
                <input style={{...S.half,flex:1}} placeholder="New preset name…" value={newPresetName} onChange={e=>setNewPresetName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newPresetName.trim()){const np=makePreset(newPresetName.trim());const up=[...presets,np];savePresets(up,np.id);setNewPresetName("");}}}/>
                <button style={{...S.btn(),width:"auto",padding:"10px 14px",marginTop:0,fontSize:11}} onClick={()=>{if(!newPresetName.trim())return;const np=makePreset(newPresetName.trim());const up=[...presets,np];savePresets(up,np.id);setNewPresetName("");}}>+ Add</button>
              </div>
            </div>

            {/* Active rig editor */}
            <div style={{...S.row,alignItems:"center",marginBottom:10}}>
              {editingName?(
                <>
                  <input style={{...S.half,flex:1}} value={profile.name} onChange={e=>saveProfile({name:e.target.value})} autoFocus/>
                  <button onClick={()=>setEditingName(false)} style={{...S.btn(),width:"auto",padding:"10px 14px",marginTop:0,marginLeft:8,fontSize:11}}>Done</button>
                </>
              ):(
                <>
                  <div style={{flex:1,fontSize:18,fontWeight:600,color:C.goldLight}}>{profile.name}</div>
                  <button onClick={()=>setEditingName(true)} style={S.ghostBtn}>rename</button>
                </>
              )}
            </div>

            {[["grinder","Grinder model"],["burrs","Burr type / size"],["apparatus","Machine / apparatus"],["filter","Filter type"],["water","Water (TDS / source)"]].map(([key,ph])=>(
              <div key={key} style={{marginBottom:10}}>
                <label style={S.label}>{ph}</label>
                <input style={S.input} placeholder={ph} value={profile[key]||""} onChange={e=>saveProfile({[key]:e.target.value})}/>
              </div>
            ))}

            <div style={S.card}>
              <label style={S.label}>Custom Variables</label>
              {(profile.customVars||[]).map((cv,i)=>(
                <div key={i} style={{...S.row,marginBottom:8,alignItems:"center"}}>
                  <div style={{flex:1,fontSize:12,color:C.goldLight,fontFamily:"Courier New"}}>{cv.name}</div>
                  <input style={{...S.half,flex:2}} placeholder="value" value={cv.value||""} onChange={e=>{const up=[...(profile.customVars||[])];up[i]={...up[i],value:e.target.value};saveProfile({customVars:up});}}/>
                  <button onClick={()=>{const up=(profile.customVars||[]).filter((_,j)=>j!==i);saveProfile({customVars:up});}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>
                </div>
              ))}
              <div style={S.chipRow}>
                {PRESET_VARS.filter(pv=>!(profile.customVars||[]).find(cv=>cv.name===pv)).map(pv=>(
                  <button key={pv} style={S.chip(false)} onClick={()=>saveProfile({customVars:[...(profile.customVars||[]),{name:pv,value:""}]})}>+ {pv}</button>
                ))}
              </div>
              <div style={{...S.row,marginTop:10}}>
                <input style={{...S.half,flex:1}} placeholder="Custom variable…" value={newVar} onChange={e=>setNewVar(e.target.value)}/>
                <button style={{...S.btn(),width:"auto",padding:"10px 14px",marginTop:0,fontSize:11}} onClick={()=>{if(!newVar.trim())return;saveProfile({customVars:[...(profile.customVars||[]),{name:newVar.trim(),value:""}]});setNewVar("");}}>Add</button>
              </div>
            </div>

            <div style={{textAlign:"center",fontSize:11,color:"rgba(196,146,58,0.4)",marginTop:8,fontFamily:"Courier New"}}>✓ changes save automatically</div>

            {/* Switch / add user */}
            <div style={{...S.row,marginTop:16,gap:10}}>
              <button style={{...S.ghostBtn,flex:1}} onClick={switchUser}>Switch User</button>
              <button style={{...S.ghostBtn,flex:1}} onClick={()=>{switchUser();setTimeout(()=>setLoginMode("create"),100);}}>+ New User</button>
            </div>

            {/* About */}
            <div style={{...S.card,marginTop:16,borderColor:"rgba(212,164,90,0.08)"}}>
              <label style={S.label}>About Coffee G</label>
              <p style={{fontSize:14,color:C.text,lineHeight:1.75,margin:"0 0 10px"}}>
                <em>Coffee G</em> combines two things: the world of coffee, and <em>ji</em> — a Hindi honorific used as a warm term of respect and friendship.
              </p>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.7,margin:0,fontStyle:"italic"}}>
                Like saying "coffee, my friend" — a companion for your coffee journey, not just a tool.
              </p>
            </div>

            <div style={{height:24}}/>
          </div>
        )}

      </div>
    </>
  );
}
