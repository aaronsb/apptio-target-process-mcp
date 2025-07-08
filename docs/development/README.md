# Development Guide

This directory contains documentation on development practices, patterns, and processes for the Targetprocess MCP server.

## Current Documentation

- **README.md** (this file) - Main development guide with modular architecture patterns
- **semantic-hints-pattern.md** - Pattern for contextual workflow guidance in semantic operations
- **tp-docs-findings.md** - Analysis of the Targetprocess documentation scraper tool

## Archived Documentation

Historical planning and refactor documents have been moved to the `archive/` directory. These documents were used during the initial implementation of semantic operations and are preserved for historical context:

- **semantic-refactor-summary.md** - Initial refactor summary from WordPress MCP analysis
- **semantic-architecture-plan.md** - Original planning document for semantic operations
- **wordpress-mcp-analysis.md** - Analysis of WordPress MCP patterns

These archived documents served their purpose during development but are no longer actively maintained. The current implementation is documented in the main [Semantic Operations Documentation](../semantic-operations/).

## Getting Started with Development

To set up a development environment:

1. **Clone the repository recursively**:
   ```bash
   git clone --recursive https://github.com/aaronsb/apptio-target-process-mcp.git
   cd apptio-target-process-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure credentials**:
   ```bash
   cp config/targetprocess.example.json config/targetprocess.json
   # Edit config/targetprocess.json with your credentials
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Run the server**:
   ```bash
   node build/index.js
   ```

## Development Tools

### Documentation Search

The repository includes a documentation scraper/searcher for Targetprocess developer documentation as a submodule (`resources/target-process-docs`). This tool provides a local search interface for quickly finding relevant documentation.

To use:
1. Ensure the submodule is initialized: `git submodule update --init`

2. First time setup (from project root):
   ```bash
   pushd resources/target-process-docs && npm install && ./refresh-docs.sh && popd
   ```
   This will install dependencies and perform the initial documentation scrape and indexing.

3. To search the documentation (can be run from any directory):
   ```bash
   pushd resources/target-process-docs && ./search-docs.sh "your search query" && popd
   ```
   Example: `pushd resources/target-process-docs && ./search-docs.sh "entity states" && popd`

Why pushd/popd?
- The search tool uses relative paths to find its documentation database
- pushd saves your current directory location
- Temporarily changes to the tool's directory to run the command
- popd automatically returns you to your previous location
This approach means you can run searches from any directory in your project while ensuring the tool works correctly.

This tool is particularly useful when:
- Implementing new API integrations
- Understanding TargetProcess entity relationships
- Looking up API endpoints and parameters
- Researching TargetProcess features and capabilities

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
src/
  ├── api/          # API client and service layer
  │   └── client/   # Targetprocess API client
  ├── entities/     # Entity type definitions
  │   ├── assignable/ # Assignable entity types
  │   └── base/     # Base entity types
  ├── tools/        # MCP tool implementations
  │   ├── entity/   # Entity-specific tools
  │   ├── inspect/  # Inspection tools
  │   ├── search/   # Search tools
  │   └── update/   # Update tools
  ├── index.ts      # Application entry point
  └── server.ts     # MCP server implementation
```

## Coding Patterns

### Tool Implementation Pattern

All tools follow a consistent pattern:

```typescript
// Input schema for the tool
export const toolNameSchema = z.object({
  // Tool parameters...
});

export type ToolNameInput = z.infer<typeof toolNameSchema>;

// Tool implementation
export class ToolNameTool {
  constructor(private service: TPService) {}

  // Execute method handles the tool logic
  async execute(args: unknown) {
    try {
      // Parse and validate input
      const parsedArgs = toolNameSchema.parse(args);
      
      // Tool-specific logic
      // ...

      // Return formatted result
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      // Error handling
      // ...
    }
  }

  // Tool definition for MCP
  static getDefinition() {
    return {
      name: 'tool_name',
      description: 'Tool description',
      inputSchema: {
        // JSON Schema for the tool input
        // ...
      }
    } as const;
  }
}
```

### API Service Pattern

The `TPService` class handles all communication with the Targetprocess API:

```typescript
export class TPService {
  private baseUrl: string;
  private auth: string;
  private retryConfig: RetryConfig;
  private validEntityTypesCache: string[];

  constructor(config: TPServiceConfig) {
    // Initialize service
    // ...
  }

  // API methods
  async searchEntities(params: SearchParams): Promise<any[]> {
    // Search logic
    // ...
  }

  async getEntity(type: string, id: number, include?: string[]): Promise<any> {
    // Get entity logic
    // ...
  }

  // More API methods...

  // Helper methods
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    // Retry logic
    // ...
  }

  // More helper methods...
}
```

## Testing Approach

### Unit Testing

Unit tests focus on testing individual components in isolation:

```typescript
describe('SearchTool', () => {
  const mockService = {
    searchEntities: jest.fn(),
    // Mock other methods as needed
  };

  const searchTool = new SearchTool(mockService as unknown as TPService);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should search entities with valid input', async () => {
    mockService.searchEntities.mockResolvedValue([{ id: 1, name: 'Test' }]);

    const result = await searchTool.execute({
      type: 'UserStory',
      where: "EntityState.Name eq 'Open'",
    });

    expect(mockService.searchEntities).toHaveBeenCalledWith({
      type: 'UserStory',
      where: "EntityState.Name eq 'Open'",
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify([{ id: 1, name: 'Test' }], null, 2),
        },
      ],
    });
  });

  // More tests...
});
```

### Integration Testing

Integration tests verify that components work together:

```typescript
describe('Targetprocess API Integration', () => {
  let service: TPService;

  beforeAll(() => {
    service = new TPService({
      domain: process.env.TP_DOMAIN || '',
      credentials: {
        username: process.env.TP_USERNAME || '',
        password: process.env.TP_PASSWORD || '',
      },
    });
  });

  it('should search for user stories', async () => {
    const results = await service.searchEntities({
      type: 'UserStory',
      take: 5,
    });

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('Id');
      expect(results[0]).toHaveProperty('Name');
    }
  });

  // More tests...
});
```

## CI/CD Pipeline

The project uses GitHub Actions for automated builds:

- Pushes to `main` branch trigger new container builds
- Version tags (v*.*.*) create versioned releases
- Images are published to GitHub Container Registry

## Development Best Practices

1. **Type Safety**: Use TypeScript types and interfaces for everything
2. **Error Handling**: Implement comprehensive error handling
3. **Input Validation**: Validate all inputs using Zod schemas
4. **Documentation**: Document all public methods and classes
5. **Testing**: Write tests for all components
6. **Consistency**: Follow established patterns and conventions
7. **Separation of Concerns**: Keep components focused on specific responsibilities
8. **Code Quality**: Use ESLint and Prettier for code quality
9. **Performance**: Be mindful of performance implications
10. **Security**: Never hardcode credentials or sensitive information

## Development Workflow

1. **Create a Feature Branch**: `git checkout -b feature/your-feature-name`
2. **Implement Changes**: Follow the coding patterns and best practices
3. **Write Tests**: Add tests for your changes
4. **Run Tests**: `npm test`
5. **Build**: `npm run build`
6. **Create a Pull Request**: Submit your changes for review

## Further Resources

- [Targetprocess API Documentation](https://dev.targetprocess.com/docs/introduction)
- [Model Context Protocol Specification](https://github.com/anthropics/anthropic-sdk-typescript)
- [Zod Documentation](https://github.com/colinhacks/zod)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)