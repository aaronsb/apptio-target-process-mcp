# Targetprocess MCP Server

## What is this?

The Targetprocess MCP Server enables AI assistants to interact with your Targetprocess data, letting you query, create, and manage work items through natural language. Ask questions about your projects, update work items, and get insights without switching contexts.

## Why use it?

- **Talk to Your Data**: Ask questions about user stories, bugs, and projects in natural language
- **Stay in Flow**: Update work items without switching to the Targetprocess UI
- **Discover Relationships**: Understand how projects, features, and stories connect
- **Automate Reporting**: Generate custom reports and dashboards through conversation
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

- **Entity Management**: Create, read, update, and search Targetprocess entities
- **Complex Queries**: Filter items by custom fields, status, relationships, and more
- **Data Discovery**: Explore entity types, properties, and relationships
- **Rich Includes**: Retrieve related data in a single request
- **Enterprise Support**: Handles complex schemas with millions of records
- **Error Resilience**: Robust error handling and clear feedback
- **Documentation Access**: Built-in access to Targetprocess documentation
- **LLM Integration**: Works with Claude, ChatGPT, and other AI assistants

## License

MIT