#!/bin/bash
# Script to set up GitHub labels for the project

echo "Setting up GitHub labels..."

# Delete default labels (optional - comment out if you want to keep them)
# gh label delete "bug" --yes 2>/dev/null || true
# gh label delete "duplicate" --yes 2>/dev/null || true
# gh label delete "enhancement" --yes 2>/dev/null || true
# gh label delete "good first issue" --yes 2>/dev/null || true
# gh label delete "help wanted" --yes 2>/dev/null || true
# gh label delete "invalid" --yes 2>/dev/null || true
# gh label delete "question" --yes 2>/dev/null || true
# gh label delete "wontfix" --yes 2>/dev/null || true

# Create new labels
# Type labels
gh label create "bug" -c "d73a4a" -d "Something isn't working" 2>/dev/null || true
gh label create "feature" -c "0075ca" -d "New feature or request" 2>/dev/null || true
gh label create "enhancement" -c "a2eeef" -d "Enhancement to existing functionality" 2>/dev/null || true
gh label create "documentation" -c "0075ca" -d "Improvements or additions to documentation" 2>/dev/null || true
gh label create "question" -c "d876e3" -d "Further information is requested" 2>/dev/null || true

# Priority labels
gh label create "priority: critical" -c "d73a4a" -d "Critical priority issue" 2>/dev/null || true
gh label create "priority: high" -c "ff9800" -d "High priority issue" 2>/dev/null || true
gh label create "priority: medium" -c "fbca04" -d "Medium priority issue" 2>/dev/null || true
gh label create "priority: low" -c "0e8a16" -d "Low priority issue" 2>/dev/null || true

# Status labels
gh label create "status: ready" -c "0e8a16" -d "Ready to be worked on" 2>/dev/null || true
gh label create "status: in progress" -c "fbca04" -d "Work in progress" 2>/dev/null || true
gh label create "status: blocked" -c "d73a4a" -d "Blocked by external factors" 2>/dev/null || true
gh label create "status: needs review" -c "fbca04" -d "Needs review from maintainers" 2>/dev/null || true

# Component labels
gh label create "component: api" -c "1d76db" -d "API client related" 2>/dev/null || true
gh label create "component: tools" -c "1d76db" -d "MCP tools related" 2>/dev/null || true
gh label create "component: entities" -c "1d76db" -d "Entity definitions" 2>/dev/null || true
gh label create "component: operations" -c "1d76db" -d "Semantic operations" 2>/dev/null || true
gh label create "component: docker" -c "1d76db" -d "Docker related" 2>/dev/null || true

# Other useful labels
gh label create "good first issue" -c "7057ff" -d "Good for newcomers" 2>/dev/null || true
gh label create "help wanted" -c "008672" -d "Extra attention is needed" 2>/dev/null || true
gh label create "security" -c "d73a4a" -d "Security related issue" 2>/dev/null || true
gh label create "breaking change" -c "d73a4a" -d "Breaking change" 2>/dev/null || true
gh label create "dependencies" -c "0366d6" -d "Pull requests that update a dependency file" 2>/dev/null || true

echo "Labels setup complete!"