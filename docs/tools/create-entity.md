# create_entity

The `create_entity` tool allows you to create new entities in your Targetprocess instance. It supports creating various entity types with required and optional fields.

## Purpose

Use this tool when you need to:
- Create a new work item (user story, bug, task, etc.)
- Add a new project or team structure
- Create related items for existing entities
- Generate test data or populate templates

## Parameters

```json
{
  "type": "UserStory",          // Required: Entity type to create
  "name": "Login Feature",      // Required: Entity name
  "description": "Implement secure login", // Optional: Entity description
  "project": {                  // Required for most entities: Project to create in
    "id": 123
  },
  "team": {                     // Optional: Team to assign
    "id": 456
  },
  // Additional entity-specific fields...
}
```

## Parameter Details

### type (Required)
The type of entity to create. Must be one of the supported Targetprocess entity types:

```
'UserStory', 'Bug', 'Task', 'Feature', 'Epic', 'PortfolioEpic', 
'Solution', 'Request', 'Impediment', 'TestCase', 'TestPlan',
'Project', 'Team', 'Iteration', 'TeamIteration', 'Release', 'Program'
```

### name (Required)
The name of the entity to create. This is displayed in the Targetprocess UI.

### description (Optional)
A detailed description of the entity. Supports rich text formatting.

### project (Required for most entities)
The project to which the entity belongs. Must be specified as an object with an `id` field:

```json
"project": {
  "id": 123
}
```

This is required for most entity types (UserStory, Bug, Task, Feature, etc.) but may not be required for top-level entities like Project.

### team (Optional)
The team assigned to the entity. Must be specified as an object with an `id` field:

```json
"team": {
  "id": 456
}
```

### Entity-specific fields

Different entity types support different fields:

#### For UserStory/Bug/Task/Feature
- `priority`: Priority object with ID (`{ "id": 789 }`)
- `effort`: Numeric effort/story points value
- `tags`: Array of tag strings
- `userStory`: Parent user story (for Tasks/Bugs) (`{ "id": 12345 }`)
- `feature`: Parent feature (for UserStory) (`{ "id": 67890 }`)
- `assignedUser`: User to assign (`{ "id": 111 }`)

#### For Project
- `program`: Parent program (`{ "id": 222 }`)
- `owner`: Project owner (`{ "id": 333 }`)

#### For Team
- `teamMembers`: Array of user IDs to add to the team

## Response Format

The tool returns a JSON object representing the newly created entity, including:

- The generated ID for the new entity
- All standard fields (Name, Description, etc.)
- Any related data specified during creation
- Entity-specific fields based on the entity type

Example response structure:

```json
{
  "Id": 12345,
  "Name": "Login Feature",
  "Description": "Implement secure login",
  "CreateDate": "2024-05-08T15:30:00Z",
  "ModifyDate": "2024-05-08T15:30:00Z",
  "Project": {
    "Id": 123,
    "Name": "Mobile App"
  },
  "Team": {
    "Id": 456,
    "Name": "Frontend Team"
  },
  "EntityState": {
    "Id": 300,
    "Name": "Open"
  }
}
```

## Examples

### Create a User Story

```json
{
  "type": "UserStory",
  "name": "Implement OAuth authentication",
  "description": "Add support for OAuth 2.0 to the login screen",
  "project": {
    "id": 123
  },
  "team": {
    "id": 456
  },
  "priority": {
    "id": 789
  },
  "effort": 5
}
```

### Create a Task in a User Story

```json
{
  "type": "Task",
  "name": "Design OAuth flow diagram",
  "description": "Create a sequence diagram for the OAuth authentication flow",
  "project": {
    "id": 123
  },
  "userStory": {
    "id": 12345
  },
  "assignedUser": {
    "id": 111
  }
}
```

### Create a Bug

```json
{
  "type": "Bug",
  "name": "Login screen crashes on small devices",
  "description": "The login screen crashes when viewed on phones with screens smaller than 5 inches",
  "project": {
    "id": 123
  },
  "priority": {
    "id": 999
  },
  "tags": ["mobile", "crash", "login"]
}
```

### Create a New Project

```json
{
  "type": "Project",
  "name": "New Analytics Dashboard",
  "description": "Project for creating the new analytics dashboard for customers",
  "owner": {
    "id": 333
  }
}
```

## Common Errors

### Missing Required Fields
```
Invalid create parameters: name is required
```
**Solution:** Ensure all required fields (like name) are provided.

### Invalid Reference
```
Create entity failed: Project with id 999999 not found
```
**Solution:** Verify the IDs of referenced entities (Project, Team, etc.) are correct.

### Permission Error
```
Create entity failed: You don't have permission to create entities in this project
```
**Solution:** Ensure the authenticated user has permissions to create entities in the specified project.

### Invalid Entity Type
```
Invalid create parameters: type must be one of: UserStory, Bug, Task...
```
**Solution:** Use one of the supported entity types.

## Tips and Best Practices

1. **Validate IDs First**: Verify the existence of referenced entities (projects, teams, users) before creating
2. **Start Simple**: Begin with required fields and add optional fields as needed
3. **Use Proper Relations**: Ensure you're using the correct relation fields for parent entities
4. **Check Default States**: Newly created entities will use the default entity state unless specified
5. **Permission Check**: Ensure the authenticated user has permission to create entities in the target project
6. **Custom Fields**: For custom fields, use the `CustomFields` object with field names as keys
7. **Automatic Fields**: Some fields (CreateDate, ModifyDate) are set automatically by the system
8. **Validation Rules**: Be aware that your Targetprocess instance may have custom validation rules