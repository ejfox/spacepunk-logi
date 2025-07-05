#!/bin/bash

echo "🔍 CHECKING SPACEPUNK STATUS..."
echo ""

# Check processes (only this project)
echo "📋 SPACEPUNK PROJECT PROCESSES:"
ps aux | grep "/Users/ejfox/code/spacepunk-logi" | grep -v grep | while read line; do
    echo "  ✓ $line"
done

echo ""

# Check ports
echo "🌐 PORT STATUS:"
if lsof -i:3666 > /dev/null 2>&1; then
    echo "  ✅ Port 3666 (Backend): OPEN"
else
    echo "  ❌ Port 3666 (Backend): CLOSED"
fi

if lsof -i:3667 > /dev/null 2>&1; then
    echo "  ✅ Port 3667 (Frontend): OPEN"
else
    echo "  ❌ Port 3667 (Frontend): CLOSED"
fi

echo ""

# Test connections
echo "🧪 CONNECTION TESTS:"
echo -n "  Backend API: "
if curl -s --max-time 3 http://localhost:3666/api/test > /dev/null 2>&1; then
    echo "✅ RESPONDING"
else
    echo "❌ NOT RESPONDING"
fi

echo -n "  Frontend: "
if curl -s --max-time 3 http://localhost:3667/ > /dev/null 2>&1; then
    echo "✅ RESPONDING"
else
    echo "❌ NOT RESPONDING"
fi

echo ""
echo "🌐 Quick URLs:"
echo "  Frontend: http://localhost:3667"
echo "  Backend Test: http://localhost:3666/api/test"
echo ""

# If both are working
if curl -s --max-time 3 http://localhost:3666/api/test > /dev/null 2>&1 && curl -s --max-time 3 http://localhost:3667/ > /dev/null 2>&1; then
    echo "🎉 EVERYTHING IS WORKING! Ready to test streaming!"
else
    echo "⚠️  Something is down. Run './restart-everything.sh' to fix it."
fi