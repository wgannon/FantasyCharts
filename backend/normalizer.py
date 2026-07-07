from dataclasses import dataclass, field
from typing import Any

@dataclass
class LeagueMeta:
    name: str
    platform: str
    league_id: str
    season: int
    current_week: int
    scoring_type: str | None
    error: str | None

@dataclass
class Team:
    league: str
    team_id: str
    team_name: str
    owner_name: str
    wins: int
    losses: int
    ties: int
    points_for: float
    points_against: float
    streak: str
    position_points: dict = field(default_factory=dict)

@dataclass
class WeeklyMatchup:
    league: str
    week: int
    home_team_id: str
    away_team_id: str
    home_team_name: str
    away_team_name: str
    home_owner: str
    away_owner: str
    home_score: float
    away_score: float
    winner: str

@dataclass
class OwnerRecord:
    owner_name: str
    total_wins: int
    total_losses: int
    total_ties: int
    total_points_for: float
    per_league: dict = field(default_factory=dict)

@dataclass
class H2HRecord:
    owner_a: str
    owner_b: str
    a_wins: int
    b_wins: int
    ties: int
    matchups: list = field(default_factory=list)

@dataclass
class RivalryCallout:
    type: str
    description: str
    owners: list = field(default_factory=list)


def _espn_scoring_type(settings: dict | None) -> str | None:
    if not settings:
        return None
    try:
        ss = settings.get("scoringSettings", {})
        rec = ss.get("rec", ss.get("53", 0)) or 0
        if rec >= 0.9:
            return "PPR"
        if rec >= 0.4:
            return "HALF_PPR"
        return "STANDARD"
    except Exception:
        return None


def _espn_streak(record: dict) -> str:
    try:
        overall = record.get("overall", {})
        stype = overall.get("streakType", "")
        slen  = overall.get("streakLength", 0)
        if stype == "WIN":
            return f"W{slen}"
        if stype == "LOSS":
            return f"L{slen}"
        if stype == "TIE":
            return f"T{slen}"
    except Exception:
        pass
    return ""


def _resolve_owner(league_name: str, team_id_str: str, owner_map: dict, fallback: str) -> str:
    for canonical, leagues in owner_map.items():
        val = leagues.get(league_name)
        if val is not None and str(val) == team_id_str:
            return canonical
    return fallback


def normalize_espn_league(
    raw: dict,
    league_name: str,
    owner_map: dict,
) -> tuple[LeagueMeta, list[Team]]:
    current_week = raw.get("scoringPeriodId", 1)
    season       = raw.get("seasonId", 0)
    settings     = raw.get("settings", {})
    scoring_type = _espn_scoring_type(settings)

    meta = LeagueMeta(
        name=league_name,
        platform="espn",
        league_id=str(raw.get("id", "")),
        season=season,
        current_week=current_week,
        scoring_type=scoring_type,
        error=None,
    )

    teams: list[Team] = []
    for t in raw.get("teams", []):
        team_id  = str(t.get("id", ""))
        location = t.get("location") or ""
        nickname = t.get("nickname") or ""
        team_name = f"{location} {nickname}".strip() or f"Team {team_id}"
        record    = t.get("record", {})
        overall   = record.get("overall", {})
        owner_name = _resolve_owner(league_name, team_id, owner_map, team_name)
        teams.append(Team(
            league=league_name,
            team_id=team_id,
            team_name=team_name,
            owner_name=owner_name,
            wins=overall.get("wins", 0),
            losses=overall.get("losses", 0),
            ties=overall.get("ties", 0),
            points_for=overall.get("pointsFor", 0.0),
            points_against=overall.get("pointsAgainst", 0.0),
            streak=_espn_streak(record),
            position_points={"QB": None, "RB": None, "WR": None, "TE": None, "K": None, "DST": None},
        ))

    return meta, teams


