# Fantasy Aggregator

A full-stack dashboard that aggregates standings, matchups, and cross-league rivalry data from multiple fantasy football leagues — ESPN and Sleeper — into a single dark-themed interface.

## What It Does

- **Multi-league standings**: View standings for any configured ESPN or Sleeper league in a tabbed interface with W-L-T, points for/against, streak, and position breakdowns (QB/RB/WR/TE/K/DST).
- **Position breakdown chart**: Stacked bar chart showing season-cumulative starter points by position for each team, with above/below league-average indicators.
- **Cross-league owner leaderboard**: If multiple leagues share the same owners, aggregate wins, losses, and points for across all leagues into a single ranked table.
- **Head-to-head rivalry grid**: A matrix showing each mapped owner's win-loss record against every other mapped owner across all leagues. Click any cell to drill into the individual matchup history.
- **Rivalry callouts**: Auto-detected highlights — dominant records (e.g., 3-0), sweep leaders (winning in every shared league), and closest matchup margin.
- **15-minute disk cache**: All API responses are cached to `backend/.cache/` to avoid hammering the upstream APIs. Player data is cached for 24 hours.

## Requirements

- Python 3.11+
- Node.js 18+
- ESPN private league credentials (if using ESPN leagues)
- Sleeper league IDs (public API, no credentials needed)

## Setup

### 1. Get Your ESPN Credentials

ESPN private leagues require two cookies from your browser session. Log in to ESPN Fantasy at https://fantasy.espn.com, then open browser DevTools (F12), go to the Application -> Cookies -> `https://fantasy.espn.com` tab, and copy:

- `espn_s2` — a long alphanumeric string
- `SWID` — a GUID in curly braces like `{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}`

These expire periodically; update `config.yaml` when the dashboard stops returning data.

For public ESPN leagues, you still need to provide placeholder values (the API may allow access without valid cookies for public leagues).

### 2. Find Your League IDs

**ESPN**: Open your league on the ESPN Fantasy site. The URL contains the league ID: `fantasy.espn.com/football/league?leagueId=12345678` — copy the number.

**Sleeper**: Open your league at https://sleeper.com. The league ID is the long number in the URL, e.g., `app.sleeper.com/leagues/987654321098765432/...`.

### 3. Create config.yaml

```bash
cp config.example.yaml config.yaml
```

Edit `config.yaml` with your credentials and league details:

```yaml
espn:
  s2_cookie: "AEBxxxxxxxxxxxxxxxx..."
  swid: "{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}"

season: 2024

leagues:
  - name: "Main League"
    platform: espn
    league_id: 12345678
  - name: "Bestball League"
    platform: sleeper
    league_id: "987654321098765432"

owners: {}   # fill in after step 4
```

### 4. Discover Owner IDs (for cross-league rivalries)

Start the backend temporarily and call the helper endpoint:

```bash
cd /path/to/FantasyCharts
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

In another terminal:

```bash
curl http://localhost:8000/api/owners/dump | python3 -m json.tool
```

This returns each league's teams with their `team_id` values. Use those IDs to populate the `owners` section of `config.yaml`:

```yaml
owners:
  Matt:
    "Main League": 3                              # ESPN team ID (integer)
    "Bestball League": "123456789012345678"        # Sleeper user_id (string)
  Dave:
    "Main League": 7
    "Bestball League": "987654321098765432"
