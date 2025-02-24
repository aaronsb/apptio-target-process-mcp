# Targetprocess MCP Use Cases

This document outlines common use cases and procedures for interacting with Targetprocess through the MCP server. Each use case demonstrates how to accomplish common tasks programmatically using the available MCP tools.

## Common Use Cases

### 1. Viewing Department/Team Information

**Purpose:** Retrieve and analyze team and department-level information.

**Using MCP Tools:**

```json
// Search for all teams in a specific department
{
  "type": "Team",
  "include": ["Project", "AssignedUser"],
  "where": "Department.Name == 'IT'",
  "take": 100
}
```

**Tips:**
- Use the `include` parameter to fetch related data in a single request
- The `where` clause supports complex filtering expressions
- Increase `take` value (up to 1000) to retrieve more results

### 2. Running Cost Reports

**Purpose:** Analyze project costs and spending across the organization.

**Using MCP Tools:**

```json
// Get project cost information
{
  "type": "Project",
  "include": ["Budget", "Effort", "Team"],
  "where": "StartDate >= '2024-01-01'",
  "orderBy": ["StartDate desc"]
}

// Get specific project details
{
  "type": "Project",
  "id": 123,
  "include": ["Budget", "Effort", "Team", "UserStories"]
}
```

**Tips:**
- Use date filters in the `where` clause for period-specific analysis
- Include related entities to get comprehensive cost data
- Chain multiple requests to build detailed reports

### 3. Managing Application Information

**Purpose:** Track and update application-related entities.

**Using MCP Tools:**

```json
// Create a new feature for an application
{
  "type": "Feature",
  "name": "New Authentication System",
  "description": "Implement OAuth 2.0 authentication",
  "project": {
    "id": 123
  },
  "team": {
    "id": 456
  }
}

// Search for application features
{
  "type": "Feature",
  "where": "Project.Id == 123",
  "include": ["Project", "Team", "UserStories"]
}
```

**Tips:**
- Use entity relationships to maintain proper connections
- Include relevant teams and projects when creating new entities
- Update existing entities to reflect changes in status or ownership

### 4. Tracking Work Items

**Purpose:** Monitor and manage user stories, bugs, and tasks.

**Using MCP Tools:**

```json
// Search for active user stories
{
  "type": "UserStory",
  "where": "EntityState.Name == 'In Progress'",
  "include": ["AssignedUser", "Team", "Project"]
}

// Update work item status
{
  "type": "UserStory",
  "id": 789,
  "fields": {
    "status": {
      "id": 101
    },
    "assignedUser": {
      "id": 202
    }
  }
}
```

**Tips:**
- Use entity states to track progress
- Include assignees and teams for accountability
- Update multiple fields in a single request

### 5. Budget vs. Actual Analysis

**Purpose:** Compare planned versus actual metrics.

**Using MCP Tools:**

```json
// Get project metrics
{
  "type": "Project",
  "include": ["Budget", "TimeSpent", "Effort"],
  "where": "EndDate >= Today()"
}

// Get team capacity
{
  "type": "Team",
  "include": ["Capacity", "TimeSpent"],
  "where": "Project.Id == 123"
}
```

**Tips:**
- Combine multiple queries to build comprehensive reports
- Use date-based filters for period-specific analysis
- Include relevant metrics for comparison

## Best Practices

1. **Error Handling:**
   - Always check response status
   - Handle rate limits appropriately
   - Implement retry logic for failed requests

2. **Performance:**
   - Use specific `where` clauses to limit result sets
   - Include only necessary related data
   - Batch operations when possible

3. **Data Management:**
   - Keep entity references up to date
   - Maintain proper relationships between entities
   - Archive or clean up obsolete data

## Advanced Tips

### Complex Queries

Combine multiple conditions in where clauses:

```json
{
  "type": "UserStory",
  "where": "(EntityState.Name == 'In Progress' or EntityState.Name == 'Testing') and Team.Name == 'DevOps'",
  "include": ["Tasks", "Bugs"]
}
```

### Bulk Operations

When working with multiple entities:

```json
// Get all stories for a release
{
  "type": "UserStory",
  "where": "Release.Id == 123",
  "take": 1000
}
```

### Custom Fields

Access and update custom fields:

```json
{
  "type": "UserStory",
  "id": 456,
  "fields": {
    "CustomField.RiskLevel": "High",
    "CustomField.Priority": 1
  }
}
```

## Troubleshooting

If you encounter issues:

1. Verify entity IDs and relationships
2. Check permission levels for the authenticated user
3. Validate query syntax and field names
4. Review API response codes for specific error messages

---

*Note: The examples above assume appropriate permissions and access levels. Actual field names and entity relationships may vary based on your Targetprocess configuration.*
