# Target Process MCP Architecture

This document provides a high-level overview of the Target Process Model Context Protocol (MCP) implementation architecture, including system structure, class diagrams, and transaction models.

## Documentation Structure

This document serves as the **architectural overview** for the system. For detailed deep-dives into specific components, please refer to the [`architecture/`](architecture/) subdirectory which contains:

- **Component design details** - In-depth analysis of each system component
- **Data model specifications** - Detailed entity relationships and schemas  
- **Transaction flow diagrams** - Step-by-step sequence diagrams for operations
- **Implementation guides** - Technical implementation details

**When to read which document:**
- **Start here** (ARCHITECTURE.md) for system understanding and high-level design decisions
- **Use architecture/ subdirectory** when implementing features or debugging specific components

---

## System Overview

The Target Process MCP server provides an interface between Large Language Models (LLMs) and the Target Process API, enabling AI assistants to perform operations such as searching, retrieving, creating, and updating Target Process entities.

## System Architecture

> **📋 For detailed component analysis:** See [architecture/components.md](architecture/components.md)

```mermaid
flowchart TB
    Client[MCP Client / LLM] <--> |MCP Protocol| Server[Target Process MCP Server]
    Server <--> |HTTP REST API| TP[Target Process API]
    
    subgraph "MCP Server Components"
        Server --> Tools[Tool Implementations]
        Server --> TPService[TP Service Layer]
    end
    
    subgraph "Tools"
        Tools --> SearchTool[Search Tool]
        Tools --> GetTool[Get Entity Tool]
        Tools --> CreateTool[Create Entity Tool]
        Tools --> UpdateTool[Update Entity Tool]
        Tools --> InspectTool[Inspect Object Tool]
    end
    
    TPService --> Cache[Entity Type Cache]
    
    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style Server fill:#bbf,stroke:#333,stroke-width:2px
    style TP fill:#bfb,stroke:#333,stroke-width:2px
    style Tools fill:#fbb,stroke:#333,stroke-width:2px
    style TPService fill:#fbf,stroke:#333,stroke-width:2px
```

## Class Diagram

```mermaid
classDiagram
    class Server {
        -server: Server
        -service: TPService
        -tools: Object
        +constructor()
        -setupHandlers()
        -initializeCache()
        +run()
    }
    
    class TPService {
        -baseUrl: string
        -auth: string
        -retryConfig: RetryConfig
        -validEntityTypesCache: string[]
        +constructor(config: TPServiceConfig)
        +searchEntities()
        +getEntity()
        +createEntity()
        +updateEntity()
        +getUserStories()
        +getUserStory()
        +fetchMetadata()
        +getValidEntityTypes()
        +initializeEntityTypeCache()
        -formatWhereValue()
        -formatWhereField()
        -validateWhereClause()
        -formatOrderBy()
        -validateInclude()
        -executeWithRetry()
        -extractErrorMessage()
        -handleApiResponse()
        -validateEntityType()
    }
    
    class BaseTool {
        <<interface>>
        +execute()
        +static getDefinition()
    }
    
    class SearchTool {
        -service: TPService
        +constructor(service: TPService)
        +execute(args)
        +static getDefinition()
    }
    
    class GetEntityTool {
        -service: TPService
        +constructor(service: TPService)
        +execute(args)
        +static getDefinition()
    }
    
    class CreateEntityTool {
        -service: TPService
        +constructor(service: TPService)
        +execute(args)
        +static getDefinition()
    }
    
    class UpdateEntityTool {
        -service: TPService
        +constructor(service: TPService)
        +execute(args)
        +static getDefinition()
    }
    
    class InspectObjectTool {
        -service: TPService
        +constructor(service: TPService)
        +execute(args)
        +static getDefinition()
    }
    
    Server *-- TPService : contains
    Server *-- SearchTool : contains
    Server *-- GetEntityTool : contains
    Server *-- CreateEntityTool : contains
    Server *-- UpdateEntityTool : contains
    Server *-- InspectObjectTool : contains
    
    BaseTool <|-- SearchTool : implements
    BaseTool <|-- GetEntityTool : implements
    BaseTool <|-- CreateEntityTool : implements
    BaseTool <|-- UpdateEntityTool : implements
    BaseTool <|-- InspectObjectTool : implements
    
    SearchTool --> TPService : uses
    GetEntityTool --> TPService : uses
    CreateEntityTool --> TPService : uses
    UpdateEntityTool --> TPService : uses
    InspectObjectTool --> TPService : uses
```

## Entity Data Models

> **📋 For detailed entity specifications:** See [architecture/data-models.md](architecture/data-models.md)

