import { useState } from 'react';
import { RECIPES, TIER_LABELS } from '../lib/recipes';
import { getSavedRecipes, toggleSavedRecipe } from '../lib/storage';

export default function Discover({ profile }) {
  const [saved, setSaved]         = useState(() => getSavedRecipes());
  const [expanded, setExpanded]   = useState(null);

  function handleToggleSave(id) {
    const next = toggleSavedRecipe(id);
    setSaved(next);
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 16px 24px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Discover</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        Community recipes from gurus, growers, and roasters.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {RECIPES.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            saved={saved.includes(recipe.id)}
            expanded={expanded === recipe.id}
            onToggleExpand={() => setExpanded(expanded === recipe.id ? null : recipe.id)}
            onToggleSave={() => handleToggleSave(recipe.id)}
          />
        ))}
      </div>
    </div>
  );
}

function RecipeCard({ recipe, saved, expanded, onToggleExpand, onToggleSave }) {
  const tierLabel = TIER_LABELS[recipe.author_tier];
  const params = recipe.parameters;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={onToggleExpand}
        style={{
          width: '100%',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{recipe.bean_name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {recipe.method} · {recipe.bean_roast} · {recipe.bean_origin}
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 18, marginLeft: 8 }}>
            {expanded ? '⌃' : '⌄'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {tierLabel && (
            <span style={{
              fontSize: 11,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '2px 8px',
              color: 'var(--accent)',
            }}>
              {tierLabel}
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{recipe.author}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            ★ {recipe.rating_count}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            {params.dose   && <Param label="Dose"   value={`${params.dose}g`} />}
            {params.yield  && <Param label="Yield"  value={`${params.yield}${recipe.method === 'Espresso' ? 'g' : 'ml'}`} />}
            {params.time   && <Param label="Time"   value={params.time} />}
            {params.grind  && <Param label="Grind"  value={`${params.grind}${params.grind_device ? ` · ${params.grind_device}` : ''}`} />}
            {params.temp   && <Param label="Temp"   value={`${params.temp}°C`} />}
          </div>

          {recipe.notes && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
              {recipe.notes}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onToggleSave}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: saved ? 'var(--accent)' : 'var(--surface-2)',
                color: saved ? '#fff' : 'var(--text)',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {saved ? '★ Saved' : '☆ Save'}
            </button>

            {recipe.affiliate_links?.length > 0 && recipe.affiliate_links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--accent)',
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Param({ label, value }) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      borderRadius: 8,
      padding: '6px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
