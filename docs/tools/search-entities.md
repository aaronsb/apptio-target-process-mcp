# search_entities

The `search_entities` tool allows you to search for Targetprocess entities based on type and filter criteria. It supports complex filters, includes for related data, pagination, and ordering.

## Purpose

Use this tool when you need to:
- Find entities matching specific criteria
- Get a list of entities for analysis or processing
- Filter entities by status, ownership, dates, etc.
- Retrieve groups of related entities

## Parameters

```json
{
  "type": "UserStory",          // Required: Entity type to search for
  "where": "EntityState.Name eq 'Open'", // Optional: Filter expression
  "take": 100,                  // Optional: Number of items to return (default: 100, max: 1000)
  "skip": 0,                    // Optional: Number of items to skip (for pagination)
  "include": ["Project", "Team"], // Optional: Related data to include
  "orderBy": ["CreateDate desc"] // Optional: Sorting criteria
}
```

## Parameter Details

### type (Required)
The type of entity to search for. Must be one of the supported Targetprocess entity types:

```
'UserStory', 'Bug', 'Task', 'Feature', 'Epic', 'PortfolioEpic', 
'Solution', 'Request', 'Impediment', 'TestCase', 'TestPlan',
'Project', 'Team', 'Iteration', 'TeamIteration', 'Release', 'Program'
```

### where (Optional)
A filter expression to narrow down the search results. The syntax follows Targetprocess query language:

- **Equality**: `Field eq 'Value'`
- **Inequality**: `Field ne 'Value'`
- **Greater/Less Than**: `Field gt 10`, `Field lt 20`
- **Logical AND/OR**: `Field1 eq 'Value1' and Field2 eq 'Value2'`
- **Contains**: `Field contains 'Value'`
- **Null Check**: `Field is null`, `Field is not null`

Examples:
- `"EntityState.Name eq 'Open'"`
- `"Project.Id eq 123 and AssignedUser.FirstName eq 'John'"`
- `"CreateDate gt '2024-01-01' and Name contains 'API'"`

### take (Optional)
The number of items to return. Default is 100, maximum is 1000.

### skip (Optional)
The number of items to skip, used for pagination. Default is 0.

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

### orderBy (Optional)
An array of sorting criteria. Each criterion is a string in the format `Field [asc|desc]`.

Examples:
- `["CreateDate desc"]`: Sort by creation date, newest first
- `["Priority.Importance desc", "Name asc"]`: Sort by priority descending, then by name ascending

## Response Format

The tool returns a JSON array of entities matching the search criteria. Each entity includes:

- All standard fields (Id, Name, Description, etc.)
- Any related data requested via the `include` parameter
- Entity-specific fields based on the entity type

Example response structure:

```json
[
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
    }
  },
  // More entities...
]
```

## Examples

### Basic Search

Find all open user stories:

```json
{
  "type": "UserStory",
  "where": "EntityState.Name eq 'Open'"
}
```

### Search with Related Data

Find bugs assigned to a specific user and include project information:

```json
{
  "type": "Bug",
  "where": "AssignedUser.FirstName eq 'John' and AssignedUser.LastName eq 'Smith'",
  "include": ["Project", "EntityState", "Priority"]
}
```

### Pagination

Get the second page of 50 tasks:

```json
{
  "type": "Task",
  "take": 50,
  "skip": 50,
  "orderBy": ["CreateDate desc"]
}
```

### Complex Filtering

Find high-priority features that are either in progress or testing:

```json
{
  "type": "Feature",
  "where": "Priority.Name eq 'High' and (EntityState.Name eq 'In Progress' or EntityState.Name eq 'Testing')",
  "include": ["Project", "Team", "AssignedUser"]
}
```

### Date-Based Filtering

Find user stories created this month:

```json
{
  "type": "UserStory",
  "where": "CreateDate gt '2024-05-01' and CreateDate lt '2024-06-01'",
  "include": ["Project", "Team"]
}
```

## Common Errors

### Invalid Entity Type
```
Invalid search parameters: type must be one of: UserStory, Bug, Task, Feature...
```
**Solution:** Use one of the supported entity types.

### Invalid Where Clause
```
Get entities failed: Invalid filter expression
```
**Solution:** Check the syntax of your where clause. Ensure string values are enclosed in single quotes.

### Missing Required Fields
```
Invalid search parameters: type is required
```
**Solution:** Ensure you're providing all required parameters.

### Too Many Results
```
Too many results. Please use more specific filters.
```
**Solution:** Add more specific filtering criteria to narrow down the results.

## Tips and Best Practices

1. **Start Specific**: Begin with specific queries and gradually broaden if needed
2. **Limit Results**: Use `take` to limit result size, especially for large datasets
3. **Include Only What's Needed**: Only include related data that you actually need
4. **Use Pagination**: For large result sets, implement pagination
5. **Optimize Where Clauses**: Place the most restrictive conditions first
6. **Query Performance**: Complex filters with multiple includes may be slow
7. **Date Formatting**: Use ISO format for dates (`YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`)
8. **Case Sensitivity**: String comparisons are case-sensitive