'use client';

import { useState, useEffect } from 'react';
import type { LeagueConfig, MatchupResult, StandingEntry, Challenge } from '@/types/fantasy';
import { ScoreMarginChart } from './ScoreMarginChart';
import { StandingsTable } from './StandingsTable';
import { ChallengesTable } from './ChallengesTable';
import styles from '@/app/page.module.css';
import dashStyles from './Dashboard.module.css';

type TabMode = 'matchups' | 'standings';

interface Tab {
  id: string;
  label: string;
  source: string;
  mode: TabMode;
  league: LeagueConfig;
}

interface Props {
  leagues: LeagueConfig[];
  challenges: Challenge[];
}

export function Dashboard({ leagues, challenges }: Props) {
  const tabs: Tab[] = [
    ...leagues.map(l => ({ id: `${l.source}-matchups`, label: l.name, source: l.source, mode: 'matchups' as TabMode, league: l })),
    ...leagues.map(l => ({ id: `${l.source}-standings`, label: `${l.source === 'espn' ? 'ESPN' : 'Sleeper'} Standings`, source: l.source, mode: 'standings' as TabMode, league: l })),
  ];

  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]);
  const [matchups, setMatchups] = useState<MatchupResult[]>([]);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [week, setWeek] = useState(tabs[0].league.currentWeek);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab.mode === 'matchups') {
      setWeek(activeTab.league.currentWeek);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMatchups([]);
    setStandings([]);

    let endpoint = '';
    if (activeTab.mode === 'matchups') {
      endpoint = activeTab.league.source === 'espn'
        ? `/api/espn/${activeTab.league.id}?week=${week}&year=${activeTab.league.year}`
        : `/api/sleeper/${activeTab.league.id}?week=${week}`;
    } else {
      endpoint = activeTab.league.source === 'espn'
        ? `/api/espn/${activeTab.league.id}/standings?year=${activeTab.league.year}`
        : `/api/sleeper/${activeTab.league.id}/standings`;
    }

    fetch(endpoint)
      .then(async r => {
        const text = await r.text();
        let data: unknown;
        try { data = JSON.parse(text); } catch { throw new Error(`Server error (${r.status})`); }
        if (!r.ok || (data as { error?: string })?.error) {
          setError((data as { error?: string })?.error ?? `Server error (${r.status})`);
        } else if (activeTab.mode === 'standings') {
          setStandings(data as StandingEntry[]);
        } else {
          setMatchups(data as MatchupResult[]);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeTab, week]);

  const activeLeague = activeTab.league;

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
        {activeTab.mode === 'matchups' && (
          <div className={styles.badge}>Week {week}</div>
        )}
      </header>

      {/* Tabs */}
      <div className={dashStyles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${dashStyles.tab} ${activeTab.id === tab.id ? dashStyles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className={dashStyles.tabSource}>{tab.source.toUpperCase()}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Week selector — matchups only */}
      {activeTab.mode === 'matchups' && (
        <div className={dashStyles.weekRow}>
          <span className={styles.label}>Week</span>
          <div className={dashStyles.weekButtons}>
            {Array.from({ length: activeLeague.currentWeek }, (_, i) => i + 1).map(w => (
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
      )}

      {/* Main panel */}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.label}>
              {activeTab.mode === 'matchups' ? 'Head-to-Head Score Comparison' : `${activeLeague.year} Final Standings`}
            </p>
            <h2>
              {activeTab.mode === 'matchups'
                ? `${activeLeague.name} · Week ${week}`
                : activeTab.label}
            </h2>
          </div>
          <span className={styles.tag}>{activeLeague.source}</span>
        </div>

        {loading && <p className={styles.muted}>Loading…</p>}
        {error && (
          <div className={dashStyles.errorBox}>
            <strong>Could not load data:</strong> {error}
          </div>
        )}

        {!loading && !error && activeTab.mode === 'matchups' && matchups.length === 0 && (
          <p className={styles.muted}>No matchup data for Week {week}.</p>
        )}
        {!loading && !error && activeTab.mode === 'matchups' && matchups.length > 0 && (
          <ScoreMarginChart matchups={matchups} title={activeLeague.name} />
        )}

        {!loading && !error && activeTab.mode === 'standings' && (
          <StandingsTable standings={standings} year={activeLeague.year} />
        )}
      </section>

      {/* Challenges — ESPN matchups tab only */}
      {activeTab.mode === 'matchups' && activeLeague.source === 'espn' && (
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
