import { useState } from 'react'
import type { OwnerRecord } from '../types'

export default function OwnerLeaderboard({ records }: { records: OwnerRecord[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (name: string) => setExpanded(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s })

  const thStyle: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }
  const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid var(--border)' }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--surface)' }}>
            <th style={thStyle}></th>
            <th style={thStyle}>Owner</th>
            <th style={thStyle}>W-L-T</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Total PF</th>
            <th style={thStyle}>Leagues</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <>
              <tr key={r.owner_name} style={{ background: i % 2 === 0 ? 'var(--card)' : 'var(--surface)', cursor: 'pointer' }} onClick={() => toggle(r.owner_name)}>
                <td style={{ ...tdStyle, color: 'var(--muted)', fontSize: 11 }}>{expanded.has(r.owner_name) ? '▼' : '▶'}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{r.owner_name}</td>
                <td style={tdStyle}>{r.total_wins}-{r.total_losses}-{r.total_ties}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{r.total_points_for.toFixed(1)}</td>
                <td style={{ ...tdStyle, color: 'var(--muted)' }}>{Object.keys(r.per_league).length}</td>
              </tr>
              {expanded.has(r.owner_name) && Object.entries(r.per_league).map(([lg, d]) => (
                <tr key={`${r.owner_name}-${lg}`} style={{ background: 'var(--bg)' }}>
                  <td style={tdStyle}></td>
                  <td style={{ ...tdStyle, paddingLeft: 28, color: 'var(--muted)', fontSize: 12 }}>{lg} — {d.team_name}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--muted)' }}>{d.wins}-{d.losses}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>{d.points_for.toFixed(1)}</td>
                  <td style={tdStyle}></td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
