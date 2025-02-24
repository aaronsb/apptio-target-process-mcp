# Targetprocess MCP Server

A Model Context Protocol (MCP) server for interacting with Targetprocess API.

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

1. Clone the repository:
```bash
git clone https://github.com/modelcontextprotocol/targetprocess-mcp.git
cd targetprocess-mcp
```

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
  "take": 10,                   // Optional: Number of items to return (default: 10, max: 1000)
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
