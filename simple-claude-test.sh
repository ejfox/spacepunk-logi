#!/bin/bash

# Simple test to verify Claude can receive input
echo "Testing direct input to Claude..."

# Create a simple request
echo "Create a single HTML file called snow-crash.html with minimalist Swiss design for a Snow Crash fan site. Just make one file with some basic content about the novel." | claude code --dangerously-skip-permissions

echo "Test complete. Check for snow-crash.html file."