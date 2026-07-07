import type { LeagueMeta } from '../types'

export default function LeagueMetaStrip({ meta }: { meta: LeagueMeta }) {
  const chip = (label: string, color: string) => (
    <span style={{
      background: `${color}22`, color, border: `1px solid ${color}55`,
      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
    }}>{label}</span>
  )
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
      marginBottom: 12,
      fontSize: 13,
    }}>
      <strong style={{ fontSize: 14 }}>{meta.name}</strong>
      {chip(meta.platform.toUpperCase(), meta.platform === 'espn' ? '#e3b341' : '#58a6ff')}
      <span style={{ color: 'var(--muted)' }}>{meta.season} Season</span>
      <span style={{ color: 'var(--muted)' }}>Week {meta.current_week}</span>
      {meta.scoring_type && <span style={{ color: 'var(--muted)' }}>{meta.scoring_type}</span>}
    </div>
  )
}
