import { Dashboard } from "@/components/Dashboard";
import { readFileSync } from "fs";
import path from "path";
import type { LeagueConfig, Challenge } from "@/types/fantasy";

export default function Home() {
  const leaguesPath = path.join(process.cwd(), "data", "leagues.json");
  const challengesPath = path.join(process.cwd(), "data", "challenges.json");

  const leagues: LeagueConfig[] = JSON.parse(readFileSync(leaguesPath, "utf-8"));
  const challengesData = JSON.parse(readFileSync(challengesPath, "utf-8"));
  const challenges: Challenge[] = challengesData.challenges ?? [];

  return <Dashboard leagues={leagues} challenges={challenges} />;
}
