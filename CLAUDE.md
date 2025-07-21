# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Targetprocess MCP Server is a Model Context Protocol (MCP) implementation that provides tools for interacting with the Targetprocess project management platform. It enables AI assistants to search, create, update, and query Targetprocess entities through a standardized interface.

## Command Reference

### Building and Running

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run linting
npm run lint

# Run tests
npm run test

# Run a single test file
npm test -- src/__tests__/targetprocess.test.ts

# Build Docker image (quiet mode - logs to /tmp/apptio-target-process-mcp/)
./scripts/docker-build.sh

# Build Docker image with verbose output
./scripts/docker-build.sh --verbose

# Run Docker container (uses .env file)
./scripts/docker-run.sh

# Run Docker container with API key authentication
./scripts/docker-run.sh --api-key

# Run MCP inspector for tool testing
npm run inspector

# Watch mode for development (auto-rebuild on changes)
npm run watch
```

### Documentation Search

The repository includes a documentation scraper/searcher for Targetprocess developer documentation. To use:

```bash
# First time setup (initializes the docs database)
pushd resources/target-process-docs && npm install && ./refresh-docs.sh && popd

# Search documentation
pushd resources/target-process-docs && ./search-docs.sh "your search query" && popd
```

### Configuration

The server can be configured either through environment variables or a JSON config file:

1. Environment variables:
   - `TP_DOMAIN`: Your Targetprocess domain (e.g., company.tpondemand.com)
   - `TP_USERNAME`: Your Targetprocess username
   - `TP_PASSWORD`: Your Targetprocess password

2. Config file:
   - Copy `config/targetprocess.example.json` to `config/targetprocess.json`
   - Edit with your credentials

## Code Architecture

The codebase follows a modular design with three main layers:

### 1. Entities Layer (`/src/entities`)

Models the TargetProcess entity hierarchy, following inheritance patterns:

- **Base Entities**: Core entity types with common properties (`general.entity.ts`)
- **Assignable Entities**: Entities that can be assigned to users (UserStory, Bug, Task, etc.)
- **Project Entities**: Project-related entities (Project, Team, Iteration)

Entity hierarchy:
```
GeneralEntity (base)
├── AssignableEntity
│   ├── UserStory
│   ├── Bug
│   ├── Task
│   ├── Feature
│   └── Epic
└── Non-Assignable Entities
    ├── Project
    ├── Team
    └── Iteration
```

### 2. API Layer (`/src/api`)

Handles API communication and operations:

- **API Client** (`tp.service.ts`): Core API client implementing REST API calls
- **Error Handling**: Includes retry logic with exponential backoff (max 3 retries)
- **Authentication**: Supports both Basic Auth and API token authentication

Key methods in TPService:
- `searchEntities()`: Search with filtering, sorting, and pagination
- `getEntity()`: Get entity by ID with optional includes
- `createEntity()`: Create new entities with validation
- `updateEntity()`: Update existing entities
- `inspectObject()`: Get metadata about entity types
- `getComments()`: Retrieve comments for entities with hierarchy support
- `createComment()`: Create new comments with reply functionality
- `deleteComment()`: Delete comments with proper validation

### 3. Tools Layer (`/src/tools`)

Implements the MCP tools available to AI assistants:

- **search_entities**: Search for Targetprocess entities with filtering capabilities
- **get_entity**: Get detailed information about a specific entity
- **create_entity**: Create new entities with proper validation
- **update_entity**: Update existing entities
- **inspect_object**: Inspect Targetprocess objects and properties

### Additional Components

- **Context Builder** (`/src/context/context-builder.ts`): Builds contextual information for entities
- **Resource Provider** (`/src/resources/resource-provider.ts`): Provides MCP resources for entity types

## Development Patterns

### Error Handling

- API errors are wrapped in `McpError` with appropriate error codes
- Retry logic is implemented for transient errors (5xx status codes)
- No retries for 400 (bad request) or 401 (unauthorized)
- Validation errors provide clear messages to users

### Query Building

- Where clauses use the Targetprocess query syntax with proper validation
- Value formatting handles different types (strings, dates, booleans)
- Field validation ensures proper format for API requests
- Supports operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `in`

Example query patterns:
```typescript
// Simple equality
"Name = 'My Story'"

// Complex conditions
"(Project.Id = 123) and (EntityState.Name != 'Done')"

// Contains operator
"Name contains 'search term'"

