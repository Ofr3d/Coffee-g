const TABS = [
  { id: 'discover', label: 'Discover', icon: '✦' },
  { id: 'beans',    label: 'Beans',    icon: '◉' },
  { id: 'brew',     label: 'Brew',     icon: '◎' },
  { id: 'train',    label: 'Train',    icon: '◈' },
  { id: 'me',       label: 'Profile',  icon: '◑' },
];

export default function TabBar({ active, onChange }) {
  return (
    <nav style={{
      display: 'flex',
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      paddingBottom: 'var(--safe-bottom)',
      height: 'calc(var(--tab-h) + var(--safe-bottom))',
      flexShrink: 0,
    }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            color: active === tab.id ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            transition: 'color 0.15s',
          }}
        >
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
