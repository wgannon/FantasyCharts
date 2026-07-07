import yaml
from pathlib import Path
from pydantic import BaseModel
from typing import Any

class ESPNConfig(BaseModel):
    s2_cookie: str
    swid: str

class LeagueConfig(BaseModel):
    name: str
    platform: str
    league_id: Any

class AppConfig(BaseModel):
    espn: ESPNConfig
    season: int
    leagues: list[LeagueConfig]
    owners: dict[str, dict[str, Any]] = {}

_config: AppConfig | None = None

def get_config() -> AppConfig:
    global _config
    if _config is not None:
        return _config
    p = Path(__file__).parent.parent / "config.yaml"
    if not p.exists():
        raise FileNotFoundError(
            "config.yaml not found. Copy config.example.yaml to config.yaml and fill in your values."
        )
    with open(p) as f:
        data = yaml.safe_load(f)
    _config = AppConfig(**data)
    return _config
