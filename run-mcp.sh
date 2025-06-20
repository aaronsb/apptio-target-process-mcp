#!/bin/bash
# MCP wrapper script for targetprocess

# Source the .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Force strict mode for MCP
export MCP_STRICT_MODE=true

# Run the MCP server with stdio flag
exec node "$(dirname "$0")/build/index.js" --stdio