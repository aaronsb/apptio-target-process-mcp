# Claude Code Configuration Guide

This comprehensive guide explains how to integrate the Targetprocess MCP Server with Claude Code using the native MCP support. Claude Code provides the most streamlined integration experience with automatic tool discovery and intelligent workflow hints.

## Prerequisites

- Claude Code installed and configured
- Node.js 18+ installed on your system
- Targetprocess credentials (username/password or API key)
- Access to your Targetprocess domain

## Quick Setup (Recommended)

The fastest way to get started is using our development setup script:

```bash
# Clone and navigate to the repository
git clone <repository-url>
cd apptio-target-process-mcp

# Run the quick setup script
./scripts/dev-setup.sh
```

This script will:
1. Install dependencies and build the project
2. Create a `.env` file if missing (with prompts for your credentials)
3. Add the MCP server to Claude Code with local scope
4. Verify the installation

After setup, **restart Claude Code** to load the new MCP server.

## Manual Setup Options

### Option 1: Local Build (Development)

This method builds and runs the server from source, ideal for development or customization.

#### Step 1: Build the Project

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Verify build
ls build/index.js
```

#### Step 2: Add to Claude Code

**Basic Configuration (Username/Password):**
```bash
claude mcp add targetprocess node /absolute/path/to/apptio-target-process-mcp/build/index.js \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password
```

**API Key Configuration (Recommended):**
```bash
claude mcp add targetprocess node /absolute/path/to/apptio-target-process-mcp/build/index.js \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_API_KEY=your-api-key
```

**With Role-Specific Tools:**
```bash
claude mcp add targetprocess node /absolute/path/to/apptio-target-process-mcp/build/index.js \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=your-user-id \
  -e TP_USER_EMAIL=your-email
```

### Option 2: Docker Approach

Use the pre-built Docker image for a containerized setup.

#### Step 1: Build Docker Image

```bash
# Build the Docker image
./scripts/docker-build.sh

# Or build with verbose output
./scripts/docker-build.sh --verbose
```

#### Step 2: Add Docker-based MCP to Claude Code

**Username/Password:**
```bash
claude mcp add targetprocess docker \
  --image apptio-target-process-mcp:latest \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password
```

**API Key:**
```bash
claude mcp add targetprocess docker \
  --image apptio-target-process-mcp:latest \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_API_KEY=your-api-key
```

**With Role Configuration:**
```bash
claude mcp add targetprocess docker \
  --image apptio-target-process-mcp:latest \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=your-user-id \
  -e TP_USER_EMAIL=your-email
```

## Role-Specific Tools Configuration

**Important**: ALL tools provide semantic hints and intelligent workflow guidance. However, configuring a role adds ADDITIONAL specialized tools tailored to that role's workflow.

### Available Roles

Configure `TP_USER_ROLE` to access role-specific tools:

#### Developer Role (`TP_USER_ROLE=developer`)
Additional tools for personal task management:
- `show_my_tasks` - View your assigned tasks with priority filtering
- `start_working_on` - Begin work on a task (updates state, logs time)
- `complete_task` - Mark task complete with proper workflow transitions
- `show_my_bugs` - View bugs assigned to you with severity analysis
- `log_time` - Record time spent with intelligent entity discovery
- `add_comment` - Add contextual comments with workflow suggestions
- `show_comments` - View comments with hierarchical organization
- `delete_comment` - Delete comments with ownership validation
- `analyze_attachment` - AI vision analysis of TargetProcess attachments

#### Project Manager Role (`TP_USER_ROLE=project-manager`)
Additional tools for project oversight:
- `show_project_status` - Project health dashboard with metrics
- `show_team_workload` - Team capacity and assignment analysis
- `create_sprint_plan` - Sprint planning with velocity predictions
- `show_sprint_progress` - Current sprint burndown and progress

#### Tester Role (`TP_USER_ROLE=tester`)
Additional tools for quality assurance:
- `show_my_test_tasks` - Test tasks with execution status
- `create_bug_report` - Structured bug reporting with templates
- `show_test_coverage` - Coverage analysis across projects
- `validate_user_stories` - Story readiness for testing

#### Product Owner Role (`TP_USER_ROLE=product-owner`)
Additional tools for product management:
- `show_product_backlog` - Prioritized backlog with insights
- `analyze_story_readiness` - Story completeness analysis
- `show_feature_progress` - Feature delivery tracking
- `stakeholder_summary` - Executive summary generation

### Role Configuration Examples

```bash
# Developer setup
claude mcp add targetprocess node /path/to/build/index.js \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=12345 \
  -e TP_USER_EMAIL=dev@company.com

