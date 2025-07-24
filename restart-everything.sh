#!/bin/bash

echo "🔥 KILLING ONLY SPACEPUNK PROJECT PROCESSES..."
# Kill only processes in THIS specific project directory
pkill -f "/Users/ejfox/code/spacepunk-logi" 2>/dev/null || true
# Kill only processes using our specific ports
lsof -ti:3666 | xargs kill -9 2>/dev/null || true
lsof -ti:3667 | xargs kill -9 2>/dev/null || true

echo "⏳ Waiting for ports to clear..."
sleep 3

echo ""
echo "🚀 STARTING BACKEND (REAL SERVER WITH LLM)..."
cd /Users/ejfox/code/spacepunk-logi/server
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

echo "⏳ Waiting for backend to start..."
sleep 2

echo ""
echo "🎨 STARTING FRONTEND..."
cd /Users/ejfox/code/spacepunk-logi
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo "⏳ Waiting for frontend to start..."
sleep 5

echo ""
echo "🧪 TESTING CONNECTIONS..."

# Test backend
echo -n "Backend (port 3666): "
if curl -s http://localhost:3666/api/test > /dev/null 2>&1; then
    echo "✅ WORKING"
else
    echo "❌ FAILED"
fi

# Test frontend  
echo -n "Frontend (port 3667): "
if curl -s http://localhost:3667/ > /dev/null 2>&1; then
    echo "✅ WORKING"
else
    echo "❌ FAILED"
fi

echo ""
echo "🌐 URLs:"
echo "Frontend: http://localhost:3667"
echo "Backend API: http://localhost:3666/api/test"
echo "Streaming Test: http://localhost:3666/api/dialog/generate-stream"
echo ""
echo "📋 Process IDs:"
echo "Backend: $BACKEND_PID"
echo "Frontend: $FRONTEND_PID"
echo ""
echo "🛑 To stop everything later:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🎮 Ready to test! Go to http://localhost:3667 and click Explore!"