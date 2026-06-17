'use client';

import type { StandingEntry } from '@/types/fantasy';
import styles from '@/app/page.module.css';

interface Props {
  standings: StandingEntry[];
  year: number;
}

export function StandingsTable({ standings, year }: Props) {
  if (standings.length === 0) {
    return <p className={styles.muted}>No standings data available for {year}.</p>;
  }

  return (
    <div className={styles.table}>
      <div
        className={`${styles.row} ${styles.head}`}
        style={{ gridTemplateColumns: '0.4fr 1.8fr 0.8fr 0.8fr 0.8fr 0.8fr' }}
      >
        <span>#</span>
        <span>Team</span>
        <span>Record</span>
        <span>PF</span>
        <span>PA</span>
        <span>Diff</span>
      </div>
      {standings.map((s) => {
        const diff = s.pointsFor - s.pointsAgainst;
        const record = s.ties > 0 ? `${s.wins}-${s.losses}-${s.ties}` : `${s.wins}-${s.losses}`;
        return (
          <div
            key={s.teamId}
            className={styles.row}
            style={{ gridTemplateColumns: '0.4fr 1.8fr 0.8fr 0.8fr 0.8fr 0.8fr' }}
          >
            <span className={s.rank <= 3 ? styles.positive : styles.muted}>{s.rank}</span>
            <span className={styles.em}>{s.name}</span>
            <span className={styles.bold}>{record}</span>
            <span>{s.pointsFor.toFixed(2)}</span>
            <span>{s.pointsAgainst.toFixed(2)}</span>
            <span className={diff >= 0 ? styles.positive : styles.negative}>
              {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
