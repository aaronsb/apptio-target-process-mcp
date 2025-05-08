# get_entity

The `get_entity` tool retrieves detailed information about a specific Targetprocess entity by its ID. It allows you to fetch a single entity with optional related data.

## Purpose

Use this tool when you need to:
- Get complete details about a specific entity
- Retrieve an entity by its known ID
- Access an entity with its related data
- Verify if an entity exists

## Parameters

```json
{
  "type": "UserStory",          // Required: Entity type
  "id": 12345,                  // Required: Entity ID
  "include": ["Project", "Team"], // Optional: Related data to include
  "allow_informative_errors": false // Optional: Extract metadata from errors
}
```

## Parameter Details

### type (Required)
The type of entity to retrieve. Must be one of the supported Targetprocess entity types:

```
'UserStory', 'Bug', 'Task', 'Feature', 'Epic', 'PortfolioEpic', 
'Solution', 'Request', 'Impediment', 'TestCase', 'TestPlan',
'Project', 'Team', 'Iteration', 'TeamIteration', 'Release', 'Program'
```

### id (Required)
The unique identifier of the entity to retrieve. This must be a number.

### include (Optional)
An array of related data to include in the response. Commonly used includes:

- `Project`: The project the entity belongs to
- `Team`: The team assigned to the entity
- `AssignedUser`: The user assigned to the entity
- `EntityState`: The current state of the entity
- `CustomFields`: Custom fields defined for the entity

Entity-specific includes:
- For UserStory: `Tasks`, `Bugs`, `Feature`
- For Feature: `UserStories`, `Epic`
- For Task/Bug: `UserStory`

### allow_informative_errors (Optional)
When set to `true`, the tool will attempt to extract useful metadata from error responses, such as valid entity types. This is particularly useful for API discovery. Default is `false`.

## Response Format

The tool returns a JSON object representing the requested entity, including:

- All standard fields (Id, Name, Description, etc.)
- Any related data requested via the `include` parameter
- Entity-specific fields based on the entity type

Example response structure:

```json
{
  "Id": 12345,
  "Name": "Implement login feature",
  "Description": "Add user authentication",
  "CreateDate": "2024-01-15T10:30:00Z",
  "ModifyDate": "2024-01-20T15:45:00Z",
  "Project": {
    "Id": 100,
    "Name": "Mobile App"
  },
  "Team": {
    "Id": 200,
    "Name": "Frontend Team"
  },
  "EntityState": {
    "Id": 300,
    "Name": "In Progress"
  },
  "Tasks": [
    {
      "Id": 67890,
      "Name": "Design login UI"
    },
    {
      "Id": 67891,
      "Name": "Implement authentication API"
    }
  ]
}
```

When `allow_informative_errors` is set to `true` and an error occurs, the response may include metadata extracted from the error:

```json
{
  "status": "metadata",
  "message": "Operation failed but returned useful metadata",
  "entityTypes": ["UserStory", "Bug", "Task", "Feature", "Epic"],
  "originalError": "Invalid entity type. Valid entity types are: UserStory, Bug, Task, Feature, Epic"
}
```

## Examples

### Basic Entity Retrieval

Get a user story by ID:

```json
{
  "type": "UserStory",
  "id": 12345
}
```

### Retrieval with Related Data

Get a bug with project, team, and assigned user information:

```json
{
  "type": "Bug",
  "id": 67890,
  "include": ["Project", "Team", "AssignedUser", "EntityState"]
}
```

### Retrieving a User Story with its Tasks

Get a user story with all associated tasks:

```json
{
  "type": "UserStory",
  "id": 12345,
  "include": ["Tasks", "Project", "Team"]
}
```

### API Discovery Using Errors

Intentionally use an invalid entity type to discover valid types:

```json
{
  "type": "InvalidType",
  "id": 12345,
  "allow_informative_errors": true
}
```

This may return:

```json
{
  "status": "metadata",
  "message": "Operation failed but returned useful metadata",
  "entityTypes": ["UserStory", "Bug", "Task", "Feature", "Epic", "Project", "Team"],
  "originalError": "Invalid entity type. Valid entity types are: UserStory, Bug, Task, Feature, Epic, Project, Team"
}
```

## Common Errors

### Entity Not Found
```
Get entity failed: Entity with id 12345 not found
```
**Solution:** Verify the entity ID is correct and exists.

### Invalid Entity Type
```
Invalid get entity parameters: type must be one of: UserStory, Bug, Task, Feature...
```
**Solution:** Use one of the supported entity types.

### Invalid ID
```
Invalid get entity parameters: id must be a number
```
**Solution:** Ensure the ID is a valid number.

### Invalid Include
```
Get entity failed: Invalid include: InvalidRelation
```
**Solution:** Use valid relation names in the include array.

## Tips and Best Practices

1. **Minimize Includes**: Only include related data that you actually need
2. **Verify IDs First**: Ensure the entity ID exists before attempting to retrieve it
3. **Error Discovery**: Use `allow_informative_errors: true` for API exploration
4. **Deep Relations**: You can include nested relations using dot notation (e.g., `Feature.Epic`)
5. **Custom Fields**: Remember to include `CustomFields` if you need custom field data
6. **Performance**: Requests with many includes may be slower to process
7. **API Exploration**: If you're unsure about entity types, use the `inspect_object` tool or `allow_informative_errors`