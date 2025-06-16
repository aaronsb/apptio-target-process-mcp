# Targetprocess MCP Server

## What is this?

The Targetprocess MCP Server enables AI assistants to interact with your Targetprocess data through intelligent semantic operations. Beyond basic data access, it provides workflow-aware tools that understand context, suggest next steps, and adapt to your Targetprocess configuration automatically.

## Why use it?

- **Intelligent Workflows**: Semantic operations that understand your work context and suggest logical next steps
- **Dynamic Discovery**: Automatically adapts to your Targetprocess configuration without hard-coded assumptions
- **Role-Based Tools**: Operations filtered by your role (developer, project manager, tester, etc.)
- **Smart Error Handling**: Transforms API failures into actionable guidance and learning opportunities
- **Stay in Flow**: Complete full workflows without switching to the Targetprocess UI
- **Enterprise Ready**: Handles complex schemas and millions of records with robust authentication and error handling

## Quick Start

### Docker (Recommended for Containerized Environments)

```bash
# Basic usage
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  ghcr.io/aaronsb/apptio-target-process-mcp

# With semantic operations and strict mode (recommended for MCP clients)
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=your-user-id \
  -e TP_USER_EMAIL=your-email \
  -e MCP_STRICT_MODE=true \
  ghcr.io/aaronsb/apptio-target-process-mcp
```

### NPX (No Installation Required)

```bash
# Basic usage
TP_DOMAIN=your-domain.tpondemand.com TP_USERNAME=your-username TP_PASSWORD=your-password \
  npx -y https://github.com/aaronsb/apptio-target-process-mcp.git

# With semantic operations and strict mode (recommended for MCP clients)
TP_DOMAIN=your-domain.tpondemand.com TP_USERNAME=your-username TP_PASSWORD=your-password \
TP_USER_ROLE=developer TP_USER_ID=your-user-id TP_USER_EMAIL=your-email \
MCP_STRICT_MODE=true \
  npx -y https://github.com/aaronsb/apptio-target-process-mcp.git
```

[Full installation guide →](docs/integration/installation.md)
[CLI usage guide →](docs/integration/cli-usage.md)

### Claude Code Integration

```bash
# Quick setup for development
./scripts/dev-setup.sh

# Basic manual setup
npm install && npm run build
claude mcp add targetprocess node ./build/index.js \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password

# With semantic operations (recommended)
claude mcp add targetprocess node ./build/index.js \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=your-user-id \
  -e TP_USER_EMAIL=your-email \
  -e MCP_STRICT_MODE=true
```

[Claude Code integration guide →](docs/integration/claude-code.md)

### MCP Client Configuration

**Strict Mode:** For MCP clients that require clean JSON-RPC on stdio (like Claude Desktop), enable strict mode to redirect all logging to stderr:

```bash
# Environment variable
MCP_STRICT_MODE=true

# Auto-detection also works for:
# - Claude Desktop (stdio transport)
# - Non-TTY environments
# - When --stdio flag is present
```

**Semantic Operations:** Enable intelligent workflow tools with role-based filtering:

```bash
TP_USER_ROLE=developer        # Options: developer, project-manager, tester
TP_USER_ID=your-user-id       # For task assignments and time tracking  
TP_USER_EMAIL=your-email      # Identity for semantic operations
```

**Why Enable Semantic Operations?**
- **Context-Aware Tools**: Get `show_my_tasks`, `start_working_on`, `complete_task` instead of just raw API calls
- **Intelligent Discovery**: Operations adapt to your TargetProcess configuration without hard-coded assumptions
- **Workflow Guidance**: Smart error handling transforms failures into actionable next steps
- **Role-Based Filtering**: Only see tools relevant to your role (developer, PM, tester)

### Configuration Examples

#### 1. NPX (No Installation Required)

```bash
# Basic usage
TP_DOMAIN=your-domain.tpondemand.com TP_USERNAME=your-username TP_PASSWORD=your-password \
  npx -y https://github.com/aaronsb/apptio-target-process-mcp.git

# With semantic operations (recommended)
TP_DOMAIN=your-domain.tpondemand.com TP_USERNAME=your-username TP_PASSWORD=your-password \
TP_USER_ROLE=developer TP_USER_ID=your-user-id TP_USER_EMAIL=your-email \
MCP_STRICT_MODE=true \
  npx -y https://github.com/aaronsb/apptio-target-process-mcp.git
```

#### 2. Docker

```bash
# Basic usage
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  ghcr.io/aaronsb/apptio-target-process-mcp

# With semantic operations (recommended)
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=your-user-id \
  -e TP_USER_EMAIL=your-email \
  -e MCP_STRICT_MODE=true \
  ghcr.io/aaronsb/apptio-target-process-mcp
```

#### 3. Claude Desktop Configuration

Add to your Claude Desktop configuration file (`~/.config/Claude/claude_desktop_config.json`):

**Using Docker:**
```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "TP_USERNAME",
        "-e", "TP_PASSWORD", 
        "-e", "TP_DOMAIN",
        "-e", "TP_USER_ROLE",
        "-e", "TP_USER_ID",
        "-e", "TP_USER_EMAIL",
        "-e", "MCP_STRICT_MODE",
        "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
      ],
      "env": {
        "TP_USERNAME": "your-username",
        "TP_PASSWORD": "your-password",
        "TP_DOMAIN": "your-domain.tpondemand.com",
        "TP_USER_ROLE": "developer",
        "TP_USER_ID": "your-user-id",
        "TP_USER_EMAIL": "your-email@company.com",
        "MCP_STRICT_MODE": "true"
      },
      "disabled": false,
      "transportType": "stdio"
    }
  }
}
```

