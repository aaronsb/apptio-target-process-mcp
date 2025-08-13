# Claude Desktop Configuration Guide

This comprehensive guide walks you through configuring the Targetprocess MCP Server with Claude Desktop, including authentication options, role-specific configurations, and troubleshooting.

## Table of Contents

1. [Finding the Configuration File](#finding-the-configuration-file)
2. [Basic Configuration with Username/Password](#basic-configuration-with-usernamepassword)
3. [Basic Configuration with API Key](#basic-configuration-with-api-key)
4. [Role-Specific Configuration](#role-specific-configuration)
5. [Complete Configuration Examples](#complete-configuration-examples)
6. [Multiple Server Configurations](#multiple-server-configurations)
7. [Troubleshooting Claude Desktop Issues](#troubleshooting-claude-desktop-issues)
8. [Verifying the Integration](#verifying-the-integration)

## Finding the Configuration File

Claude Desktop stores its configuration in platform-specific locations:

### Windows
```
%APPDATA%\Claude\claude_desktop_config.json
```
**Full path example:** `C:\Users\YourName\AppData\Roaming\Claude\claude_desktop_config.json`

### macOS
```
~/Library/Application Support/Claude/claude_desktop_config.json
```
**Full path example:** `/Users/YourName/Library/Application Support/Claude/claude_desktop_config.json`

### Linux
```
~/.config/Claude/claude_desktop_config.json
```
**Full path example:** `/home/YourName/.config/Claude/claude_desktop_config.json`

### Creating the Configuration File

If the file doesn't exist, create it with basic JSON structure:

```json
{
  "mcpServers": {}
}
```

## Basic Configuration with Username/Password

### Docker Configuration

This approach uses the Docker image and basic authentication:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TP_DOMAIN",
        "-e",
        "TP_USERNAME",
        "-e",
        "TP_PASSWORD",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_USERNAME": "your-username",
        "TP_PASSWORD": "your-password"
      }
    }
  }
}
```

### NPX Configuration

This approach uses NPX to run directly from the npm registry:

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
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_USERNAME": "your-username",
        "TP_PASSWORD": "your-password"
      }
    }
  }
}
```

## Basic Configuration with API Key

### Docker with API Key (Recommended)

API key authentication is more secure and recommended for production use:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TP_DOMAIN",
        "-e",
        "TP_API_KEY",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### NPX with API Key

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
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Creating an API Key

To create an API key in Targetprocess:

1. Log into your Targetprocess instance
2. Go to **Settings** → **Access Tokens**
3. Click **Create Token**
4. Give it a descriptive name (e.g., "Claude Desktop Integration")
5. Select appropriate permissions
6. Copy the generated token and use it as `TP_API_KEY`

## Role-Specific Configuration

**Important:** ALL tools provide semantic hints and intelligent responses. Configuring a role adds ADDITIONAL specialized tools that are specific to that workflow.

### Understanding Semantic Tools

- **Base tools** (available to all configurations): `search_entities`, `get_entity`, `create_entity`, `update_entity`, `inspect_object`, `comment`
- **Role-specific tools** (added when `TP_USER_ROLE` is configured): Specialized operations like `show_my_tasks`, `complete_task`, `start_working_on`, etc.
- **ALL tools** provide contextual hints, workflow suggestions, and intelligent error handling

### Developer Role Configuration

Adds specialized tools for task management, bug tracking, and time logging:

#### Additional Tools Added:
- `show_my_tasks` - View your assigned tasks with priority filtering
- `start_working_on` - Begin work on a task with state transitions
- `complete_task` - Mark tasks complete with time logging
- `show_my_bugs` - View and analyze assigned bugs
- `log_time` - Record time spent on work items
- `analyze_attachment` - AI-powered analysis of attachments

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TP_DOMAIN",
        "-e",
        "TP_API_KEY",
        "-e",
        "TP_USER_ROLE",
        "-e",
        "TP_USER_ID",
        "-e",
        "TP_USER_EMAIL",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_API_KEY": "your-api-key-here",
        "TP_USER_ROLE": "developer",
        "TP_USER_ID": "12345",
        "TP_USER_EMAIL": "developer@company.com"
      }
    }
  }
}
```

### Project Manager Role Configuration

Adds specialized tools for project oversight, planning, and team management:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TP_DOMAIN",
        "-e",
        "TP_API_KEY",
        "-e",
        "TP_USER_ROLE",
        "-e",
        "TP_USER_ID",
        "-e",
        "TP_USER_EMAIL",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_API_KEY": "your-api-key-here",
        "TP_USER_ROLE": "project-manager",
        "TP_USER_ID": "12345",
        "TP_USER_EMAIL": "pm@company.com"
      }
    }
  }
}
```

### Tester Role Configuration

