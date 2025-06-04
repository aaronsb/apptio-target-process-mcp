#!/bin/bash
set -e

# Setup .env file for local development

echo "🔧 Setting up .env file for Targetprocess MCP"
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists."
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file."
        exit 0
    fi
fi

# Copy from example if it exists
if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
else
    # Create from scratch
    cat > .env << 'EOF'
# Targetprocess Authentication
TP_USERNAME=your-username
TP_PASSWORD=your-password
TP_DOMAIN=your-domain.tpondemand.com

# Alternative: API Key Authentication (comment out basic auth above and uncomment below)
# TP_DOMAIN=your-domain.tpondemand.com
# TP_API_KEY=your-api-key-here
EOF
    echo "✅ Created new .env file"
fi

echo ""
echo "📝 Please edit .env with your Targetprocess credentials:"
echo "   - TP_DOMAIN: Your Targetprocess domain (e.g., company.tpondemand.com)"
echo "   - TP_USERNAME: Your username"
echo "   - TP_PASSWORD: Your password"
echo ""
echo "Or use API key authentication by uncommenting and setting TP_API_KEY"
echo ""

# Offer to open in editor if available
if command -v "${EDITOR:-nano}" > /dev/null 2>&1; then
    read -p "Would you like to edit .env now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        "${EDITOR:-nano}" .env
    fi
fi