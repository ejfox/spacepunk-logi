#!/bin/bash

# Spacepunk Auto-Restart Server Script
# This script automatically restarts the backend if it crashes

echo "🚀 Starting Spacepunk Logistics servers with auto-restart..."

# Function to start backend with auto-restart
start_backend() {
  while true; do
    echo "📡 Starting backend server..."
    cd server
    npm run dev
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
      echo "✅ Backend exited cleanly"
      break
    else
      echo "💥 Backend crashed with exit code $exit_code"
      echo "🔄 Restarting in 5 seconds..."
      sleep 5
    fi
  done
}

# Function to start frontend  
start_frontend() {
  echo "🎨 Starting frontend server..."
  npm run dev
}

# Start backend in background with auto-restart
start_backend &
BACKEND_PID=$!

# Start frontend in foreground
start_frontend

# Clean up background process when script exits
trap "kill $BACKEND_PID 2>/dev/null" EXIT

wait