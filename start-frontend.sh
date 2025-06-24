#!/bin/bash

echo "🎮 Starting Spacepunk Frontend..."
echo "🔥 Launching Nuxt development server..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the Nuxt development server on port 3667
PORT=3667 npm run dev