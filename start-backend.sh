#!/bin/bash

echo "🚀 Starting Spacepunk Backend..."
echo "📡 Setting up database and services..."

# Start Docker services (database, redis)
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to initialize..."
sleep 20

# Start the real server with full features
echo "🎮 Starting full Spacepunk server with LLM integration..."
node server/src/index.js