def normalize_espn_matchups(
    raw: dict,
    league_name: str,
    team_map: dict[str, str],
    owner_resolved: dict[str, str],
) -> list[WeeklyMatchup]:
    matchups = []
    for entry in raw.get("schedule", []):
        home = entry.get("home")
        away = entry.get("away")
        if not home or not away:
            continue
        week = entry.get("matchupPeriodId", 0)
        h_id = str(home.get("teamId", ""))
        a_id = str(away.get("teamId", ""))
        h_score = home.get("totalPoints", 0.0) or 0.0
        a_score = away.get("totalPoints", 0.0) or 0.0
        raw_winner = entry.get("winner", "")
        if raw_winner == "HOME":
            winner = "home"
        elif raw_winner == "AWAY":
            winner = "away"
        elif raw_winner == "TIE":
            winner = "tie"
        else:
            winner = "pending"
        matchups.append(WeeklyMatchup(
            league=league_name,
            week=week,
            home_team_id=h_id,
            away_team_id=a_id,
            home_team_name=team_map.get(h_id, f"Team {h_id}"),
            away_team_name=team_map.get(a_id, f"Team {a_id}"),
            home_owner=owner_resolved.get(h_id, team_map.get(h_id, h_id)),
            away_owner=owner_resolved.get(a_id, team_map.get(a_id, a_id)),
            home_score=h_score,
            away_score=a_score,
            winner=winner,
        ))
    return matchups


def _sleeper_scoring_type(league_raw: dict) -> str | None:
    try:
        rec = league_raw.get("scoring_settings", {}).get("rec", None)
        if rec is None:
            return None
        if rec >= 0.9:
            return "PPR"
        if rec >= 0.4:
            return "HALF_PPR"
        return "STANDARD"
    except Exception:
        return None


def _sleeper_streak(roster_id: int, matchups_by_week: dict[int, list]) -> str:
    """Compute streak by scanning weeks from latest to earliest."""
    weeks_sorted = sorted(matchups_by_week.keys(), reverse=True)
    streak_char = None
    count = 0
    for w in weeks_sorted:
        week_matchups = matchups_by_week[w]
        my_entry = next((m for m in week_matchups if m.get("roster_id") == roster_id), None)
        if not my_entry:
            break
        mid = my_entry.get("matchup_id")
        if mid is None:
            break
        pair = [m for m in week_matchups if m.get("matchup_id") == mid]
        if len(pair) != 2:
            break
        me    = next(m for m in pair if m.get("roster_id") == roster_id)
        other = next(m for m in pair if m.get("roster_id") != roster_id)
        my_pts    = me.get("points", 0) or 0
        other_pts = other.get("points", 0) or 0
        if my_pts > other_pts:
            result = "W"
        elif my_pts < other_pts:
            result = "L"
        else:
            result = "T"
        if streak_char is None:
            streak_char = result
        if result == streak_char:
            count += 1
        else:
            break
    if streak_char and count:
        return f"{streak_char}{count}"
    return ""


def _sleeper_position_points(
    roster_id: int,
    matchups_by_week: dict[int, list],
    players_meta: dict,
) -> dict:
    totals: dict[str, float] = {"QB": 0.0, "RB": 0.0, "WR": 0.0, "TE": 0.0, "K": 0.0, "DST": 0.0}
    has_data = False
    for week_matchups in matchups_by_week.values():
        my_entry = next((m for m in week_matchups if m.get("roster_id") == roster_id), None)
        if not my_entry:
            continue
        starters = my_entry.get("starters") or []
        players_points = my_entry.get("players_points") or {}
        for pid in starters:
            pts = players_points.get(pid, 0) or 0
            if pts == 0:
                continue
            has_data = True
            player_info = players_meta.get(str(pid), {})
            pos = (player_info.get("position") or "").upper()
            if pos == "DEF":
                pos = "DST"
            if pos in totals:
                totals[pos] += pts
            else:
                # FLEX — use fantasy_positions or default to position field
                fp = player_info.get("fantasy_positions") or []
                for fp_pos in fp:
                    if fp_pos.upper() in totals:
                        totals[fp_pos.upper()] += pts
                        break
    if not has_data:
        return {k: None for k in totals}
    return totals


