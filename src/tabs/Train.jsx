import { useState } from 'react';
import { TRAIN_CARDS } from '../lib/tips';
import { getDismissedCards, dismissCard } from '../lib/storage';

export default function Train() {
  const [dismissed, setDismissed] = useState(() => getDismissedCards());

  const cards = TRAIN_CARDS.filter(c => !dismissed.includes(c.id));

  function handleDismiss(id) {
    dismissCard(id);
    setDismissed(prev => [...prev, id]);
  }

  if (cards.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 16 }}>
        <div style={{ fontSize: 40 }}>☕</div>
        <h3 style={{ fontSize: 18, fontWeight: 600 }}>You've read everything.</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          More cards will arrive as the community grows. Keep brewing.
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 16px 12px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Train</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Bite-sized coffee knowledge. Dismiss what you already know.
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cards.map(card => (
          <TrainCard key={card.id} card={card} onDismiss={() => handleDismiss(card.id)} />
        ))}
      </div>
    </div>
  );
}

function TrainCard({ card, onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', padding: '16px', textAlign: 'left' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <span style={{
              display: 'inline-block',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--accent)',
              marginBottom: 6,
            }}>
              {card.topic}
            </span>
            <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>{card.headline}</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }}>
            {expanded ? '⌃' : '⌄'}
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ paddingTop: 14, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 14 }}>
            {card.body}
          </p>
          <div style={{
            background: 'var(--surface-2)',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Takeaway
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{card.takeaway}</p>
          </div>

          <button
            onClick={onDismiss}
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              padding: '6px 0',
              textDecoration: 'underline',
            }}
          >
            Got it — dismiss
          </button>
        </div>
      )}
    </div>
  );
}
