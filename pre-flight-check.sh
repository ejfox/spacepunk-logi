#!/bin/bash

# Pre-flight check for overnight autonomous development
echo "🛸 PRE-FLIGHT CHECK FOR OVERNIGHT DEVELOPMENT"
echo "============================================="

# Check 1: Git status
echo "📊 Current Git Status:"
echo "Branch: $(git branch --show-current)"
echo "Uncommitted changes: $(git status --porcelain | wc -l | tr -d ' ')"

# Check 2: GitHub issues
echo ""
echo "📋 GitHub Issues:"
ISSUE_COUNT=$(gh issue list | wc -l | tr -d ' ')
echo "Open issues: $ISSUE_COUNT"
if [ "$ISSUE_COUNT" -gt 0 ]; then
    echo "✅ Ready to work on issues"
else
    echo "⚠️  No open issues - will need to brainstorm new features"
fi

# Check 3: GitHub auth
echo ""
echo "🔐 GitHub Authentication:"
if gh auth status >/dev/null 2>&1; then
    echo "✅ GitHub CLI authenticated"
else
    echo "❌ GitHub CLI not authenticated - run 'gh auth login'"
    exit 1
fi

# Check 4: Dependencies
echo ""
echo "🔧 Dependencies:"
for cmd in claude node gh git; do
    if command -v $cmd &> /dev/null; then
        echo "✅ $cmd available"
    else
        echo "❌ $cmd not found"
        exit 1
    fi
done

# Check 5: Test client
echo ""
echo "🧪 Test Infrastructure:"
if [ -f "test-client.js" ]; then
    echo "✅ Test client available"
    if node -c test-client.js 2>/dev/null; then
        echo "✅ Test client syntax valid"
    else
        echo "❌ Test client has syntax errors"
        exit 1
    fi
else
    echo "❌ Test client not found"
    exit 1
fi

# Check 6: Required files
echo ""
echo "📄 Required Files:"
for file in OVERNIGHT_REQUEST.txt claude.md; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check 7: Repo state
echo ""
echo "🏗️  Repository State:"
if [ -d ".git" ]; then
    echo "✅ Git repository"
else
    echo "❌ Not a git repository"
    exit 1
fi

if [ -d "server" ] && [ -d "components" ]; then
    echo "✅ Spacepunk project structure detected"
else
    echo "❌ Not in spacepunk-logi directory"
    exit 1
fi

echo ""
echo "🚀 ALL CHECKS PASSED - READY FOR OVERNIGHT DEVELOPMENT!"
echo ""
echo "To start overnight session:"
echo "  ./overnight-auto-claude.sh"
echo ""
echo "To stop during the night:"
echo "  touch STOP_AUTO_CLAUDE"
echo ""
echo "Tomorrow morning, check:"
echo "  gh pr list    (see created PRs)"
echo "  git log       (see commits)"
echo "  overnight-claude-*.log (see full log)"