# Project Manager setup
claude mcp add targetprocess node /path/to/build/index.js \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=project-manager \
  -e TP_USER_ID=67890 \
  -e TP_USER_EMAIL=pm@company.com
```

## Claude MCP Command Reference

### Adding the Server

```bash
# Local scope (current project only)
claude mcp add [name] [command] [options]

# User scope (all projects)  
claude mcp add [name] [command] -s user [options]

# System scope (all users)
claude mcp add [name] [command] -s system [options]
```

### Managing the Server

```bash
# List all MCP servers
claude mcp list

# View specific server details
claude mcp show targetprocess

# Update existing server (remove and re-add)
claude mcp remove targetprocess
claude mcp add targetprocess [new-configuration]

# Remove server
claude mcp remove targetprocess
```

### Scope Considerations

- **Local scope**: Available only in the current project directory
- **User scope**: Available across all your projects
- **System scope**: Available for all users (requires admin privileges)

Most users should use **user scope** for convenience across projects.

## Configuration Verification

### Step 1: Verify Installation

```bash
# Check if server is registered
claude mcp list | grep targetprocess

# View server configuration
claude mcp show targetprocess
```

### Step 2: Test Connection

Restart Claude Code, then test a simple query:

```
Can you search for 5 user stories using the Targetprocess tools?
```

Expected behavior:
- Claude should automatically use the `search_entities` tool
- Results should include semantic hints and workflow suggestions
- If role is configured, additional context should appear

### Step 3: Verify Role Tools (if configured)

```
Show me my assigned tasks
```

Expected behavior:
- If `TP_USER_ROLE=developer`: Should use `show_my_tasks` tool
- Results should include role-specific context and next action suggestions

## Updating Configuration

### Update Environment Variables

```bash
# Remove existing configuration
claude mcp remove targetprocess

# Add with new configuration
claude mcp add targetprocess node /path/to/build/index.js \
  -e TP_DOMAIN=new-domain.tpondemand.com \
  -e TP_API_KEY=new-api-key \
  -e TP_USER_ROLE=project-manager
```

### Update to Latest Version

```bash
# Navigate to project directory
cd /path/to/apptio-target-process-mcp

# Pull latest changes
git pull

# Rebuild
npm run build

# Configuration automatically uses updated version
# No need to re-add to Claude Code
```

### Switch Between Docker and Local Build

```bash
# Remove current configuration
claude mcp remove targetprocess

# Add new configuration type
# (either docker or node command as shown above)
```

## Removing the Configuration

```bash
# Remove from Claude Code
claude mcp remove targetprocess

# Optional: Clean up local build
cd /path/to/apptio-target-process-mcp
npm run clean
```

## Troubleshooting

### Server Not Appearing in Tools

**Symptoms**: Targetprocess tools not available in Claude Code

**Solutions**:
1. **Restart Claude Code** after adding the MCP server
2. Verify installation: `claude mcp list | grep targetprocess`
3. Check build completion: `ls build/index.js`
4. Try re-adding: `claude mcp remove targetprocess && claude mcp add ...`

### Authentication Errors

**Symptoms**: "Invalid credentials" or "Authentication failed" errors

**Solutions**:
1. **Verify credentials** in your Targetprocess web interface
2. **Check domain format**: Use `company.tpondemand.com` (not full URL)
3. **Try API key**: Often more reliable than username/password
4. **Test manually**: `curl -u username:password https://company.tpondemand.com/api/v1/Context`

