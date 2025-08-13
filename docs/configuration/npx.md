# NPX Configuration Guide

This guide explains how to use the Targetprocess MCP Server with NPX, allowing you to run it without local installation.

## What is NPX and Why Use It?

NPX (Node Package Execute) is a command-line utility that ships with npm (version 5.2.0+). It allows you to execute packages directly from the npm registry without installing them globally or locally.

### Advantages of NPX Approach
- **No Local Installation**: Run the MCP server without cloning or building the repository
- **Always Latest Version**: NPX fetches the latest published version automatically
- **Easy Updates**: No need to manually update - just run again to get the latest version
- **Consistent Environment**: Same version runs across different machines
- **Quick Testing**: Perfect for trying out the server before committing to a local setup
- **CI/CD Friendly**: Easily integrate into automated workflows

### Limitations of NPX Approach
- **Network Dependency**: Requires internet connection for first run or updates
- **No Local Development**: Cannot modify source code or contribute changes
- **Startup Latency**: Slight delay on first run while package downloads
- **Limited Customization**: Cannot modify configuration beyond environment variables
- **Version Control**: Less control over which specific version runs

## Basic Usage with Username/Password

The simplest way to use the Targetprocess MCP server with basic authentication:

```bash
npx @aaronsb/targetprocess-mcp
```

Set your credentials via environment variables:

```bash
export TP_DOMAIN="your-company.tpondemand.com"
export TP_USERNAME="your-username" 
export TP_PASSWORD="your-password"
npx @aaronsb/targetprocess-mcp
```

Or inline:

```bash
TP_DOMAIN="your-company.tpondemand.com" \
TP_USERNAME="your-username" \
TP_PASSWORD="your-password" \
npx @aaronsb/targetprocess-mcp
```

## Basic Usage with API Key

API key authentication is the recommended approach for production use:

```bash
export TP_DOMAIN="your-company.tpondemand.com"
export TP_API_KEY="your-api-key"
npx @aaronsb/targetprocess-mcp
```

Or inline:

```bash
TP_DOMAIN="your-company.tpondemand.com" \
TP_API_KEY="your-api-key" \
npx @aaronsb/targetprocess-mcp
```

### Obtaining an API Key

1. Log into your Targetprocess instance
2. Go to **Settings** → **Access Tokens**
3. Create a new token with appropriate permissions
4. Use the token as `TP_API_KEY`

## Role-Specific Configuration

### Understanding Tool Types

The Targetprocess MCP server provides two categories of tools:

1. **Core Tools**: Available to all users regardless of role
   - `search_entities` - Search for any type of Targetprocess entity
   - `get_entity` - Get detailed information about a specific entity
   - `create_entity` - Create new entities
   - `update_entity` - Update existing entities  
   - `inspect_object` - Explore Targetprocess metadata
   - `comment` - Unified comment operations
   - `show_more` / `show_all` - Pagination tools

2. **Role-Specific Semantic Operations**: Additional specialized tools based on your role
   - **Developer**: `show_my_tasks`, `complete_task`, `show_my_bugs`, `log_time`, etc.
   - **Project Manager**: Sprint planning tools, team management, reporting tools
   - **Tester**: Test execution tools, defect tracking, quality metrics
   - **Product Owner**: Backlog management, story prioritization, roadmap tools

All tools provide **semantic hints** and intelligent guidance, but configuring a role adds specialized workflow tools tailored to your job function.

### Developer Role Configuration

Perfect for software developers working on tasks and fixing bugs:

```bash
export TP_DOMAIN="your-company.tpondemand.com"
export TP_API_KEY="your-api-key"
export TP_USER_ROLE="developer"
export TP_USER_ID="12345"  # Your user ID in Targetprocess
export TP_USER_EMAIL="you@company.com"
npx @aaronsb/targetprocess-mcp
```

**Additional Tools Added:**
- `show_my_tasks` - View your assigned tasks with priority insights
- `start_working_on` - Begin work on a task with state transitions
- `complete_task` - Mark tasks complete with time logging  
- `show_my_bugs` - Analyze your assigned bugs with severity insights
- `log_time` - Record time spent with intelligent discovery
- `add_comment` - Add contextual comments with reply support
- `show_comments` - View comments with hierarchical organization
- `delete_comment` - Delete comments with ownership validation
- `analyze_attachment` - AI-powered analysis of TargetProcess attachments

### Project Manager Role Configuration

Designed for project managers overseeing teams and sprints:

```bash
export TP_DOMAIN="your-company.tpondemand.com" 
export TP_API_KEY="your-api-key"
export TP_USER_ROLE="project-manager"
export TP_USER_ID="12345"
export TP_USER_EMAIL="pm@company.com"
npx @aaronsb/targetprocess-mcp
```

