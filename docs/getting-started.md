# Getting Started with Targetprocess MCP

This guide will help you quickly set up and start using the Targetprocess MCP Server with your AI assistant.

## Prerequisites

- **Targetprocess Account**: You need a valid Targetprocess account with API access.
- **Docker** (for containerized deployment) or **Node.js 20+** (for local development).
- **AI Assistant**: An LLM that supports the Model Context Protocol (Claude, ChatGPT, etc.).

## Installation Options

### Quick Start with Docker

The fastest way to get started is using the pre-built Docker image:

```bash
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  ghcr.io/aaronsb/apptio-target-process-mcp
```

### Local Development Setup

For development or customization:

1. Clone the repository:
   ```bash
   git clone --recursive https://github.com/aaronsb/apptio-target-process-mcp.git
   cd apptio-target-process-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure credentials:
   ```bash
   cp config/targetprocess.example.json config/targetprocess.json
   # Edit config/targetprocess.json with your credentials
   ```

4. Build and run:
   ```bash
   npm run build
   node build/index.js
   ```

For more detailed installation options, see the [Installation Guide](integration/installation.md).

## Connecting to Your AI Assistant

### Claude Desktop

1. Open Claude Desktop settings
2. Add the MCP server configuration
3. Use the included example configuration

### Cline

1. Edit your Cline configuration
2. Add the Targetprocess MCP server
3. Test the connection

For detailed instructions for each AI assistant, see the [AI Integration Guide](integration/README.md).

## Your First Queries

Once connected, you can start interacting with Targetprocess through your AI assistant:

### Basic Queries

- **Find open user stories**: "Show me open user stories in Project X"
- **Get entity details**: "Show details for Bug #12345"
- **Create an entity**: "Create a new task for implementing login feature"

### Tips for Good Results

- Be specific about the entity type (User Story, Bug, Task, etc.)
- Include relevant filtering criteria (project, status, assignee)
- For complex operations, provide all required fields

## Example Conversation

Here's an example conversation with your AI assistant using the Targetprocess MCP:

```
You: Show me open user stories in the Mobile App project

AI: I'll search for open user stories in the Mobile App project.

[AI uses search_entities tool]

I found 5 open user stories in the Mobile App project:

1. #1234: "Implement user authentication"
   - Priority: High
   - Assigned to: John Smith
   
2. #1235: "Add push notification support"
   - Priority: Medium
   - Assigned to: Jane Doe
   
3. #1236: "Optimize image loading"
   - Priority: Low
   - Assigned to: Unassigned

4. #1237: "Fix login screen layout on small devices"
   - Priority: Medium
   - Assigned to: John Smith

5. #1238: "Add dark mode support"
   - Priority: Low
   - Assigned to: Jane Doe

You: Create a new task for implementing OAuth in user story #1234

AI: I'll create a new task for implementing OAuth in user story #1234.

[AI uses create_entity tool]

Task created successfully!

Task #1569: "Implement OAuth 2.0 for authentication"
- Added to User Story #1234
- Status: Open
- Priority: High

You: What's the overall progress on the Mobile App project?

AI: Let me check the progress of the Mobile App project.

[AI uses multiple tools to gather data]

Mobile App Project Progress:
- Total stories: 15
- Completed: 6 (40%)
- In progress: 4 (26.7%)
- Open: 5 (33.3%)
- Team velocity: 8 story points per iteration
- Estimated completion: 2 iterations
```

## Next Steps

Now that you've set up the Targetprocess MCP and tried some basic queries, you can:

1. Explore the [Use Cases](use-cases/README.md) for more examples of how to use the MCP
2. Learn about the [Core Concepts](core-concepts.md) to understand how the MCP works
3. Read the [Tools Reference](tools/README.md) for detailed API documentation
4. Check out [Advanced Usage](use-cases/advanced-usage.md) for complex query patterns

## Troubleshooting

If you encounter issues:

- Ensure your Targetprocess credentials are correct
- Check that your account has API access permissions
- Verify Docker is running (if using the Docker image)
- Check the MCP server logs for detailed error messages

For more help, see the [Troubleshooting Guide](integration/troubleshooting.md) or file an issue on GitHub.