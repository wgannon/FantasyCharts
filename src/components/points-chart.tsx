'use client';

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Series = {
  name: string;
  data: number[];
};

type PointsChartProps = {
  series: Series[];
  categories: string[];
};

const baseOptions: ApexOptions = {
  chart: {
    type: "area",
    toolbar: { show: false },
    foreColor: "#9fb2d0",
    fontFamily: "var(--font-grotesk), 'Inter', system-ui, sans-serif",
  },
  legend: {
    position: "top",
    labels: { colors: "#e9eefc" },
  },
  dataLabels: { enabled: false },
  stroke: {
    curve: "smooth",
    width: 3,
  },
  grid: {
    borderColor: "rgba(255,255,255,0.05)",
  },
  xaxis: {
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: "#9fb2d0" } },
  },
  yaxis: {
    labels: { style: { colors: "#9fb2d0" } },
  },
  tooltip: {
    theme: "dark",
    shared: true,
  },
  colors: ["#6ef2c1", "#7ec4ff", "#f7cf5b", "#ff8fb1", "#9f8bff", "#54d3ff"],
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 0.8,
      opacityFrom: 0.2,
      opacityTo: 0.05,
      stops: [0, 60, 100],
    },
  },
};

export function PointsChart({ series, categories }: PointsChartProps) {
  const options: ApexOptions = { ...baseOptions, xaxis: { ...baseOptions.xaxis, categories } };
  return <ApexChart options={options} series={series} type="area" height={340} />;
}
