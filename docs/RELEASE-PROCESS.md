# Release Process

This project uses **Semantic Release** for automatic versioning and release management based on conventional commit messages.

## How It Works

When PRs are merged to the `main` branch, the release workflow:

1. **Analyzes commits** since the last release
2. **Determines version bump** based on conventional commit types
3. **Creates git tags** automatically
4. **Generates release notes**
5. **Updates CHANGELOG.md**
6. **Creates GitHub releases**

## Commit Message Format

Use [Conventional Commits](https://conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Version Bumps

| Commit Type | Version Bump | Example |
|-------------|-------------|---------|
| `fix:` | **patch** (0.9.0 → 0.9.1) | `fix: resolve authentication timeout` |
| `feat:` | **minor** (0.9.0 → 0.10.0) | `feat: add comment threading support` |
| `refactor:` | **minor** (0.9.0 → 0.10.0) | `refactor: break down TPService class` |
| `perf:` | **patch** (0.9.0 → 0.9.1) | `perf: optimize entity search queries` |
| Breaking changes | **major** (0.9.0 → 1.0.0) | `feat!: remove deprecated API methods` |

### Types That Don't Trigger Releases

- `docs:` - Documentation changes
- `test:` - Test additions/changes  
- `ci:` - CI configuration changes
- `chore:` - Maintenance tasks

## Branch Strategy

- **main** - Production releases (v1.0.0, v1.1.0, etc.)
- **develop** - Beta releases (v1.1.0-beta.1, v1.1.0-beta.2, etc.)
- **alpha** - Alpha releases (v1.1.0-alpha.1, etc.)

## Manual Release (if needed)

To trigger a release manually:

1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Select branch (usually `main`)
4. Click "Run workflow"

## Examples

### Recent Release History

Your recent commits would generate these releases:

```bash
# Current: v0.9.0

# Next release would be v0.10.0 based on:
e76501c refactor: break down TPService class per SOLID principles (Issue #124)
5414fdb feat: consolidate comment tools into unified semantic comment tool (#183)

# If you had only fixes:
1889f20 fix: eliminate hardcoded test domains and use environment configuration
24a3101 fix: configure global environment loading for all tests
# Would generate: v0.9.1
```

### Good Commit Examples

```bash
# Feature additions (minor bump)
git commit -m "feat: add attachment analysis with AI vision support"
git commit -m "feat(api): implement retry logic with exponential backoff"

# Bug fixes (patch bump) 
git commit -m "fix: resolve Jest ES modules configuration issue"
git commit -m "fix(auth): handle expired token refresh"

# Breaking changes (major bump)
git commit -m "feat!: remove legacy comment API endpoints"
git commit -m "refactor!: restructure entity hierarchy"

# No release
git commit -m "docs: update API documentation"
git commit -m "test: add integration tests for comment operations"
git commit -m "ci: update Node.js versions in workflow"
```

## Troubleshooting

### Release Failed

1. Check workflow logs in Actions tab
2. Common issues:
   - Missing `GITHUB_TOKEN` permissions
   - Test failures blocking release
   - Invalid conventional commit format

### Wrong Version Generated

- Review commit messages since last release
- Use `git log v0.9.0..HEAD --oneline` to see commits
- Ensure commit types match intended version bump

### Skip Release

Add `[skip ci]` or `[skip release]` to commit message:

```bash
git commit -m "chore: update documentation [skip ci]"
```

## GitHub Permissions

The release workflow needs these permissions (already configured):

- `contents: write` - Create tags and releases
- `issues: write` - Update issues with release info  
- `pull-requests: write` - Update PRs with release info

## Optional: NPM Publishing

Currently disabled (`npmPublish: false`). To enable:

1. Set `npmPublish: true` in `.releaserc.json`
2. Add `NPM_TOKEN` secret to GitHub repository
3. Update package visibility if needed (`"private": false` already set)