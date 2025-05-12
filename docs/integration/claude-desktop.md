# Claude Desktop Integration

This guide walks you through setting up and using the Targetprocess MCP with Claude Desktop.

## Prerequisites

Before you begin, ensure you have:

1. [Claude Desktop](https://claude.ai/download) installed
2. Docker installed and running (for the containerized approach)
3. Targetprocess credentials (domain, username, password)

## Setting Up Claude Desktop

### Step 1: Install Claude Desktop

If you haven't already, download and install Claude Desktop from [claude.ai/download](https://claude.ai/download).

### Step 2: Configure the MCP Server

1. Open Claude Desktop
2. Click on your profile picture in the bottom left
3. Select "Settings"
4. Click on the "MCP Servers" tab
5. Click "Add Server"

### Step 3: Enter Server Configuration

Fill in the server details:

- **Name**: Targetprocess
- **Command Type**: Docker
- **Command**: docker
- **Arguments**:
  ```
  run
  -i
  --rm
  -e
  TP_DOMAIN
  -e
  TP_USERNAME
  -e
  TP_PASSWORD
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
  ```
- **Environment Variables**:
  - **TP_DOMAIN**: your-domain.tpondemand.com
  - **TP_USERNAME**: your-username
  - **TP_PASSWORD**: your-password

Your configuration should look like this:

![Claude Desktop MCP Configuration](../images/claude-desktop-config.png)

### Step 4: Advanced Options (Optional)

- **Auto-Approve**: You can set specific tools to be automatically approved:
  - search_entities
  - get_entity
  - inspect_object
- **Disabled**: Keep unchecked to enable the server

## Manual Configuration

If you prefer to edit the configuration file directly:

1. Locate your Claude Desktop configuration file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add the following configuration:

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
        "TP_DOMAIN": "your-domain.tpondemand.com",
        "TP_USERNAME": "your-username",
        "TP_PASSWORD": "your-password"
      },
      "autoApprove": [],
      "disabled": false
    }
  }
}
```

## Using with Claude Desktop

### Step 1: Start a New Conversation

1. Open Claude Desktop
2. Start a new conversation or select an existing one
3. Claude will automatically connect to the Targetprocess MCP

### Step 2: Making Requests

You can now ask Claude to interact with your Targetprocess instance. For example:

- "Show me open user stories in my current project"
- "Find bugs assigned to me"
- "Create a new task for implementing the login screen"
- "What entity types are available in my Targetprocess instance?"

### Step 3: Tool Approval

When Claude needs to use a tool for the first time, you'll see an approval prompt:

![Tool Approval Dialog](../images/tool-approval.png)

You can:
- Approve this request
- Always approve this tool
- Deny the request

For security, review the parameters before approving to ensure they're appropriate.

## Advanced Usage

### Using NPX (No Docker Required)

For a simpler approach that doesn't require Docker:

1. Update the Claude Desktop configuration to use npx:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "npx",
      "args": [
        "-y",
        "https://github.com/aaronsb/apptio-target-process-mcp.git"
      ],
      "env": {
        "TP_DOMAIN": "your-domain.tpondemand.com",
        "TP_USERNAME": "your-username",
        "TP_PASSWORD": "your-password"
      },
      "autoApprove": [],
      "disabled": false
    }
  }
}
```

This approach:
- Uses NPX to run the tool directly from GitHub
- Doesn't require Docker installation
- Automatically uses the latest version

### Using Local Installation Instead of Docker

If you've installed the MCP server locally:

1. Update the Claude Desktop configuration to point to your local installation:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "node",
      "args": [
        "/path/to/apptio-target-process-mcp/build/index.js"
      ],
      "env": {
        "TP_DOMAIN": "your-domain.tpondemand.com",
        "TP_USERNAME": "your-username",
        "TP_PASSWORD": "your-password"
      },
      "autoApprove": [],
      "disabled": false
    }
  }
}
```

### Using the Provided Scripts

If using the provided scripts:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "/path/to/apptio-target-process-mcp/scripts/run-local.sh",
      "args": [],
      "autoApprove": [],
      "disabled": false
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Tool Not Appearing in Claude Desktop

**Possible Causes:**
- MCP server is not running
- Configuration is incorrect
- Docker is not running

**Solutions:**
1. Check if Docker is running
2. Verify your configuration settings
3. Try restarting Claude Desktop
4. Check logs for errors

#### Authentication Failed

**Possible Causes:**
- Incorrect credentials
- Account permissions

**Solutions:**
1. Verify your Targetprocess credentials
2. Ensure the account has API access
3. Try logging into the Targetprocess web interface with the same credentials

#### Tool Fails to Execute

**Possible Causes:**
- Invalid parameters
- Permission issues
- API limitations

**Solutions:**
1. Check the parameters being passed to the tool
2. Review the error message for clues
3. Verify the user has permission to perform the requested action

For more troubleshooting help, see the [Troubleshooting Guide](troubleshooting.md).

## Best Practices

1. **Be Specific in Prompts**: Instead of "show me user stories," try "show me open user stories in the Mobile App project"
2. **Review Parameters**: Before approving tool usage, review the parameters to ensure they're what you expect
3. **Start Simple**: Begin with simple queries and gradually increase complexity
4. **Check Permissions**: Ensure your Targetprocess user has permissions for the actions you want to perform
5. **Use Related Data**: Ask for related data when needed (e.g., "show me bugs with their related user stories")

## Next Steps

Now that you have Claude Desktop set up with the Targetprocess MCP:

1. Explore the [Use Cases](../use-cases/README.md) for examples of what you can do
2. Check the [Core Concepts](../core-concepts.md) to understand how the MCP works
3. Review the [Tools Reference](../tools/README.md) for detailed API documentation