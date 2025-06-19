#!/bin/bash
# Script to enable GitHub Discussions

echo "Enabling GitHub Discussions..."

# Enable discussions using GitHub API
gh api repos/:owner/:repo \
  --method PATCH \
  --field has_discussions=true \
  2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ GitHub Discussions enabled!"
  echo ""
  echo "You can now:"
  echo "- Create discussion categories in Settings > Discussions"
  echo "- Start community discussions"
  echo "- Move appropriate issues to discussions"
else
  echo "⚠️  Could not enable discussions via API."
  echo "    Please enable manually in Settings > Features > Discussions"
fi