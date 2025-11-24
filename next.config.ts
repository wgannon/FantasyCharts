import type { NextConfig } from "next";

const repo = "https://github.com/wgannon/FantasyCharts";
const nextConfig: NextConfig = {
  output: "export",
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  /* config options here */
};

export default nextConfig;