**Additional Tools Added:**
- Sprint planning and management tools
- Team workload analysis tools  
- Progress reporting and metrics
- Resource allocation tools

### Tester Role Configuration

Tailored for QA engineers and testers:

```bash
export TP_DOMAIN="your-company.tpondemand.com"
export TP_API_KEY="your-api-key" 
export TP_USER_ROLE="tester"
export TP_USER_ID="12345"
export TP_USER_EMAIL="tester@company.com"
npx @aaronsb/targetprocess-mcp
```

**Additional Tools Added:**
- Test execution and tracking tools
- Defect lifecycle management
- Quality metrics and reporting
- Test planning tools

### Product Owner Role Configuration

For product owners managing backlogs and roadmaps:

```bash
export TP_DOMAIN="your-company.tpondemand.com"
export TP_API_KEY="your-api-key"
export TP_USER_ROLE="product-owner" 
export TP_USER_ID="12345"
export TP_USER_EMAIL="po@company.com"
npx @aaronsb/targetprocess-mcp
```

**Additional Tools Added:**
- Backlog prioritization tools
- Story management and grooming
- Roadmap planning tools
- Stakeholder communication tools

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TP_DOMAIN` | Your Targetprocess domain | `company.tpondemand.com` |

### Authentication (Choose One)

| Variable | Description | Example |
|----------|-------------|---------|
| `TP_API_KEY` | API token (recommended) | `abc123def456...` |
| `TP_USERNAME` + `TP_PASSWORD` | Basic auth credentials | `john.doe` + `secretpass` |

### Role Configuration (Optional)

| Variable | Description | Example | Values |
|----------|-------------|---------|---------|
| `TP_USER_ROLE` | Your role for specialized tools | `developer` | `developer`, `project-manager`, `tester`, `product-owner` |
| `TP_USER_ID` | Your Targetprocess user ID | `12345` | Numeric ID |
| `TP_USER_EMAIL` | Your email for assignments | `you@company.com` | Valid email |

### Advanced Configuration (Optional)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TP_LOG_LEVEL` | Logging verbosity | `info` | `debug`, `info`, `warn`, `error` |
| `TP_TIMEOUT` | API request timeout (ms) | `30000` | `60000` |
| `TP_RETRY_COUNT` | Max retry attempts | `3` | `5` |

## Advanced Examples

### Environment File Approach

Create a `.env` file for reusable configuration:

```bash
# .env file
TP_DOMAIN=mycompany.tpondemand.com
TP_API_KEY=abc123def456ghi789
TP_USER_ROLE=developer
TP_USER_ID=12345
TP_USER_EMAIL=john.doe@company.com
TP_LOG_LEVEL=debug
```

Then run:

```bash
set -a && source .env && set +a
npx @aaronsb/targetprocess-mcp
```

### Full Developer Setup

Complete configuration for a developer with all options:

```bash
TP_DOMAIN="mycompany.tpondemand.com" \
TP_API_KEY="your-secret-api-key" \
TP_USER_ROLE="developer" \
TP_USER_ID="12345" \
TP_USER_EMAIL="john.doe@company.com" \
TP_LOG_LEVEL="debug" \
TP_TIMEOUT="60000" \
TP_RETRY_COUNT="5" \
npx @aaronsb/targetprocess-mcp
```

### Integration with MCP Clients

#### Claude Code Integration

```bash
claude mcp add targetprocess npx @aaronsb/targetprocess-mcp \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=12345 \
  -e TP_USER_EMAIL=you@company.com
```

#### Claude Desktop Integration

Add to your Claude Desktop config file (`config.json`):

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "npx",
      "args": ["@aaronsb/targetprocess-mcp"],
      "env": {
        "TP_DOMAIN": "company.tpondemand.com",
        "TP_API_KEY": "your-api-key",
        "TP_USER_ROLE": "developer",
        "TP_USER_ID": "12345",
        "TP_USER_EMAIL": "you@company.com"
      }
    }
  }
}
```

## Troubleshooting Common NPX Issues

### Package Not Found

**Error**: `npm ERR! 404 Not Found - GET https://registry.npmjs.org/@aaronsb/targetprocess-mcp`

**Solutions**:
1. Check the exact package name: `@aaronsb/targetprocess-mcp`
2. Verify you have internet connection
3. Try clearing NPX cache: `npx --cache-clean`
4. Check npm registry: `npm config get registry`

### Permission Errors

**Error**: `EACCES: permission denied`

**Solutions**:
1. Don't use `sudo` with NPX - it should work without elevated privileges
2. Check npm permissions: `npm config get prefix`
3. Fix npm permissions: `npm config set prefix ~/.npm-global`
4. Add to PATH: `export PATH=~/.npm-global/bin:$PATH`

### Network/Proxy Issues

**Error**: Network timeout or connection refused

