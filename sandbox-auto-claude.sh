#!/bin/bash

# Sandbox Auto-Claude Launcher
# Safely runs autonomous development in Docker container

set -e

echo "🐳 Spacepunk Auto-Claude Sandbox Launcher"
echo "======================================="

# Configuration
MODE="${1:-test}"
GITHUB_TOKEN_FILE="$HOME/.config/gh/hosts.yml"

# Pre-flight checks
log_info() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log_info "Checking Docker availability..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon not running. Please start Docker Desktop."
    exit 1
fi

log_info "✅ Docker is available"

# Check for GitHub token
if [ -f "$GITHUB_TOKEN_FILE" ]; then
    log_info "✅ GitHub CLI config found"
else
    echo "❌ GitHub CLI not configured. Run 'gh auth login' first."
    exit 1
fi

# Extract GitHub token for container
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    GITHUB_TOKEN=$(gh auth token)
    log_info "✅ GitHub token extracted"
else
    echo "❌ Cannot extract GitHub token. Please run 'gh auth login'."
    exit 1
fi

# Create output directories
mkdir -p auto-claude-output auto-claude-logs

log_info "📁 Created output directories"

# Build the container
log_info "🔨 Building Auto-Claude container..."
if docker build -f Dockerfile.auto-claude -t spacepunk-auto-claude . &> build.log; then
    log_info "✅ Container built successfully"
else
    echo "❌ Container build failed. Check build.log for details."
    exit 1
fi

# Safety confirmation
echo ""
echo "🚨 SAFETY CONFIRMATION"
echo "====================="
echo "This will run autonomous development in a Docker container with:"
echo "  • Resource limits: 2GB RAM, 1 CPU"
echo "  • Read-only project mount (except git)"
echo "  • Isolated network"
echo "  • Non-root user"
echo "  • Output isolated to auto-claude-output/"
echo ""
echo "Mode: $MODE"
if [ "$MODE" = "test" ]; then
    echo "Duration: ~15 minutes (3 cycles of 5 minutes)"
else
    echo "Duration: ~1 WEEK (672 cycles of 35 minutes)"
fi
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Export GitHub token for docker-compose
export GITHUB_TOKEN

# Run the container
log_info "🚀 Starting Auto-Claude in sandbox..."
if [ "$MODE" = "test" ]; then
    # Test mode - run with logs visible
    docker-compose -f docker-compose.auto-claude.yml up --build auto-claude
else
    # Production mode - run detached with monitoring
    docker-compose -f docker-compose.auto-claude.yml up -d
    log_info "🌙 Auto-Claude running in background for ~1 week"
    echo ""
    echo "Monitor with:"
    echo "  docker-compose -f docker-compose.auto-claude.yml logs -f auto-claude"
    echo "  tail -f auto-claude-logs/auto-claude-*.log"
    echo ""
    echo "Stop with:"
    echo "  touch STOP_AUTO_CLAUDE"
    echo "  docker-compose -f docker-compose.auto-claude.yml down"
fi

# Cleanup on exit
cleanup() {
    log_info "🧹 Cleaning up containers..."
    docker-compose -f docker-compose.auto-claude.yml down 2>/dev/null || true
}

trap cleanup EXIT

# If test mode, wait for completion
if [ "$MODE" = "test" ]; then
    echo ""
    echo "📊 Test completed! Check results:"
    echo "  ls -la auto-claude-output/"
    echo "  cat auto-claude-logs/auto-claude-*.log"
fi