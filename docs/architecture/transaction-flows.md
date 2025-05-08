# Transaction Flows

This document outlines the key transaction flows in the Targetprocess MCP, including sequence diagrams for common operations and error handling patterns.

## Search Flow

The search flow is used to find entities matching specific criteria:

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant SearchTool as Search Tool
    participant TPService as TP Service
    participant TP as Target Process API
    
    Client->>+Server: Call search_entities tool
    Server->>+SearchTool: Execute with args
    SearchTool->>SearchTool: Validate input using Zod
    SearchTool->>+TPService: searchEntities(type, where, include, take, skip)
    TPService->>TPService: Validate entity type
    TPService->>TPService: Validate where clause
    TPService->>TPService: Format query parameters
    TPService->>+TP: GET /api/v1/{EntityType}s?where=...&include=...
    TP-->>-TPService: Return JSON response
    TPService->>TPService: Handle response/errors
    TPService-->>-SearchTool: Return entities
    SearchTool->>SearchTool: Format MCP response
    SearchTool-->>-Server: Return formatted results
    Server-->>-Client: Return tool response
```

## Get Entity Flow

The get entity flow retrieves a specific entity by ID:

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant GetTool as Get Entity Tool
    participant TPService as TP Service
    participant TP as Target Process API
    
    Client->>+Server: Call get_entity tool
    Server->>+GetTool: Execute with args
    GetTool->>GetTool: Validate input using Zod
    GetTool->>+TPService: getEntity(type, id, include)
    TPService->>TPService: Validate entity type
    TPService->>TPService: Validate includes
    TPService->>+TP: GET /api/v1/{EntityType}s/{id}?include=...
    TP-->>-TPService: Return entity data
    TPService->>TPService: Handle response/errors
    
    alt allow_informative_errors enabled & error occurs
        TPService->>TPService: Extract metadata from error
        TPService-->>GetTool: Return metadata
    else no error
        TPService-->>-GetTool: Return entity
    end
    
    GetTool->>GetTool: Format MCP response
    GetTool-->>-Server: Return formatted entity
    Server-->>-Client: Return tool response
```

## Create Entity Flow

The create entity flow creates a new entity:

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant CreateTool as Create Entity Tool
    participant TPService as TP Service
    participant TP as Target Process API
    
    Client->>+Server: Call create_entity tool
    Server->>+CreateTool: Execute with args
    CreateTool->>CreateTool: Validate input using Zod
    CreateTool->>CreateTool: Transform input for API
    CreateTool->>+TPService: createEntity(type, data)
    TPService->>TPService: Validate entity type
    TPService->>TPService: Validate required fields
    TPService->>TPService: Format entity data
    TPService->>+TP: POST /api/v1/{EntityType}s
    Note right of TP: With JSON payload
    TP-->>-TPService: Return created entity
    TPService->>TPService: Handle response/errors
    TPService-->>-CreateTool: Return created entity
    CreateTool->>CreateTool: Format MCP response
    CreateTool-->>-Server: Return formatted entity
    Server-->>-Client: Return tool response
```

## Update Entity Flow

The update entity flow modifies an existing entity:

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant UpdateTool as Update Entity Tool
    participant TPService as TP Service
    participant TP as Target Process API
    
    Client->>+Server: Call update_entity tool
    Server->>+UpdateTool: Execute with args
    UpdateTool->>UpdateTool: Validate input using Zod
    UpdateTool->>UpdateTool: Transform fields for API
    UpdateTool->>+TPService: updateEntity(type, id, fields)
    TPService->>TPService: Validate entity type
    TPService->>TPService: Format update data
    TPService->>+TP: POST /api/v1/{EntityType}s/{id}
    Note right of TP: With JSON payload
    TP-->>-TPService: Return updated entity
    TPService->>TPService: Handle response/errors
    TPService-->>-UpdateTool: Return updated entity
    UpdateTool->>UpdateTool: Format MCP response
    UpdateTool-->>-Server: Return formatted entity
    Server-->>-Client: Return tool response
```

## Inspect Object Flow

The inspect object flow examines metadata about entities and properties:

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant InspectTool as Inspect Object Tool
    participant TPService as TP Service
    participant TP as Target Process API
    
    Client->>+Server: Call inspect_object tool
    Server->>+InspectTool: Execute with args
    InspectTool->>InspectTool: Validate input using Zod
    
    alt action == "list_types"
        InspectTool->>+TPService: getValidEntityTypes()
        TPService->>TPService: Check cache
        
        alt cache valid
            TPService-->>InspectTool: Return cached types
        else cache invalid
            TPService->>+TP: GET /api/v1/EntityTypes
            TP-->>-TPService: Return entity types
            TPService->>TPService: Update cache
            TPService-->>InspectTool: Return entity types
        end
    else action == "get_properties"
        InspectTool->>+TP: GET /api/v1/{EntityType}s/$metadata
        TP-->>-InspectTool: Return entity properties
    else action == "get_property_details"
        InspectTool->>+TP: GET /api/v1/{EntityType}s/$metadata
        TP-->>-InspectTool: Return entity properties
        InspectTool->>InspectTool: Extract property details
    else action == "discover_api_structure"
        InspectTool->>InspectTool: Try direct metadata first
        InspectTool->>+TP: GET /api/v1/$metadata
        
        alt direct metadata succeeds
            TP-->>-InspectTool: Return API metadata
        else direct metadata fails
            TP-->>-InspectTool: Return error
            InspectTool->>+TP: GET /api/v1/InvalidType/1
            TP-->>-InspectTool: Return error with valid types
            InspectTool->>InspectTool: Extract types from error
        end
    end
    
    InspectTool->>InspectTool: Format MCP response
    InspectTool-->>-Server: Return formatted result
    Server-->>-Client: Return tool response
