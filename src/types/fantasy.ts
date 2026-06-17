export type LeagueSource = 'espn' | 'sleeper';

export interface LeagueConfig {
  id: string;
  name: string;
  source: LeagueSource;
  year: number;
  currentWeek: number;
}

export interface TeamScore {
  id: string;
  name: string;
  score: number;
}

export interface MatchupResult {
  week: number;
  home: TeamScore;
  away: TeamScore;
  winner: 'home' | 'away' | 'tie' | 'pending';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  week: number;
  winner: string | null;
  winnerTeam: string | null;
  score: number | null;
  settled: boolean;
}