**Solutions**:
1. Check corporate proxy settings:
   ```bash
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```
2. Use registry mirror if needed:
   ```bash
   npm config set registry https://registry.npmmirror.com/
   ```
3. Bypass SSL if necessary (not recommended for production):
   ```bash
   npm config set strict-ssl false
   ```

### Version Issues

**Error**: Using old version or unexpected behavior

**Solutions**:
1. Clear NPX cache: `npx --cache-clean`
2. Force latest version: `npx @aaronsb/targetprocess-mcp@latest`
3. Check what's cached: `npm ls -g --depth=0`
4. Clear npm cache: `npm cache clean --force`

### Authentication Failures

**Error**: `401 Unauthorized` or connection refused

**Solutions**:
1. Verify domain format (don't include `https://`):
   - ✅ Correct: `company.tpondemand.com`
   - ❌ Incorrect: `https://company.tpondemand.com`
2. Test credentials in browser first
3. For API key: Check token has proper permissions
4. For basic auth: Ensure username/password are correct
5. Check if account is locked or credentials expired

### Memory/Performance Issues

**Error**: Out of memory or slow performance

**Solutions**:
1. Increase Node.js memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npx @aaronsb/targetprocess-mcp
   ```
2. Use production logging level:
   ```bash
   TP_LOG_LEVEL="error" npx @aaronsb/targetprocess-mcp
   ```
3. Reduce timeout if needed:
   ```bash
   TP_TIMEOUT="15000" npx @aaronsb/targetprocess-mcp
   ```

### Debugging NPX Execution

Enable verbose logging to troubleshoot issues:

```bash
NPX_DEBUG=1 TP_LOG_LEVEL="debug" npx @aaronsb/targetprocess-mcp
```

Check what NPX is actually running:

```bash
npx --package @aaronsb/targetprocess-mcp which targetprocess-mcp
```

## Security Considerations

### Credential Management
- **Never hardcode credentials** in scripts or configuration files committed to version control
- Use environment variables or secure credential stores
- Prefer API keys over username/password combinations
- Rotate API keys regularly

### Network Security
- Ensure HTTPS is used for all Targetprocess communications (automatic)
- Be cautious with proxy configurations that might log credentials
- Use secure networks when possible, avoid public WiFi for production use

### Access Control
- Use minimal required permissions for API keys
- Configure `TP_USER_ID` correctly to ensure proper access controls
- Regularly audit user permissions in Targetprocess

## Best Practices

### Production Usage
1. **Use API Keys**: More secure and easier to rotate than passwords
2. **Set Appropriate Log Level**: Use `info` or `warn` in production, `debug` only for troubleshooting
3. **Configure Timeouts**: Adjust `TP_TIMEOUT` based on your network conditions
4. **Role Configuration**: Set `TP_USER_ROLE` for optimal tool selection

### Development Usage
1. **Use Debug Logging**: Set `TP_LOG_LEVEL=debug` when developing or troubleshooting
2. **Environment Files**: Use `.env` files for consistent local development
3. **Version Pinning**: Use specific versions (`@aaronsb/targetprocess-mcp@1.0.0`) for reproducible builds

### Performance Optimization
1. **Minimal Environment**: Only set environment variables you actually use
2. **Appropriate Timeouts**: Don't set unnecessarily high timeout values
3. **Cache Awareness**: Understand that NPX may cache packages between runs

## Migration from Local Installation

If you're currently using a local installation and want to switch to NPX:

1. **Remove local MCP server**:
   ```bash
   claude mcp remove targetprocess
   ```

2. **Add NPX version**:
   ```bash
   claude mcp add targetprocess npx @aaronsb/targetprocess-mcp \
     -e TP_DOMAIN=your-domain \
     -e TP_API_KEY=your-key \
     -e TP_USER_ROLE=your-role \
     -e TP_USER_ID=your-id
   ```

3. **Test the migration**:
   ```bash
   claude mcp list
   # Should show targetprocess using npx command
   ```

## Getting Help

If you encounter issues with NPX usage:

1. **Check Package Status**: Visit [npmjs.com](https://www.npmjs.com/package/@aaronsb/targetprocess-mcp)
2. **Review Logs**: Enable debug logging to see detailed execution info
3. **GitHub Issues**: Report issues at the [project repository](https://github.com/aaronsb/apptio-target-process-mcp/issues)
4. **Documentation**: Check the [integration guide](../integration/README.md) for additional troubleshooting

## Related Documentation

- [Claude Code Integration](../integration/claude-code.md) - Using with Claude Code specifically
- [Claude Desktop Integration](../integration/claude-desktop.md) - Using with Claude Desktop
- [Docker Configuration](docker.md) - Alternative containerized approach
- [Tool Reference](../tools/README.md) - Complete tool documentation
- [Semantic Operations](../semantic-operations/README.md) - Role-specific operations guide