```

## Error Handling Flow

The error handling flow with retry logic:

```mermaid
flowchart TD
    Start([API Call]) --> CallAPI[Execute API Request]
    CallAPI --> CheckResponse{Response OK?}
    
    CheckResponse -->|Yes| ReturnResult[Return Result]
    CheckResponse -->|No| CheckRetries{Max Retries Reached?}
    
    CheckRetries -->|Yes| CheckStatusCode{Status Code?}
    CheckRetries -->|No| CheckErrorType{Error Type?}
    
    CheckStatusCode -->|400/401| ThrowInvalidRequest[Throw InvalidRequest Error]
    CheckStatusCode -->|404| ThrowNotFound[Throw NotFound Error]
    CheckStatusCode -->|Other| ThrowGenericError[Throw Generic Error]
    
    CheckErrorType -->|400/401| ThrowError[Throw McpError]
    CheckErrorType -->|Other| Wait[Wait with Exponential Backoff]
    Wait --> IncrementRetry[Increment Retry Count]
    IncrementRetry --> CallAPI
    
    ReturnResult --> End([End])
    ThrowInvalidRequest --> End
    ThrowNotFound --> End
    ThrowGenericError --> End
    ThrowError --> End
```

## Entity Type Validation Flow

The entity type validation flow:

```mermaid
flowchart TD
    Start([Validate Entity Type]) --> CheckCache{Cache Valid?}
    
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
    
    Return --> End([End])
    ThrowError --> End
```

## Query Execution Flow

The query execution flow with parameter formatting:

```mermaid
flowchart TD
    Start([Execute Query]) --> ValidateParams[Validate Query Parameters]
    ValidateParams --> ValidateType[Validate Entity Type]
    ValidateType --> ValidateWhere{Where Clause Provided?}
    
    ValidateWhere -->|Yes| FormatWhere[Format Where Clause]
    ValidateWhere -->|No| SkipWhere[Skip Where Formatting]
    
    FormatWhere --> ValidateInclude{Include Provided?}
    SkipWhere --> ValidateInclude
    
    ValidateInclude -->|Yes| FormatInclude[Format Include Parameters]
    ValidateInclude -->|No| SkipInclude[Skip Include Formatting]
    
    FormatInclude --> ValidateOrderBy{OrderBy Provided?}
    SkipInclude --> ValidateOrderBy
    
    ValidateOrderBy -->|Yes| FormatOrderBy[Format OrderBy Parameters]
    ValidateOrderBy -->|No| SkipOrderBy[Skip OrderBy Formatting]
    
    FormatOrderBy --> BuildUrl[Build API URL with Parameters]
    SkipOrderBy --> BuildUrl
    
    BuildUrl --> ExecuteWithRetry[Execute Request with Retry Logic]
    ExecuteWithRetry --> HandleResponse[Handle API Response]
    HandleResponse --> FormatResult[Format Result for MCP]
    FormatResult --> End([End])
```

## Server Initialization Flow

The server initialization flow:

```mermaid
sequenceDiagram
    participant Server as Server
    participant Config as Configuration
    participant TPService as TP Service
    participant Tools as Tool Components
    
    Server->>+Config: Load configuration
    Config-->>-Server: Return config
    
    Server->>+TPService: Create service with config
    TPService-->>-Server: Return service instance
    
    Server->>Server: Initialize tools
    Server->>+Tools: Create tool instances
    Tools-->>-Server: Return tool instances
    
    Server->>Server: Setup MCP handlers
    Server->>Server: Setup error handling
    
    Server->>+TPService: Initialize entity type cache
    TPService->>TPService: Fetch valid entity types
    TPService-->>-Server: Cache initialized
    
    Server->>Server: Start HTTP server
    Server->>Server: Log server started
```

## MCP Request Processing Flow

The MCP request processing flow:

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant McpHandler as MCP Handler
    participant Tool as Tool Component
    
    Client->>+Server: Send MCP request
    Server->>+McpHandler: Process request
    McpHandler->>McpHandler: Parse request
    McpHandler->>McpHandler: Validate request format
    McpHandler->>McpHandler: Extract tool name and params
    
    McpHandler->>+Tool: Execute tool with params
    Tool->>Tool: Validate input parameters
    Tool->>Tool: Process request
    
    alt Success
        Tool-->>-McpHandler: Return result
        McpHandler->>McpHandler: Format MCP response
        McpHandler-->>-Server: Return success response
        Server-->>-Client: Return success response
    else Error
        Tool-->>-McpHandler: Throw error
        McpHandler->>McpHandler: Convert to MCP error
        McpHandler-->>-Server: Return error response
        Server-->>-Client: Return error response
    end
```

These transaction flows demonstrate the key paths through the system and how different components interact during various operations.