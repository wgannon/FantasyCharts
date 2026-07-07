import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Team, Pos } from '../types'

const POS_COLORS: Record<string, string> = {
  QB: '#58a6ff', RB: '#3fb950', WR: '#a371f7', TE: '#e3b341',
}

export default function PositionChart({ teams, leagueName }: { teams: Team[]; leagueName: string }) {
  const filtered = teams.filter(t => t.league === leagueName)
  const positions: Pos[] = ['QB', 'RB', 'WR', 'TE']
  const hasAny = filtered.some(t => positions.some(p => t.position_points[p] !== null))

  if (!hasAny) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: 13 }}>
        Position data unavailable — boxscore access required for ESPN leagues.
      </div>
    )
  }

  const data = filtered.map(t => ({
    name: t.team_name.split(' ')[0],
    QB: t.position_points.QB ?? 0,
    RB: t.position_points.RB ?? 0,
    WR: t.position_points.WR ?? 0,
    TE: t.position_points.TE ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6 }}
          labelStyle={{ color: 'var(--text)', fontWeight: 600 }}
          itemStyle={{ color: 'var(--text)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
        {positions.map(p => <Bar key={p} dataKey={p} fill={POS_COLORS[p]} radius={[2, 2, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  )
}