def normalize_sleeper_league(
    league_raw: dict,
    rosters: list,
    users: list,
    matchups_by_week: dict[int, list],
    league_name: str,
    owner_map: dict,
    players_meta: dict | None = None,
) -> tuple[LeagueMeta, list[Team], list[WeeklyMatchup]]:
    season = int(league_raw.get("season", 0))
    current_week = league_raw.get("settings", {}).get("leg", 1)

    meta = LeagueMeta(
        name=league_name,
        platform="sleeper",
        league_id=str(league_raw.get("league_id", "")),
        season=season,
        current_week=current_week,
        scoring_type=_sleeper_scoring_type(league_raw),
        error=None,
    )

    # Build user lookup
    user_display: dict[str, str] = {}
    user_team:    dict[str, str] = {}
    for u in users:
        uid = u.get("user_id", "")
        user_display[uid] = u.get("display_name", uid)
        user_team[uid] = (u.get("metadata") or {}).get("team_name") or u.get("display_name", uid)

    teams: list[Team] = []
    for r in rosters:
        roster_id  = r.get("roster_id")
        owner_id   = r.get("owner_id", "")
        s          = r.get("settings") or {}
        wins       = s.get("wins", 0)
        losses     = s.get("losses", 0)
        ties       = s.get("ties", 0)
        fpts       = (s.get("fpts", 0) or 0) + (s.get("fpts_decimal", 0) or 0) / 100
        fpts_ag    = (s.get("fpts_against", 0) or 0) + (s.get("fpts_against_decimal", 0) or 0) / 100
        team_name  = user_team.get(owner_id, f"Roster {roster_id}")
        raw_owner  = user_display.get(owner_id, team_name)
        owner_name = _resolve_owner(league_name, owner_id, owner_map, raw_owner)
        streak     = _sleeper_streak(roster_id, matchups_by_week)

        if players_meta is not None:
            pos_pts = _sleeper_position_points(roster_id, matchups_by_week, players_meta)
        else:
            pos_pts = {"QB": None, "RB": None, "WR": None, "TE": None, "K": None, "DST": None}

        teams.append(Team(
            league=league_name,
            team_id=str(roster_id),
            team_name=team_name,
            owner_name=owner_name,
            wins=wins,
            losses=losses,
            ties=ties,
            points_for=fpts,
            points_against=fpts_ag,
            streak=streak,
            position_points=pos_pts,
        ))

    # Build matchup list
    # Map roster_id -> team info
    roster_map: dict[int, tuple[str, str, str]] = {}  # roster_id -> (team_id_str, team_name, owner_name)
    for t in teams:
        roster_map[int(t.team_id)] = (t.team_id, t.team_name, t.owner_name)

    all_matchups: list[WeeklyMatchup] = []
    for week, week_entries in matchups_by_week.items():
        grouped: dict[int, list] = {}
        for entry in week_entries:
            mid = entry.get("matchup_id")
            if mid is None:
                continue
            grouped.setdefault(mid, []).append(entry)
        for pair in grouped.values():
            if len(pair) != 2:
                continue
            a, b = pair
            a_rid = a.get("roster_id")
            b_rid = b.get("roster_id")
            a_score = a.get("points", 0) or 0
            b_score = b.get("points", 0) or 0
            a_info = roster_map.get(a_rid, (str(a_rid), f"Roster {a_rid}", f"Roster {a_rid}"))
            b_info = roster_map.get(b_rid, (str(b_rid), f"Roster {b_rid}", f"Roster {b_rid}"))
            if a_score > b_score:
                winner = "home"
            elif b_score > a_score:
                winner = "away"
            elif a_score == 0 and b_score == 0:
                winner = "pending"
            else:
                winner = "tie"
            all_matchups.append(WeeklyMatchup(
                league=league_name,
                week=week,
                home_team_id=a_info[0],
                away_team_id=b_info[0],
                home_team_name=a_info[1],
                away_team_name=b_info[1],
                home_owner=a_info[2],
                away_owner=b_info[2],
                home_score=a_score,
                away_score=b_score,
                winner=winner,
            ))

    return meta, teams, all_matchups


