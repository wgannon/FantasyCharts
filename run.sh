#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ROOT/config.yaml" ]; then
  echo "ERROR: config.yaml not found."
  echo "  cp config.example.yaml config.yaml"
  echo "  # then edit config.yaml with your credentials"
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 not found. Install Python 3.11+"
  exit 1
fi
if ! command -v node &>/dev/null; then
  echo "ERROR: node not found. Install Node.js 18+"
  exit 1
fi

if [ ! -d "$ROOT/.venv" ]; then
  echo "→ Creating Python virtual environment..."
  python3 -m venv "$ROOT/.venv"
fi
source "$ROOT/.venv/bin/activate"
pip install -q -r "$ROOT/backend/requirements.txt"

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "→ Installing frontend dependencies..."
  cd "$ROOT/frontend" && npm install --silent
  cd "$ROOT"
fi

echo "→ Starting backend on http://localhost:8000"
cd "$ROOT"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "→ Starting frontend on http://localhost:5173"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Fantasy Aggregator running!             ║"
echo "║  Frontend : http://localhost:5173        ║"
echo "║  API docs : http://localhost:8000/docs   ║"
echo "╚══════════════════════════════════════════╝"
echo "Press Ctrl+C to stop."

cleanup() { kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0; }
trap cleanup INT TERM
wait
