// Phase 1: "Get Coffee" tab — placeholder marketplace.
// Top-level type toggle (Roasted / Green) retints the canvas; roast-level is a
// sub-filter that only applies to roasted coffee. Green coffee is the input to
// the later home-roasting branch, so it shows an honest empty-state for now.
import { useState } from 'react';
import { RECIPES, TIER_LABELS } from '../lib/recipes';

const ROAST_LEVELS = ['All', 'Light', 'Medium-Light', 'Medium', 'Medium-Dark', 'Dark'];

// Filter-driven canvas tint + accent. Sketch values — see art/ design board.
const TYPE_THEME = {
  Roasted: { bg: '#ece0d2', accent: '#9a6a3c' }, // light brown — roasted
  Green:   { bg: '#e4e7da', accent: '#6e8c5a' }, // subtle green — raw/unroasted
};

export default function Beans({ profile }) {
  const [coffeeType, setCoffeeType] = useState('Roasted');
  const [roastFilter, setRoastFilter] = useState('All');
  const [ratings, setRatings] = useState({});

  const theme = TYPE_THEME[coffeeType];

  // Green coffee has no data yet (arrives with the home-roasting branch).
  const filtered = coffeeType === 'Green'
    ? []
    : RECIPES.filter(r => roastFilter === 'All' || r.bean_roast === roastFilter);

  function handleRate(id, stars) {
    setRatings(r => ({ ...r, [id]: r[id] === stars ? 0 : stars }));
  }

  return (
    <div
      style={{
        // Local overrides: every child reading var(--bg)/var(--accent) recolors.
        ['--bg']: theme.bg,
        ['--accent']: theme.accent,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        transition: 'background 0.25s ease',
      }}
    >
      <div style={{ padding: '20px 16px 12px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Get Coffee</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 14 }}>
          Browse roasted beans, or green coffee to roast yourself.
        </p>

        {/* Type toggle — drives the canvas tint */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', borderRadius: 12, padding: 4, marginBottom: 14 }}>
          {['Roasted', 'Green'].map(t => (
            <button
              key={t}
              onClick={() => setCoffeeType(t)}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 600,
                background: coffeeType === t ? 'var(--accent)' : 'transparent',
                color: coffeeType === t ? '#fff' : 'var(--text-muted)',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Roast-level sub-filter — roasted coffee only */}
        {coffeeType === 'Roasted' && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {ROAST_LEVELS.map(r => (
              <FilterChip key={r} label={r} active={roastFilter === r} onClick={() => setRoastFilter(r)} />
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {coffeeType === 'Green' ? (
          <GreenEmptyState />
        ) : (
          filtered.map(recipe => (
            <BeanCard key={recipe.id} recipe={recipe} userRating={ratings[recipe.id] || 0} onRate={s => handleRate(recipe.id, s)} />
          ))
        )}
      </div>
    </div>
  );
}

function GreenEmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>Green coffee is coming</div>
      <p style={{ fontSize: 14, lineHeight: 1.6 }}>
        Raw beans to roast at home arrive with home-roasting. For now, the canvas just shows how the green filter will feel.
      </p>
    </div>
  );
}

function BeanCard({ recipe, userRating, onRate }) {
  const [expanded, setExpanded] = useState(false);
  const tierLabel = TIER_LABELS[recipe.author_tier];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <button onClick={() => setExpanded(e => !e)} style={{ width: '100%', padding: '14px 16px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{recipe.bean_name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {recipe.bean_origin} · {recipe.bean_roast}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
              {tierLabel && <span style={{ color: 'var(--accent)' }}>{tierLabel}</span>}
              <span>{recipe.author}</span>
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 18, marginLeft: 8 }}>{expanded ? '⌃' : '⌄'}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ paddingTop: 14, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {recipe.notes}
          </p>

          {/* Star rating */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Your rating
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => onRate(s)}
                  style={{ fontSize: 26, color: s <= userRating ? 'var(--accent)' : 'var(--border)' }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {recipe.affiliate_links?.length > 0 && recipe.affiliate_links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                marginBottom: 8,
              }}
            >
              {link.label} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        whiteSpace: 'nowrap',
        padding: '6px 14px',
        borderRadius: 20,
        fontSize: 13,
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent)22' : 'var(--surface-2)',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  );
}
