import { useState, useEffect } from 'react'
import { fetchRivalries } from '../api'
import type { RivalriesResponse } from '../types'
import LoadingSpinner from './shared/LoadingSpinner'
import ErrorBanner from './shared/ErrorBanner'
import OwnerLeaderboard from './OwnerLeaderboard'
import H2HGrid from './H2HGrid'
import RivalryCallouts from './RivalryCallouts'

const section = (title: string, children: React.ReactNode) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 600, marginBottom: 12 }}>{title}</div>
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>{children}</div>
  </div>
)

export default function RivalriesView() {
  const [data, setData] = useState<RivalriesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRivalries()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner label="Loading rivalries…" />
  if (error) return <ErrorBanner message={error} />
  if (!data) return null

  if (!data.owner_records.length) {
    return (
      <div style={{ background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.3)', borderRadius: 8, padding: '20px 24px', color: 'var(--text)', fontSize: 13, maxWidth: 600 }}>
        <strong>No owner mappings configured.</strong><br /><br />
        Add an <code style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 3 }}>owners</code> section to <code style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 3 }}>config.yaml</code> to enable cross-league rivalry tracking. Run <code style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 3 }}>GET /api/owners/dump</code> to discover team IDs.
      </div>
    )
  }

  return (
    <div>
      {section('Owner Leaderboard', <OwnerLeaderboard records={data.owner_records} />)}
      {section('Head-to-Head Grid', <H2HGrid h2h={data.h2h} />)}
      {section('Rivalry Callouts', <RivalryCallouts callouts={data.callouts} />)}
    </div>
  )
}
