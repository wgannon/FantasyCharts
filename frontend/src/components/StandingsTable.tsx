import type { Team, Pos } from '../types'
import Tooltip from './shared/Tooltip'

const POSITIONS: Pos[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST']

function leagueAvg(teams: Team[], pos: Pos): number | null {
  const vals = teams.map(t => t.position_points[pos]).filter((v): v is number => v !== null)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export default function StandingsTable({ teams, leagueName }: { teams: Team[]; leagueName: string }) {
  const sorted = [...teams]
    .filter(t => t.league === leagueName)
    .sort((a, b) => b.wins - a.wins || b.points_for - a.points_for)

  const avgs = Object.fromEntries(POSITIONS.map(p => [p, leagueAvg(sorted, p)])) as Record<Pos, number | null>

  const thStyle: React.CSSProperties = {
    padding: '8px 12px', textAlign: 'left', fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)',
    fontWeight: 600, whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--border)',
  }
  const tdStyle: React.CSSProperties = {
    padding: '10px 12px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--surface)' }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Team</th>
            <th style={thStyle}>Owner</th>
            <th style={thStyle}>W-L-T</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>PF</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>PA</th>
            <th style={thStyle}>Streak</th>
            {POSITIONS.map(p => <th key={p} style={{ ...thStyle, textAlign: 'right' }}>{p}</th>)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, i) => {
            const streakColor = team.streak.startsWith('W') ? 'var(--positive)' : team.streak.startsWith('L') ? 'var(--negative)' : 'var(--muted)'
            return (
              <tr key={team.team_id} style={{ background: i % 2 === 0 ? 'var(--card)' : 'var(--surface)' }}>
                <td style={{ ...tdStyle, color: 'var(--muted)' }}>{i + 1}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{team.team_name}</td>
                <td style={{ ...tdStyle, color: 'var(--muted)' }}>{team.owner_name}</td>
                <td style={tdStyle}>{team.wins}-{team.losses}-{team.ties}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{team.points_for.toFixed(1)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{team.points_against.toFixed(1)}</td>
                <td style={{ ...tdStyle, color: streakColor, fontWeight: 600 }}>{team.streak || '—'}</td>
                {POSITIONS.map(p => {
                  const val = team.position_points[p]
                  const avg = avgs[p]
                  if (val === null) return <td key={p} style={{ ...tdStyle, textAlign: 'right', color: 'var(--muted)' }}>N/A</td>
                  const delta = avg !== null ? val - avg : null
                  const indicator = delta === null ? '' : delta > 0 ? ' ▲' : delta < 0 ? ' ▼' : ''
                  const indColor = delta === null ? '' : delta > 0 ? 'var(--positive)' : delta < 0 ? 'var(--negative)' : ''
                  return (
                    <td key={p} style={{ ...tdStyle, textAlign: 'right' }}>
                      {val.toFixed(1)}
                      {indicator && delta !== null && (
                        <Tooltip content={`${delta > 0 ? '+' : ''}${delta.toFixed(1)} vs league avg`}>
                          <span style={{ color: indColor, fontSize: 10, marginLeft: 2 }}>{indicator}</span>
                        </Tooltip>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