Adds specialized tools for test management, bug reporting, and quality assurance:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TP_DOMAIN",
        "-e",
        "TP_API_KEY",
        "-e",
        "TP_USER_ROLE",
        "-e",
        "TP_USER_ID",
        "-e",
        "TP_USER_EMAIL",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_API_KEY": "your-api-key-here",
        "TP_USER_ROLE": "tester",
        "TP_USER_ID": "12345",
        "TP_USER_EMAIL": "tester@company.com"
      }
    }
  }
}
```

### Product Owner Role Configuration

Adds specialized tools for backlog management, story planning, and stakeholder communication:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TP_DOMAIN",
        "-e",
        "TP_API_KEY",
        "-e",
        "TP_USER_ROLE",
        "-e",
        "TP_USER_ID",
        "-e",
        "TP_USER_EMAIL",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_API_KEY": "your-api-key-here",
        "TP_USER_ROLE": "product-owner",
        "TP_USER_ID": "12345",
        "TP_USER_EMAIL": "po@company.com"
      }
    }
  }
}
```

## Complete Configuration Examples

### Production Configuration with All Options

This example shows a complete configuration with all available options:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TP_DOMAIN",
        "-e",
        "TP_API_KEY",
        "-e",
        "TP_USER_ROLE",
        "-e",
        "TP_USER_ID",
        "-e",
        "TP_USER_EMAIL",
        "-e",
        "MCP_STRICT_MODE",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_API_KEY": "your-api-key-here",
        "TP_USER_ROLE": "developer",
        "TP_USER_ID": "12345",
        "TP_USER_EMAIL": "developer@company.com",
        "MCP_STRICT_MODE": "true"
      },
      "autoApprove": [
        "search_entities",
        "get_entity",
        "inspect_object"
      ],
      "disabled": false
    }
  }
}
```

### Local Development Configuration

For local development when you've built the project locally:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "node",
      "args": [
        "/path/to/apptio-target-process-mcp/build/index.js"
      ],
      "env": {
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_API_KEY": "your-api-key-here",
        "TP_USER_ROLE": "developer",
        "TP_USER_ID": "12345",
        "TP_USER_EMAIL": "developer@company.com"
      },
      "cwd": "/path/to/apptio-target-process-mcp"
    }
  }
}
```

## Multiple Server Configurations

You can configure multiple Targetprocess instances or different role configurations:

```json
{
  "mcpServers": {
    "targetprocess-dev": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "TP_DOMAIN",
        "-e", "TP_API_KEY",
        "-e", "TP_USER_ROLE",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_DOMAIN": "dev-company.tpondemand.com",
        "TP_API_KEY": "dev-api-key",
        "TP_USER_ROLE": "developer"
      }
    },
    "targetprocess-prod": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "TP_DOMAIN",
        "-e", "TP_API_KEY",
        "-e", "TP_USER_ROLE",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_DOMAIN": "prod-company.tpondemand.com",
        "TP_API_KEY": "prod-api-key",
        "TP_USER_ROLE": "project-manager"
      }
    }
  }
}
```

## Troubleshooting Claude Desktop Issues

### Server Not Appearing

**Symptoms:**
- Targetprocess tools don't appear in Claude Desktop
- No MCP connection indicators

**Solutions:**

1. **Check Configuration Syntax**
   ```bash
   # Validate JSON syntax
   python -m json.tool ~/.config/Claude/claude_desktop_config.json
   ```

2. **Verify File Location**
   - Ensure you're editing the correct config file for your platform
   - Check file permissions (should be readable by your user)

3. **Restart Claude Desktop**
   - Close Claude Desktop completely
   - Wait 5 seconds
   - Reopen Claude Desktop

### Authentication Failures

**Symptoms:**
- Tools appear but return authentication errors
- "Invalid credentials" or "Unauthorized" messages

**Solutions:**

1. **Test Credentials Independently**
   ```bash
   # Test API key
   curl -H "Authorization: Basic $(echo -n 'token:your-api-key' | base64)" \
        https://your-company.tpondemand.com/api/v1/Context
   
   # Test username/password
   curl -H "Authorization: Basic $(echo -n 'username:password' | base64)" \
        https://your-company.tpondemand.com/api/v1/Context
   ```

2. **Check Domain Format**
   - ✅ Correct: `company.tpondemand.com`
   - ❌ Incorrect: `https://company.tpondemand.com`
   - ❌ Incorrect: `company.tpondemand.com/api`

3. **Verify API Key Permissions**
   - Log into Targetprocess web interface
   - Go to **Settings** → **Access Tokens**
   - Ensure your token has appropriate permissions

### Docker Issues

**Symptoms:**
- "Docker command failed" errors
- Container not starting

**Solutions:**

1. **Verify Docker Installation**
   ```bash
   docker --version
   docker run hello-world
   ```

2. **Check Image Availability**
   ```bash
   docker pull ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```

3. **Test Container Manually**
   ```bash
   docker run -it --rm \
     -e TP_DOMAIN=your-company.tpondemand.com \
     -e TP_API_KEY=your-api-key \
     ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```

### NPX Issues

**Symptoms:**
- NPX command fails or hangs
- Package not found errors

**Solutions:**

1. **Check Node.js/NPM Installation**
   ```bash
   node --version
   npm --version
   npx --version
   ```

2. **Clear NPX Cache**
   ```bash
   npx --clear-cache
   ```

