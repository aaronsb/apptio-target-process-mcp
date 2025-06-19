#!/bin/bash
# Main script to set up all project configurations

echo "🚀 Setting up Targetprocess MCP Server project configuration..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "   Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Run setup scripts
echo "📋 Setting up GitHub labels..."
./scripts/setup-labels.sh
echo ""

echo "🔒 Setting up branch protection..."
./scripts/setup-branch-protection.sh
echo ""

echo "💬 Enabling discussions..."
./scripts/setup-discussions.sh
echo ""

echo "✅ Project configuration complete!"
echo ""
echo "📝 Next steps:"
echo "1. Run the label setup script to create labels"
echo "2. Configure branch protection rules if needed"
echo "3. Create discussion categories in GitHub UI"
echo "4. Review and customize the templates as needed"
echo ""
echo "🎉 Your project now has:"
echo "- Issue templates (bug, feature, question)"
echo "- Pull request template"
echo "- Contributing guidelines"
echo "- Code of conduct"
echo "- Security policy"
echo "- CODEOWNERS file"
echo "- Dependabot configuration"
echo "- Setup scripts for labels and protection"