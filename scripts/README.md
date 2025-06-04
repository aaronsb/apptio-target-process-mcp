# Scripts Directory

This directory contains helper scripts for development and deployment of the Targetprocess MCP server.

## Development Scripts

### `dev-setup.sh`
Complete development environment setup:
- Installs dependencies
- Builds the project
- Sets up `.env` file
- Adds MCP server to Claude Code

**Usage:** `./scripts/dev-setup.sh`

### `setup-env.sh`
Creates or updates the `.env` file from `.env.example`.

**Usage:** `./scripts/setup-env.sh`

## Docker Scripts

### `docker-build.sh`
Builds a complete Docker image with full CI pipeline:
- Installs dependencies
- Runs linting
- Runs tests  
- Builds TypeScript
- Creates Docker image

**Features:**
- Quiet mode by default (logs to `/tmp/apptio-target-process-mcp/`)
- Protects AI tools from verbose build output
- `--verbose` flag for detailed output

**Usage:** 
```bash
./scripts/docker-build.sh          # Quiet mode
./scripts/docker-build.sh --verbose # Verbose output
```

### `docker-run.sh`
Runs the Docker container with proper environment configuration:
- Sources credentials from `.env` file
- Supports both basic auth and API key authentication  
- Provides helpful error messages and hints
- Checks for Docker image existence

**Usage:**
```bash
./scripts/docker-run.sh              # Basic auth from .env
./scripts/docker-run.sh --api-key    # API key auth from .env
./scripts/docker-run.sh --verbose    # Show Docker command
./scripts/docker-run.sh --help       # Show help
```

## Why These Scripts?

### AI Context Protection
The docker build process can generate hundreds of lines of output. The `docker-build.sh` script:
- Logs verbose output to temporary files
- Shows only success/failure status  
- Prevents AI tools from consuming excessive context with build logs
- Preserves AI context window for actual development work

### Consistent Development Flow
All scripts follow npm conventions where possible. If you need simple operations:
- `npm install` - Install dependencies
- `npm run build` - Build TypeScript only
- `npm run lint` - Run linting only
- `npm test` - Run tests only

Use the shell scripts for:
- Complex workflows (docker builds)
- Environment setup
- AI-friendly operations