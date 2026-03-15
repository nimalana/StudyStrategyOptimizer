#!/usr/bin/env bash
set -e

# Start FastAPI backend
echo "Starting backend on http://localhost:8000 ..."
cd "$(dirname "$0")/backend"
venv/bin/uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start Next.js frontend
echo "Starting frontend on http://localhost:3000 ..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
