import { useState } from 'react'
import type { H2HRecord } from '../types'

export default function H2HGrid({ h2h }: { h2h: H2HRecord[] }) {
  const [selected, setSelected] = useState<H2HRecord | null>(null)

  if (!h2h.length) return <p style={{ color: 'var(--muted)', fontSize: 13 }}>No head-to-head matchups found between mapped owners yet.</p>

  const owners = Array.from(new Set(h2h.flatMap(r => [r.owner_a, r.owner_b]))).sort()

  const lookup = (a: string, b: string): H2HRecord | undefined =>
    h2h.find(r => (r.owner_a === a && r.owner_b === b) || (r.owner_a === b && r.owner_b === a))

  const cellStyle = (bg: string): React.CSSProperties => ({
    padding: '8px 10px', textAlign: 'center', fontSize: 12, cursor: 'pointer',
    background: bg, border: '1px solid var(--border)', minWidth: 60,
  })

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 12px', color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase' }}>&#8595; vs &#8594;</th>
              {owners.map(o => <th key={o} style={{ padding: '8px 10px', color: 'var(--muted)', fontWeight: 600, border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{o}</th>)}
            </tr>
          </thead>
          <tbody>
            {owners.map(rowOwner => (
              <tr key={rowOwner}>
                <td style={{ padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap', border: '1px solid var(--border)' }}>{rowOwner}</td>
                {owners.map(colOwner => {
                  if (rowOwner === colOwner) return <td key={colOwner} style={cellStyle('var(--surface)')}>—</td>
                  const rec = lookup(rowOwner, colOwner)
                  if (!rec) return <td key={colOwner} style={cellStyle('var(--bg)')}>—</td>
                  const rowWins = rec.owner_a === rowOwner ? rec.a_wins : rec.b_wins
                  const colWins = rec.owner_a === rowOwner ? rec.b_wins : rec.a_wins
                  const bg = rowWins > colWins ? 'rgba(63,185,80,0.12)' : rowWins < colWins ? 'rgba(248,81,73,0.12)' : 'var(--card)'
                  return (
                    <td key={colOwner} style={cellStyle(bg)} onClick={() => setSelected(selected?.owner_a === rec.owner_a && selected?.owner_b === rec.owner_b ? null : rec)}>
                      <span style={{ color: rowWins > colWins ? 'var(--positive)' : rowWins < colWins ? 'var(--negative)' : 'var(--text)', fontWeight: 600 }}>{rowWins}</span>
                      <span style={{ color: 'var(--muted)' }}>-{colWins}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div style={{ marginTop: 16, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>{selected.owner_a} vs {selected.owner_b} — All Matchups</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11 }}>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>League</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Week</th>
                <th style={{ padding: '4px 8px' }}>{selected.owner_a}</th>
                <th style={{ padding: '4px 8px' }}>{selected.owner_b}</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Winner</th>
              </tr>
            </thead>
            <tbody>
              {selected.matchups.map((m, i) => {
                const aScore = m.home_owner === selected.owner_a ? m.home_score : m.away_score
                const bScore = m.home_owner === selected.owner_b ? m.home_score : m.away_score
                const winner = m.winner === 'home' ? m.home_owner : m.winner === 'away' ? m.away_owner : 'Tie'
                return (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 8px' }}>{m.league}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>Wk {m.week}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{aScore.toFixed(1)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{bScore.toFixed(1)}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--positive)', fontWeight: 600 }}>{winner}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
