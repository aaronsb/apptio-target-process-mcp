# AI Assistant Installation Guide

This guide provides detailed instructions for AI assistants like Cline to help users set up and configure the Targetprocess MCP server.

## Prerequisites

1. Docker installed and running
2. A Targetprocess account with:
   - Domain (e.g., company.tpondemand.com)
   - Username
   - Password

## Installation Steps

### 1. Pull the Docker Image

The server is distributed as a Docker image. Pull the latest version:

```bash
docker pull ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

### 2. Configure Your AI Assistant

This MCP server works with AI assistants that support the Model Context Protocol:
- [Cline](https://cline.bot) - CLI-based assistant (config: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`)
- [Claude Desktop](https://claude.ai/download) - Anthropic's desktop app (config: `~/.config/Claude/claude_desktop_config.json`)
- [Goose](https://block.github.io/goose/) - Local AI assistant

Add the following configuration to your AI assistant's MCP settings file:

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
        "TP_USERNAME",
        "-e",
        "TP_PASSWORD",
        "-e",
        "TP_DOMAIN",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_USERNAME": "your-username",
        "TP_PASSWORD": "your-password",
        "TP_DOMAIN": "your-domain.tpondemand.com"
      },
      "autoApprove": [],
      "disabled": false
    }
  }
}
```

### 3. Required Environment Variables

Replace the following values in your configuration:

- `TP_DOMAIN`: Your Targetprocess domain (e.g., company.tpondemand.com)
- `TP_USERNAME`: Your Targetprocess username
- `TP_PASSWORD`: Your Targetprocess password

### 4. Verification

To verify the installation:

1. Restart your AI assistant to load the new configuration
2. The MCP server should connect automatically
3. Test with a simple command like searching for a user story

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify Docker is running
   - Check your Targetprocess credentials
   - Ensure your domain is correct and accessible

2. **Authentication Error**
   - Double-check your username and password
   - Verify your account has API access permissions

3. **Docker Image Not Found**
   - Run `docker pull ghcr.io/aaronsb/apptio-target-process-mcp:latest` to manually pull the image
   - Check your internet connection

### Getting Help

If you encounter issues:

1. Check the Docker logs:
   ```bash
   docker logs $(docker ps | grep apptio-target-process-mcp | awk '{print $1}')
   ```

2. File an issue on GitHub with:
   - Error message (without sensitive information)
   - Steps to reproduce
   - Your environment details (OS, Docker version)
