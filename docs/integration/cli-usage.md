# Command Line Usage

This guide explains how to run the Targetprocess MCP directly from the command line, including using `npx` for one-off execution without installation.

## Using npx (No Installation Required)

### Basic Usage with npx

The MCP server communicates via standard input/output (stdio), making it ideal for integration with AI assistants. To run it using npx:

```bash
npx -y https://github.com/aaronsb/apptio-target-process-mcp.git
```

> **Note:** The server runs in the foreground and expects communication via stdin/stdout. For normal usage, you'll typically use this with an AI assistant that manages the communication.

### Configuration with npx

When using the npx method, you have several options for configuration:

1. **Environment Variables (Recommended)**:

   Set the environment variables before running the npx command:

   ```bash
   # For basic authentication (username/password)
   export TP_DOMAIN=your-domain.tpondemand.com
   export TP_USERNAME=your-username
   export TP_PASSWORD=your-password
   npx -y https://github.com/aaronsb/apptio-target-process-mcp.git
   ```

   Or, more simply on one line:

   ```bash
   TP_DOMAIN=your-domain.tpondemand.com TP_USERNAME=your-username TP_PASSWORD=your-password npx -y https://github.com/aaronsb/apptio-target-process-mcp.git
   ```

   For API key authentication:
   ```bash
   TP_DOMAIN=your-domain.tpondemand.com TP_API_KEY=your-api-key npx -y https://github.com/aaronsb/apptio-target-process-mcp.git
   ```

2. **Configuration File**:
   The tool looks for configuration in these locations (in order):
   - `./targetprocess.json` (current directory)
   - `./config/targetprocess.json` (config subdirectory)
   - `~/.targetprocess.json` (user's home directory)
   - `~/.config/targetprocess/config.json` (user's config directory)

   Create a configuration file in one of these locations before running the npx command.

## Using npx with AI Assistants

### Claude Desktop

To use npx with Claude Desktop:

1. Edit your Claude Desktop configuration to use npx instead of Docker:

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

### Command-line MCP Clients

For command-line MCP clients like Cline:

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

## Local Installation

If you prefer to install the package locally:

```bash
npm install -g https://github.com/aaronsb/apptio-target-process-mcp.git
```

Then run it:

```bash
TargetProcessMCP
```

The same environment variables and configuration file options apply when running the installed package.

## Docker Execution

If you prefer Docker, you can run the tool without installation:

```bash
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  ghcr.io/aaronsb/apptio-target-process-mcp
```

## Configuration File Format

Your configuration file should be in JSON format:

**Basic Authentication**:
```json
{
  "domain": "your-domain.tpondemand.com",
  "credentials": {
    "username": "your-username",
    "password": "your-password"
  }
}
```

**API Key Authentication**:
```json
{
  "domain": "your-domain.tpondemand.com",
  "apiKey": "your-api-key"
}
```

## Troubleshooting

### "No configuration found" Error

If you see this error:
```
No configuration found. Please set environment variables (TP_DOMAIN, TP_USERNAME, TP_PASSWORD) or create a configuration file
```

Ensure one of the following:
1. Environment variables are correctly set
2. A configuration file exists in one of the supported locations
3. You have permissions to read the configuration file

### Authentication Errors

If authentication fails, verify:
1. Your Targetprocess domain is correct
2. Your credentials (username/password or API key) are valid
3. Your user account has API access permissions

For more detailed troubleshooting, see the [Troubleshooting Guide](troubleshooting.md).