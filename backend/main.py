import dataclasses
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.config import get_config, AppConfig
from backend.clients.espn import ESPNClient, LeagueAPIError as ESPNError
from backend.clients.sleeper import SleeperClient, LeagueAPIError as SleeperError
from backend.normalizer import (
    normalize_espn_league, normalize_espn_matchups,
    normalize_sleeper_league, compute_rivalries,
    LeagueMeta, Team, WeeklyMatchup,
)

app = FastAPI(title="Fantasy Aggregator API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def _dc(obj):
    """Recursively convert dataclasses to dicts for JSON serialization."""
    if dataclasses.is_dataclass(obj) and not isinstance(obj, type):
        return {k: _dc(v) for k, v in dataclasses.asdict(obj).items()}
    if isinstance(obj, list):
        return [_dc(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _dc(v) for k, v in obj.items()}
    return obj


@app.get("/api/health")
def health():
    return {"status": "ok"}


def _get_cfg():
    try:
        return get_config()
    except FileNotFoundError as e:
        raise HTTPException(503, detail=str(e))


def _load_all_data(cfg: AppConfig, refresh: bool = False):
    espn_client = ESPNClient(cfg.espn.s2_cookie, cfg.espn.swid)
    sleeper_client = SleeperClient()
    all_metas: list[LeagueMeta] = []
    all_teams: list[Team] = []
    all_matchups: list[WeeklyMatchup] = []

    for league_cfg in cfg.leagues:
        name = league_cfg.name
        if league_cfg.platform == "espn":
            try:
                raw = espn_client.get_league(
                    int(league_cfg.league_id), cfg.season,
                    ["mTeam", "mStandings", "mSettings", "mMatchup"], refresh=refresh
                )
                meta, teams = normalize_espn_league(raw, name, cfg.owners)
                team_map = {t.team_id: t.team_name for t in teams}
                owner_resolved = {t.team_id: t.owner_name for t in teams}
                matchups = normalize_espn_matchups(raw, name, team_map, owner_resolved)
                all_metas.append(meta)
                all_teams.extend(teams)
                all_matchups.extend(matchups)
            except Exception as e:
                all_metas.append(LeagueMeta(name, "espn", str(league_cfg.league_id),
                                            cfg.season, 0, None, str(e)))
        elif league_cfg.platform == "sleeper":
            try:
                lid = str(league_cfg.league_id)
                league_raw  = sleeper_client.get_league(lid, refresh=refresh)
                rosters     = sleeper_client.get_rosters(lid, refresh=refresh)
                users       = sleeper_client.get_users(lid, refresh=refresh)
                current_week = league_raw.get("settings", {}).get("leg", 1)
                matchups_by_week: dict[int, list] = {}
                for w in range(1, current_week + 1):
                    wm = sleeper_client.get_matchups(lid, w, refresh=refresh)
                    if wm:
                        matchups_by_week[w] = wm
                try:
                    players_meta = sleeper_client.get_players(refresh=refresh)
                except Exception:
                    players_meta = None
                meta, teams, matchups = normalize_sleeper_league(
                    league_raw, rosters, users, matchups_by_week,
                    name, cfg.owners, players_meta
                )
                all_metas.append(meta)
                all_teams.extend(teams)
                all_matchups.extend(matchups)
            except Exception as e:
                all_metas.append(LeagueMeta(name, "sleeper", str(league_cfg.league_id),
                                            cfg.season, 0, None, str(e)))

    return all_metas, all_teams, all_matchups


@app.get("/api/leagues")
def get_leagues(refresh: bool = Query(False)):
    cfg = _get_cfg()
    metas, _, _ = _load_all_data(cfg, refresh)
    return _dc(metas)


@app.get("/api/standings")
def get_standings(refresh: bool = Query(False)):
    cfg = _get_cfg()
    metas, teams, _ = _load_all_data(cfg, refresh)
    return _dc({"leagues": metas, "teams": teams})


@app.get("/api/matchups/{league_name}")
def get_matchups(league_name: str, week: int = Query(1), refresh: bool = Query(False)):
    cfg = _get_cfg()
    _, _, all_matchups = _load_all_data(cfg, refresh)
    filtered = [m for m in all_matchups if m.league == league_name and m.week == week]
    return _dc(filtered)


@app.get("/api/rivalries")
def get_rivalries(refresh: bool = Query(False)):
    cfg = _get_cfg()
    _, all_teams, all_matchups = _load_all_data(cfg, refresh)
    owner_records, h2h, callouts = compute_rivalries(all_matchups, cfg.owners, all_teams)
    return _dc({"owner_records": owner_records, "h2h": h2h, "callouts": callouts})


@app.get("/api/owners/dump")
def owners_dump(refresh: bool = Query(False)):
    cfg = _get_cfg()
    espn_client = ESPNClient(cfg.espn.s2_cookie, cfg.espn.swid)
    sleeper_client = SleeperClient()
    result = {}
    for league_cfg in cfg.leagues:
        name = league_cfg.name
        if league_cfg.platform == "espn":
            try:
                raw = espn_client.get_league(
                    int(league_cfg.league_id), cfg.season, ["mTeam"], refresh=refresh
                )
                teams_out = []
                for t in raw.get("teams", []):
                    loc = t.get("location") or ""
                    nick = t.get("nickname") or ""
                    teams_out.append({"team_id": t.get("id"), "team_name": f"{loc} {nick}".strip(), "owner": ""})
                result[name] = teams_out
            except Exception as e:
                result[name] = {"error": str(e)}
        elif league_cfg.platform == "sleeper":
            try:
                lid = str(league_cfg.league_id)
                rosters = sleeper_client.get_rosters(lid, refresh=refresh)
                users   = sleeper_client.get_users(lid, refresh=refresh)
                user_map = {u.get("user_id"): u.get("display_name", "") for u in users}
                result[name] = [
                    {"team_id": r.get("owner_id"), "team_name": user_map.get(r.get("owner_id"), ""), "owner": ""}
                    for r in rosters
                ]
            except Exception as e:
                result[name] = {"error": str(e)}
    return result
