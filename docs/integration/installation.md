# Installation Guide

This guide provides detailed instructions for setting up and configuring the Targetprocess MCP server.

## Prerequisites

Before you begin, ensure you have:

1. **Targetprocess Account**: You need a valid Targetprocess account with:
   - Domain (e.g., company.tpondemand.com)
   - Username
   - Password
   - API access permissions

2. **Docker** (for containerized deployment) or **Node.js 20+** (for local development)

3. **AI Assistant**: An LLM client that supports the Model Context Protocol (MCP)

## Installation Options

There are multiple ways to install and run the Targetprocess MCP:

### Option 1: Docker (Recommended)

The easiest way to get started is using the pre-built Docker image:

1. **Pull the Docker image**:
   ```bash
   docker pull ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```

2. **Run the container**:
   ```bash
   docker run -i --rm \
     -e TP_DOMAIN=your-domain.tpondemand.com \
     -e TP_USERNAME=your-username \
     -e TP_PASSWORD=your-password \
     ghcr.io/aaronsb/apptio-target-process-mcp
   ```

3. **Configure your AI assistant**:
   See the [AI assistant-specific guides](#ai-assistant-configuration) for detailed instructions.

### Option 2: Local Development Setup

For development or customization:

1. **Clone the repository recursively**:
   ```bash
   git clone --recursive https://github.com/aaronsb/apptio-target-process-mcp.git
   cd apptio-target-process-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure credentials**:
   ```bash
   cp config/targetprocess.example.json config/targetprocess.json
   ```
   
   Edit `config/targetprocess.json` with your credentials:
   ```json
   {
     "domain": "your-domain.tpondemand.com",
     "credentials": {
       "username": "your-username",
       "password": "your-password"
     }
   }
   ```

4. **Build and run**:
   ```bash
   npm run build
   node build/index.js
   ```

### Option 3: Local Scripts for Development

For local development and testing, use the provided scripts:

1. **Build the local image**:
   ```bash
   ./scripts/build-local.sh         # Quiet mode (default), logs to file
   ./scripts/build-local.sh --verbose  # Full build output in terminal
   ```

2. **Run the local image**:
   ```bash
   ./scripts/run-local.sh
   ```

## Environment Variables

The Targetprocess MCP supports the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `TP_DOMAIN` | Your Targetprocess domain (e.g., company.tpondemand.com) | Yes |
| `TP_USERNAME` | Your Targetprocess username | Yes |
| `TP_PASSWORD` | Your Targetprocess password | Yes |
| `MCP_PORT` | Port for the MCP server (default: 8080) | No |
| `MCP_HOST` | Host for the MCP server (default: 0.0.0.0) | No |
| `LOG_LEVEL` | Logging level (default: info) | No |

## Configuration File

Instead of environment variables, you can use a configuration file:

```json
{
  "domain": "your-domain.tpondemand.com",
  "credentials": {
    "username": "your-username",
    "password": "your-password"
  },
  "server": {
    "port": 8080,
    "host": "0.0.0.0"
  },
  "logging": {
    "level": "info"
  }
}
```

## AI Assistant Configuration

### Claude Desktop

1. Open Claude Desktop settings
2. Navigate to the MCP Servers section
3. Add a new MCP server with the following configuration:

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

For more details, see the [Claude Desktop Integration Guide](claude-desktop.md).

### Cline

1. Edit your Cline configuration file:
   ```bash
   vi ~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
   ```

2. Add the Targetprocess MCP server configuration:
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

For more details, see the [Cline Integration Guide](cline.md).

### Goose

1. Edit your Goose configuration file:
   ```bash
   vi ~/.config/goose/config.json
   ```

2. Add the Targetprocess MCP server configuration:
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

For more details, see the [Goose Integration Guide](goose.md).

## Testing Your Installation

To verify your installation is working correctly:

1. Start your AI assistant
2. Ask a simple question like "Can you search for open user stories in Targetprocess?"
3. The assistant should be able to use the Targetprocess MCP to search for and display open user stories

If you encounter issues, check the [Troubleshooting Guide](troubleshooting.md).

## Security Considerations

To enhance security:

1. **Use a Dedicated API User**: Create a dedicated Targetprocess user with only the necessary permissions
2. **Regularly Rotate Passwords**: Change the API user's password regularly
3. **Use Environment Variables**: Avoid hardcoding credentials in configuration files
4. **Limit Tool Access**: Be selective about which tools you auto-approve
5. **Review Tool Usage**: Periodically review what tools are being used by your AI assistant

## Docker Build Options

When building the Docker image locally, you can use these options:

- **Quiet mode** (default): Minimal output, logs to file
  ```bash
  ./scripts/build-local.sh
  ```
  Logs are saved to `/tmp/apptio-target-process-mcp/docker-build.log`

- **Verbose mode**: Full build output in terminal
  ```bash
  ./scripts/build-local.sh --verbose
  ```

## Next Steps

Once you've installed and configured the Targetprocess MCP:

1. Explore the [Getting Started Guide](../getting-started.md) for basic usage
2. Check the [Use Cases](../use-cases/README.md) for examples of what you can do
3. Read the [Core Concepts](../core-concepts.md) to understand how the MCP works