**Using NPX:**
```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "npx",
      "args": ["-y", "https://github.com/aaronsb/apptio-target-process-mcp.git"],
      "env": {
        "TP_USERNAME": "your-username",
        "TP_PASSWORD": "your-password",
        "TP_DOMAIN": "your-domain.tpondemand.com",
        "TP_USER_ROLE": "developer",
        "TP_USER_ID": "your-user-id",
        "TP_USER_EMAIL": "your-email@company.com",
        "MCP_STRICT_MODE": "true"
      },
      "disabled": false,
      "transportType": "stdio"
    }
  }
}
```

#### 4. Claude Code Integration

```bash
# Quick setup for development
./scripts/dev-setup.sh

# Manual setup with Docker
claude mcp add targetprocess docker \
  -a "run" -a "-i" -a "--rm" \
  -a "-e" -a "TP_DOMAIN" \
  -a "-e" -a "TP_USERNAME" \
  -a "-e" -a "TP_PASSWORD" \
  -a "-e" -a "TP_USER_ROLE" \
  -a "-e" -a "TP_USER_ID" \
  -a "-e" -a "TP_USER_EMAIL" \
  -a "-e" -a "MCP_STRICT_MODE" \
  -a "ghcr.io/aaronsb/apptio-target-process-mcp:latest" \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=your-user-id \
  -e TP_USER_EMAIL=your-email \
  -e MCP_STRICT_MODE=true

# Manual setup with local build
npm install && npm run build
claude mcp add targetprocess node ./build/index.js \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=your-user-id \
  -e TP_USER_EMAIL=your-email \
  -e MCP_STRICT_MODE=true
```

#### 5. Local Development (Built from Source)

```bash
# Build and run locally
npm install && npm run build
node ./build/index.js

# For MCP clients requiring JSON config
```

**JSON Configuration for MCP Clients:**
```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "node",
      "args": ["/path/to/apptio-target-process-mcp/build/index.js"],
      "env": {
        "TP_USERNAME": "your-username",
        "TP_PASSWORD": "your-password",
        "TP_DOMAIN": "your-domain.tpondemand.com",
        "TP_USER_ROLE": "developer",
        "TP_USER_ID": "your-user-id",
        "TP_USER_EMAIL": "your-email@company.com",
        "MCP_STRICT_MODE": "true"
      },
      "disabled": false,
      "transportType": "stdio"
    }
  }
}
```

### IBM watsonx Orchestrate Integration

```bash
# Import as a toolkit in watsonx Orchestrate
orchestrate toolkits import \
  --kind mcp \
  --name targetprocess \
  --package-root /path/to/apptio-target-process-mcp \
  --command '["node", "build/index.js"]' \
  --tools "*"
```

[Toolkit integration guide →](docs/integration/toolkit-integration.md)

## What can I do with it?

```
# Examples of what you can ask your AI assistant:

"Show me all open user stories in the mobile app project"
"Create a bug for the authentication failure on the login page"
"What's the status of our Q2 release?"
"Update the priority of story #12345 to high"
"Show me all tasks assigned to Sarah"
"Which team has the most open bugs right now?"
```

[More use cases →](docs/use-cases/README.md)

## Documentation

- [Getting Started](docs/getting-started.md) - First steps and basic usage
- [Core Concepts](docs/core-concepts.md) - Understanding the key components
- [Tools Reference](docs/tools/README.md) - Detailed API documentation
- [Use Cases](docs/use-cases/README.md) - Common workflows and examples
- [AI Integration](docs/integration/README.md) - Setting up with Claude, ChatGPT, etc.
- [Architecture](docs/architecture/README.md) - System design and implementation
- [Development](docs/development/README.md) - Contributing and extending

## Features

### Semantic Operations (Workflow Intelligence)
- **show_my_tasks**: View assigned tasks with smart filtering and priority analysis
- **start_working_on**: Begin work on tasks with automatic state transitions
- **complete_task**: Mark tasks complete with integrated time logging and comments
- **show_my_bugs**: Analyze assigned bugs with dynamic severity categorization
- **log_time**: Record time with intelligent entity type discovery and validation
- **add_comment**: Add contextual comments with workflow-aware follow-up suggestions

### Core API Tools
- **Entity Management**: Create, read, update, and search Targetprocess entities
- **Complex Queries**: Filter items by custom fields, status, relationships, and more
- **Data Discovery**: Explore entity types, properties, and relationships
- **Rich Includes**: Retrieve related data in a single request

### Enterprise Features
- **Role-Based Access**: Tools filtered by personality configuration (developer, PM, tester)
- **Dynamic Discovery**: Adapts to custom Targetprocess configurations automatically
- **Error Resilience**: Transforms API failures into actionable guidance
- **Documentation Access**: Built-in access to Targetprocess documentation
- **LLM Integration**: Works with Claude, ChatGPT, and other AI assistants

## License

MIT