// In list operator
"Id in [1, 2, 3]"
```

### Type Safety

- Type definitions follow Targetprocess's data model
- Zod schemas validate input at runtime
- Entity relationships are modeled using TypeScript interfaces
- Use `unknown` instead of `any` for better type safety

## Common Development Tasks

### Adding a new entity type

1. Create a new file in the appropriate entities directory
2. Extend from the appropriate base class
3. Implement required interfaces and methods
4. Add the entity type to the `ENTITY_TYPES` constant in base types

Example:
```typescript
export class NewEntity extends AssignableEntity {
  static readonly entityType = 'NewEntity';
  // Add specific properties
}
```

### Adding a new semantic operation

1. Create operation class implementing `SemanticOperation<TParams>` interface
2. Add to appropriate feature module (e.g., `/src/operations/work/`)
3. Register in feature module's `initializeOperations()` method
4. Add to personality configuration in `/config/personalities/`
5. Include dynamic discovery patterns and intelligent error handling

### Adding a new raw tool

1. Create a tool implementation in the tools directory
2. Define input validation using Zod
3. Register the tool in the server.ts file
4. Add proper error handling and validation

### Updating API client logic

1. Modify TPService methods for new capabilities
2. Ensure proper error handling and type safety
3. Add appropriate retry logic for reliability
4. Update types in `api.types.ts` if needed

## Testing

- Test files are located in `src/__tests__/`
- Use Jest for unit testing
- Mock external API calls when writing tests
- Run `npm test` to execute all tests

## Docker Development

The Docker image is built in multiple stages for optimization:
1. Dependencies stage: Installs production dependencies
2. Build stage: Compiles TypeScript
3. Runtime stage: Minimal runtime image

Local development uses shell scripts in `/scripts/` for convenience.

## Claude Code Integration

For development setup with Claude Code:

```bash
# Quick setup (sets up .env and adds to Claude Code)
./scripts/dev-setup.sh

# Manual add to local project
claude mcp add targetprocess node ./build/index.js \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password
```

After adding, restart Claude Code to access the Targetprocess tools.

## Semantic Operations Configuration

The server supports role-based semantic operations that provide workflow intelligence:

### Environment Configuration

```bash
# Role-based tool filtering
TP_USER_ROLE=developer  # Options: developer, project-manager, tester

# User identity for assignments and time tracking
TP_USER_ID=101734
TP_USER_EMAIL=user@company.com
```

### Available Semantic Operations

**Developer Role:**
- `show_my_tasks` - View assigned tasks with priority filtering
- `start_working_on` - Begin work with state transitions  
- `complete_task` - Mark complete with time logging
- `show_my_bugs` - Analyze bugs with severity insights
- `log_time` - Record time with intelligent discovery
- `add_comment` - Add contextual comments with reply support
- `show_comments` - View comments with hierarchical organization
- `delete_comment` - Delete comments with ownership validation
- `analyze_attachment` - Securely analyze TargetProcess attachments with AI vision support

**Key Features:**
- Dynamic discovery of entity states, priorities, severities
- Intelligent error handling with actionable guidance
- Context-aware workflow suggestions
- Graceful fallback for API discovery failures

## IBM watsonx Orchestrate Integration

The MCP server can be imported as a toolkit in IBM watsonx Orchestrate:

```bash
# Import all tools
orchestrate toolkits import \
  --kind mcp \
  --name targetprocess \
  --package-root /path/to/apptio-target-process-mcp \
  --command '["node", "build/index.js"]' \
  --tools "*"

# Import specific tools only
orchestrate toolkits import \
  --kind mcp \
  --name targetprocess \
  --package-root /path/to/apptio-target-process-mcp \
  --command '["node", "build/index.js"]' \
  --tools "search_entities,get_entity"

# With app connection
orchestrate toolkits import \
  --kind mcp \
  --name targetprocess \
  --package-root /path/to/apptio-target-process-mcp \
  --command '["node", "build/index.js"]' \
  --tools "*" \
  --app-id "your_targetprocess_app_id"
```

See the [toolkit integration guide](docs/integration/toolkit-integration.md) for detailed instructions.

## Recent Changes

- Updated to MCP SDK version 1.11.1
- Added architecture documentation with system diagrams
- Modular architecture refactoring for better maintainability
- Improved query system with better validation and error handling
- Added context builder and resource provider components
- Added IBM watsonx Orchestrate toolkit integration support
- **Implemented true semantic comment operations (Issue #51)** - Transformed add-comment, show-comments, and delete-comment from basic API wrappers into intelligent semantic operations with:
  - Dynamic discovery of comment capabilities and templates
  - Entity context detection (workflow stage, blocked status, timing, assignments)
  - Role-based templates and formatting (developer, tester, PM, PO)
  - Pattern recognition in comments (blockers, decisions, key discussions)
  - Rich text support with Markdown to HTML conversion
  - Hierarchical comment threading with parent/child relationships
  - User mention resolution with @-mention support
  - Performance tracking with 500ms target
  - Educational error responses with actionable guidance
  - Comprehensive test coverage (first semantic operations with full tests)
- **Fixed metadata endpoint issues (Issue #56)** - Implemented hybrid approach for metadata fetching:
  - Primary: `/EntityTypes` endpoint for reliable entity information
  - Secondary: `/meta` endpoint for detailed properties when available
  - Fallback: EntityRegistry for system types
  - Graceful degradation when endpoints fail
  - Enhanced error handling with informative messages
- **Implemented secure attachment analysis (Based on PR #21)** - Added AI vision-ready attachment processing with security-first approach:
  - Security validation: MIME type whitelist, file size limits (50MB max), suspicious filename detection
  - Safe base64 encoding for AI framework consumption
  - Model-agnostic output format (works with Claude, GPT-4V, etc.)
  - Support for images and safe document types
  - Performance tracking and educational error responses

## Architecture Notes

**All operations are semantic operations** - The server is designed so that all user-facing operations go through the semantic layer and `formatSemanticResult()`. This ensures consistent behavior, automatic pagination, and proper result formatting across all tools. Raw MCP tools should only be used for internal system operations.