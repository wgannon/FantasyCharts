import { useState, useEffect } from 'react'
import { fetchStandings } from '../api'
import type { StandingsResponse } from '../types'
import LoadingSpinner from './shared/LoadingSpinner'
import ErrorBanner from './shared/ErrorBanner'
import LeagueMetaStrip from './LeagueMetaStrip'
import StandingsTable from './StandingsTable'
import PositionChart from './PositionChart'

export default function StandingsView() {
  const [data, setData] = useState<StandingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeLeague, setActiveLeague] = useState<string>('')

  useEffect(() => {
    fetchStandings()
      .then(d => { setData(d); if (d.leagues.length) setActiveLeague(d.leagues[0].name) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner label="Loading standings…" />
  if (error) return <ErrorBanner message={error} />
  if (!data) return null

  const failedLeagues = data.leagues.filter(l => l.error)
  const activeMeta = data.leagues.find(l => l.name === activeLeague)

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px',
    borderRadius: '8px 8px 0 0',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--text)' : 'var(--muted)',
    background: active ? 'var(--card)' : 'transparent',
    border: `1px solid ${active ? 'var(--border)' : 'transparent'}`,
    borderBottom: active ? '1px solid var(--card)' : '1px solid var(--border)',
    transition: 'all 0.15s',
    cursor: 'pointer',
  })

  const panel: React.CSSProperties = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '0 8px 8px 8px',
    padding: 20,
    marginBottom: 24,
  }

  return (
    <div>
      {failedLeagues.map(l => (
        <ErrorBanner key={l.name} message={`${l.name}: ${l.error}`} />
      ))}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
        {data.leagues.map(l => (
          <button key={l.name} style={tabStyle(activeLeague === l.name)} onClick={() => setActiveLeague(l.name)}>
            {l.name}
          </button>
        ))}
      </div>
      {activeMeta && (
        <div style={panel}>
          <LeagueMetaStrip meta={activeMeta} />
          {activeMeta.error
            ? <ErrorBanner message={activeMeta.error} />
            : <>
                <StandingsTable teams={data.teams} leagueName={activeLeague} />
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Points by Position (Starters)</div>
                  <PositionChart teams={data.teams} leagueName={activeLeague} />
                </div>
              </>
          }
        </div>
      )}
    </div>
  )
}
