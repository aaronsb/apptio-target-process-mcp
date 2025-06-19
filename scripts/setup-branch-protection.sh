#!/bin/bash
# Script to set up branch protection rules for the main branch

echo "Setting up branch protection for main branch..."

# Set up branch protection for main
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field "required_status_checks[strict]=true" \
  --field "required_status_checks[contexts][]=build" \
  --field "required_status_checks[contexts][]=test" \
  --field "enforce_admins=false" \
  --field "required_pull_request_reviews[dismiss_stale_reviews]=true" \
  --field "required_pull_request_reviews[require_code_owner_reviews]=true" \
  --field "required_pull_request_reviews[required_approving_review_count]=1" \
  --field "restrictions=null" \
  --field "allow_force_pushes=false" \
  --field "allow_deletions=false" \
  --field "required_conversation_resolution=true" \
  --field "lock_branch=false" \
  --field "allow_fork_syncing=true" \
  2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Branch protection enabled for main branch"
else
  echo "⚠️  Could not enable branch protection. You may need admin permissions."
  echo "    You can manually configure this in Settings > Branches"
fi

echo ""
echo "Recommended manual settings in GitHub UI:"
echo "- Require branches to be up to date before merging"
echo "- Include administrators in restrictions"
echo "- Require signed commits (optional)"
echo ""
echo "Branch protection helps ensure:"
echo "- All changes go through PR review"
echo "- Tests pass before merging"
echo "- No direct pushes to main"
echo "- Consistent code quality"