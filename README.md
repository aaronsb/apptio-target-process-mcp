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
# Run with Docker
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  ghcr.io/aaronsb/apptio-target-process-mcp
```

### NPX (No Installation Required)

```bash
# Run directly with npx
TP_DOMAIN=your-domain.tpondemand.com TP_USERNAME=your-username TP_PASSWORD=your-password \
  npx -y https://github.com/aaronsb/apptio-target-process-mcp.git
```

[Full installation guide →](docs/integration/installation.md)
[CLI usage guide →](docs/integration/cli-usage.md)

### Claude Code Integration

```bash
# Quick setup for development
./scripts/dev-setup.sh

# Or manual setup
npm install && npm run build
claude mcp add targetprocess node ./build/index.js \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password
```

[Claude Code integration guide →](docs/integration/claude-code.md)

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