# Targetprocess MCP Server

A Model Context Protocol (MCP) server for interacting with Targetprocess API.

## Development Paths

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
