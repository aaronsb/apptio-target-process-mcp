# AI Integration Guides

This directory contains guides for integrating the Targetprocess MCP with various AI assistants and LLMs that support the Model Context Protocol.

## Available Guides

- [Installation Guide](installation.md) - Complete installation instructions
- [Claude Desktop Integration](claude-desktop.md) - Setting up with Claude Desktop
- [Cline Integration](cline.md) - Setting up with Cline CLI
- [Goose Integration](goose.md) - Setting up with Goose
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

## What is the Model Context Protocol (MCP)?

The Model Context Protocol (MCP) is a standard that enables AI assistants to interact with external tools and services through a unified interface. It allows AI models to:

1. Discover what tools are available
2. Understand how to use those tools
3. Call the tools with appropriate parameters
4. Process and interpret tool responses

## Supported AI Assistants

The Targetprocess MCP works with various AI assistants that support the Model Context Protocol:

| Assistant | Support | Configuration |
|-----------|---------|---------------|
| [Claude Desktop](https://claude.ai/download) | Full | [Guide](claude-desktop.md) |
| [Cline](https://cline.bot) | Full | [Guide](cline.md) |
| [Goose](https://block.github.io/goose/) | Full | [Guide](goose.md) |
| Custom MCP Clients | Full | [Custom Integration](custom-integration.md) |

## Quick Start

For the fastest setup:

1. Install Docker
2. Pull the Docker image:
   ```bash
   docker pull ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```
3. Configure your AI assistant to use the MCP server:
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

For detailed instructions, see the [Installation Guide](installation.md).

## Example Configuration

Here's an example of how to configure the Targetprocess MCP with Cline:

```json
// ~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
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

## Security Considerations

When integrating the Targetprocess MCP with AI assistants, consider these security best practices:

1. **Use Environment Variables**: Store credentials as environment variables instead of hardcoding them
2. **Create a Dedicated API User**: Use a dedicated Targetprocess user with appropriate permissions
3. **Regularly Rotate Passwords**: Update passwords regularly for enhanced security
4. **Be Careful with autoApprove**: Only auto-approve specific tools if necessary
5. **Review Tool Usage**: Periodically review what tools are being used by your AI assistant

## Troubleshooting

If you encounter issues with the integration, check the [Troubleshooting Guide](troubleshooting.md) for common problems and solutions.