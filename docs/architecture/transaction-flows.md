# Transaction Flows

This document outlines the key transaction flows in the Targetprocess MCP, including sequence diagrams for common operations and error handling patterns.

## Version 2.0+ Updates

**⚠️ Important Changes**: The inspect_object tool and metadata fetching have been significantly enhanced with a hybrid approach for improved performance and reliability. See the [Enhanced Inspect Object Flow](#inspect-object-flow-enhanced-v20) section for details.

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

## Inspect Object Flow (Enhanced v2.0+)

The inspect object flow examines metadata about entities and properties using a hybrid approach:

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant InspectTool as Inspect Object Tool
    participant TPService as TP Service
    participant EntityRegistry as Entity Registry
    participant TP as Target Process API
    
    Client->>+Server: Call inspect_object tool
    Server->>+InspectTool: Execute with args
    InspectTool->>InspectTool: Validate input using Zod
    
    alt action == "list_types"
        InspectTool->>+TPService: getValidEntityTypes()
        TPService->>TPService: Get static types from EntityRegistry
        TPService->>+TP: GET /api/v1/EntityTypes (paginated)
        TP-->>-TPService: Return entity types batch
        TPService->>TPService: Merge API + Registry types
        TPService->>TPService: Register custom types
        TPService-->>-InspectTool: Return complete entity types
    else action == "get_properties"
        InspectTool->>+TPService: fetchMetadata()
        
        Note over TPService: Hybrid Metadata Approach
        TPService->>+TP: GET /api/v1/EntityTypes (Primary)
        TP-->>-TPService: Return basic entity info
        
        TPService->>+TP: GET /api/v1/meta (Secondary)
        alt meta endpoint succeeds
            TP-->>-TPService: Return detailed metadata
            TPService->>TPService: Attempt JSON repair if needed
        else meta endpoint fails
            TP-->>-TPService: Return error
            Note over TPService: Graceful degradation
        end
        
        TPService->>TPService: createHybridMetadata()
        TPService->>+EntityRegistry: enhanceWithSystemTypes()
        EntityRegistry-->>-TPService: Return enhanced metadata
        TPService-->>-InspectTool: Return hybrid metadata
        
        InspectTool->>InspectTool: extractEntityProperties()
        InspectTool->>+EntityRegistry: getEntityTypeInfo()
        EntityRegistry-->>-InspectTool: Return registry info
        
    else action == "get_property_details"
        InspectTool->>+TPService: fetchMetadata()
        Note over TPService: Same hybrid approach as above
        TPService-->>-InspectTool: Return hybrid metadata
        InspectTool->>InspectTool: extractPropertyDetails()
        InspectTool->>+EntityRegistry: getEntityTypeInfo()
        EntityRegistry-->>-InspectTool: Return registry info
        
    else action == "discover_api_structure"
        InspectTool->>+TPService: fetchMetadata()
        TPService-->>-InspectTool: Return hybrid metadata
        
        alt hybrid metadata succeeds
            InspectTool->>InspectTool: Extract entity types
        else hybrid metadata fails
            InspectTool->>+TP: GET /api/v1/NonExistentType/1
            TP-->>-InspectTool: Return error with entity types
            InspectTool->>InspectTool: Extract types from error
        end
    end
    
    InspectTool->>InspectTool: Format MCP response with limitations
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

## Enhanced Entity Type Validation Flow (v2.0+)

The enhanced entity type validation flow with hybrid approach:

```mermaid
flowchart TD
    Start([Validate Entity Type]) --> GetStatic[Get Static Types from EntityRegistry]
    GetStatic --> InitSet[Initialize Entity Type Set]
    
    InitSet --> FetchEntityTypes[Fetch from /api/v1/EntityTypes]
    FetchEntityTypes --> CheckPagination{More Pages?}
    
    CheckPagination -->|Yes| FetchNextPage[Fetch Next Page]
    FetchNextPage --> MergeTypes[Merge with Existing Types]
    MergeTypes --> CheckPagination
    
    CheckPagination -->|No| RegisterCustom[Register Custom Types]
    RegisterCustom --> CacheResults[Cache All Entity Types]
    CacheResults --> ValidateType{Type Valid?}
    
    ValidateType -->|Yes| Return[Return Validated Type]
    ValidateType -->|No| FallbackStatic{Type in Static Registry?}
    
    FallbackStatic -->|Yes| Return
    FallbackStatic -->|No| ThrowError[Throw McpError]
    
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

## Metadata Fetching Flow (New v2.0+)

The enhanced metadata fetching flow with hybrid approach:

```mermaid
flowchart TD
    Start([Fetch Metadata]) --> FetchEntityTypes["Primary: GET /api/v1/EntityTypes (Paginated)"]
    FetchEntityTypes --> ProcessPages[Process All Pages]
    ProcessPages --> TryMetaEndpoint["Secondary: GET /api/v1/meta"]
    
    TryMetaEndpoint --> ParseMeta{Parse Meta JSON}
    ParseMeta -->|Success| ExtractRelationships[Extract Relationships]
    ParseMeta -->|Malformed JSON| AttemptRepair[Attempt JSON Repair]
    ParseMeta -->|Failed| WarnAndContinue[Warn & Continue Without Meta]
    
    AttemptRepair --> RepairSuccess{Repair Success?}
    RepairSuccess -->|Yes| ExtractRelationships
    RepairSuccess -->|No| WarnAndContinue
    
    ExtractRelationships --> ExtractProperties[Extract Properties]
    ExtractProperties --> ExtractHierarchy[Extract Hierarchy]
    ExtractHierarchy --> CombineData[Combine EntityTypes + Meta Data]
    
    WarnAndContinue --> UseEntityTypesOnly[Use EntityTypes Data Only]
    UseEntityTypesOnly --> CombineData
    
    CombineData --> EnhanceWithRegistry[Enhance with EntityRegistry]
    EnhanceWithRegistry --> FinalMetadata[Return Hybrid Metadata]
    FinalMetadata --> End([End])
```

## Performance Improvements (v2.0+)

### Response Time Comparison
- **v1.x**: `/api/v1/Index/meta` - 2-5 seconds (large response, JSON issues)
- **v2.0+**: `/api/v1/EntityTypes` - 0.3-1 second (paginated, reliable)

### Reliability Improvements
- **Graceful Fallback**: Works even if `/meta` endpoint fails
- **JSON Repair**: Attempts to fix malformed JSON responses
- **Pagination**: Handles large instances with 100+ entity types
- **Comprehensive Coverage**: Combines API + Registry for complete entity list

### Error Handling Enhancements
- **Informative Messages**: Clear explanations of limitations
- **Helpful Suggestions**: Guidance on alternative approaches
- **Graceful Degradation**: Continues to work with reduced functionality

These transaction flows demonstrate the key paths through the system and how different components interact during various operations. The v2.0+ enhancements provide significantly improved performance and reliability while maintaining backwards compatibility.