```

The owner keys (e.g., `Matt`, `Dave`) become the canonical display names shown in the rivalry dashboard.

### 5. Run the Application

```bash
./run.sh
```

This script:
1. Creates a Python virtual environment at `.venv/` if it doesn't exist
2. Installs Python dependencies from `backend/requirements.txt`
3. Installs frontend Node dependencies if `frontend/node_modules/` is absent
4. Starts the FastAPI backend on port 8000 with `--reload`
5. Starts the Vite dev server on port 5173

Open **http://localhost:5173** in your browser.

API documentation (auto-generated Swagger UI) is available at **http://localhost:8000/docs**.

## Configuration Reference

| Field | Type | Description |
|---|---|---|
| `espn.s2_cookie` | string | Your `espn_s2` browser cookie value |
| `espn.swid` | string | Your `SWID` browser cookie value (include curly braces) |
| `season` | integer | NFL season year (e.g., `2024`) |
| `leagues[].name` | string | Display name for this league (used as key in `owners`) |
| `leagues[].platform` | `espn` or `sleeper` | Platform identifier |
| `leagues[].league_id` | int or string | ESPN: integer ID. Sleeper: string ID |
| `owners` | dict | Canonical owner name -> dict of league name -> team ID |

## Dashboard Descriptions

### Standings (Tab 1)

Select any configured league from the tab bar. The panel shows:

- **League metadata strip**: Platform badge (ESPN/SLEEPER), season year, current week, scoring type (PPR/HALF_PPR/STANDARD).
- **Standings table**: Teams sorted by wins then points for. Columns: rank, team name, owner name, W-L-T, points for (PF), points against (PA), win/loss streak, and seasonal points by position (QB, RB, WR, TE, K, DST). Position columns show N/A when boxscore access is unavailable. Above-average values show a green up-arrow indicator; below-average show a red down-arrow. Hover an indicator for the exact delta.
- **Position chart**: Stacked bar chart (Recharts) of cumulative season starter points by QB/RB/WR/TE for each team. Shown only when position data is available.

Error banners appear for any league that fails to load — other leagues continue to render normally.

### Rivalries (Tab 2)

Only available when at least one owner is mapped in `config.yaml`. Shows:

- **Owner Leaderboard**: All mapped owners ranked by combined wins across all leagues, then by total points for. Click any row to expand a per-league breakdown showing team name, W-L, and points for that league.
- **Head-to-Head Grid**: N x N matrix where each cell shows `rowOwner wins - colOwner wins` across all completed matchups between those two owners in any shared league. Green cells = row owner is winning the series; red = losing; neutral = tied. Click any cell to expand a chronological matchup log below the grid.
- **Rivalry Callouts**: Auto-detected notable facts:
  - **Dominant**: One owner is 3-0 or better against another across all leagues.
  - **Sweep**: One owner is winning the head-to-head in every league they share with another (minimum 2 shared leagues).
  - **Closest Margin**: The single matchup with the smallest point differential across all leagues and all weeks.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check — returns `{"status":"ok"}` |
| GET | `/api/leagues` | League metadata for all configured leagues |
| GET | `/api/standings` | All teams + league metadata |
| GET | `/api/matchups/{league_name}?week=N` | Matchups for a specific league and week |
| GET | `/api/rivalries` | Owner records, H2H matrix, callouts |
| GET | `/api/owners/dump` | Raw team/owner IDs for config setup |

All endpoints accept `?refresh=true` to bypass the disk cache and fetch fresh data.

## Caching

Cached files live in `backend/.cache/` as MD5-keyed JSON blobs. Default TTL is 15 minutes. The Sleeper player database (used for position scoring) is cached for 24 hours due to its large size (~5 MB).

To clear all caches:

```bash
rm -rf backend/.cache/
```

Or pass `?refresh=true` on any API endpoint to bypass the cache for that request only.

## Troubleshooting

**"config.yaml not found"** — You haven't copied `config.example.yaml`. Run `cp config.example.yaml config.yaml` and fill in your credentials.

**ESPN returns 401 or empty teams** — Your ESPN cookies have expired. Log in to ESPN Fantasy again, copy fresh `espn_s2` and `SWID` values, and update `config.yaml`. Clear the cache (`rm -rf backend/.cache/`) to force a fresh fetch.

**Sleeper league shows 0 teams** — Check the `league_id` in config. Sleeper IDs are long integers stored as strings; make sure you're copying the full ID from the URL.

**Position data shows N/A for all ESPN teams** — The standard views (`mTeam`, `mStandings`, `mMatchup`) do not include boxscore data. Position breakdown is fully supported for Sleeper leagues via the `players_points` field on matchup entries.

**Rivals tab shows "No owner mappings configured"** — You need to add an `owners` section to `config.yaml`. Run `GET /api/owners/dump` to discover the correct team IDs for each league, then map them.

**Port already in use** — Kill any existing processes on ports 8000 or 5173 before running `./run.sh`. On Linux: `lsof -ti:8000 | xargs kill -9`.

**Frontend shows blank page** — Make sure the Vite dev server started (check terminal output). If `frontend/node_modules/` is missing, run `cd frontend && npm install`.
