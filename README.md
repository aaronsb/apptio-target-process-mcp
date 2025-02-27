# Targetprocess MCP Server

The Model Context Protocol (MCP) is a standard that enables AI assistants to interact with external tools and services through a unified interface. MCP servers provide these capabilities by exposing tools and resources that AI assistants can use to accomplish tasks.

This MCP server provides tools for interacting with Targetprocess, a project management and agile planning platform. It enables AI assistants to:
- Search and retrieve Targetprocess entities (User Stories, Bugs, Tasks, Features, etc.)
- Create and update entities with proper validation
- Query entities with complex filters and includes
- Inspect and discover the Targetprocess data model
- Handle authentication and API interactions safely

## Key Features

- **Data Model Discovery**: Explore and understand complex Targetprocess implementations
- **Powerful Querying**: Use complex filters and includes to retrieve exactly the data you need
- **Entity Management**: Create and update entities with proper validation
- **Relationship Exploration**: Understand how different entities relate to each other
- **Error Handling**: Robust error handling with retries and informative messages
- **Documentation Integration**: Built-in access to Targetprocess documentation

## Use Cases

This MCP server is particularly valuable in corporate settings where Targetprocess might handle millions of records with complex schemas and data models. Common use cases include:

- **Data Model Discovery**: Map and understand complex Targetprocess implementations
- **Enterprise Analytics**: Extract and analyze data across millions of records
- **Cross-System Integration**: Use as a bridge between Targetprocess and other systems
- **Custom Reporting**: Build specialized reports not available in the standard UI
- **Batch Operations**: Manage large-scale changes across many entities
- **Schema Exploration**: Discover custom fields and relationships in complex implementations

For detailed examples and implementation guides, see [USECASES.md](USECASES.md).

## Getting Started

Clone the repository recursively to include the documentation search tool:
```bash
git clone --recursive https://github.com/aaronsb/apptio-target-process-mcp.git
cd apptio-target-process-mcp
```

## Development Resources

### Documentation Search

This repository includes a documentation scraper/searcher for Targetprocess developer documentation as a submodule. You can use it to quickly search through Targetprocess's documentation:

```bash
# From the project root:
pushd resources/target-process-docs && npm install && ./refresh-docs.sh && popd  # First time setup

# To search documentation (from any directory):
pushd resources/target-process-docs && ./search-docs.sh "your search query" && popd

# Example search:
pushd resources/target-process-docs && ./search-docs.sh "entity states" && popd
```

The search tool is located in resources/target-process-docs. We use pushd/popd commands here because:
1. The tool requires access to its database files using relative paths
2. pushd saves your current directory location
3. Temporarily changes to the tool's directory to run the command
4. popd automatically returns you to your previous location
This approach lets you run searches from any directory while ensuring the tool can find its database files.

This tool provides a powerful way to search through Targetprocess's developer documentation locally. The search results include relevant documentation sections with context, making it easier to find specific API details or implementation guidance.

### CI/CD Pipeline

The project uses GitHub Actions for automated builds:
- Pushes to `main` branch trigger new container builds
- Version tags (v*.*.*) create versioned releases
- Images are published to GitHub Container Registry

You can use the published image:

```bash
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  ghcr.io/aaronsb/apptio-target-process-mcp
```

### Environment Variables

- `TP_DOMAIN`: Your Targetprocess domain (e.g., company.tpondemand.com)
- `TP_USERNAME`: Your Targetprocess username
- `TP_PASSWORD`: Your Targetprocess password

### Local Development with Docker

For local development and testing, use the provided scripts:

1. Build the local image:
   > Note: The build script uses Docker's quiet mode by default to minimize log output. This is intentional to reduce AI token consumption when interacting with tools like Cline that process the build output. In quiet mode, the full build log is saved to `/tmp/apptio-target-process-mcp/docker-build.log`. Use `--verbose` flag to see build output directly in the terminal.
```bash
./scripts/build-local.sh         # Quiet mode (default), logs to file
./scripts/build-local.sh --verbose  # Full build output in terminal
```

2. Run the local image:
```bash
./scripts/run-local.sh
```

3. Configure Cline:
Edit `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`:
```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "./scripts/run-local.sh",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Local Development without Docker

### Prerequisites

- Node.js 20 or later
- npm

### Setup

1. Clone the repository recursively:
```bash
git clone --recursive https://github.com/modelcontextprotocol/targetprocess-mcp.git
cd targetprocess-mcp
```

Note: The `--recursive` flag is required to also clone the documentation search tool submodule.

2. Install dependencies:
```bash
npm install
```

3. Copy the example config:
```bash
cp config/targetprocess.example.json config/targetprocess.json
```

4. Edit `config/targetprocess.json` with your Targetprocess credentials.

### Building

```bash
npm run build
```

### Running

```bash
node build/index.js
```

## API Capabilities

For detailed examples and common use cases, see [USECASES.md](USECASES.md).

The MCP server provides the following tools for interacting with Targetprocess:

### search_entities
Search for Targetprocess entities (UserStory, Bug, Task, Feature) with filtering and includes.
```json
{
  "type": "UserStory",          // Required: Entity type to search for
  "where": "EntityState.Name eq 'Open'", // Optional: Filter expression
  "take": 10,                   // Optional: Number of items to return (default: 100, max: 1000)
  "include": ["Project", "Team"] // Optional: Related data to include
}
```

### get_entity
Get detailed information about a specific entity.
```json
{
  "type": "UserStory",          // Required: Entity type
  "id": 123456,                 // Required: Entity ID
  "include": ["Project", "Team"] // Optional: Related data to include
}
```

### create_entity
Create a new entity in Targetprocess.
```json
{
  "type": "UserStory",          // Required: Entity type to create
  "name": "Story Name",         // Required: Entity name
  "description": "Details...",  // Optional: Entity description
  "project": {                  // Required: Project to create in
    "id": 123
  },
  "team": {                     // Optional: Team to assign
    "id": 456
  }
}
```

### update_entity
Update an existing entity.
```json
{
  "type": "UserStory",          // Required: Entity type
  "id": 123456,                 // Required: Entity ID
  "fields": {                   // Required: Fields to update
    "name": "New Name",
    "description": "New description",
    "status": {
      "id": 789
    }
  }
}
```

### inspect_object
Inspect Targetprocess objects and properties through the API.
```json
{
  "action": "list_types",       // Required: Action to perform
  "entityType": "UserStory",    // Required for some actions: Entity type to inspect
  "propertyName": "Description" // Required for some actions: Property to inspect
}
```

## Performance Considerations

When working with large Targetprocess instances that may contain millions of records:

1. **Use Specific Queries**: Always use the most specific query possible to limit result sets
2. **Limit Result Size**: Use the `take` parameter to limit the number of results returned
3. **Include Only Necessary Data**: Only include related data that you actually need
4. **Consider Pagination**: For large result sets, implement pagination in your application
5. **Batch Operations**: For bulk operations, consider batching requests to avoid overloading the API

## LLM Integration

This MCP server can be used with various AI assistants that support the Model Context Protocol:

- [Cline](https://cline.bot) - A CLI-based AI assistant
- [Claude Desktop](https://claude.ai/download) - Anthropic's desktop application
- [Goose](https://block.github.io/goose/) - A local AI assistant

For configuration and setup instructions, see [llms-install.md](llms-install.md).

## Configuration

The server can be configured either through environment variables or a JSON config file.

### Config File Format

```json
{
  "domain": "your-domain.tpondemand.com",
  "credentials": {
    "username": "your-username",
    "password": "your-password"
  }
}
```

## License

MIT
