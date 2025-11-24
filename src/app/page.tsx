import styles from "./page.module.css";
import { PointsChart } from "@/components/points-chart";

const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8", "Week 9"];

type Manager = {
  name: string;
  team: string;
  record: string;
  streak: string;
  pointsFor: number;
  pointsAgainst: number;
  weeklyPoints: number[];
};

const managers: Manager[] = [
  {
    name: "Ava Carter",
    team: "Midnight Meteors",
    record: "7-2",
    streak: "W3",
    pointsFor: 942,
    pointsAgainst: 821,
    weeklyPoints: [110, 98, 97, 124, 101, 132, 96, 115, 169],
  },
  {
    name: "Caleb Ortiz",
    team: "Gridiron Guild",
    record: "6-3",
    streak: "L1",
    pointsFor: 905,
    pointsAgainst: 853,
    weeklyPoints: [95, 104, 113, 88, 117, 121, 92, 109, 66],
  },
  {
    name: "Zoe Kim",
    team: "Electric Owls",
    record: "6-3",
    streak: "W2",
    pointsFor: 884,
    pointsAgainst: 812,
    weeklyPoints: [90, 112, 99, 101, 96, 119, 122, 82, 63],
  },
  {
    name: "Miles Rivera",
    team: "Tempo Titans",
    record: "5-4",
    streak: "L1",
    pointsFor: 861,
    pointsAgainst: 876,
    weeklyPoints: [104, 89, 107, 95, 102, 110, 83, 90, 81],
  },
  {
    name: "Harper Singh",
    team: "Yardage Yaks",
    record: "4-5",
    streak: "W1",
    pointsFor: 828,
    pointsAgainst: 889,
    weeklyPoints: [86, 101, 91, 109, 94, 97, 106, 88, 56],
  },
  {
    name: "Drew Wallace",
    team: "Clutch Crew",
    record: "3-6",
    streak: "L2",
    pointsFor: 799,
    pointsAgainst: 915,
    weeklyPoints: [83, 96, 88, 92, 99, 87, 81, 97, 76],
  },
];

const totalPoints = managers.reduce((sum, m) => sum + m.pointsFor, 0);
const topScorer = [...managers].sort((a, b) => b.pointsFor - a.pointsFor)[0];
const hottestStreak = managers.find((m) => m.streak.startsWith("W")) ?? managers[0];
const chartSeries = managers.map((m) => ({ name: m.team, data: m.weeklyPoints }));

export default function Home() {
  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>ESPN Fantasy · Mock League</p>
          <h1>Fantasy Pulse</h1>
          <p className={styles.lede}>
            Quick-look dashboard with six managers, weekly scoring trends, and league momentum.
          </p>
        </div>
        <div className={styles.badge}>Week 9</div>
      </header>

      <section className={styles.grid}>
        <div className={styles.card}>
          <p className={styles.label}>Points Pace</p>
          <h3>{totalPoints.toLocaleString()} pts</h3>
          <p className={styles.subtext}>Total points scored league-wide through Week 9.</p>
        </div>
        <div className={styles.card}>
          <p className={styles.label}>Top Seed</p>
          <h3>{topScorer.team}</h3>
          <p className={styles.subtext}>
            {topScorer.name} · {topScorer.record} · {topScorer.pointsFor} PF
          </p>
        </div>
        <div className={styles.card}>
          <p className={styles.label}>Momentum</p>
          <h3>{hottestStreak.team}</h3>
          <p className={styles.subtext}>
            {hottestStreak.name} riding a {hottestStreak.streak} streak.
          </p>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.label}>Weekly Scoring</p>
            <h2>Team trajectories</h2>
          </div>
          <span className={styles.tag}>ApexCharts</span>
        </div>
        <PointsChart series={chartSeries} categories={weeks} />
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.label}>Standings Snapshot</p>
            <h2>Leaders at a glance</h2>
          </div>
          <span className={styles.tag}>6 managers</span>
        </div>
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.head}`}>
            <span>Team</span>
            <span>Manager</span>
            <span>Record</span>
            <span>PF</span>
            <span>PA</span>
            <span>Diff</span>
            <span>Streak</span>
          </div>
          {managers.map((m) => {
            const diff = m.pointsFor - m.pointsAgainst;
            return (
              <div key={m.team} className={styles.row}>
                <span className={styles.em}>{m.team}</span>
                <span>{m.name}</span>
                <span className={styles.bold}>{m.record}</span>
                <span>{m.pointsFor}</span>
                <span>{m.pointsAgainst}</span>
                <span className={diff >= 0 ? styles.positive : styles.negative}>
                  {diff >= 0 ? "+" : ""}
                  {diff}
                </span>
                <span className={styles.muted}>{m.streak}</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
