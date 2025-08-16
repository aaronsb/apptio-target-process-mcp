# 🎯 Targetprocess MCP Server

[<img src="https://github.com/user-attachments/assets/a32b59f5-da64-4597-935f-5e3d973f72e9" width="100%">](https://www.targetprocess.com)

An [MCP](https://github.com/modelcontextprotocol/specification) (Model Context Protocol) server implementation for [Targetprocess](https://www.targetprocess.com/) project management platform, providing semantic AI-powered operations alongside traditional API access.

Turn your AI assistant into a Targetprocess power user - manage projects, track work, and update tasks through natural conversation.

## Installation

Choose your preferred method:

### 🤖 [Claude Desktop](docs/configuration/claude-desktop.md)
Native integration with Anthropic's Claude Desktop app.

```json
{
  "mcpServers": {
    "targetprocess": {
      "command": "npx",
      "args": ["-y", "https://github.com/aaronsb/apptio-target-process-mcp.git"],
      "env": {
        "TP_DOMAIN": "your-domain.tpondemand.com",
        "TP_API_KEY": "your-api-key"
      }
    }
  }
}
```

[Full Claude Desktop guide →](docs/configuration/claude-desktop.md)

### 📂 [Claude Code](docs/configuration/claude-code.md)
Use with Anthropic's Claude Code IDE (claude.ai/code)

```bash
# Add to project
claude mcp add targetprocess npm run targetprocess

# Configure .env
TP_DOMAIN=your-domain.tpondemand.com
TP_API_KEY=your-api-key
```

[Full Claude Code guide →](docs/configuration/claude-code.md)

### 🐳 [Docker](docs/configuration/docker.md)
Run in an isolated container environment.

```bash
# With API key (recommended)
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  ghcr.io/aaronsb/apptio-target-process-mcp

# With role-specific tools and strict mode (recommended for MCP clients)
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

[Full Docker configuration guide →](docs/configuration/docker.md)

### 📦 [NPX](docs/configuration/npx.md)
Zero installation required. Perfect for trying out the server.

```bash
# With API key (recommended)
TP_DOMAIN=your-domain.tpondemand.com TP_API_KEY=your-api-key \
  npx -y https://github.com/aaronsb/apptio-target-process-mcp.git

# With role-specific tools and strict mode (recommended for MCP clients)
TP_DOMAIN=your-domain.tpondemand.com TP_USERNAME=your-username TP_PASSWORD=your-password \
TP_USER_ROLE=developer TP_USER_ID=your-user-id TP_USER_EMAIL=your-email \
MCP_STRICT_MODE=true \
  npx -y https://github.com/aaronsb/apptio-target-process-mcp.git
```

[Full NPX configuration guide →](docs/configuration/npx.md)

### 💻 [Local Development](docs/configuration/local-development.md)
Clone and run locally for development.

```bash
# Clone and setup
git clone https://github.com/aaronsb/apptio-target-process-mcp.git
cd apptio-target-process-mcp
npm install

# Configure
cp .env.example .env
# Edit .env with your credentials

# With role-specific tools and strict mode
TP_USER_ROLE=developer \
  TP_USER_ID=your-user-id \
  TP_USER_EMAIL=your-email \
  MCP_STRICT_MODE=true
```

[Full local development guide →](docs/configuration/local-development.md)

## Configuration

### API Authentication

#### Option 1: API Key (Recommended)
1. Go to Targetprocess → Settings → Access Tokens
2. Create a new token
3. Set `TP_API_KEY` environment variable

#### Option 2: Basic Auth
Set both:
- `TP_USERNAME`: Your Targetprocess username
- `TP_PASSWORD`: Your Targetprocess password

⚠️ **Security Note**: Never commit credentials to version control. Use environment variables or `.env` files (gitignored).

### Available Tools

The server provides these MCP tools to AI assistants:

| Tool | Description |
|------|-------------|
| **search_entities** | Search with powerful filtering, sorting, and includes |
| **get_entity** | Retrieve detailed entity information |
| **create_entity** | Create new work items with validation |
| **update_entity** | Update existing entities |
| **inspect_object** | Explore entity types and properties |

### Role-Specific Tools

All tools provide semantic hints and workflow suggestions. When you configure a user role, you get **additional specialized tools**:

| Role | Additional Tools |
|------|------------------|
| `developer` | `show_my_tasks`, `start_working_on`, `complete_task`, `show_my_bugs`, `log_time` |
| `project-manager` | Project oversight and team management tools |
| `tester` | Test case and bug management tools |
| `product-owner` | Backlog and feature prioritization tools |

```bash
# Enable role-specific tools
TP_USER_ROLE=developer        # Your role
TP_USER_ID=your-user-id       # For assignments
TP_USER_EMAIL=your-email      # For identification
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `TP_DOMAIN` | Yes | Your Targetprocess domain (e.g., company.tpondemand.com) |
| `TP_API_KEY` | Yes* | API key for authentication (recommended) |
| `TP_USERNAME` | Yes* | Username for basic authentication |
| `TP_PASSWORD` | Yes* | Password for basic authentication |
| `TP_USER_ROLE` | No | Enable role-specific tools: `developer`, `project-manager`, `tester`, `product-owner` |
| `TP_USER_ID` | No | Your Targetprocess user ID (for assignments) |
| `TP_USER_EMAIL` | No | Your email (for identification) |
| `MCP_STRICT_MODE` | No | Set to `true` for MCP clients requiring clean JSON-RPC |

*Either API key or username/password required

For detailed configuration examples, see the guides above.

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

### Role-Specific Tools (Developer Role)
When configured with `TP_USER_ROLE=developer`, these additional tools become available:
- **show_my_tasks**: View assigned tasks with smart filtering and priority analysis
- **start_working_on**: Begin work on tasks with automatic state transitions
- **complete_task**: Mark tasks complete with integrated time logging and comments
- **show_my_bugs**: Analyze assigned bugs with dynamic severity categorization
- **log_time**: Record time with intelligent entity type discovery and validation
- **add_comment**: Add contextual comments with workflow-aware follow-up suggestions

Note: All tools (both core and role-specific) provide semantic hints and workflow suggestions.

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