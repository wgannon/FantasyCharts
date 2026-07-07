export type Platform = 'espn' | 'sleeper'
export type Winner = 'home' | 'away' | 'tie' | 'pending'
export type Pos = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST'

export interface LeagueMeta {
  name: string
  platform: Platform
  league_id: string
  season: number
  current_week: number
  scoring_type: string | null
  error: string | null
}

export interface Team {
  league: string
  team_id: string
  team_name: string
  owner_name: string
  wins: number
  losses: number
  ties: number
  points_for: number
  points_against: number
  streak: string
  position_points: Record<Pos, number | null>
}

export interface WeeklyMatchup {
  league: string
  week: number
  home_team_id: string
  away_team_id: string
  home_team_name: string
  away_team_name: string
  home_owner: string
  away_owner: string
  home_score: number
  away_score: number
  winner: Winner
}

export interface OwnerRecord {
  owner_name: string
  total_wins: number
  total_losses: number
  total_ties: number
  total_points_for: number
  per_league: Record<string, { wins: number; losses: number; ties: number; points_for: number; team_name: string }>
}

export interface H2HRecord {
  owner_a: string
  owner_b: string
  a_wins: number
  b_wins: number
  ties: number
  matchups: Array<{
    league: string; week: number
    home_team_name: string; away_team_name: string
    home_owner: string; away_owner: string
    home_score: number; away_score: number
    winner: Winner
  }>
}

export interface RivalryCallout {
  type: 'sweep' | 'streak' | 'closest_margin' | 'dominant'
  description: string
  owners: string[]
}

export interface StandingsResponse {
  leagues: LeagueMeta[]
  teams: Team[]
}

export interface RivalriesResponse {
  owner_records: OwnerRecord[]
  h2h: H2HRecord[]
  callouts: RivalryCallout[]
}
