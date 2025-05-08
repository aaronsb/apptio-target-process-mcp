# update_entity

The `update_entity` tool allows you to update existing entities in your Targetprocess instance by modifying their fields, relationships, and properties.

## Purpose

Use this tool when you need to:
- Change the status of a work item
- Reassign a task to a different user
- Update priority, effort, or description
- Move items between projects or teams
- Add or modify custom field values

## Parameters

```json
{
  "type": "UserStory",          // Required: Entity type
  "id": 12345,                  // Required: Entity ID
  "fields": {                   // Required: Fields to update
    "name": "Updated Name",
    "description": "New description",
    "status": {
      "id": 789
    },
    "team": {
      "id": 456
    },
    "assignedUser": {
      "id": 111
    }
  }
}
```

## Parameter Details

### type (Required)
The type of entity to update. Must be one of the supported Targetprocess entity types:

```
'UserStory', 'Bug', 'Task', 'Feature', 'Epic', 'PortfolioEpic', 
'Solution', 'Request', 'Impediment', 'TestCase', 'TestPlan',
'Project', 'Team', 'Iteration', 'TeamIteration', 'Release', 'Program'
```

### id (Required)
The unique identifier of the entity to update. This must be a number.

### fields (Required)
An object containing the fields to update. Only the fields included in this object will be modified; all other fields will remain unchanged.

Common fields that can be updated:

#### Text Fields
- `name`: Entity name
- `description`: Detailed description

#### Status and Priority
- `status` or `entityState`: Current status (`{ "id": 789 }`)
- `priority`: Priority level (`{ "id": 999 }`)

#### Relationships
- `team`: Assigned team (`{ "id": 456 }`)
- `project`: Parent project (`{ "id": 123 }`)
- `assignedUser`: Assigned user (`{ "id": 111 }`)
- `feature`: Parent feature (for UserStory) (`{ "id": 67890 }`)
- `userStory`: Parent user story (for Task/Bug) (`{ "id": 12345 }`)

#### Numeric Fields
- `effort`: Story points/effort estimate
- `timeSpent`: Time spent on the item

#### Custom Fields
Custom fields can be updated through the `CustomFields` object:

```json
"fields": {
  "CustomFields": {
    "RiskLevel": "High",
    "BusinessValue": 8
  }
}
```

## Response Format

The tool returns a JSON object representing the updated entity, including:

- All standard fields (Id, Name, Description, etc.)
- The modified fields with their new values
- Any related data that was updated
- Entity-specific fields based on the entity type

Example response structure:

```json
{
  "Id": 12345,
  "Name": "Updated Login Feature",
  "Description": "New description with security requirements",
  "CreateDate": "2024-01-15T10:30:00Z",
  "ModifyDate": "2024-05-08T16:45:00Z",
  "Project": {
    "Id": 123,
    "Name": "Mobile App"
  },
  "Team": {
    "Id": 456,
    "Name": "Frontend Team"
  },
  "EntityState": {
    "Id": 789,
    "Name": "In Progress"
  },
  "AssignedUser": {
    "Id": 111,
    "FirstName": "John",
    "LastName": "Smith"
  }
}
```

## Examples

### Update Status

Change the status of a user story:

```json
{
  "type": "UserStory",
  "id": 12345,
  "fields": {
    "status": {
      "id": 789
    }
  }
}
```

### Reassign and Update Priority

Reassign a bug and change its priority:

```json
{
  "type": "Bug",
  "id": 67890,
  "fields": {
    "assignedUser": {
      "id": 111
    },
    "priority": {
      "id": 999
    }
  }
}
```

### Update Description and Effort

Update a task's description and effort estimate:

```json
{
  "type": "Task",
  "id": 54321,
  "fields": {
    "description": "Updated task description with detailed steps",
    "effort": 8
  }
}
```

### Move Between Projects

Move a user story to a different project:

```json
{
  "type": "UserStory",
  "id": 12345,
  "fields": {
    "project": {
      "id": 789
    }
  }
}
```

### Update Custom Fields

Update custom fields on a feature:

```json
{
  "type": "Feature",
  "id": 67890,
  "fields": {
    "CustomFields": {
      "RiskLevel": "Medium",
      "BusinessValue": 7,
      "TargetRelease": "2024 Q3"
    }
  }
}
```

## Common Errors

### Entity Not Found
```
Update entity failed: Entity with id 12345 not found
```
**Solution:** Verify the entity ID is correct and exists.

### Invalid Entity Type
```
Invalid update parameters: type must be one of: UserStory, Bug, Task, Feature...
```
**Solution:** Use one of the supported entity types.

### Invalid Reference
```
Update entity failed: Status with id 999999 not found
```
**Solution:** Verify the IDs of referenced entities (Status, Team, User, etc.) are correct.

### Permission Error
```
Update entity failed: You don't have permission to update this entity
```
**Solution:** Ensure the authenticated user has permissions to update the entity.

### Missing Required Fields
```
Invalid update parameters: id is required
```
**Solution:** Ensure all required parameters are provided.

## Tips and Best Practices

1. **Minimal Updates**: Only include the fields you want to change in the `fields` object
2. **Verify IDs First**: Check that entity IDs and reference IDs are valid before updating
3. **Status Transitions**: Be aware of valid state transitions in your Targetprocess workflow
4. **Custom Fields**: Use the `CustomFields` object for updating custom fields
5. **Batch Updates**: For updating multiple entities with the same changes, use multiple calls in a loop
6. **Validation Rules**: Your Targetprocess instance may have custom validation rules
7. **Check Response**: Always check the response to verify the update was successful
8. **Permission Check**: Ensure the authenticated user has permission to make the desired changes