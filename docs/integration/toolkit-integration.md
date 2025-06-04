# IBM watsonx Orchestrate Toolkit Integration

This guide explains how to integrate the Targetprocess MCP Server as a toolkit in IBM watsonx Orchestrate.

## Prerequisites

- IBM watsonx Orchestrate Developer Edition (toolkit support is currently limited to Developer Edition)
- Targetprocess MCP Server built and ready (`npm run build` completed)
- Targetprocess credentials (username/password or API key)

## Overview

IBM watsonx Orchestrate supports importing MCP (Model Context Protocol) servers as toolkits, allowing you to use Targetprocess tools within your AI workflows. The MCP server communicates via stdio transport, making it compatible with the orchestrate toolkit framework.

## Import Command

To import the Targetprocess MCP Server as a toolkit:

```bash
orchestrate toolkits import \
  --kind mcp \
  --name targetprocess \
  --package-root /path/to/apptio-target-process-mcp \
  --command '["node", "build/index.js"]' \
  --tools "*"
```

### Command Parameters

- `--kind mcp`: Specifies this is an MCP-based toolkit
- `--name targetprocess`: The name for your toolkit (customize as needed)
- `--package-root`: Full path to your MCP server directory
- `--command`: The command to launch the server (can use string or array format)
- `--tools "*"`: Imports all available tools (or specify individual tool names)

### Alternative Command Format

You can also use a simple string format for the command:

```bash
orchestrate toolkits import \
  --kind mcp \
  --name targetprocess \
  --package-root /path/to/apptio-target-process-mcp \
  --command 'node build/index.js' \
  --tools "*"
```

## Configuration Methods

### Method 1: Environment Variables (Recommended)

The MCP server can be configured using environment variables. When importing the toolkit, these will be automatically passed to the server:

```bash
# Basic Authentication
export TP_DOMAIN=your-domain.tpondemand.com
export TP_USERNAME=your-username
export TP_PASSWORD=your-password

# OR API Key Authentication
export TP_DOMAIN=your-domain.tpondemand.com
export TP_API_KEY=your-api-key
```

### Method 2: App Connection

If you have a Targetprocess connection configured in watsonx Orchestrate:

```bash
orchestrate toolkits import \
  --kind mcp \
  --name targetprocess \
  --package-root /path/to/apptio-target-process-mcp \
  --command '["node", "build/index.js"]' \
  --tools "*" \
  --app-id "your_targetprocess_app_id"
```

The connection details from the app will be exposed as environment variables to the MCP server.

### Method 3: Configuration File

As a fallback, the server can read from configuration files in these locations:
- `./targetprocess.json`
- `./config/targetprocess.json`
- `~/.targetprocess.json`
- `~/.config/targetprocess/config.json`

## Available Tools

The following tools will be available in your toolkit:

1. **search_entities** - Search for Targetprocess entities with filtering
2. **get_entity** - Get detailed information about a specific entity
3. **create_entity** - Create new entities (User Stories, Bugs, Tasks, etc.)
4. **update_entity** - Update existing entities
5. **inspect_object** - Inspect Targetprocess objects and properties

## Importing Specific Tools

To import only specific tools instead of all:

```bash
orchestrate toolkits import \
  --kind mcp \
  --name targetprocess \
  --package-root /path/to/apptio-target-process-mcp \
  --command '["node", "build/index.js"]' \
  --tools "search_entities,get_entity"
```

## Updating the Toolkit

To update the toolkit with new settings or after code changes:

1. Remove the existing toolkit:
   ```bash
   orchestrate toolkits remove --name targetprocess
   ```

2. Re-import with new specifications:
   ```bash
   orchestrate toolkits import \
     --kind mcp \
     --name targetprocess \
     --package-root /path/to/apptio-target-process-mcp \
     --command '["node", "build/index.js"]' \
     --tools "*"
   ```

3. Re-import any agents that depend on this toolkit

## Troubleshooting

### Build Issues

Ensure the project is built before importing:
```bash
cd /path/to/apptio-target-process-mcp
npm install
npm run build
```

### Authentication Errors

If you receive authentication errors:
1. Verify your credentials are correct
2. Check that environment variables are properly set
3. Ensure your Targetprocess domain includes the full URL (e.g., `company.tpondemand.com`)

### Toolkit Not Found

If the toolkit import fails:
1. Verify the package-root path is correct
2. Ensure `build/index.js` exists
3. Check that you're using Developer Edition of watsonx Orchestrate

### Connection Issues

The MCP server uses stdio transport by default. If you encounter connection issues:
1. Test the server locally: `node build/index.js`
2. Check for any error messages in the orchestrate logs
3. Verify no other processes are interfering with stdio

## Example Workflow

After importing the toolkit, you can use it in your orchestrate workflows:

```
User: "Show me all open bugs in the mobile project"
→ Toolkit uses search_entities to find bugs
→ Returns filtered results

User: "Create a new user story for the authentication feature"
→ Toolkit uses create_entity
→ Returns the created story details

User: "Update the priority of bug #12345 to high"
→ Toolkit uses update_entity
→ Confirms the update
```

## Best Practices

1. **Use Environment Variables**: This is the most secure way to handle credentials
2. **Import All Tools**: Use `--tools "*"` unless you have specific requirements
3. **Test Locally First**: Ensure the MCP server works locally before importing
4. **Keep Updated**: Re-import the toolkit after significant code changes

## Additional Resources

- [Targetprocess MCP Server Documentation](../../README.md)
- [IBM watsonx Orchestrate Toolkit Documentation](https://developer.watson-orchestrate.ibm.com/tools/toolkits)
- [Model Context Protocol Specification](https://modelcontextprotocol.com)