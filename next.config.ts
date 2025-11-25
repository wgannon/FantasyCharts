import type { NextConfig } from "next";

const repo = "FantasyCharts"; // adjust if your repo name changes
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  // Only add basePath/assetPrefix in production (for GitHub Pages). Dev stays at "/".
  basePath: isProd ? `/${repo}` : undefined,
  assetPrefix: isProd ? `/${repo}/` : undefined,
};

export default nextConfig;