3. **Test NPX Package**
   ```bash
   TP_DOMAIN=your-company.tpondemand.com \
   TP_API_KEY=your-api-key \
   npx -y @aaronsb/targetprocess-mcp
   ```

### Tool Execution Failures

**Symptoms:**
- Tools appear but fail when executed
- Timeout errors
- Partial responses

**Solutions:**

1. **Check Network Connectivity**
   ```bash
   ping your-company.tpondemand.com
   curl -I https://your-company.tpondemand.com
   ```

2. **Verify User Permissions**
   - Ensure your user account has appropriate permissions in Targetprocess
   - Test operations in the web interface first

3. **Enable Debug Logging**
   ```json
   {
     "mcpServers": {
       "targetprocess": {
         "env": {
           "MCP_STRICT_MODE": "true",
           "DEBUG": "targetprocess:*"
         }
       }
     }
   }
   ```

### Performance Issues

**Symptoms:**
- Slow response times
- Timeouts on large queries

**Solutions:**

1. **Optimize Query Scope**
   - Use specific filters instead of broad searches
   - Limit result sets with `take` parameter

2. **Check Network Latency**
   - Test from different network connections
   - Consider geographic proximity to Targetprocess servers

3. **Use Appropriate Role Configuration**
   - Role-specific tools are optimized for common workflows
   - Base tools may require more specific parameters

## Verifying the Integration

### Step 1: Check MCP Server Status

1. Open Claude Desktop
2. Start a new conversation
3. Look for MCP connection indicators (typically in the interface)

### Step 2: Test Basic Functionality

Try these commands to verify the integration:

```
Show me the available entity types in my Targetprocess instance.
```

Expected response should list entity types like UserStory, Bug, Task, etc.

### Step 3: Test Authentication

```
Search for any user stories in my Targetprocess instance.
```

If authentication is working, you should see actual data from your instance.

### Step 4: Test Role-Specific Tools (if configured)

For developer role:
```
Show me my current tasks.
```

For project manager role:
```
Show me project status and team assignments.
```

### Step 5: Verify Tool Approval Flow

1. When Claude tries to use a tool for the first time, you should see an approval dialog
2. You can choose to:
   - **Approve once** - Allow this specific usage
   - **Always approve** - Auto-approve this tool in the future
   - **Deny** - Block this usage

### Step 6: Test Error Handling

Try an invalid query to ensure errors are handled gracefully:
```
Search for entities with an invalid entity type.
```

You should receive a helpful error message with suggestions.

### Common Success Indicators

- ✅ Tools appear in Claude's available functions
- ✅ Authentication succeeds without errors
- ✅ Queries return actual data from your Targetprocess instance
- ✅ Role-specific tools appear (if configured with `TP_USER_ROLE`)
- ✅ Error messages are helpful and actionable
- ✅ Semantic hints and workflow suggestions appear

### Common Failure Indicators

- ❌ No MCP tools available in conversation
- ❌ Authentication errors on every request
- ❌ Generic error messages without context
- ❌ Timeouts on all requests
- ❌ Docker or NPX command failures

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `TP_DOMAIN` | ✅ | Targetprocess domain (without https://) | `company.tpondemand.com` |
| `TP_API_KEY` | ⚠️* | API token (recommended) | `abc123def456...` |
| `TP_USERNAME` | ⚠️* | Username for basic auth | `john.doe` |
| `TP_PASSWORD` | ⚠️* | Password for basic auth | `secretpassword` |
| `TP_USER_ROLE` | ❌ | Role for specialized tools | `developer`, `project-manager`, `tester`, `product-owner` |
| `TP_USER_ID` | ❌ | Your user ID in Targetprocess | `12345` |
| `TP_USER_EMAIL` | ❌ | Your email in Targetprocess | `user@company.com` |
| `MCP_STRICT_MODE` | ❌ | Enable strict validation | `true` |

*Either `TP_API_KEY` OR (`TP_USERNAME` + `TP_PASSWORD`) is required.

## Security Best Practices

### Credential Management
- **Use API keys** instead of username/password when possible
- **Never commit** configuration files with credentials to version control
- **Rotate API keys** regularly
- **Use minimum required permissions** for API keys

### Network Security
- Ensure your Targetprocess instance uses HTTPS
- Consider network-level restrictions if accessing from corporate environments
- Monitor API usage for unusual patterns

### Configuration Security
- Set appropriate file permissions on configuration files
- Consider using environment variables for sensitive values in shared environments
- Regularly review and update configurations

## Next Steps

Once you have successfully configured Claude Desktop with the Targetprocess MCP Server:

1. **Explore Use Cases**: Check the [use cases documentation](../use-cases/README.md) for examples of what you can accomplish
2. **Learn Core Concepts**: Review [core concepts](../core-concepts.md) to understand how the MCP works
3. **Read Tool Documentation**: Explore the [tools reference](../tools/README.md) for detailed API information
4. **Try Role-Specific Workflows**: If you configured a role, explore the specialized operations available in the [semantic operations documentation](../semantic-operations/README.md)

For additional help, see the [troubleshooting guide](../integration/troubleshooting.md) or [integration documentation](../integration/README.md).