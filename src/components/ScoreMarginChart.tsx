'use client';

import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import type { MatchupResult } from '@/types/fantasy';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Props {
  matchups: MatchupResult[];
  title: string;
}

interface PointMeta {
  x: number;
  y: number;
  meta: { label: string; week: number };
}

export function ScoreMarginChart({ matchups, title }: Props) {
  const homeWins: PointMeta[] = matchups.filter(m => m.winner === 'home').map(m => ({
    x: m.home.score, y: m.away.score,
    meta: { label: `${m.home.name} def. ${m.away.name}`, week: m.week }
  }));
  const awayWins: PointMeta[] = matchups.filter(m => m.winner === 'away').map(m => ({
    x: m.home.score, y: m.away.score,
    meta: { label: `${m.away.name} def. ${m.home.name}`, week: m.week }
  }));
  const pending: PointMeta[] = matchups.filter(m => m.winner === 'pending').map(m => ({
    x: m.home.score, y: m.away.score,
    meta: { label: `${m.home.name} vs ${m.away.name}`, week: m.week }
  }));

  const allScores = matchups.flatMap(m => [m.home.score, m.away.score]).filter(s => s > 0);
  const minScore = allScores.length ? Math.floor(Math.min(...allScores) * 0.95) : 0;
  const maxScore = allScores.length ? Math.ceil(Math.max(...allScores) * 1.05) : 200;

  const series = [
    { name: 'Home Win', data: homeWins.map(p => ({ x: p.x, y: p.y })) },
    { name: 'Away Win', data: awayWins.map(p => ({ x: p.x, y: p.y })) },
    { name: 'In Progress', data: pending.map(p => ({ x: p.x, y: p.y })) },
  ];

  const allPoints = [...homeWins, ...awayWins, ...pending];

  const options: ApexOptions = {
    chart: {
      type: 'scatter',
      toolbar: { show: false },
      foreColor: '#9fb2d0',
      zoom: { enabled: false },
    },
    colors: ['#6ef2c1', '#7ec4ff', '#9fb2d0'],
    markers: { size: 9, strokeWidth: 0 },
    legend: { position: 'top', labels: { colors: '#e9eefc' } },
    xaxis: {
      title: { text: 'Home Score', style: { color: '#9fb2d0' } },
      min: minScore,
      max: maxScore,
      tickAmount: 6,
      labels: { style: { colors: '#9fb2d0' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: 'Away Score', style: { color: '#9fb2d0' } },
      min: minScore,
      max: maxScore,
      tickAmount: 6,
      labels: { style: { colors: '#9fb2d0' } },
    },
    grid: { borderColor: 'rgba(255,255,255,0.05)' },
    annotations: {},
    tooltip: {
      theme: 'dark',
      custom: ({ seriesIndex, dataPointIndex }: { seriesIndex: number; dataPointIndex: number }) => {
        const seriesGroups = [homeWins, awayWins, pending];
        const point = seriesGroups[seriesIndex]?.[dataPointIndex];
        if (!point) return '';
        return `<div style="padding:8px 12px;font-size:13px">
          <strong>${point.meta.label}</strong><br/>
          Week ${point.meta.week}<br/>
          ${point.x.toFixed(1)} – ${point.y.toFixed(1)}
        </div>`;
      },
    },
  };

  // Suppress unused variable warning — allPoints is available for future use
  void allPoints;
  void title;

  return (
    <div>
      <p style={{ color: '#9fb2d0', fontSize: 13, marginBottom: 8 }}>
        Points above diagonal → away team won · below → home team won
      </p>
      <ApexChart options={options} series={series} type="scatter" height={360} />
    </div>
  );
}
