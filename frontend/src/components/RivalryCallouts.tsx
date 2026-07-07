import type { RivalryCallout } from '../types'

const ICONS: Record<string, string> = {
  sweep: '🏆', streak: '🔥', dominant: '💪', closest_margin: '⚖️',
}

export default function RivalryCallouts({ callouts }: { callouts: RivalryCallout[] }) {
  if (!callouts.length) return <p style={{ color: 'var(--muted)', fontSize: 13 }}>No notable rivalries detected yet — more games needed.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {callouts.map((c, i) => (
        <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20 }}>{ICONS[c.type] || '📊'}</span>
          <div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>{c.description}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {c.owners.map(o => (
                <span key={o} style={{ background: 'rgba(88,166,255,0.1)', color: 'var(--accent)', border: '1px solid rgba(88,166,255,0.3)', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{o}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
