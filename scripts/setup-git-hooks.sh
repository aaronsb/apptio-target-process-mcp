#!/bin/bash
# Setup git hooks for the project

echo "Setting up git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook to check for secrets before committing

echo "Running pre-commit checks..."

# Run secret scanning
if [ -f "scripts/check-secrets.cjs" ]; then
    node scripts/check-secrets.cjs
    if [ $? -ne 0 ]; then
        echo "❌ Pre-commit check failed: secrets detected"
        echo "   Please remove any secrets before committing."
        exit 1
    fi
fi

# Run linting if configured
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    # Check if lint script exists
    if npm run lint --dry-run &> /dev/null 2>&1; then
        echo "Running linter..."
        npm run lint
        if [ $? -ne 0 ]; then
            echo "❌ Pre-commit check failed: linting errors"
            echo "   Please fix linting errors before committing."
            exit 1
        fi
    fi
fi

echo "✅ Pre-commit checks passed"
exit 0
EOF

# Make hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully!"
echo ""
echo "The pre-commit hook will now:"
echo "- Check for secrets before each commit"
echo "- Run linting checks"
echo ""
echo "To bypass hooks in emergency (use sparingly):"
echo "  git commit --no-verify"