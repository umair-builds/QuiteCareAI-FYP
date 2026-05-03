#!/bin/bash
# ============================================================
# QuietCare AI Engine Startup Script
# ============================================================
# This script starts your local FastAPI AI engine AND tunnels
# it publicly via ngrok so your Vercel frontend can reach it.
#
# USAGE:
#   1. Add your ngrok static domain below (NGROK_DOMAIN)
#   2. Run:  chmod +x start-ai.sh  (only once)
#   3. Run:  ./start-ai.sh
# ============================================================

# ⬇️  Your ngrok static domain from dashboard.ngrok.com → Domains
NGROK_DOMAIN="dehydrate-amid-cautious.ngrok-free.dev"

AI_ENGINE_DIR="$(dirname "$0")"

echo ""
echo "🚀 Starting QuietCare AI Engine..."
echo ""

# Kill anything already running on port 8000
echo "🔍 Checking port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "⚠️  Killed old process on port 8000" || echo "✅ Port 8000 is free"
sleep 1

# Activate virtual environment
source "$AI_ENGINE_DIR/venv/bin/activate"

# Start FastAPI in the background
uvicorn app:app --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!
echo "✅ FastAPI started (PID: $UVICORN_PID) → http://localhost:8000"

# Give FastAPI a moment to boot
sleep 2

# Start ngrok tunnel with your static domain
# NOTE: Free ngrok plan uses --url (--domain is deprecated)
echo "🌐 Starting ngrok tunnel → https://$NGROK_DOMAIN"
ngrok http --url="$NGROK_DOMAIN" 8000 &
NGROK_PID=$!

echo ""
echo "============================================================"
echo "  AI Engine:  http://localhost:8000"
echo "  Public URL: https://$NGROK_DOMAIN"
echo "============================================================"
echo ""
echo "  ⚠️  Remember to set this in Vercel Dashboard:"
echo "     VITE_AI_ENGINE_URL = https://$NGROK_DOMAIN"
echo ""
echo "  Press Ctrl+C to stop everything."
echo "============================================================"
echo ""

# Wait and clean up both processes on Ctrl+C
trap "echo ''; echo 'Stopping...'; kill $UVICORN_PID $NGROK_PID 2>/dev/null; exit 0" INT
wait
