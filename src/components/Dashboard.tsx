'use client';

import { useState, useEffect } from 'react';
import type { LeagueConfig, MatchupResult, Challenge } from '@/types/fantasy';
import { ScoreMarginChart } from './ScoreMarginChart';
import { ChallengesTable } from './ChallengesTable';
import styles from '@/app/page.module.css';
import dashStyles from './Dashboard.module.css';

interface Props {
  leagues: LeagueConfig[];
  challenges: Challenge[];
}

export function Dashboard({ leagues, challenges }: Props) {
  const [activeLeague, setActiveLeague] = useState<LeagueConfig>(leagues[0]);
  const [matchups, setMatchups] = useState<MatchupResult[]>([]);
  const [week, setWeek] = useState(activeLeague?.currentWeek ?? 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWeek(activeLeague.currentWeek);
  }, [activeLeague]);

  useEffect(() => {
    if (!activeLeague) return;
    setLoading(true);
    setError(null);
    const endpoint = activeLeague.source === 'espn'
      ? `/api/espn/${activeLeague.id}?week=${week}&year=${activeLeague.year}`
      : `/api/sleeper/${activeLeague.id}?week=${week}`;
    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setMatchups([]); }
        else setMatchups(data);
      })
      .catch(() => setError('Failed to load matchups'))
      .finally(() => setLoading(false));
  }, [activeLeague, week]);

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Fantasy · Multi-League Dashboard</p>
          <h1>Fantasy Pulse</h1>
          <p className={styles.lede}>
            Head-to-head score margins, standings, and weekly challenges across your leagues.
          </p>
        </div>
        <div className={styles.badge}>Week {week}</div>
      </header>

      {/* League tabs */}
      <div className={dashStyles.tabs}>
        {leagues.map(league => (
          <button
            key={`${league.source}-${league.id}`}
            className={`${dashStyles.tab} ${activeLeague?.id === league.id ? dashStyles.active : ''}`}
            onClick={() => setActiveLeague(league)}
          >
            <span className={dashStyles.tabSource}>{league.source.toUpperCase()}</span>
            {league.name}
          </button>
        ))}
      </div>

      {/* Week selector */}
      <div className={dashStyles.weekRow}>
        <span className={styles.label}>Week</span>
        <div className={dashStyles.weekButtons}>
          {Array.from({ length: activeLeague?.currentWeek ?? 9 }, (_, i) => i + 1).map(w => (
            <button
              key={w}
              className={`${dashStyles.weekBtn} ${w === week ? dashStyles.weekActive : ''}`}
              onClick={() => setWeek(w)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Score margin chart */}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.label}>Head-to-Head Score Comparison</p>
            <h2>{activeLeague?.name} · Week {week}</h2>
          </div>
          <span className={styles.tag}>{activeLeague?.source}</span>
        </div>
        {loading && <p className={styles.muted}>Loading matchups…</p>}
        {error && (
          <div className={dashStyles.errorBox}>
            <strong>Could not load data:</strong> {error}
          </div>
        )}
        {!loading && !error && matchups.length === 0 && (
          <p className={styles.muted}>No matchup data for Week {week}.</p>
        )}
        {!loading && !error && matchups.length > 0 && (
          <ScoreMarginChart matchups={matchups} title={activeLeague?.name ?? ''} />
        )}
      </section>

      {/* Challenges table — only for ESPN leagues */}
      {activeLeague?.source === 'espn' && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.label}>Weekly Challenges</p>
              <h2>Week {week} Challenges</h2>
            </div>
            <span className={styles.tag}>ESPN</span>
          </div>
          <ChallengesTable challenges={challenges} week={week} />
        </section>
      )}
    </main>
  );
}