### Tool Execution Errors

**Symptoms**: Tools appear but fail when executed

**Solutions**:
1. **Check Claude Code logs**: `claude logs`
2. **Test server manually**: `node build/index.js` (should show startup message)
3. **Verify dependencies**: `npm install`
4. **Check permissions**: Ensure files are readable

### Role Tools Not Appearing

**Symptoms**: Basic tools work, but role-specific tools are missing

**Solutions**:
1. **Verify role configuration**: `claude mcp show targetprocess`
2. **Check valid roles**: `developer`, `project-manager`, `tester`, `product-owner`
3. **Restart Claude Code** after role changes
4. **Set user context**: Include `TP_USER_ID` and `TP_USER_EMAIL`

### Performance Issues

**Symptoms**: Slow responses or timeouts

**Solutions**:
1. **Check network connectivity** to Targetprocess
2. **Reduce query sizes**: Use `take` parameter to limit results
3. **Check Targetprocess server status**
4. **Use Docker approach** for better resource isolation

### Development Mode Issues

**Symptoms**: Changes not reflected or build errors

**Solutions**:
1. **Use watch mode**: `npm run watch` for auto-rebuilding
2. **Clear build cache**: `npm run clean && npm run build`
3. **Check TypeScript errors**: `npm run type-check`
4. **Restart Claude Code** after significant changes

## Best Practices

### Security
- **Use API keys** instead of passwords when possible
- **Use user scope** rather than system scope for personal use
- **Rotate credentials** regularly
- **Don't commit credentials** to version control

### Performance
- **Start with small queries** to test connectivity
- **Use filters** to reduce result sizes
- **Consider local build** for development work
- **Use Docker** for production environments

### Workflow Integration
1. **Configure your role** for optimal tool selection
2. **Start with basic queries** before using advanced features
3. **Leverage semantic hints** for workflow guidance
4. **Combine tools** for complex workflows

### Development
- **Use development setup script** for quick starts
- **Keep local build updated** with `git pull && npm run build`
- **Test configuration changes** in local scope first
- **Monitor Claude Code logs** for debugging

## Comparison with Other Integration Methods

| Feature | Claude Code MCP | Claude Desktop | Docker Direct |
|---------|----------------|---------------|---------------|
| **Setup Complexity** | ⭐⭐ Low | ⭐⭐⭐ Medium | ⭐⭐ Low |
| **Auto-Discovery** | ✅ Built-in | ❌ Manual config | ❌ Manual |
| **Semantic Hints** | ✅ Full support | ✅ Full support | ❌ Limited |
| **Role Tools** | ✅ All roles | ✅ All roles | ⭐ Depends |
| **Updates** | 🔄 Automatic | 🔄 Manual restart | 🔄 Rebuild image |
| **Development** | ⭐⭐⭐ Excellent | ⭐⭐ Good | ⭐ Basic |
| **Debugging** | ⭐⭐⭐ Excellent logs | ⭐⭐ Good | ⭐ Limited |

**Recommendation**: Claude Code MCP provides the best developer experience with automatic tool discovery, comprehensive semantic hints, and excellent debugging capabilities.

## Next Steps

After successful configuration:

1. **Explore Basic Operations**: Try searching for entities, viewing details
2. **Test Role-Specific Tools**: If configured, test your role's specialized tools
3. **Read Workflow Guides**: Check [use-cases documentation](../use-cases/README.md)
4. **Set Up Development Environment**: For customization, see [development guide](../development/README.md)
5. **Join Community**: Report issues and get help via GitHub issues

## Support

- **Documentation**: Browse `/docs` directory for comprehensive guides
- **Issues**: Report bugs at [GitHub Issues](https://github.com/your-repo/issues)
- **Examples**: See `/docs/use-cases/` for workflow examples
- **API Reference**: Check `/docs/tools/` for detailed tool documentation

---

**Note**: This guide assumes the latest version of the MCP server. For older versions, some features may not be available. Always use the latest release for the best experience.