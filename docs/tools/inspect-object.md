# inspect_object

The `inspect_object` tool allows you to explore and discover information about Targetprocess entities, properties, and metadata. It's particularly useful for understanding the data model and available fields.

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

Returns an object mapping property names to their types:

```json
{
  "Id": "Number",
  "Name": "String",
  "Description": "String",
  "CreateDate": "Date",
  "ModifyDate": "Date",
  "Project": "Project",
  "Team": "Team",
  "EntityState": "EntityState",
  "Priority": "Priority",
  "Effort": "Number",
  "CustomFields": "Object",
  // more properties...
}
```

### get_property_details

Returns detailed information about a specific property:

```json
{
  "name": "Description",
  "type": "String",
  "isRequired": false,
  "isReadOnly": false,
  "maxLength": 4000,
  "defaultValue": "",
  "supportedOperations": ["eq", "ne", "contains", "startswith", "endswith"]
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

## Tips and Best Practices

1. **Exploration Flow**: Start with `list_types`, then `get_properties` for a specific type, then `get_property_details` for specific properties
2. **API Discovery**: Use `discover_api_structure` to discover entity types available in your instance, even if not in the standard list
3. **Custom Entity Types**: Your Targetprocess instance may have custom entity types not in the standard list
4. **Custom Fields**: Use this tool to discover custom fields before trying to use them in queries
5. **Relationship Mapping**: Use the property details to understand how entities relate to each other
6. **Error-Based Discovery**: Sometimes errors from other tools can provide useful metadata about your Targetprocess instance
7. **Caching Results**: Cache the results of these calls as they rarely change and can reduce API load
8. **Permission Awareness**: The authenticated user may not have access to all entity types and properties