def compute_rivalries(
    all_matchups: list[WeeklyMatchup],
    owner_map: dict,
    all_teams: list[Team],
) -> tuple[list[OwnerRecord], list[H2HRecord], list[RivalryCallout]]:
    mapped = set(owner_map.keys())
    if not mapped:
        return [], [], []

    # Owner records
    records: dict[str, OwnerRecord] = {o: OwnerRecord(o, 0, 0, 0, 0.0) for o in mapped}
    for t in all_teams:
        if t.owner_name not in mapped:
            continue
        rec = records[t.owner_name]
        rec.total_wins += t.wins
        rec.total_losses += t.losses
        rec.total_ties += t.ties
        rec.total_points_for += t.points_for
        rec.per_league[t.league] = {
            "wins": t.wins, "losses": t.losses, "ties": t.ties,
            "points_for": t.points_for, "team_name": t.team_name,
        }

    owner_records = sorted(records.values(), key=lambda r: (-r.total_wins, -r.total_points_for))

    # H2H
    owners_list = sorted(mapped)
    h2h_map: dict[tuple[str, str], H2HRecord] = {}
    for i, a in enumerate(owners_list):
        for b in owners_list[i+1:]:
            h2h_map[(a, b)] = H2HRecord(a, b, 0, 0, 0)

    for m in all_matchups:
        ha = m.home_owner
        aa = m.away_owner
        if ha not in mapped or aa not in mapped:
            continue
        if ha == aa:
            continue
        key = (min(ha, aa), max(ha, aa))
        rec = h2h_map.get(key)
        if rec is None:
            continue
        m_dict = {
            "league": m.league, "week": m.week,
            "home_team_name": m.home_team_name, "away_team_name": m.away_team_name,
            "home_owner": m.home_owner, "away_owner": m.away_owner,
            "home_score": m.home_score, "away_score": m.away_score,
            "winner": m.winner,
        }
        rec.matchups.append(m_dict)
        if m.winner == "home":
            if ha == rec.owner_a:
                rec.a_wins += 1
            else:
                rec.b_wins += 1
        elif m.winner == "away":
            if aa == rec.owner_a:
                rec.a_wins += 1
            else:
                rec.b_wins += 1
        elif m.winner == "tie":
            rec.ties += 1

    h2h = [r for r in h2h_map.values() if r.matchups]

    # Callouts
    callouts: list[RivalryCallout] = []

    # Dominant: >=3 wins, 0 losses
    for rec in h2h:
        if rec.a_wins >= 3 and rec.b_wins == 0:
            callouts.append(RivalryCallout("dominant",
                f"{rec.owner_a} is {rec.a_wins}-0 vs {rec.owner_b} across all leagues",
                [rec.owner_a, rec.owner_b]))
        elif rec.b_wins >= 3 and rec.a_wins == 0:
            callouts.append(RivalryCallout("dominant",
                f"{rec.owner_b} is {rec.b_wins}-0 vs {rec.owner_a} across all leagues",
                [rec.owner_b, rec.owner_a]))

    # Sweep: one owner beat another in every shared league (>=2 leagues)
    leagues_by_pair: dict[tuple[str,str], dict[str, list[WeeklyMatchup]]] = {}
    for m in all_matchups:
        ha, aa = m.home_owner, m.away_owner
        if ha not in mapped or aa not in mapped or ha == aa:
            continue
        key = (min(ha, aa), max(ha, aa))
        leagues_by_pair.setdefault(key, {}).setdefault(m.league, []).append(m)

    for (oa, ob), league_dict in leagues_by_pair.items():
        if len(league_dict) < 2:
            continue
        oa_wins = {lg: sum(
            1 for m in ms if (m.home_owner == oa and m.winner == "home") or
                              (m.away_owner == oa and m.winner == "away")
        ) for lg, ms in league_dict.items()}
        ob_wins = {lg: sum(
            1 for m in ms if (m.home_owner == ob and m.winner == "home") or
                              (m.away_owner == ob and m.winner == "away")
        ) for lg, ms in league_dict.items()}
        if all(oa_wins.get(lg, 0) > ob_wins.get(lg, 0) for lg in league_dict):
            callouts.append(RivalryCallout("sweep",
                f"{oa} is winning vs {ob} in all {len(league_dict)} shared leagues",
                [oa, ob]))
        elif all(ob_wins.get(lg, 0) > oa_wins.get(lg, 0) for lg in league_dict):
            callouts.append(RivalryCallout("sweep",
                f"{ob} is winning vs {oa} in all {len(league_dict)} shared leagues",
                [ob, oa]))

    # Closest margin
    best_margin: float | None = None
    best_m = None
    for m in all_matchups:
        if m.home_owner not in mapped or m.away_owner not in mapped:
            continue
        margin = abs(m.home_score - m.away_score)
        if best_margin is None or margin < best_margin:
            best_margin = margin
            best_m = m
    if best_m and best_margin is not None:
        callouts.append(RivalryCallout("closest_margin",
            f"Closest matchup: {best_m.home_owner} vs {best_m.away_owner} in {best_m.league} Wk{best_m.week} ({best_m.home_score:.1f}-{best_m.away_score:.1f}, margin {best_margin:.2f})",
            [best_m.home_owner, best_m.away_owner]))

    return owner_records, h2h, callouts
