# inspect_object

The `inspect_object` tool allows you to explore and discover information about Targetprocess entities, properties, and metadata. It's particularly useful for understanding the data model and available fields.

## Recent Changes (v2.0+)

**⚠️ Important**: This tool has been significantly enhanced with a hybrid metadata approach:
- **Primary Source**: Uses `/api/v1/EntityTypes` endpoint for reliable, fast basic entity information
- **Secondary Source**: Falls back to `/api/v1/meta` endpoint for detailed relationship metadata (when available)
- **Fallback**: Uses EntityRegistry for system entity types not available in API endpoints
- **Performance**: Significantly faster with pagination support for large instances
- **Reliability**: Graceful handling of malformed JSON responses from legacy endpoints

## Purpose

Use this tool when you need to:
- Discover available entity types in your Targetprocess instance
- Explore properties and fields for a specific entity type
- Get details about a specific property
- Understand the structure and relationships of entities
- Discover API capabilities through metadata

## Parameters

```json
{
  "action": "list_types",       // Required: Action to perform
  "entityType": "UserStory",    // Required for some actions: Entity type to inspect
  "propertyName": "Description" // Required for some actions: Property to inspect
}
```

## Parameter Details

### action (Required)
The action to perform. Available actions:

- `list_types`: List all available entity types
- `get_properties`: Get all properties for a specific entity type
- `get_property_details`: Get details about a specific property
- `discover_api_structure`: Attempt to discover API structure through metadata or error messages

### entityType (Required for some actions)
The entity type to inspect. Required for `get_properties` and `get_property_details` actions. Must be one of the supported Targetprocess entity types or a valid custom entity type in your instance.

### propertyName (Required for some actions)
The property to inspect. Required for `get_property_details` action. This should be a valid property name for the specified entity type.

## Response Format

The response format varies depending on the action:

### list_types

Returns a list of available entity types:

```json
[
  "UserStory",
  "Bug",
  "Task",
  "Feature",
  "Epic",
  "Project",
  "Team",
  // more entity types...
]
```

### get_properties

Returns structured information about an entity type from the hybrid metadata approach:

```json
{
  "basic_info": {
    "name": "StatusReport",
    "description": "Custom status report entity",
    "isAssignable": true,
    "isGlobal": false,
    "supportsCustomFields": true,
    "source": "API"
  },
  "registry_info": {
    "category": "custom",
    "parentTypes": ["AssignableEntity"],
    "commonIncludes": ["Project", "Team", "AssignedUser"],
    "supportsCustomFields": true
  },
  "note": "EntityTypes endpoint provides basic entity information. For detailed property metadata, additional API calls to /meta endpoint may be needed.",
  "documentation": "Documentation search results (when available)"
}
```

### get_property_details

Returns available information about a specific property with limitations noted:

```json
{
  "entityType": "StatusReport",
  "propertyName": "Name",
  "entityInfo": {
    "name": "StatusReport",
    "description": "Custom status report entity",
    "isAssignable": true,
    "isGlobal": false,
    "supportsCustomFields": true,
    "source": "API"
  },
  "note": "EntityTypes endpoint does not provide detailed property metadata. For detailed property information, a separate API call to the /meta endpoint would be needed.",
  "suggestion": "Use entity introspection through actual API calls to discover available properties.",
  "registryInfo": {
    "category": "custom",
    "commonIncludes": ["Project", "Team", "AssignedUser"]
  },
  "likelyProperty": "Name is listed as a common include for StatusReport (if applicable)"
}
```

### discover_api_structure

Returns information about the API structure:

```json
{
  "entityTypes": [
    "UserStory",
    "Bug",
    "Task",
    "Feature",
    "Epic",
    // more entity types...
  ]
}
```

## Examples

### List All Entity Types

```json
{
  "action": "list_types"
}
```

### Get Properties for User Stories

```json
{
  "action": "get_properties",
  "entityType": "UserStory"
}
```

### Get Details About a Specific Property

```json
{
  "action": "get_property_details",
  "entityType": "UserStory",
  "propertyName": "Effort"
}
```

### Discover API Structure

```json
{
  "action": "discover_api_structure"
}
```

## Common Errors

### Invalid Action
```
Invalid inspect parameters: action must be one of list_types, get_properties, get_property_details, discover_api_structure
```
**Solution:** Use one of the supported action types.

### Missing Required Parameters
```
Invalid inspect parameters: entityType is required for get_properties action
```
**Solution:** Provide all required parameters for the chosen action.

### Invalid Entity Type
```
Inspect object failed: Invalid entity type: InvalidType
```
**Solution:** Use a valid entity type that exists in your Targetprocess instance.

### Property Not Found
```
Inspect object failed: Property not found: InvalidProperty
```
**Solution:** Use a valid property name for the specified entity type.

## Current Limitations

**⚠️ Important Limitations** (as of v2.0+):
- **Property Schemas**: Detailed property metadata (data types, validation rules, constraints) is limited
- **Custom Fields**: Custom field discovery requires additional API calls not currently implemented
- **Relationship Details**: Full relationship metadata depends on `/meta` endpoint availability
- **Validation Rules**: Property validation rules and constraints not available through current endpoints

## Enhanced Capabilities

**✅ Improvements** (v2.0+):
- **Performance**: 5-10x faster response times using optimized `/EntityTypes` endpoint
- **Reliability**: Graceful handling of malformed JSON from legacy endpoints
- **Pagination**: Supports large instances with hundreds of entity types
- **Comprehensive Coverage**: Combines API data with EntityRegistry for complete entity type list
- **Custom Entity Discovery**: Automatically discovers and registers custom entity types
- **Fallback Resilience**: Works even when `/meta` endpoint fails

## Tips and Best Practices

1. **Exploration Flow**: Start with `list_types`, then `get_properties` for a specific type, then `get_property_details` for specific properties
2. **API Discovery**: Use `discover_api_structure` to discover entity types available in your instance, even if not in the standard list
3. **Custom Entity Types**: Your Targetprocess instance may have custom entity types not in the standard list - tool now auto-discovers these
4. **Property Discovery**: For detailed property information, use actual API calls (e.g., `search_entities` with `take=1`) to inspect real entity structure
5. **Performance Optimization**: Results are faster than before - cache is less critical but still recommended
6. **Relationship Mapping**: Use `registry_info.commonIncludes` to understand likely related entities
7. **Error Handling**: Tool now gracefully handles endpoint failures and provides helpful guidance
8. **Custom Field Discovery**: Use sample entity queries to discover custom fields: `search_entities` with `include=[CustomFields]`

## Migration Notes

**For existing users**: Response format has changed to provide more structured information. Update your code to handle the new response structure with `basic_info`, `registry_info`, and enhanced error messages.

**For new users**: This tool now provides more reliable basic entity information but has documented limitations for detailed property schemas.