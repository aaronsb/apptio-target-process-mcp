#!/bin/bash
# MCP wrapper script for targetprocess

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if build exists
if [ ! -f "$SCRIPT_DIR/build/index.js" ]; then
    echo "Error: build/index.js not found. Please run 'npm run build' first." >&2
    exit 1
fi

# Source the .env file if it exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a  # automatically export all variables
    source "$SCRIPT_DIR/.env"
    set +a
fi

# Force strict mode for MCP
export MCP_STRICT_MODE=true

# Run the MCP server with stdio flag
exec node "$SCRIPT_DIR/build/index.js" --stdio