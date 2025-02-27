# AI Assistant Installation Guide for Targetprocess MCP

This guide provides detailed instructions for AI assistants like Cline to help users set up and configure the Targetprocess MCP server. The instructions are formatted to be easily parsed by AI assistants for a smooth one-click installation experience.

## Prerequisites

1. Docker installed and running
   - For Windows/Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - For Linux: `sudo apt-get install docker.io` (Ubuntu/Debian) or equivalent

2. A Targetprocess account with:
   - Domain (e.g., company.tpondemand.com)
   - Username
   - Password
   - API access permissions

## One-Click Installation Steps

### 1. Pull the Docker Image

```bash
docker pull ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

### 2. Configure Your AI Assistant

This MCP server works with AI assistants that support the Model Context Protocol. Choose the appropriate configuration based on your assistant:

#### For Cline

Edit: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

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

#### For Claude Desktop

Edit: `~/.config/Claude/claude_desktop_config.json` (Linux/Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

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

#### For Goose

Edit: `~/.config/goose/config.json` (Linux/Mac) or `%APPDATA%\goose\config.json` (Windows)

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

### 3. Required Environment Variables

Replace the following values in your configuration:

- `TP_DOMAIN`: Your Targetprocess domain (e.g., company.tpondemand.com)
- `TP_USERNAME`: Your Targetprocess username
- `TP_PASSWORD`: Your Targetprocess password

### 4. Verification

To verify the installation:

1. Restart your AI assistant to load the new configuration
2. The MCP server should connect automatically
3. Test with a simple command like searching for a user story:

```
Can you search for open user stories in Targetprocess?
```

Your AI assistant should be able to use the MCP server to search for user stories and display the results.

## Local Development Setup

If you prefer to run the MCP server locally without Docker:

### Prerequisites

- Node.js 20 or later
- npm

### Setup Steps

1. Clone the repository recursively:
```bash
git clone --recursive https://github.com/aaronsb/apptio-target-process-mcp.git
cd apptio-target-process-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Copy the example config:
```bash
cp config/targetprocess.example.json config/targetprocess.json
```

4. Edit `config/targetprocess.json` with your Targetprocess credentials:
```json
{
  "domain": "your-domain.tpondemand.com",
  "credentials": {
    "username": "your-username",
    "password": "your-password"
  }
}
```

5. Build the project:
```bash
npm run build
```

6. Configure your AI assistant to use the local build:

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "node",
      "args": [
        "/path/to/apptio-target-process-mcp/build/index.js"
      ],
      "autoApprove": [],
      "disabled": false
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify Docker is running
   - Check your Targetprocess credentials
   - Ensure your domain is correct and accessible
   - Solution: `docker ps` to check if Docker is running, verify credentials in your config

2. **Authentication Error**
   - Double-check your username and password
   - Verify your account has API access permissions
   - Solution: Test your credentials by logging into the Targetprocess web interface

3. **Docker Image Not Found**
   - Run `docker pull ghcr.io/aaronsb/apptio-target-process-mcp:latest` to manually pull the image
   - Check your internet connection
   - Solution: Verify Docker is running with `docker --version`

4. **Permission Issues**
   - Ensure your Targetprocess account has appropriate permissions
   - Solution: Contact your Targetprocess administrator to verify API access

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

## Security Considerations

- Store your credentials securely
- Consider using environment variables instead of hardcoding credentials
- Use a dedicated API user with appropriate permissions
- Regularly rotate passwords for security

## Quick Reference

| Tool | Description | Example |
|------|-------------|---------|
| search_entities | Search for entities | `{ "type": "UserStory", "where": "EntityState.Name eq 'Open'" }` |
| get_entity | Get entity details | `{ "type": "UserStory", "id": 12345 }` |
| create_entity | Create a new entity | `{ "type": "UserStory", "name": "New Story", "project": { "id": 123 } }` |
| update_entity | Update an entity | `{ "type": "UserStory", "id": 12345, "fields": { "name": "Updated Story" } }` |
| inspect_object | Inspect object properties | `{ "action": "list_types" }` |
