#!/bin/bash
set -e

# Development setup script for Targetprocess MCP
# Sets up environment and adds to Claude Code

echo "🚀 Targetprocess MCP Development Setup"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "src/server.ts" ]; then
    echo "❌ Error: Please run this script from the root of the apptio-target-process-mcp directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Build the project
echo "🔨 Building project..."
npm run build

# Step 3: Setup environment
if [ ! -f ".env" ]; then
    echo ""
    echo "🔧 Setting up environment..."
    ./scripts/setup-env.sh
else
    echo "✅ .env file exists"
fi

# Step 4: Load environment and check
if [ -f ".env" ]; then
    source .env
    
    if [ -z "$TP_DOMAIN" ] || [ "$TP_DOMAIN" = "your-domain.tpondemand.com" ]; then
        echo ""
        echo "⚠️  Please edit .env with your actual Targetprocess credentials"
        echo "   Then run this script again."
        exit 1
    fi
fi

# Step 5: Add to Claude Code
echo ""
echo "🤖 Adding to Claude Code..."
echo ""

PROJECT_DIR=$(pwd)

# Check if already added
if claude mcp list 2>/dev/null | grep -q "targetprocess"; then
    echo "ℹ️  Targetprocess MCP is already added to Claude Code"
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        claude mcp remove targetprocess
    else
        echo "Keeping existing configuration"
        exit 0
    fi
fi

# Add to Claude Code
echo "Adding Targetprocess MCP to Claude Code (local scope)..."
claude mcp add targetprocess node "$PROJECT_DIR/build/index.js" \
  -e TP_DOMAIN="$TP_DOMAIN" \
  -e TP_USERNAME="$TP_USERNAME" \
  -e TP_PASSWORD="$TP_PASSWORD"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Restart Claude Code to load the new MCP server"
echo "2. The following tools will be available:"
echo "   - search_entities"
echo "   - get_entity" 
echo "   - create_entity"
echo "   - update_entity"
echo "   - inspect_object"
echo ""
echo "💡 To test: Try searching for user stories in Claude Code"
echo "   Example: search_entities({ type: 'UserStory', take: 5 })"
echo ""