# Targetprocess MCP Tools Reference

This directory contains detailed documentation for each tool provided by the Targetprocess MCP. These tools allow AI assistants to interact with your Targetprocess data.

## Available Tools

The Targetprocess MCP provides the following tools:

### Core Entity Management

- [search_entities](search-entities.md) - Search for Targetprocess entities with filtering and includes
- [get_entity](get-entity.md) - Get detailed information about a specific entity
- [create_entity](create-entity.md) - Create a new entity in Targetprocess
- [update_entity](update-entity.md) - Update an existing entity
- [inspect_object](inspect-object.md) - Inspect Targetprocess objects and properties

### Attachment Management

- [analyze_attachment](analyze-attachment.md) - Analyze and display Targetprocess attachments for AI vision analysis

## Common Concepts

All tools share some common concepts:

### Entity Types

Most tools work with specific entity types, which must be one of the supported types:

```
'UserStory', 'Bug', 'Task', 'Feature', 'Epic', 'PortfolioEpic', 
'Solution', 'Request', 'Impediment', 'TestCase', 'TestPlan',
'Project', 'Team', 'Iteration', 'TeamIteration', 'Release', 'Program'
```

### Includes

Many tools support an `include` parameter that lets you fetch related data in a single request. For example:

```json
{
  "include": ["Project", "Team", "AssignedUser"]
}
```

### Error Handling

All tools use consistent error handling. Common error types:

- `InvalidParams`: The provided parameters are invalid
- `InvalidRequest`: The request to the Targetprocess API failed
- `AuthenticationError`: Authentication with Targetprocess failed
- `NotFound`: The requested entity or resource was not found

## API Reference Structure

Each tool's documentation follows the same structure:

1. **Purpose**: What the tool does
2. **Parameters**: Required and optional parameters
3. **Parameter Details**: Detailed explanation of each parameter
4. **Response Format**: What the tool returns
5. **Examples**: Sample usage with inputs and outputs
6. **Common Errors**: Typical errors and how to fix them
7. **Tips and Best Practices**: Recommendations for effective use

## How to Use This Reference

- Start by understanding the overall [data model](../core-concepts.md)
- Identify which tool you need for your specific task
- Check the detailed documentation for that tool
- Refer to the [use cases](../use-cases/README.md) for real-world examples

For more advanced usage patterns, see the [Advanced Usage](../use-cases/advanced-usage.md) document.