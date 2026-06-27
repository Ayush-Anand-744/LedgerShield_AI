#!/bin/bash
# LedgerShield_AI — Start both Backend and Frontend
# Run from: ~/Desktop/LedgerShield_AI/
# Usage: bash START.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        LedgerShield_AI — Startup            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Kill any stale processes on ports 8000 / 3000 ──
echo "▶  Clearing ports 8000 and 3000 ..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
sleep 1

# ── Find Python 3.12 (most likely to have packages) ─
PYTHON=""
for candidate in python3.12 python3.11 python3.10; do
  if command -v "$candidate" &>/dev/null; then
    PYTHON="$candidate"
    break
  fi
done
if [ -z "$PYTHON" ]; then
  echo "❌  python3.12 not found. Install: brew install python@3.12"; exit 1
fi
echo "   Python: $($PYTHON --version)"

# ── Check if uvicorn is already available ───────────
if "$PYTHON" -c "import uvicorn" 2>/dev/null; then
  echo "   ✅  Python packages already installed — skipping pip"
  UVICORN_CMD="$PYTHON -m uvicorn"
else
  # Try installing with --break-system-packages (no venv needed, no disk overhead)
  echo "▶  Installing backend packages (system-wide) ..."
  "$PYTHON" -m pip install --quiet --break-system-packages \
    fastapi uvicorn sse-starlette pydantic \
    scikit-learn lightgbm pandas numpy imbalanced-learn
  UVICORN_CMD="$PYTHON -m uvicorn"
fi

# ── Backend ─────────────────────────────────────────
echo ""
echo "▶  Starting FastAPI backend on http://localhost:8000 ..."
echo "   (Training models on 500 Indian customers — takes ~20s on first start)"
cd "$SCRIPT_DIR"
$UVICORN_CMD backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
# Wait for backend to fully start + train models before opening browser
echo "   Waiting for models to train..."
for i in $(seq 1 30); do
  sleep 1
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅  Backend ready (${i}s)"
    break
  fi
done

# ── Frontend ────────────────────────────────────────
echo ""
echo "▶  Starting Next.js frontend on http://localhost:3000 ..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
sleep 3

# ── Done ────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅  LedgerShield_AI is running!            ║"
echo "║                                          ║"
echo "║  Frontend → http://localhost:3000        ║"
echo "║  Backend  → http://localhost:8000        ║"
echo "║  API Docs → http://localhost:8000/docs   ║"
echo "║                                          ║"
echo "║  Press Ctrl+C to stop both servers       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

open "http://localhost:3000" 2>/dev/null || true

trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
