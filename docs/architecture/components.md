# Component Design

This document details the design of the key components in the Targetprocess MCP Server architecture.

## Server Component

The Server component is the main entry point for the MCP protocol. It handles:

- Initialization of the server and its components
- Setting up HTTP endpoints for MCP communication
- Routing MCP requests to the appropriate tools
- Error handling and response formatting

```typescript
class Server {
  private server: Server;
  private service: TPService;
  private tools: Object;
  
  constructor() {
    // Initialize components
  }
  
  private setupHandlers() {
    // Set up MCP protocol handlers
  }
  
  private initializeCache() {
    // Initialize entity type cache
  }
  
  public run() {
    // Start the server
  }
}
```

## TPService Component

The TPService component handles communication with the Targetprocess API. It provides:

- Methods for CRUD operations on Targetprocess entities
- Query building and validation
- Error handling and retry logic
- Entity type validation and caching

```typescript
class TPService {
  private baseUrl: string;
  private auth: string;
  private retryConfig: RetryConfig;
  private validEntityTypesCache: string[];
  
  constructor(config: TPServiceConfig) {
    // Initialize service with configuration
  }
  
  // Entity operations
  public async searchEntities(params) {}
  public async getEntity(type, id, include) {}
  public async createEntity(type, data) {}
  public async updateEntity(type, id, fields) {}
  
  // Utility methods
  public async getValidEntityTypes() {}
  public async initializeEntityTypeCache() {}
  
  // Internal helper methods
  private formatWhereValue(value) {}
  private formatWhereField(field) {}
  private validateWhereClause(where) {}
  private formatOrderBy(orderBy) {}
  private validateInclude(include) {}
  private executeWithRetry(fn) {}
  private extractErrorMessage(error) {}
  private handleApiResponse(response) {}
  private validateEntityType(type) {}
}
```

## Tool Components

Each tool component handles a specific type of operation:

### SearchTool

Handles entity search operations with filtering, pagination, and includes:

```typescript
class SearchTool {
  private service: TPService;
  
  constructor(service: TPService) {
    this.service = service;
  }
  
  public async execute(args) {
    // Validate input
    // Transform parameters
    // Execute search using service
    // Format response
  }
  
  public static getDefinition() {
    // Return tool definition for MCP
  }
}
```

### GetEntityTool

Handles retrieval of specific entities by ID:

```typescript
class GetEntityTool {
  private service: TPService;
  
  constructor(service: TPService) {
    this.service = service;
  }
  
  public async execute(args) {
    // Validate input
    // Execute get entity using service
    // Format response
  }
  
  public static getDefinition() {
    // Return tool definition for MCP
  }
}
```

### CreateEntityTool

Handles creation of new entities:

```typescript
class CreateEntityTool {
  private service: TPService;
  
  constructor(service: TPService) {
    this.service = service;
  }
  
  public async execute(args) {
    // Validate input
    // Transform parameters
    // Execute create entity using service
    // Format response
  }
  
  public static getDefinition() {
    // Return tool definition for MCP
  }
}
```

### UpdateEntityTool

Handles updating of existing entities:

```typescript
class UpdateEntityTool {
  private service: TPService;
  
  constructor(service: TPService) {
    this.service = service;
  }
  
  public async execute(args) {
    // Validate input
    // Transform parameters
    // Execute update entity using service
    // Format response
  }
  
  public static getDefinition() {
    // Return tool definition for MCP
  }
}
```

### InspectObjectTool

Handles metadata inspection operations:

```typescript
class InspectObjectTool {
  private service: TPService;
  
  constructor(service: TPService) {
    this.service = service;
  }
  
  public async execute(args) {
    // Validate input
    // Determine action type
    // Execute appropriate inspection method
    // Format response
  }
  
  private async listTypes() {
    // List available entity types
  }
  
  private async getProperties(entityType) {
    // Get properties for entity type
  }
  
  private async getPropertyDetails(entityType, propertyName) {
    // Get details for specific property
  }
  
  private async discoverApiStructure() {
    // Discover API structure from metadata or errors
  }
  
  public static getDefinition() {
    // Return tool definition for MCP
  }
}
```

## Entity Components

The entity components define the data models used in the application:

### BaseEntity

```typescript
interface BaseEntity {
  Id: number;
  Name: string;
  Description: string;
  CreateDate: string;
  ModifyDate: string;
  // Other common fields
}
```

### AssignableEntity

```typescript
interface AssignableEntity extends BaseEntity {
  EntityState: EntityState;
  Project: Project;
  Team: Team;
  AssignedUser: User;
  // Other assignable entity fields
}
```

### Specific Entity Types

```typescript
interface UserStory extends AssignableEntity {
  Tasks: Task[];
  Bugs: Bug[];
  Feature: Feature;
  // User story specific fields
}

interface Task extends AssignableEntity {
  UserStory: UserStory;
  // Task specific fields
}

interface Bug extends AssignableEntity {
  UserStory: UserStory;
  // Bug specific fields
}
```

## Component Interactions

The components interact in a layered fashion:

1. The **Server** component receives MCP requests and routes them to the appropriate **Tool** component
2. Each **Tool** component:
   - Validates and transforms input
   - Calls the appropriate **TPService** methods
   - Formats the response according to MCP standards
3. The **TPService** component:
   - Validates entity types and parameters
   - Constructs API requests
   - Handles communication with the Targetprocess API
   - Processes API responses
   - Handles errors and retries

This layered approach allows for:
- Clean separation of concerns
- Easy testing of individual components
- Straightforward addition of new tools and capabilities
- Flexible error handling at appropriate levels