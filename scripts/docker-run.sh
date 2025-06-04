#!/bin/bash
set -e

# Run the Targetprocess MCP Docker container
# 
# This script runs the Docker image with proper environment variables.
# It sources credentials from .env file or uses command line arguments.
#
# Usage: 
#   ./scripts/docker-run.sh                    # Uses .env file
#   ./scripts/docker-run.sh --help            # Show help

show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help          Show this help message"
    echo "  --api-key       Use API key authentication (from .env)"
    echo "  --verbose       Show Docker output"
    echo ""
    echo "Environment variables (from .env or exported):"
    echo "  TP_DOMAIN       Targetprocess domain"
    echo "  TP_USERNAME     Username (basic auth)"
    echo "  TP_PASSWORD     Password (basic auth)"
    echo "  TP_API_KEY      API key (alternative auth)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run with basic auth from .env"
    echo "  $0 --api-key          # Run with API key from .env"
    exit 0
}

# Parse arguments
USE_API_KEY=false
VERBOSE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --help) show_help ;;
        --api-key) USE_API_KEY=true ;;
        --verbose) VERBOSE=true ;;
        *) echo "Unknown option: $1"; show_help ;;
    esac
    shift
done

# Load environment variables if .env exists
if [ -f ".env" ]; then
    source .env
else
    echo "⚠️  No .env file found. Please run ./scripts/setup-env.sh first."
    exit 1
fi

# Check for required variables
if [ -z "$TP_DOMAIN" ]; then
    echo "❌ Error: TP_DOMAIN not set"
    exit 1
fi

# Build Docker run command
DOCKER_CMD="docker run --rm -i"
DOCKER_CMD="$DOCKER_CMD -e TP_DOMAIN=$TP_DOMAIN"

if [ "$USE_API_KEY" = true ]; then
    if [ -z "$TP_API_KEY" ]; then
        echo "❌ Error: TP_API_KEY not set"
        exit 1
    fi
    DOCKER_CMD="$DOCKER_CMD -e TP_API_KEY=$TP_API_KEY"
else
    if [ -z "$TP_USERNAME" ] || [ -z "$TP_PASSWORD" ]; then
        echo "❌ Error: TP_USERNAME and TP_PASSWORD not set"
        exit 1
    fi
    DOCKER_CMD="$DOCKER_CMD -e TP_USERNAME=$TP_USERNAME -e TP_PASSWORD=$TP_PASSWORD"
fi

DOCKER_CMD="$DOCKER_CMD apptio-target-process-mcp:local"

# Check if Docker image exists
if ! docker images | grep -q "apptio-target-process-mcp.*local"; then
    echo "❌ Error: Docker image 'apptio-target-process-mcp:local' not found"
    echo ""
    echo "💡 Hints:"
    echo "  • Run './scripts/docker-build.sh' to build the image"
    echo "  • Check if the build completed successfully"
    echo "  • Look for build logs in /tmp/apptio-target-process-mcp/"
    exit 1
fi

# Run the container
echo "🚀 Running Targetprocess MCP Docker container..."
echo ""

if [ "$VERBOSE" = true ]; then
    echo "Command: $DOCKER_CMD"
    echo ""
fi

if ! eval $DOCKER_CMD; then
    echo ""
    echo "❌ Container failed to run"
    echo ""
    echo "💡 Troubleshooting hints:"
    echo "  • Check your credentials in .env file"
    echo "  • Verify TP_DOMAIN format (should be: company.tpondemand.com)"
    echo "  • Try running with --verbose flag for more details"
    echo "  • Check Docker logs: docker logs <container-id>"
fi