import json
import time
import hashlib
from pathlib import Path

CACHE_DIR = Path(__file__).parent / ".cache"
DEFAULT_TTL = 900       # 15 minutes
PLAYER_TTL  = 86400     # 24 hours for large player dumps

def _path(key: str) -> Path:
    h = hashlib.md5(key.encode()).hexdigest()
    return CACHE_DIR / f"{h}.json"

def get_cached(key: str, ttl: int = DEFAULT_TTL):
    p = _path(key)
    if p.exists():
        try:
            env = json.loads(p.read_text())
            if time.time() - env["ts"] < ttl:
                return env["data"]
        except Exception:
            pass
    return None

def set_cached(key: str, data) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    _path(key).write_text(json.dumps({"ts": time.time(), "data": data}))

def cache_key(*parts) -> str:
    return ":".join(str(p) for p in parts)
