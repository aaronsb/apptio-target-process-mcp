# Claude Code Integration

This guide explains how to integrate the Targetprocess MCP Server with Claude Code using the native MCP support.

## Prerequisites

- Claude Code installed and configured
- Node.js installed on your system
- Targetprocess MCP Server built (`npm run build`)
- Targetprocess credentials

## Quick Setup

Run the setup script from the project root:

```bash
./scripts/setup-claude-mcp.sh
```

This script will:
1. Build the project if needed
2. Help you create a `.env` file if missing
3. Show you the exact commands to add the MCP server to Claude Code

## Manual Setup

### 1. Build the Project

```bash
npm install
npm run build
```

### 2. Add to Claude Code

#### Local Scope (Current Project Only)

```bash
claude mcp add targetprocess node /path/to/apptio-target-process-mcp/build/index.js \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password
```

#### User Scope (All Projects)

```bash
claude mcp add targetprocess node /path/to/apptio-target-process-mcp/build/index.js \
  -s user \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password
```

#### Using NPX (If Published)

```bash
claude mcp add targetprocess npx TargetProcessMCP \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password
```

### 3. Verify Installation

```bash
claude mcp list
```

You should see `targetprocess` in the list of available MCP servers.

## Using the Tools

After adding the MCP server and restarting Claude Code, you'll have access to these tools:

### search_entities
Search for Targetprocess entities with filtering:
```
search_entities({
  type: "UserStory",
  where: "Project.Name = 'Mobile App'",
  take: 10
})
```

### get_entity
Get detailed information about a specific entity:
```
get_entity({
  type: "Bug",
  id: 12345,
  include: ["Project", "AssignedUser"]
})
```

### create_entity
Create new entities:
```
create_entity({
  type: "Task",
  name: "Implement login feature",
  project: { id: 123 }
})
```

### update_entity
Update existing entities:
```
update_entity({
  type: "UserStory",
  id: 456,
  fields: {
    status: { id: 2 },
    priority: { id: 1 }
  }
})
```

### inspect_object
Explore Targetprocess metadata:
```
inspect_object({
  objectType: "UserStory"
})
```

## Configuration Options

### Environment Variables

- `TP_DOMAIN`: Your Targetprocess domain (required)
- `TP_USERNAME`: Username for basic auth
- `TP_PASSWORD`: Password for basic auth
- `TP_API_KEY`: API key (alternative to username/password)

### Using a Configuration File

Instead of environment variables, you can use a config file:

1. Create `config/targetprocess.json`:
```json
{
  "domain": "your-domain.tpondemand.com",
  "credentials": {
    "username": "your-username",
    "password": "your-password"
  }
}
```

2. Add the MCP server without environment variables:
```bash
claude mcp add targetprocess node /path/to/apptio-target-process-mcp/build/index.js
```

## Troubleshooting

### Server Not Appearing
- Restart Claude Code after adding the MCP server
- Check that the build was successful: `ls build/index.js`
- Verify with `claude mcp list`

### Authentication Errors
- Double-check your credentials
- Ensure the domain includes the full URL (e.g., `company.tpondemand.com`)
- Try using API key authentication instead of username/password

### Tool Execution Errors
- Check Claude Code logs: `claude logs`
- Run the server manually to test: `node build/index.js`
- Ensure all dependencies are installed: `npm install`

## Removing the Server

To remove the MCP server from Claude Code:

```bash
claude mcp remove targetprocess
```

## Development Mode

For development, you can add the server pointing to the source files:

```bash
claude mcp add targetprocess-dev npm run watch \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password
```

This will rebuild automatically when you make changes.

## Best Practices

1. **Use Project Scope for Testing**: Add to local scope first to test
2. **Secure Credentials**: Use environment variables or secure config files
3. **API Key Preferred**: Use API keys instead of passwords when possible
4. **Regular Updates**: Pull latest changes and rebuild periodically

## Comparison with Other Integrations

| Feature | Claude Code MCP | IBM watsonx Orchestrate | Docker |
|---------|----------------|------------------------|---------|
| Setup Complexity | Low | Medium | Low |
| Environment | Local Node.js | Toolkit Import | Container |
| Authentication | Env vars / Config | App Connection | Env vars |
| Auto-approval | Not needed | Configure per tool | N/A |
| Development | Easy | Requires rebuild | Rebuild image |

## Next Steps

- Try the [example workflows](../use-cases/README.md)
- Read about [tool descriptions](../tools/README.md)
- Learn about [error handling](../architecture/README.md)