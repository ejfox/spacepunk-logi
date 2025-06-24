#!/bin/bash

echo "🚀 Starting Spacepunk Development Environment..."

# Check if Docker services are running
echo "🐳 Checking Docker services..."
docker compose ps

# Start backend services if not running
if ! docker compose ps | grep -q "spacepunk-server.*Up"; then
    echo "🔧 Starting backend services..."
    docker compose up -d
fi

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Start frontend in a new terminal tab
echo "🎮 Starting frontend server on port 3667..."
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && PORT=3667 npm run dev"'

echo "✅ Development environment started!"
echo "   Frontend: http://localhost:3667"
echo "   Backend: http://localhost:3666"
echo "   Database: postgres://localhost:5432/spacepunk_logi"