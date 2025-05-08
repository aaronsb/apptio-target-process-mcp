# Advanced Queries

This document covers advanced query patterns and filtering techniques for the Targetprocess MCP. These techniques help you extract exactly the data you need from complex Targetprocess instances.

## Complex Filtering

### Nested Conditions

You can combine multiple conditions with parentheses for complex filtering:

```json
// Find high-priority stories that are either in progress or testing
{
  "type": "UserStory",
  "where": "Priority.Name eq 'High' and (EntityState.Name eq 'In Progress' or EntityState.Name eq 'Testing')",
  "include": ["Project", "Team", "AssignedUser"]
}
```

### Date-Based Filters

Targetprocess supports a variety of date-based filters:

```json
// Find items created this month but not yet started
{
  "type": "UserStory",
  "where": "CreateDate gt @StartOfMonth and EntityState.Name eq 'Open'",
  "include": ["Project", "Team"]
}

// Find items that have been in progress for more than 2 weeks
{
  "type": "UserStory",
  "where": "EntityState.Name eq 'In Progress' and StartDate lt @Today-14",
  "include": ["Project", "Team", "AssignedUser"]
}

// Find items due in the next 30 days
{
  "type": "UserStory",
  "where": "DueDate gt @Today and DueDate lt @Today+30",
  "include": ["Project", "Team", "AssignedUser"]
}
```

### Custom Field Filtering

Filter by custom field values:

```json
// Filter by custom field values
{
  "type": "UserStory",
  "where": "CustomField.RiskLevel eq 'High' and CustomField.BusinessValue gt 8",
  "include": ["Project", "Team"]
}
```

## Entity Relationships

### Relationship-Based Queries

Find entities based on their relationships:

```json
// Find stories with specific related entities
{
  "type": "UserStory",
  "where": "Tasks.Count gt 0 and Bugs.Count eq 0",
  "include": ["Tasks", "Project"]
}

// Find stories related to a specific feature
{
  "type": "UserStory",
  "where": "Feature.Id eq 12345",
  "include": ["Feature", "Project", "Team"]
}

// Find features without epics
{
  "type": "Feature",
  "where": "Epic is null",
  "include": ["Project", "UserStories"]
}
```

### Relationship Exploration

Explore entity relationships:

```json
// Get a user story with all relationships
{
  "type": "UserStory",
  "id": 12345,
  "include": ["Project", "Team", "Feature", "Epic", "Tasks", "Bugs", "Comments", "CustomFields"]
}

// Explore feature to story relationships
{
  "type": "Feature",
  "id": 67890,
  "include": ["UserStories", "Epic", "Project", "Teams"]
}
```

## Advanced Text Search

### Text-Based Searches

Search for specific text in fields:

```json
// Search for specific text in name or description
{
  "type": "UserStory",
  "where": "Name contains 'API' or Description contains 'integration'",
  "include": ["Project", "Team"]
}

// Find items with specific naming patterns
{
  "type": "Bug",
  "where": "Name startswith 'CRITICAL:'",
  "include": ["Project", "AssignedUser"]
}

// Search across multiple entity types (multiple calls)
// First search in user stories
{
  "type": "UserStory",
  "where": "Description contains 'security vulnerability'",
  "include": ["Project", "Team"]
}

// Then search in bugs
{
  "type": "Bug",
  "where": "Description contains 'security vulnerability'",
  "include": ["Project", "Team"]
}
```

## Collection Filtering

### Filtering by Collection Properties

Filter based on collection properties:

```json
// Find projects with more than 10 active stories
{
  "type": "Project",
  "where": "UserStories.Count(EntityState.Name eq 'In Progress') gt 10",
  "include": ["Teams"]
}

// Find user stories with specific task counts
{
  "type": "UserStory",
  "where": "Tasks.Count gt 5 and Bugs.Count eq 0",
  "include": ["Project", "Team", "Tasks"]
}
```

## Null Value Checks

### Finding Missing Values

Find entities with missing information:

```json
// Find stories missing required information
{
  "type": "UserStory",
  "where": "Description is null or Effort is null or AssignedUser is null",
  "include": ["Project", "Team"]
}

// Find tasks without parent stories
{
  "type": "Task",
  "where": "UserStory is null",
  "include": ["Project", "AssignedUser"]
}
```

