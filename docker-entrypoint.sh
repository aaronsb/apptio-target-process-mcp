#!/bin/sh
set -e

# Print version info
echo "Target Process MCP Server"
echo "Docker Hash: $DOCKER_HASH"
echo "Node Version: $(node -v)"

# Start the MCP server
exec node build/index.js
