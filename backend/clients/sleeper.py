import httpx
from backend.cache import get_cached, set_cached, cache_key, DEFAULT_TTL, PLAYER_TTL

SLEEPER_BASE = "https://api.sleeper.app/v1"

class LeagueAPIError(Exception):
    def __init__(self, message: str, league_id, status_code: int = 0):
        super().__init__(message)
        self.league_id = league_id
        self.status_code = status_code

class SleeperClient:
    def _get(self, path: str) -> dict | list | None:
        with httpx.Client(timeout=30) as client:
            try:
                resp = client.get(f"{SLEEPER_BASE}/{path}")
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                raise LeagueAPIError(
                    f"Sleeper HTTP {e.response.status_code} for {path}",
                    path, e.response.status_code
                )
            except Exception as e:
                raise LeagueAPIError(str(e), path)

    def get_league(self, league_id: str, refresh: bool = False) -> dict:
        key = cache_key("sleeper", "league", league_id)
        if not refresh:
            c = get_cached(key)
            if c is not None:
                return c
        data = self._get(f"league/{league_id}")
        set_cached(key, data)
        return data

    def get_rosters(self, league_id: str, refresh: bool = False) -> list:
        key = cache_key("sleeper", "rosters", league_id)
        if not refresh:
            c = get_cached(key)
            if c is not None:
                return c
        data = self._get(f"league/{league_id}/rosters") or []
        set_cached(key, data)
        return data

    def get_users(self, league_id: str, refresh: bool = False) -> list:
        key = cache_key("sleeper", "users", league_id)
        if not refresh:
            c = get_cached(key)
            if c is not None:
                return c
        data = self._get(f"league/{league_id}/users") or []
        set_cached(key, data)
        return data

    def get_matchups(self, league_id: str, week: int, refresh: bool = False) -> list | None:
        key = cache_key("sleeper", "matchups", league_id, week)
        if not refresh:
            c = get_cached(key)
            if c is not None:
                return c
        data = self._get(f"league/{league_id}/matchups/{week}")
        if data is None or not isinstance(data, list):
            return None
        set_cached(key, data)
        return data

    def get_players(self, refresh: bool = False) -> dict:
        key = cache_key("sleeper", "players")
        if not refresh:
            c = get_cached(key, ttl=PLAYER_TTL)
            if c is not None:
                return c
        data = self._get("players/nfl") or {}
        set_cached(key, data)
        return data

    def get_league_history_chain(self, league_id: str) -> list[str]:
        """Walk previous_league_id chain. Returns older league IDs (oldest first), NOT including current."""
        chain = []
        current_id = league_id
        for _ in range(10):
            try:
                lg = self.get_league(current_id)
                prev = lg.get("previous_league_id")
                if not prev:
                    break
                chain.append(str(prev))
                current_id = str(prev)
            except Exception:
                break
        chain.reverse()
        return chain