```mermaid
classDiagram
    class BaseEntity {
        +Id: number
        +Name: string
        +Description: string
    }
    
    class AssignableEntity {
        +EntityState: EntityState
        +Project: Project
        +Team: Team
        +AssignedUser: User
    }
    
    class UserStory {
        +Tasks: Task[]
        +Bugs: Bug[]
        +Feature: Feature
    }
    
    class Task {
        +UserStory: UserStory
    }
    
    class Bug {
        +UserStory: UserStory
    }
    
    class Feature {
        +UserStories: UserStory[]
        +Epic: Epic
    }
    
    class Epic {
        +Features: Feature[]
        +PortfolioEpic: PortfolioEpic
    }
    
    BaseEntity <|-- AssignableEntity : extends
    AssignableEntity <|-- UserStory : extends
    AssignableEntity <|-- Task : extends
    AssignableEntity <|-- Bug : extends
    AssignableEntity <|-- Feature : extends
    AssignableEntity <|-- Epic : extends
    
    UserStory o-- Task : contains
    UserStory o-- Bug : contains
    Feature o-- UserStory : contains
    Epic o-- Feature : contains
```

## Transaction Models

> **📋 For detailed transaction flows:** See [architecture/transaction-flows.md](architecture/transaction-flows.md)

### Search Flow

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant TP as Target Process API
    
    Client->>+Server: Call search_entities tool
    Server->>Server: Parse arguments
    Server->>+TP: GET /api/v1/{EntityType}s
    Note right of TP: With query params:<br/>- where<br/>- include<br/>- take<br/>- orderBy
    TP-->>-Server: Return JSON response
    Server->>Server: Format response
    Server-->>-Client: Return formatted results
```

### Entity CRUD Operations

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant TP as Target Process API
    
    alt Get Entity
        Client->>+Server: Call get_entity tool
        Server->>+TP: GET /api/v1/{EntityType}s/{id}
        TP-->>-Server: Return entity data
        Server-->>-Client: Return formatted entity
    else Create Entity
        Client->>+Server: Call create_entity tool
        Server->>+TP: POST /api/v1/{EntityType}s
        Note right of TP: With JSON payload
        TP-->>-Server: Return created entity
        Server-->>-Client: Return result
    else Update Entity
        Client->>+Server: Call update_entity tool
        Server->>+TP: POST /api/v1/{EntityType}s/{id}
        Note right of TP: With JSON payload
        TP-->>-Server: Return updated entity
        Server-->>-Client: Return result
    end
```

### Error Handling and Retry Logic

```mermaid
flowchart TD
    Start([API Call]) --> CallAPI[Execute API Request]
    CallAPI --> CheckResponse{Response OK?}
    
    CheckResponse -->|Yes| ReturnResult[Return Result]
    CheckResponse -->|No| CheckRetries{Max Retries Reached?}
    
    CheckRetries -->|Yes| ThrowError[Throw McpError]
    CheckRetries -->|No| CheckErrorType{Error Type?}
    
    CheckErrorType -->|400/401| ThrowError
    CheckErrorType -->|Other| Wait[Wait with Exponential Backoff]
    Wait --> IncrementRetry[Increment Retry Count]
    IncrementRetry --> CallAPI
    
    ReturnResult --> End([End])
    ThrowError --> End
```

## Configuration and Initialization

The Target Process MCP server can be configured in two ways:

1. **Environment Variables:**
   - `TP_DOMAIN`: Target Process domain (e.g., "company.tpondemand.com")
   - `TP_USERNAME`: Username for authentication
   - `TP_PASSWORD`: Password for authentication

2. **Configuration File:**
   - Located at `config/targetprocess.json`
   - Contains domain and credential information

During initialization, the server:

1. Loads configuration
2. Initializes the TP Service with configuration
3. Creates tool instances
4. Sets up MCP request handlers
5. Initializes entity type cache in the background

## Caching Strategy

The server maintains a cache of valid entity types to improve performance:

```mermaid
flowchart TD
    Start([API Call Requires Entity Validation]) --> CheckCache{Cache Valid?}
    
    CheckCache -->|Yes| UseCache[Use Cached Entity Types]
    CheckCache -->|No| CheckInit{Cache Init in Progress?}
    
    CheckInit -->|Yes| WaitForInit[Wait for Initialization]
    CheckInit -->|No| InitCache[Initialize Cache]
    
    InitCache --> FetchAPI[Fetch Entity Types from API]
    FetchAPI --> CacheResults[Cache Results]
    CacheResults --> SetTimestamp[Set Cache Timestamp]
    
    WaitForInit --> UseCache
    SetTimestamp --> UseCache
    
    UseCache --> ValidateType{Type Valid?}
    ValidateType -->|Yes| Return[Return Validated Type]
    ValidateType -->|No| FallbackCheck{Fallback to Static List?}
    
    FallbackCheck -->|Yes| CheckStatic{Type in Static List?}
    FallbackCheck -->|No| ThrowError[Throw McpError]
    
    CheckStatic -->|Yes| Return
    CheckStatic -->|No| ThrowError
```

## Conclusion

The Target Process MCP architecture follows a layered approach with clean separation of concerns:

1. **MCP Server Layer**: Handles communication with the MCP client
2. **Tool Layer**: Implements specific operations as MCP tools
3. **Service Layer**: Provides reusable API communication logic
4. **API Layer**: Communicates with the Target Process REST API

This architecture ensures maintainability, extensibility, and robust error handling throughout the system.
