# Targetprocess MCP Server

## What is this?

The Targetprocess MCP Server enables AI assistants to interact with your Targetprocess data through intelligent semantic operations. Beyond basic data access, it provides workflow-aware tools that understand context, suggest next steps, and adapt to your Targetprocess configuration automatically.

## ⚠️ IMPORTANT: Not Just Another API Wrapper!

> **This project implements SEMANTIC OPERATIONS** - intelligent, context-aware workflows that understand how people actually work. We're not building simple API wrappers; we're building tools that think.
> 
> **Before contributing**, you MUST understand our semantic operations philosophy:
> - 📖 Read [CONTRIBUTING.md](CONTRIBUTING.md) - Mandatory reading for all contributors
> - 🧠 Study [Semantic Operations Documentation](docs/semantic-operations/) - The heart of this project
> - 🎯 Operations adapt to user context, not just expose CRUD endpoints
> - 🔄 Dynamic discovery over hard-coded assumptions
> 
> **If you're here to add "just another API endpoint wrapper" - please reconsider.** We need contributors who understand and embrace the semantic operations approach.

## Why use it?

- **Intelligent Workflows**: Semantic operations that understand your work context and suggest logical next steps
- **Dynamic Discovery**: Automatically adapts to your Targetprocess configuration without hard-coded assumptions
- **Role-Based Tools**: Operations filtered by your role (developer, project manager, tester, etc.)
- **Smart Error Handling**: Transforms API failures into actionable guidance and learning opportunities
- **Stay in Flow**: Complete full workflows without switching to the Targetprocess UI
- **Enterprise Ready**: Handles complex schemas and millions of records with robust authentication and error handling

## MCP Registry Support

This MCP server is available through multiple MCP registries:

- **[Smithery.ai](https://smithery.ai)** - Install directly from the Smithery registry
- **[Cprime](https://cprime.com)** - Available through Cprime's MCP catalog

Each registry maintains its own configuration branch with platform-specific settings while staying synchronized with the latest features and updates.

## Quick Start

Choose your preferred setup method:

### 🐳 [Docker](docs/configuration/docker.md)
Best for production and containerized environments. No local installation required.

```bash
# With API key (recommended)
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  ghcr.io/aaronsb/apptio-target-process-mcp
```

[Full Docker configuration guide →](docs/configuration/docker.md)

### 📦 [NPX](docs/configuration/npx.md)
Zero installation required. Perfect for trying out the server.

```bash
# With API key (recommended)
TP_DOMAIN=your-domain.tpondemand.com TP_API_KEY=your-api-key \
  npx -y https://github.com/aaronsb/apptio-target-process-mcp.git
```

[Full NPX configuration guide →](docs/configuration/npx.md)

### 🖥️ [Claude Desktop](docs/configuration/claude-desktop.md)
Integrate with Claude Desktop app for a seamless AI assistant experience.

[Full Claude Desktop configuration guide →](docs/configuration/claude-desktop.md)

### 💻 [Claude Code](docs/configuration/claude-code.md)
Development-focused integration with Claude Code.

```bash
# Quick setup
./scripts/dev-setup.sh
```

[Full Claude Code configuration guide →](docs/configuration/claude-code.md)

### 🛠️ [Local Development](docs/configuration/local-development.md)
For contributors and developers who want to modify the server.

[Full local development guide →](docs/configuration/local-development.md)

## Configuration Options

### Authentication Methods

- **API Key** (Recommended): Use `TP_API_KEY` for secure, token-based authentication
- **Username/Password**: Use `TP_USERNAME` and `TP_PASSWORD` for basic authentication

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