## Combining Multiple Conditions

### Complex Multi-Condition Queries

Combine multiple conditions for precise filtering:

```json
// Complex query combining multiple conditions
{
  "type": "UserStory",
  "where": "Project.Id eq 123 and Team.Id eq 456 and Priority.Name eq 'High' and EntityState.Name ne 'Done' and CreateDate gt '2024-01-01' and AssignedUser is not null",
  "include": ["Project", "Team", "AssignedUser", "Tasks", "Bugs"],
  "orderBy": ["Priority.Importance desc", "CreateDate asc"]
}
```

## Query Operators

### Available Operators

Targetprocess supports a variety of operators:

- **eq**: Equal
- **ne**: Not Equal
- **gt**: Greater Than
- **lt**: Less Than
- **ge**: Greater Than or Equal
- **le**: Less Than or Equal
- **contains**: Contains substring
- **startswith**: Starts with substring
- **endswith**: Ends with substring
- **in**: In a list of values
- **and**: Logical AND
- **or**: Logical OR
- **not**: Logical NOT
- **is null**: Is null
- **is not null**: Is not null

Examples:

```json
// Using gt/lt operators
{
  "type": "UserStory",
  "where": "Effort gt 5 and Effort lt 13",
  "include": ["Project", "Team"]
}

// Using in operator
{
  "type": "UserStory",
  "where": "EntityState.Name in ('Open', 'In Progress')",
  "include": ["Project", "Team"]
}

// Using not operator
{
  "type": "UserStory",
  "where": "not (EntityState.Name eq 'Done')",
  "include": ["Project", "Team"]
}
```

## Advanced Sorting

### Multi-Level Sorting

Sort results by multiple criteria:

```json
// Sort by multiple fields
{
  "type": "UserStory",
  "where": "Project.Id eq 123",
  "orderBy": ["Priority.Importance desc", "CreateDate asc", "Name asc"],
  "include": ["Project", "Team", "AssignedUser"]
}
```

## Timeboxed Queries

### Finding Items in Specific Time Periods

Find items within specific time boundaries:

```json
// Find items created last week
{
  "type": "UserStory",
  "where": "CreateDate gt @StartOfLastWeek and CreateDate lt @EndOfLastWeek",
  "include": ["Project", "Team"]
}

// Find items due this month
{
  "type": "UserStory",
  "where": "DueDate gt @StartOfMonth and DueDate lt @EndOfMonth",
  "include": ["Project", "Team"]
}
```

## Querying by Metrics

### Finding Items by Numeric Properties

Query based on numeric metrics:

```json
// Find high effort stories
{
  "type": "UserStory",
  "where": "Effort gt 13",
  "include": ["Project", "Team"]
}

// Find items with significant time spent
{
  "type": "UserStory",
  "where": "TimeSpent gt 40",
  "include": ["Project", "Team", "AssignedUser"]
}
```

## Advanced Use Cases

### Finding Blocked Items

Find items that are blocked or have dependencies:

```json
// Find items with blocking bugs
{
  "type": "UserStory",
  "where": "Bugs.Count(Priority.Name eq 'Blocker') gt 0",
  "include": ["Project", "Team", "Bugs"]
}
```

### Finding Workflow Anomalies

Identify items that may indicate workflow issues:

```json
// Find items stuck in a state for too long
{
  "type": "UserStory",
  "where": "EntityState.Name eq 'In Progress' and ModifyDate lt @Today-30",
  "include": ["Project", "Team", "AssignedUser"]
}

// Find items that bounce between states
{
  "type": "UserStory",
  "where": "EntityState.Name eq 'Testing' and TimeInState.TotalHours lt 24",
  "include": ["Project", "Team", "AssignedUser"]
}
```

## Tips for Advanced Queries

1. **Build Incrementally**: Start with simple queries and add complexity incrementally
2. **Test Each Condition**: Test each filter condition separately before combining
3. **Check Performance**: Complex queries with multiple conditions may be slower
4. **Limit Results**: Use the `take` parameter to limit large result sets
5. **Watch for Typos**: Field names and values are case-sensitive
6. **Date Formatting**: Use ISO format for dates (`YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`)
7. **Use Parentheses**: Parentheses clarify the order of operations in complex conditions
8. **Check Permissions**: Results are limited to entities the user has permission to view