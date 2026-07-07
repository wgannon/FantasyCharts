import httpx
from backend.cache import get_cached, set_cached, cache_key, DEFAULT_TTL

ESPN_BASE = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl"

class LeagueAPIError(Exception):
    def __init__(self, message: str, league_id, status_code: int = 0):
        super().__init__(message)
        self.league_id = league_id
        self.status_code = status_code

class ESPNClient:
    def __init__(self, s2: str, swid: str):
        self.cookies = {"espn_s2": s2, "SWID": swid}

    def _get(self, url: str, params: dict | None = None) -> dict | list:
        with httpx.Client(timeout=30) as client:
            try:
                resp = client.get(url, cookies=self.cookies, params=params,
                                  headers={"Accept": "application/json"})
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                raise LeagueAPIError(
                    f"ESPN HTTP {e.response.status_code} for {url}",
                    url, e.response.status_code
                )
            except Exception as e:
                raise LeagueAPIError(str(e), url)

    def get_league(self, league_id: int, year: int, views: list[str],
                   scoring_period: int | None = None, refresh: bool = False) -> dict:
        view_str = ",".join(sorted(views))
        key = cache_key("espn", "league", league_id, year, view_str, scoring_period or "")
        if not refresh:
            cached = get_cached(key)
            if cached is not None:
                return cached
        params: dict = {"view": views}
        if scoring_period is not None:
            params["scoringPeriodId"] = scoring_period
        url = f"{ESPN_BASE}/seasons/{year}/segments/0/leagues/{league_id}"
        data = self._get(url, params)
        set_cached(key, data)
        return data

    def get_league_history(self, league_id: int, year: int, refresh: bool = False) -> list:
        key = cache_key("espn", "history", league_id, year)
        if not refresh:
            cached = get_cached(key)
            if cached is not None:
                return cached
        try:
            url = f"{ESPN_BASE}/leagueHistory/{league_id}"
            data = self._get(url, {"seasonId": year})
            result = data if isinstance(data, list) else [data]
            set_cached(key, result)
            return result
        except Exception:
            return []
