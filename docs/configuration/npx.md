# NPX Configuration Guide

This comprehensive guide explains how to integrate the Targetprocess MCP Server using NPX (Node Package eXecute), providing zero-installation access to the latest version directly from the npm registry.

## Table of Contents

1. [What is NPX and Advantages](#what-is-npx-and-advantages)
2. [Prerequisites](#prerequisites)
3. [Quick Start Examples](#quick-start-examples)
4. [Authentication Methods](#authentication-methods)
5. [Role Configuration](#role-configuration)
6. [Environment Variables](#environment-variables)
7. [Integration Examples](#integration-examples)
8. [Limitations and Considerations](#limitations-and-considerations)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## What is NPX and Advantages

### What is NPX?

NPX (Node Package eXecute) is a tool that comes bundled with npm 5.2+ that allows you to run packages directly from the npm registry without installing them globally. It downloads and executes packages on-demand.

### Key Advantages

1. **Zero Installation**: No need to clone repositories or build projects locally
2. **Always Latest**: Automatically uses the most recent published version
3. **No Dependencies**: Only requires Node.js and npm (which includes npx)
4. **Instant Updates**: Each run fetches the latest version from npm registry
5. **Clean Environment**: No leftover files or global installations
6. **Cross-Platform**: Works identically on Windows, macOS, and Linux

### How It Works

```bash
# Traditional approach (install + run)
npm install -g @aaronsb/targetprocess-mcp
targetprocess-mcp

# NPX approach (run directly)
npx @aaronsb/targetprocess-mcp
```

When you run `npx @aaronsb/targetprocess-mcp`, NPX:
1. Checks if the package exists in npm registry
2. Downloads the latest version to a temporary location
3. Executes the package's main binary
4. Cleans up temporary files after execution

## Prerequisites

### Node.js and npm
- **Node.js 18+** (with ES modules support)
- **npm 9+** (bundled with Node.js, includes npx)

Check your versions:
```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
npx --version   # Should be 9.x or higher
```

### Targetprocess Access
- A Targetprocess instance (e.g., `company.tpondemand.com`)
- Valid credentials (username/password OR API key)
- Network access to your Targetprocess domain

### Network Requirements
- Access to npm registry (`registry.npmjs.org`)
- Access to your Targetprocess instance
- Outbound HTTPS connections (ports 443)

## Quick Start Examples

### Basic Setup with API Key (Recommended)
```bash
# Set environment variables and run
TP_DOMAIN=company.tpondemand.com \
TP_API_KEY=your-api-key-here \
npx @aaronsb/targetprocess-mcp
```

### Basic Setup with Username/Password
```bash
# Alternative authentication method
TP_DOMAIN=company.tpondemand.com \
TP_USERNAME=your-username \
TP_PASSWORD=your-password \
npx @aaronsb/targetprocess-mcp
```

### Developer Role Configuration
```bash
# Enable developer-specific tools
TP_DOMAIN=company.tpondemand.com \
TP_API_KEY=your-api-key \
TP_USER_ROLE=developer \
TP_USER_ID=12345 \
TP_USER_EMAIL=dev@company.com \
npx @aaronsb/targetprocess-mcp
```

### Using Environment File
```bash
# Create .env file with credentials
echo "TP_DOMAIN=company.tpondemand.com" > .env
echo "TP_API_KEY=your-api-key" >> .env

# Source environment and run
source .env && npx @aaronsb/targetprocess-mcp
```

### Always Use Latest Version
```bash
# Force download of latest version (bypassing cache)
npx --yes @aaronsb/targetprocess-mcp
```

## Authentication Methods

### API Key Authentication (Recommended)

API key authentication is more secure and reliable than username/password combinations.

**Creating an API Key:**
1. Log into your Targetprocess instance
2. Navigate to **Settings** → **Access Tokens**
3. Click **Create Token**
4. Provide a descriptive name (e.g., "NPX MCP Integration")
5. Select appropriate permissions (typically "Read/Write" for most operations)
6. Copy the generated token

**NPX Configuration:**
```bash
# Inline environment variables
TP_DOMAIN=company.tpondemand.com \
TP_API_KEY=abc123def456789... \
npx @aaronsb/targetprocess-mcp

# Or export for session
export TP_DOMAIN=company.tpondemand.com
export TP_API_KEY=abc123def456789...
npx @aaronsb/targetprocess-mcp
```

### Username/Password Authentication

While supported, username/password authentication is less secure and may be subject to additional rate limiting.

**NPX Configuration:**
```bash
# Direct inline usage
TP_DOMAIN=company.tpondemand.com \
TP_USERNAME=john.doe \
TP_PASSWORD=your-secure-password \
npx @aaronsb/targetprocess-mcp

# Using environment variables
export TP_DOMAIN=company.tpondemand.com
export TP_USERNAME=john.doe
export TP_PASSWORD=your-secure-password
npx @aaronsb/targetprocess-mcp
```

### Environment File Support

For better security and convenience, use environment files:

**Create `.env` file:**
```bash
# Authentication (choose one method)
TP_DOMAIN=company.tpondemand.com
TP_API_KEY=your-api-key-here

# OR
# TP_USERNAME=your-username
# TP_PASSWORD=your-password

# Optional role configuration
TP_USER_ROLE=developer
TP_USER_ID=12345
TP_USER_EMAIL=dev@company.com
```

**Load and run:**
```bash
# Method 1: Source the file
source .env && npx @aaronsb/targetprocess-mcp

# Method 2: Use with env command
env $(cat .env | xargs) npx @aaronsb/targetprocess-mcp

# Method 3: Use dotenv (if installed)
npx dotenv npx @aaronsb/targetprocess-mcp
```

## Role Configuration

### Understanding Tool Categories

The MCP server provides **two categories of tools**:

1. **Core Tools** - Always available, provide semantic hints and intelligent workflows:
   - `search_entities` - Search for any Targetprocess entity
   - `get_entity` - Get detailed information about specific entities
   - `create_entity` - Create new entities with validation
   - `update_entity` - Update existing entities
   - `inspect_object` - Inspect entity types and properties
   - `comment` - Unified comment management (add, view, delete, analyze)

2. **Role-Specific Tools** - Additional specialized tools when `TP_USER_ROLE` is configured:
   - Only available when role is properly configured
   - Provide workflow-optimized operations for specific user types
   - Include intelligent context and next-action suggestions

**Important:** ALL tools provide semantic hints and intelligent workflow guidance. Role configuration adds ADDITIONAL specialized tools tailored to specific workflows.

### Available Roles

#### Developer Role (`TP_USER_ROLE=developer`)

Adds specialized tools for task management and development workflows:

**Additional Tools:**
- `show_my_tasks` - View assigned tasks with priority filtering and context
- `start_working_on` - Begin work on tasks with state transitions
- `complete_task` - Mark tasks complete with time logging
- `show_my_bugs` - Analyze assigned bugs with severity insights
- `log_time` - Record time spent with intelligent entity discovery
- `add_comment` - Add contextual comments with workflow awareness
- `show_comments` - View comments with hierarchical organization
- `delete_comment` - Delete comments with ownership validation
- `analyze_attachment` - AI-powered attachment analysis with security validation

**NPX Configuration:**
```bash
TP_DOMAIN=company.tpondemand.com \
TP_API_KEY=your-api-key \
TP_USER_ROLE=developer \
TP_USER_ID=12345 \
TP_USER_EMAIL=developer@company.com \
npx @aaronsb/targetprocess-mcp
```

#### Project Manager Role (`TP_USER_ROLE=project-manager`)

Adds tools for project oversight and team management:

**Additional Tools:**
- `show_project_status` - Project health dashboard with metrics
- `show_team_workload` - Team capacity and assignment analysis
- `create_sprint_plan` - Sprint planning with velocity predictions
- `show_sprint_progress` - Current sprint burndown and progress tracking

**NPX Configuration:**
```bash
TP_DOMAIN=company.tpondemand.com \
TP_API_KEY=your-api-key \
TP_USER_ROLE=project-manager \
TP_USER_ID=67890 \
TP_USER_EMAIL=pm@company.com \
npx @aaronsb/targetprocess-mcp
```

#### Tester Role (`TP_USER_ROLE=tester`)

Adds tools for quality assurance and testing workflows:

**Additional Tools:**
- `show_my_test_tasks` - Test tasks with execution status
- `create_bug_report` - Structured bug reporting with templates
- `show_test_coverage` - Coverage analysis across projects
- `validate_user_stories` - Story readiness for testing

**NPX Configuration:**
```bash
TP_DOMAIN=company.tpondemand.com \
TP_API_KEY=your-api-key \
TP_USER_ROLE=tester \
TP_USER_ID=11111 \
TP_USER_EMAIL=tester@company.com \
npx @aaronsb/targetprocess-mcp
```

#### Product Owner Role (`TP_USER_ROLE=product-owner`)

Adds tools for product management and stakeholder communication:

**Additional Tools:**
- `show_product_backlog` - Prioritized backlog with insights
- `analyze_story_readiness` - Story completeness analysis
- `show_feature_progress` - Feature delivery tracking
- `stakeholder_summary` - Executive summary generation

**NPX Configuration:**
```bash
TP_DOMAIN=company.tpondemand.com \
TP_API_KEY=your-api-key \
TP_USER_ROLE=product-owner \
TP_USER_ID=22222 \
TP_USER_EMAIL=po@company.com \
npx @aaronsb/targetprocess-mcp
```

## Environment Variables

### Core Environment Variables

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `TP_DOMAIN` | ✅ | Targetprocess domain (without https://) | `company.tpondemand.com` | - |
| `TP_API_KEY` | ⚠️* | API token (recommended) | `abc123def456...` | - |
| `TP_USERNAME` | ⚠️* | Username for basic auth | `john.doe` | - |
| `TP_PASSWORD` | ⚠️* | Password for basic auth | `secretpassword` | - |

*Either `TP_API_KEY` OR (`TP_USERNAME` + `TP_PASSWORD`) is required.

### Role Configuration Variables

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `TP_USER_ROLE` | ❌ | Role for specialized tools | `developer`, `project-manager`, `tester`, `product-owner` | - |
| `TP_USER_ID` | ❌ | Your user ID in Targetprocess | `12345` | - |
| `TP_USER_EMAIL` | ❌ | Your email in Targetprocess | `user@company.com` | - |

### Advanced Configuration Variables

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `MCP_STRICT_MODE` | ❌ | Enable strict validation | `true`, `false` | `false` |
| `DEBUG` | ❌ | Enable debug logging | `*`, `mcp:*`, `targetprocess:*` | - |
| `NODE_ENV` | ❌ | Environment mode | `development`, `production` | `production` |

### Setting Environment Variables

**Method 1: Inline (Single Use)**
```bash
TP_DOMAIN=company.tpondemand.com TP_API_KEY=your-key npx @aaronsb/targetprocess-mcp
```

**Method 2: Export (Session-wide)**
```bash
export TP_DOMAIN=company.tpondemand.com
export TP_API_KEY=your-api-key
export TP_USER_ROLE=developer
npx @aaronsb/targetprocess-mcp
```

**Method 3: Environment File**
```bash
# Create .env
cat > .env << EOF
TP_DOMAIN=company.tpondemand.com
TP_API_KEY=your-api-key
TP_USER_ROLE=developer
TP_USER_ID=12345
TP_USER_EMAIL=dev@company.com
EOF

# Load and run
source .env && npx @aaronsb/targetprocess-mcp
```

**Method 4: Cross-Platform Script**
```bash
#!/bin/bash
# run-mcp.sh

# Load environment
source .env 2>/dev/null || echo "No .env file found"

# Set defaults
TP_DOMAIN=${TP_DOMAIN:-""}
TP_API_KEY=${TP_API_KEY:-""}

# Validate required variables
if [ -z "$TP_DOMAIN" ]; then
    echo "Error: TP_DOMAIN is required"
    exit 1
fi

if [ -z "$TP_API_KEY" ] && [ -z "$TP_USERNAME" ]; then
    echo "Error: Either TP_API_KEY or TP_USERNAME/TP_PASSWORD is required"
    exit 1
fi

# Run with npx
npx @aaronsb/targetprocess-mcp "$@"
```

## Integration Examples

### Claude Desktop Integration

Configure NPX execution in Claude Desktop:

**`claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "npx",
      "args": [
        "-y",
        "@aaronsb/targetprocess-mcp"
      ],
      "env": {
        "TP_DOMAIN": "company.tpondemand.com",
        "TP_API_KEY": "your-api-key-here",
        "TP_USER_ROLE": "developer",
        "TP_USER_ID": "12345",
        "TP_USER_EMAIL": "dev@company.com"
      }
    }
  }
}
```

**Platform-specific locations:**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Claude Code Integration

Add NPX-based MCP server to Claude Code:

```bash
# Basic configuration
claude mcp add targetprocess npx \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  @aaronsb/targetprocess-mcp

# With role configuration
claude mcp add targetprocess npx \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=12345 \
  -e TP_USER_EMAIL=dev@company.com \
  @aaronsb/targetprocess-mcp

# User scope (available across all projects)
claude mcp add targetprocess npx -s user \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  @aaronsb/targetprocess-mcp
```

### Scripted Integration

Create reusable scripts for different scenarios:

**`scripts/dev-mcp.sh` (Developer Setup):**
```bash
#!/bin/bash
set -e

# Developer-specific configuration
export TP_DOMAIN="company.tpondemand.com"
export TP_API_KEY="${DEV_API_KEY:-$(cat ~/.tp-dev-key 2>/dev/null)}"
export TP_USER_ROLE="developer"
export TP_USER_ID="12345"
export TP_USER_EMAIL="dev@company.com"

# Validation
if [ -z "$TP_API_KEY" ]; then
    echo "Error: DEV_API_KEY not set and ~/.tp-dev-key not found"
    exit 1
fi

echo "🚀 Starting Targetprocess MCP (Developer Mode)..."
npx --yes @aaronsb/targetprocess-mcp "$@"
```

**`scripts/pm-mcp.sh` (Project Manager Setup):**
```bash
#!/bin/bash
set -e

# Project Manager configuration
export TP_DOMAIN="company.tpondemand.com"
export TP_API_KEY="${PM_API_KEY:-$(cat ~/.tp-pm-key 2>/dev/null)}"
export TP_USER_ROLE="project-manager"
export TP_USER_ID="67890"
export TP_USER_EMAIL="pm@company.com"

# Validation
if [ -z "$TP_API_KEY" ]; then
    echo "Error: PM_API_KEY not set and ~/.tp-pm-key not found"
    exit 1
fi

echo "🚀 Starting Targetprocess MCP (Project Manager Mode)..."
npx --yes @aaronsb/targetprocess-mcp "$@"
```

### Multi-Environment Setup

Manage different environments with NPX:

**`.env.development`:**
```bash
TP_DOMAIN=dev-company.tpondemand.com
TP_API_KEY=dev-api-key-here
TP_USER_ROLE=developer
TP_USER_ID=12345
TP_USER_EMAIL=dev@company.com
```

**`.env.staging`:**
```bash
TP_DOMAIN=staging-company.tpondemand.com
TP_API_KEY=staging-api-key-here
TP_USER_ROLE=project-manager
TP_USER_ID=67890
TP_USER_EMAIL=pm@company.com
```

**`.env.production`:**
```bash
TP_DOMAIN=company.tpondemand.com
TP_API_KEY=prod-api-key-here
TP_USER_ROLE=developer
TP_USER_ID=12345
TP_USER_EMAIL=dev@company.com
```

**Run with specific environment:**
```bash
# Development
source .env.development && npx @aaronsb/targetprocess-mcp

# Staging
source .env.staging && npx @aaronsb/targetprocess-mcp

# Production
source .env.production && npx @aaronsb/targetprocess-mcp
```

## Limitations and Considerations

### Network Dependencies

**NPX Requires Internet Access:**
- Must be able to reach npm registry (`registry.npmjs.org`)
- First run downloads the package (subsequent runs may use cache)
- Corporate firewalls may block npm registry access

**Solutions for Restricted Networks:**
```bash
# Configure npm registry proxy
npm config set registry http://internal-npm-proxy:4873

# Use internal npm registry
npm config set registry https://nexus.company.com/repository/npm-public/

# Verify connectivity
npm ping
```

### Caching Behavior

**NPX Caching:**
- NPX caches downloaded packages in `~/.npm/_npx/`
- Cache may become stale between updates
- Force fresh download with `--yes` flag

**Managing NPX Cache:**
```bash
# Force latest version
npx --yes @aaronsb/targetprocess-mcp

# Clear NPX cache
npx --clear-cache

# Show cache location
npm config get cache
```

### Version Control

**No Version Pinning:**
- NPX always uses latest published version
- No control over which version is downloaded
- May break if new version has breaking changes

**Solutions:**
```bash
# Use specific version (if published to npm)
npx @aaronsb/targetprocess-mcp@0.10.0

# Pin to major version (if semver tags available)
npx @aaronsb/targetprocess-mcp@^0.10

# Check current version
npx @aaronsb/targetprocess-mcp --version
```

### Performance Considerations

**Startup Time:**
- First run: Download time + startup time
- Subsequent runs: Cache check + startup time
- Network latency affects initial download

**Optimization:**
```bash
# Pre-warm cache
npx @aaronsb/targetprocess-mcp --help

# Use in CI/CD with caching
# (cache ~/.npm directory)
```

### Security Considerations

**Package Trust:**
- NPX downloads and executes code from npm registry
- Verify package publisher and signatures
- Use corporate npm registry for additional security

**Credential Security:**
```bash
# Avoid inline credentials in scripts
# ❌ Bad
npx @aaronsb/targetprocess-mcp TP_API_KEY=secret-key

# ✅ Good  
export TP_API_KEY="secret-key"
npx @aaronsb/targetprocess-mcp
```

### Platform Compatibility

**Windows Considerations:**
```powershell
# PowerShell environment variables
$env:TP_DOMAIN="company.tpondemand.com"
$env:TP_API_KEY="your-api-key"
npx @aaronsb/targetprocess-mcp

# Command Prompt
set TP_DOMAIN=company.tpondemand.com
set TP_API_KEY=your-api-key
npx @aaronsb/targetprocess-mcp
```

**macOS/Linux:**
```bash
# Standard Unix approach
export TP_DOMAIN=company.tpondemand.com
export TP_API_KEY=your-api-key
npx @aaronsb/targetprocess-mcp
```

## Troubleshooting

### Common Issues

#### NPX Not Found

**Symptoms:**
```bash
npx: command not found
```

**Solutions:**
1. **Install/Update Node.js:**
   ```bash
   # Check if Node.js is installed
   node --version
   
   # If not installed, download from nodejs.org
   # Or use package manager:
   # macOS: brew install node
   # Ubuntu: sudo apt install nodejs npm
   # Windows: choco install nodejs
   ```

2. **Verify NPX is included:**
   ```bash
   # NPX comes with npm 5.2+
   npm --version
   npx --version
   ```

3. **Reinstall npm if needed:**
   ```bash
   npm install -g npm@latest
   ```

#### Package Not Found

**Symptoms:**
```bash
npm ERR! 404 Not Found - GET https://registry.npmjs.org/@aaronsb%2ftargetprocess-mcp
```

**Solutions:**
1. **Check package name:**
   ```bash
   # Correct package name
   npx @aaronsb/targetprocess-mcp
   
   # Common typos to avoid
   npx @aaronsb/target-process-mcp  # ❌
   npx aaronsb/targetprocess-mcp    # ❌
   ```

2. **Check npm registry connectivity:**
   ```bash
   npm ping
   npm view @aaronsb/targetprocess-mcp
   ```

3. **Use alternative registry:**
   ```bash
   # If corporate registry is configured
   npm config get registry
   ```

#### Authentication Failures

**Symptoms:**
- "Invalid credentials" errors
- "Authentication failed" messages
- "Connection refused" errors

**Solutions:**

1. **Verify credentials:**
   ```bash
   # Test with curl
   curl -H "Authorization: Basic $(echo -n 'token:your-api-key' | base64)" \
        https://company.tpondemand.com/api/v1/Context
   ```

2. **Check domain format:**
   ```bash
   # ✅ Correct
   TP_DOMAIN=company.tpondemand.com
   
   # ❌ Incorrect  
   TP_DOMAIN=https://company.tpondemand.com
   TP_DOMAIN=company.tpondemand.com/api
   ```

3. **Debug environment variables:**
   ```bash
   # Show current environment
   env | grep TP_
   
   # Test variable setting
   echo $TP_DOMAIN
   echo $TP_API_KEY
   ```

#### Permission Errors

**Symptoms:**
- "Access denied" when using tools
- Limited functionality despite authentication success

**Solutions:**

1. **Check Targetprocess permissions:**
   - Log into web interface
   - Verify access to projects and entities
   - Check role assignments

2. **Test API scope:**
   ```bash
   # Test basic API access
   curl -H "Authorization: Basic $(echo -n 'token:your-api-key' | base64)" \
        "https://company.tpondemand.com/api/v1/UserStories?take=1"
   ```

#### Role Configuration Issues

**Symptoms:**
- Expected role-specific tools not available
- "Invalid role" errors

**Solutions:**

1. **Verify role values:**
   ```bash
   # Valid roles
   TP_USER_ROLE=developer          # ✅
   TP_USER_ROLE=project-manager    # ✅
   TP_USER_ROLE=tester            # ✅
   TP_USER_ROLE=product-owner     # ✅
   
   # Invalid values
   TP_USER_ROLE=dev               # ❌
   TP_USER_ROLE=pm                # ❌
   TP_USER_ROLE=qa                # ❌
   ```

2. **Ensure complete user context:**
   ```bash
   # All required for role-specific tools
   export TP_USER_ROLE=developer
   export TP_USER_ID=12345
   export TP_USER_EMAIL=dev@company.com
   ```

#### Network Issues

**Symptoms:**
- Slow startup times
- Connection timeouts
- Download failures

**Solutions:**

1. **Check network connectivity:**
   ```bash
   # Test npm registry
   ping registry.npmjs.org
   
   # Test Targetprocess
   ping company.tpondemand.com
   ```

2. **Configure proxy if needed:**
   ```bash
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

3. **Use corporate registry:**
   ```bash
   npm config set registry https://nexus.company.com/repository/npm-public/
   ```

### Debug Mode

Enable comprehensive logging for troubleshooting:

```bash
# Enable all debug output
DEBUG=* npx @aaronsb/targetprocess-mcp

# Enable specific debug categories
DEBUG=mcp:*,targetprocess:* npx @aaronsb/targetprocess-mcp

# NPX debug output
NPX_DEBUG=1 npx @aaronsb/targetprocess-mcp
```

### Verbose NPX Output

Get detailed information about NPX execution:

```bash
# Verbose NPX output
npx --loglevel verbose @aaronsb/targetprocess-mcp

# Show what NPX is doing
npx --verbose @aaronsb/targetprocess-mcp
```

## Best Practices

### Security

1. **Use environment files for credentials:**
   ```bash
   # Create .env with restricted permissions
   touch .env
   chmod 600 .env
   echo "TP_API_KEY=your-secret-key" > .env
   ```

2. **Avoid inline credentials:**
   ```bash
   # ❌ Avoid - credentials visible in process list
   TP_API_KEY=secret npx @aaronsb/targetprocess-mcp
   
   # ✅ Better - use environment files
   source .env && npx @aaronsb/targetprocess-mcp
   ```

3. **Regular credential rotation:**
   ```bash
   # Rotate API keys quarterly
   # Update .env files across environments
   # Test new credentials before deployment
   ```

### Performance

1. **Pre-warm NPX cache:**
   ```bash
   # Download package during setup
   npx @aaronsb/targetprocess-mcp --help
   ```

2. **Use --yes flag for automation:**
   ```bash
   # Skip interactive prompts
   npx --yes @aaronsb/targetprocess-mcp
   ```

3. **Consider local installation for frequent use:**
   ```bash
   # For development environments
   npm install -g @aaronsb/targetprocess-mcp
   targetprocess-mcp
   ```

### Development Workflow

1. **Use version-specific scripts:**
   ```bash
   #!/bin/bash
   # development.sh
   source .env.development
   npx --yes @aaronsb/targetprocess-mcp "$@"
   ```

2. **Environment validation:**
   ```bash
   #!/bin/bash
   # validate-env.sh
   required_vars=("TP_DOMAIN" "TP_API_KEY")
   
   for var in "${required_vars[@]}"; do
       if [ -z "${!var}" ]; then
           echo "Error: $var is not set"
           exit 1
       fi
   done
   
   echo "✓ Environment validation passed"
   ```

3. **Logging and monitoring:**
   ```bash
   # Log NPX executions
   {
       echo "$(date): Starting MCP server"
       npx @aaronsb/targetprocess-mcp
   } >> /var/log/mcp-execution.log 2>&1
   ```

### Integration Patterns

1. **CI/CD Integration:**
   ```yaml
   # .github/workflows/test-mcp.yml
   name: Test MCP Integration
   on: [push, pull_request]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - name: Test MCP Server
           env:
             TP_DOMAIN: ${{ secrets.TP_DOMAIN }}
             TP_API_KEY: ${{ secrets.TP_API_KEY }}
           run: |
             npx --yes @aaronsb/targetprocess-mcp --version
   ```

2. **Docker alternative:**
   ```dockerfile
   # Dockerfile.npx
   FROM node:18-alpine
   
   RUN npm install -g @aaronsb/targetprocess-mcp
   
   ENV TP_DOMAIN=""
   ENV TP_API_KEY=""
   
   CMD ["targetprocess-mcp"]
   ```

3. **Monitoring script:**
   ```bash
   #!/bin/bash
   # monitor-mcp.sh
   
   while true; do
       if ! npx @aaronsb/targetprocess-mcp --health-check 2>/dev/null; then
           echo "$(date): MCP health check failed"
           # Send alert
       fi
       sleep 300  # Check every 5 minutes
   done
   ```

## Comparison with Other Methods

| Feature | NPX | Docker | Local Build |
|---------|-----|--------|-------------|
| **Setup Time** | ⭐⭐⭐ Instant | ⭐⭐ Medium | ⭐ Slow |
| **Dependencies** | ⭐⭐⭐ Node.js only | ⭐⭐ Docker required | ⭐ Multiple tools |
| **Always Latest** | ✅ Automatic | 🔄 Manual pull | 🔄 Manual update |
| **Network Required** | ✅ Initial download | ✅ Image pull | ❌ After clone |
| **Resource Usage** | ⭐⭐⭐ Minimal | ⭐⭐ Medium | ⭐⭐⭐ Minimal |
| **Consistency** | ⚠️ Depends on npm | ✅ Guaranteed | ⚠️ Variable |
| **Debugging** | ⭐⭐⭐ Excellent | ⭐⭐ Good | ⭐⭐⭐ Excellent |
| **Offline Use** | ⚠️ After cache | ✅ Yes | ✅ Yes |
| **Version Control** | ❌ Always latest | ✅ Tag-based | ✅ Git-based |

**Recommendation**: NPX is ideal for quick starts, testing, and environments where you want the latest version automatically. Use Docker for production stability or local builds for development.

## Next Steps

After successfully configuring NPX deployment:

1. **Test Basic Functionality**: Verify connection and core tools work
2. **Explore Role Features**: If configured, test specialized tools for your role
3. **Set Up Automation**: Create scripts for repeated use
4. **Review Use Cases**: Check [use cases documentation](../use-cases/README.md) for workflow examples
5. **Consider Production Setup**: Evaluate Docker or local build for production use

## Support and Resources

- **Package Information**: [npm registry page](https://www.npmjs.com/package/@aaronsb/targetprocess-mcp)
- **Source Code**: [GitHub repository](https://github.com/aaronsb/apptio-target-process-mcp)
- **Issues**: Report bugs at [GitHub Issues](https://github.com/aaronsb/apptio-target-process-mcp/issues)
- **Documentation**: Browse `/docs` directory for comprehensive guides

---

**Note**: This guide covers NPX-based deployment of the Targetprocess MCP Server. For other deployment methods, see the [Docker configuration guide](docker.md) or [local development guide](local-development.md).