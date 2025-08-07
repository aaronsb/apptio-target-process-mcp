# Release Process

This project uses **Semantic Release** for automatic versioning and release management based on conventional commit messages.

## ✅ Validated Workflow (August 2025)

**Status**: ✅ **Production Ready** - Successfully tested with v0.10.1 release

The automatic release system was thoroughly tested and validated through:
1. **Real functional improvements**: Fixed GetEntityTool test coverage (Issue #128)
2. **End-to-end workflow**: PR creation → merge → automatic release
3. **Branch protection compatibility**: Works with protected main branch
4. **Multiple commit analysis**: Correctly analyzed 4 commits since v0.10.0 baseline

**Test Results**: https://github.com/aaronsb/apptio-target-process-mcp/releases/tag/v0.10.1

## How It Works

When PRs are merged to the `main` branch, the release workflow:

1. **Analyzes commits** since the last release
2. **Determines version bump** based on conventional commit types  
3. **Creates git tags** automatically
4. **Generates release notes** with emoji categorization
5. **Creates GitHub releases** with build assets
6. **Publishes draft releases** for review

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

## Implementation History & Lessons Learned

### August 2025 Implementation

**Context**: Set up automatic semantic release workflow and tested with real project improvements.

#### Setup Process

1. **Initial Configuration**
   - Added `.github/workflows/release.yml` with semantic-release action
   - Created `.releaserc.json` with conventional commits configuration
   - Added dev dependencies: `semantic-release`, `@semantic-release/changelog`, etc.

2. **Branch Protection Resolution** 
   - **Issue**: Semantic-release tried to push version commits to protected main branch
   - **Solution**: Removed `@semantic-release/git` plugin to avoid branch protection conflicts
   - **Result**: Tags and releases created without pushing version commits back

3. **Baseline Tag Creation**
   - **Issue**: Initial run tried to tag all 219 commits since repository start
   - **Solution**: Manually created `v0.10.0` baseline tag on semantic release implementation commit
   - **Result**: Future releases only analyze recent commits

#### Test Validation (PR #198)

**Functional Change**: Fixed GetEntityTool test coverage (Issue #128)
- Fixed parameter naming: `entityType` → `type`
- Updated array handling for include parameters  
- All 8 GetEntityTool tests now passing

**Release Results**:
- **Version**: v0.10.1 (patch bump from `fix:` commits)
- **Commits analyzed**: 4 commits since v0.10.0
- **Release notes**: Auto-generated with emoji categorization
- **Assets**: Built application files attached to release

#### Key Learnings

✅ **What Works**:
- Conventional commits are analyzed correctly
- Branch protection doesn't block the workflow
- Multiple `fix:` commits result in single patch release
- Real project improvements validate the process

⚠️ **Gotchas Avoided**:
- Don't use `@semantic-release/git` with protected branches
- Always establish proper baseline tag before first run
- Asset conflicts in GitHub releases are cosmetic (workflow still succeeds)

### Configuration Files

**Core workflow**: `.github/workflows/release.yml`
**Release config**: `.releaserc.json`  
**Dependencies**: Added to `package.json` devDependencies

## Optional: NPM Publishing

Currently disabled (`npmPublish: false`). To enable:

1. Set `npmPublish: true` in `.releaserc.json`
2. Add `NPM_TOKEN` secret to GitHub repository
3. Update package visibility if needed (`"private": false` already set)