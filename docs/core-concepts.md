# Core Concepts

This document explains the key concepts and components of the Targetprocess MCP and how they work together to enable AI-driven interaction with your Targetprocess data.

## What is the Model Context Protocol (MCP)?

The Model Context Protocol (MCP) is a standard that enables AI assistants to interact with external tools and services through a unified interface. It allows AI models like Claude or ChatGPT to:

1. Discover what tools are available
2. Understand how to use those tools
3. Call the tools with appropriate parameters
4. Process and interpret tool responses

MCP servers like this one provide these capabilities by exposing well-defined tools and resources that AI assistants can use to accomplish tasks.

## Targetprocess Data Model

Understanding the Targetprocess data model is essential to using the MCP effectively:

### Entity Types

Targetprocess organizes work into different entity types:

- **UserStory**: Represents a feature from the user's perspective
- **Task**: A specific piece of work, often part of a User Story
- **Bug**: A defect that needs to be fixed
- **Feature**: A collection of related User Stories
- **Epic**: A large body of work containing multiple Features
- **Project**: A container for work items with a shared goal
- **Team**: A group of users working together
- **Iteration**: A time-boxed period for completing work

### Entity Relationships

Entities in Targetprocess have hierarchical relationships:

```
Epic → Feature → User Story → Task/Bug
```

And organizational relationships:

```
Project → Team → User
```

### Custom Fields

Targetprocess supports custom fields to extend the base data model. These vary by implementation but can be accessed through the MCP.

## MCP Tools

The Targetprocess MCP provides several tools for interacting with Targetprocess data:

### search_entities

Searches for entities based on type and filter criteria. Supports complex filters, includes, and pagination.

### get_entity

Retrieves detailed information about a specific entity by ID, with optional related data.

### create_entity

Creates a new entity in Targetprocess with the specified properties.

### update_entity

Updates an existing entity with new field values.

### inspect_object

Inspects Targetprocess objects and properties, enabling metadata discovery.

## Query Capabilities

The Targetprocess MCP supports powerful query capabilities:

### Where Clauses

Filter entities using where clauses:

```
EntityState.Name eq 'Open' and Team.Name eq 'DevOps'
```

### Includes

Fetch related data in a single request:

```
Include: ["Project", "Team", "AssignedUser"]
```

### Ordering

Sort results by specific fields:

```
OrderBy: ["Priority.Importance desc", "CreateDate asc"]
```

## Handling Large Datasets

When working with large Targetprocess instances:

1. **Specific Queries**: Use specific where clauses to limit results
2. **Pagination**: Use take parameter to limit result size
3. **Limited Includes**: Only include data you actually need
4. **Step-by-Step Exploration**: Explore large data sets incrementally

## Error Handling

The MCP provides robust error handling:

1. **Input Validation**: Parameters are validated before API calls
2. **Informative Messages**: Error messages provide actionable information
3. **Retry Logic**: Automatic retries for transient errors
4. **API Discovery**: Some errors can be used to discover API capabilities

## Security Model

The Targetprocess MCP uses:

1. **Authentication**: Username/password or token-based auth
2. **Permission Inheritance**: Operations inherit the permissions of the authenticated user
3. **Secure Credentials**: Credentials can be provided via environment variables or config file
4. **Validation**: All inputs are validated to prevent injection attacks

## Resource Discovery

The MCP includes mechanisms to discover Targetprocess resources:

1. **Entity Type Discovery**: List available entity types
2. **Property Exploration**: Discover properties for each entity type
3. **Relationship Mapping**: Understand how entities relate to each other
4. **API Structure Discovery**: Extract API capabilities from responses and errors

Understanding these core concepts will help you interact effectively with Targetprocess through the MCP.