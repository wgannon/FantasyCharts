import type { StandingsResponse, RivalriesResponse, WeeklyMatchup } from './types'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const j = await res.json(); msg = j.detail || j.error || msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export const fetchStandings = (refresh = false): Promise<StandingsResponse> =>
  apiFetch(`/api/standings${refresh ? '?refresh=true' : ''}`)

export const fetchRivalries = (refresh = false): Promise<RivalriesResponse> =>
  apiFetch(`/api/rivalries${refresh ? '?refresh=true' : ''}`)

export const fetchMatchups = (leagueName: string, week: number): Promise<WeeklyMatchup[]> =>
  apiFetch(`/api/matchups/${encodeURIComponent(leagueName)}?week=${week}`)

export const fetchOwnersDump = (): Promise<Record<string, Array<{team_id: string|number; team_name: string; owner: string}>>> =>
  apiFetch('/api/owners/dump')
