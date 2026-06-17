'use client';

import type { Challenge } from '@/types/fantasy';
import styles from '@/app/page.module.css';

interface Props {
  challenges: Challenge[];
  week: number;
}

export function ChallengesTable({ challenges, week }: Props) {
  const weekChallenges = challenges.filter(c => c.week === week);

  if (weekChallenges.length === 0) {
    return <p style={{ color: 'var(--muted)', fontSize: 14 }}>No challenges defined for Week {week}.</p>;
  }

  return (
    <div className={styles.table}>
      <div className={`${styles.row} ${styles.head}`} style={{ gridTemplateColumns: '1.5fr 2fr 1fr 1fr 0.8fr' }}>
        <span>Challenge</span>
        <span>Description</span>
        <span>Winner</span>
        <span>Score</span>
        <span>Status</span>
      </div>
      {weekChallenges.map(c => (
        <div key={c.id} className={styles.row} style={{ gridTemplateColumns: '1.5fr 2fr 1fr 1fr 0.8fr' }}>
          <span className={styles.em}>{c.title}</span>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>{c.description}</span>
          <span>{c.winnerTeam ?? '—'}</span>
          <span>{c.score != null ? c.score.toFixed(2) : '—'}</span>
          <span>
            {c.settled ? (
              <span className={styles.positive}>Settled</span>
            ) : (
              <span className={styles.muted}>Pending</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
