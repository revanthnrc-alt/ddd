#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt >/dev/null
python scripts/create_db.py
.venv/bin/python -m uvicorn backen.main:app --reload --port 8000 &
PID=$!
echo "Started backend (pid=$PID), waiting 2s"
sleep 2
curl -s -X POST http://127.0.0.1:8000/simulate/run -H "Content-Type: application/json" -d '{}' > /tmp/last_run.json
echo "Saved /tmp/last_run.json"
PATCH=$(curl -s -X POST http://127.0.0.1:8000/ai/blue_team -H "Content-Type: application/json" -d @/tmp/last_run.json)
echo "$PATCH" > /tmp/last_patch.json
echo "Saved /tmp/last_patch.json"
curl -s -X POST http://127.0.0.1:8000/simulate/apply_patch -H "Content-Type: application/json" -d @/tmp/last_patch.json
echo "Applied patch"
curl -s -X POST http://127.0.0.1:8000/simulate/run -H "Content-Type: application/json" -d '{}' > /tmp/last_run_after_patch.json
echo "Saved /tmp/last_run_after_patch.json"
kill $PID || true
echo "Stopped backend"
