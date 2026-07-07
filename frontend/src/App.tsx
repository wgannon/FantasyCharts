import { useState, useCallback } from 'react'
import StandingsView from './components/StandingsView'
import RivalriesView from './components/RivalriesView'

type Tab = 'standings' | 'rivalries'

export default function App() {
  const [tab, setTab] = useState<Tab>('standings')
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  const navStyle: React.CSSProperties = {
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    height: 52,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  }
  const titleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 16,
    color: 'var(--text)',
    marginRight: 'auto',
  }
  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 6,
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent)' : 'var(--muted)',
    background: active ? 'rgba(88,166,255,0.1)' : 'transparent',
    border: active ? '1px solid rgba(88,166,255,0.3)' : '1px solid transparent',
    transition: 'all 0.15s',
  })
  const refreshBtnStyle: React.CSSProperties = {
    padding: '5px 12px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    color: 'var(--muted)',
    fontSize: 12,
    marginLeft: 8,
  }

  return (
    <>
      <nav style={navStyle}>
        <span style={titleStyle}>&#9889; Fantasy Aggregator</span>
        <button style={tabBtnStyle(tab === 'standings')} onClick={() => setTab('standings')}>Standings</button>
        <button style={tabBtnStyle(tab === 'rivalries')} onClick={() => setTab('rivalries')}>Rivalries</button>
        <button style={refreshBtnStyle} onClick={refresh}>&#8635; Refresh</button>
      </nav>
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        {tab === 'standings' && <StandingsView key={`s-${refreshKey}`} />}
        {tab === 'rivalries' && <RivalriesView key={`r-${refreshKey}`} />}
      </div>
    </>
  )
}
