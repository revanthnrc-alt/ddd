#!/usr/bin/env bash
# Safe repo reorganizer: backup current tree, then move/copy files into /frontend, /backend, and /public/sample_data
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TS=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$ROOT/scripts/backup/$TS"
LOGFILE="$ROOT/scripts/move-files.log"
echo "Reorg started at $(date)" | tee -a "$LOGFILE"
mkdir -p "$BACKUP_DIR"
echo "Creating backup (rsync) to $BACKUP_DIR" | tee -a "$LOGFILE"
rsync -a --exclude='.git' --exclude='node_modules' --exclude='.venv' --exclude='relay-attack.zip' --exclude='relay.db' "$ROOT/" "$BACKUP_DIR/"

mkdir -p "$ROOT/frontend/src/api"
mkdir -p "$ROOT/backend"
mkdir -p "$ROOT/public/sample_data"

echo "Copying likely frontend files..." | tee -a "$LOGFILE"
# Common frontend files
for f in package.json index.html src public vite.config.ts tsconfig.json tailwind.config.js; do
  if [ -e "$ROOT/$f" ]; then
    echo "-> moving $f to frontend/" | tee -a "$LOGFILE"
    mv "$ROOT/$f" "$ROOT/frontend/" || cp -a "$ROOT/$f" "$ROOT/frontend/" || true
  fi
done

echo "Copying src/ if present..." | tee -a "$LOGFILE"
if [ -d "$ROOT/src" ]; then
  mv "$ROOT/src" "$ROOT/frontend/src" || cp -a "$ROOT/src" "$ROOT/frontend/src"
fi

echo "Copying backend Python files..." | tee -a "$LOGFILE"
for f in main.py app.py database.py models.py schemas.py requirements.txt backen backend.py; do
  if [ -e "$ROOT/$f" ]; then
    echo "-> moving $f to backend/" | tee -a "$LOGFILE"
    mv "$ROOT/$f" "$ROOT/backend/" || cp -a "$ROOT/$f" "$ROOT/backend/" || true
  fi
done

echo "Moving existing backen/ directory if present" | tee -a "$LOGFILE"
if [ -d "$ROOT/backen" ]; then
  mv "$ROOT/backen" "$ROOT/backend/" || cp -a "$ROOT/backen" "$ROOT/backend/"
fi

echo "Collecting mock JSON files into public/sample_data" | tee -a "$LOGFILE"
find "$ROOT" -maxdepth 3 -type f -iname "*.json" | while read -r js; do
  base="$(basename "$js")"
  # Skip package or lock files
  if [[ "$base" =~ package-lock\.json|pnpm-lock.*|yarn.lock ]]; then
    continue
  fi
  echo "-> copy $js to public/sample_data/" | tee -a "$LOGFILE"
  cp -n "$js" "$ROOT/public/sample_data/" || true
done

echo "Cleanup candidate: removing .venv, node_modules from root (not performed, user must verify)" | tee -a "$LOGFILE"

echo "Reorg finished. Backup at $BACKUP_DIR" | tee -a "$LOGFILE"
echo "Next steps: inspect frontend and backend folders, run 'git checkout -b chore/reorg-cleanup && git add . && git commit -m "chore: restructure repo into frontend/backend with mock mode"'" | tee -a "$LOGFILE"
exit 0
