# Basic Operations

This document covers the essential operations you can perform with the Targetprocess MCP, including searching, creating, and updating entities.

## Finding Entities

The most common operation is finding entities in your Targetprocess instance. Here are some common search patterns:

### Find Open User Stories

```json
{
  "type": "UserStory",
  "where": "EntityState.Name eq 'Open'",
  "include": ["Project", "Team", "AssignedUser"]
}
```

### Find Bugs Assigned to a User

```json
{
  "type": "Bug",
  "where": "AssignedUser.FirstName eq 'John' and AssignedUser.LastName eq 'Smith'",
  "include": ["Project", "EntityState"]
}
```

### Find Tasks for a Specific User Story

```json
{
  "type": "Task",
  "where": "UserStory.Id eq 12345",
  "include": ["AssignedUser", "EntityState"]
}
```

### Find Recently Modified Entities

```json
{
  "type": "UserStory",
  "where": "ModifyDate gt '2024-05-01'",
  "include": ["Project", "Team"],
  "orderBy": ["ModifyDate desc"]
}
```

## Creating New Items

Creating new entities is straightforward with the create_entity tool:

### Create a User Story

```json
{
  "type": "UserStory",
  "name": "Implement user authentication",
  "description": "Add secure authentication to the login page",
  "project": {
    "id": 123
  },
  "team": {
    "id": 456
  }
}
```

### Create a Bug

```json
{
  "type": "Bug",
  "name": "Login button unresponsive on mobile",
  "description": "The login button does not respond to taps on mobile devices",
  "project": {
    "id": 123
  },
  "priority": {
    "id": 789
  }
}
```

### Create a Task Within a User Story

```json
{
  "type": "Task",
  "name": "Design login page mockups",
  "description": "Create UI mockups for the new login page",
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

## Updating Status

Updating entity status and other properties is done with the update_entity tool:

### Change User Story Status

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

### Reassign a Bug

```json
{
  "type": "Bug",
  "id": 67890,
  "fields": {
    "assignedUser": {
      "id": 111
    }
  }
}
```

### Update Multiple Fields

```json
{
  "type": "Task",
  "id": 54321,
  "fields": {
    "status": {
      "id": 789
    },
    "description": "Updated description with new details",
    "effort": 5
  }
}
```

## Getting Detailed Information

To get detailed information about a specific entity:

### Get a User Story with Related Data

```json
{
  "type": "UserStory",
  "id": 12345,
  "include": ["Project", "Team", "Tasks", "Bugs", "Comments"]
}
```

### Get a Project with Teams and User Stories

```json
{
  "type": "Project",
  "id": 123,
  "include": ["Teams", "UserStories", "Features"]
}
```

## Team Management

Managing teams and their workload:

### Find All Teams

```json
{
  "type": "Team",
  "include": ["Projects", "Users"]
}
```

### Find Team's Current Work

```json
{
  "type": "UserStory",
  "where": "Team.Id eq 456 and EntityState.Name ne 'Done'",
  "include": ["AssignedUser", "EntityState", "Tasks"]
}
```

### Update Team Assignment

```json
{
  "type": "UserStory",
  "id": 12345,
  "fields": {
    "team": {
      "id": 789
    }
  }
}
```

## Sprint Planning

Working with iterations and sprint planning:

### Find Current Iteration

```json
{
  "type": "TeamIteration",
  "where": "StartDate le @Today and EndDate ge @Today and Team.Id eq 456",
  "include": ["Team", "UserStories"]
}
```

### Assign User Story to Iteration

```json
{
  "type": "UserStory",
  "id": 12345,
  "fields": {
    "teamIteration": {
      "id": 789
    }
  }
}
```

### Find Unassigned User Stories

```json
{
  "type": "UserStory",
  "where": "TeamIteration is null and EntityState.Name ne 'Done' and Team.Id eq 456",
  "include": ["Project", "Team"]
}
```

## Task Management

Working with tasks and their relationships:

### Create Subtasks

```json
{
  "type": "Task",
  "name": "Implement form validation",
  "description": "Add validation to login form fields",
  "project": {
    "id": 123
  },
  "userStory": {
    "id": 12345
  }
}
```

### Find Tasks by Status

```json
{
  "type": "Task",
  "where": "EntityState.Name eq 'In Progress'",
  "include": ["UserStory", "AssignedUser", "Project"]
}
```

### Track Task Progress

```json
{
  "type": "Task",
  "id": 54321,
  "fields": {
    "timeSpent": 4.5, // hours
    "remainingTime": 2.0 // hours
  }
}
```

## Bug Tracking

Managing bugs and defects:

### Create a Bug Report

```json
{
  "type": "Bug",
  "name": "Server error on form submission",
  "description": "500 error when submitting the registration form with special characters",
  "project": {
    "id": 123
  },
  "priority": {
    "id": 999 // High priority
  }
}
```

### Link Bug to User Story

```json
{
  "type": "Bug",
  "id": 67890,
  "fields": {
    "userStory": {
      "id": 12345
    }
  }
}
```

### Find Critical Bugs

```json
{
  "type": "Bug",
  "where": "Priority.Importance gt 80 and EntityState.Name ne 'Done'",
  "include": ["Project", "AssignedUser", "UserStory"],
  "orderBy": ["Priority.Importance desc"]
}
```

## Project Structure

Working with the project structure:

### Create Project Hierarchy

```json
// Create a feature
{
  "type": "Feature",
  "name": "User Authentication",
  "description": "Complete authentication system for the application",
  "project": {
    "id": 123
  }
}

// Create a user story within the feature
{
  "type": "UserStory",
  "name": "Implement login screen",
  "description": "Create the login screen UI and functionality",
  "project": {
    "id": 123
  },
  "feature": {
    "id": 456 // ID of the feature created above
  }
}
```

### Explore Project Structure

```json
{
  "type": "Project",
  "id": 123,
  "include": ["Epics", "Features", "UserStories", "Teams", "TeamIterations"]
}
```

## Common Department and Team Operations

### Viewing Department/Team Information

**Purpose:** Retrieve and analyze team and department-level information.

**Using MCP Tools:**

```json
// Search for all teams in a specific department
{
  "type": "Team",
  "include": ["Project", "AssignedUser"],
  "where": "Department.Name eq 'IT'",
  "take": 100
}
```

**Tips:**
- Use the `include` parameter to fetch related data in a single request
- The `where` clause supports complex filtering expressions
- Increase `take` value (up to 1000) to retrieve more results

### Running Cost Reports

**Purpose:** Analyze project costs and spending across the organization.

**Using MCP Tools:**

```json
// Get project cost information
{
  "type": "Project",
  "include": ["Budget", "Effort", "Team"],
  "where": "StartDate gt '2024-01-01'",
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

### Managing Application Information

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
  "where": "Project.Id eq 123",
  "include": ["Project", "Team", "UserStories"]
}
```

**Tips:**
- Use entity relationships to maintain proper connections
- Include relevant teams and projects when creating new entities
- Update existing entities to reflect changes in status or ownership

### Budget vs. Actual Analysis

**Purpose:** Compare planned versus actual metrics.

**Using MCP Tools:**

```json
// Get project metrics
{
  "type": "Project",
  "include": ["Budget", "TimeSpent", "Effort"],
  "where": "EndDate gt @Today"
}

// Get team capacity
{
  "type": "Team",
  "include": ["Capacity", "TimeSpent"],
  "where": "Project.Id eq 123"
}
```

**Tips:**
- Combine multiple queries to build comprehensive reports
- Use date-based filters for period-specific analysis
- Include relevant metrics for comparison

## Tips for Basic Operations

1. **Start Specific**: Begin with specific queries and gradually broaden if needed
2. **Include Related Data**: Use the `include` parameter to minimize API calls
3. **Check IDs**: Verify entity IDs before referencing them in create or update operations
4. **Status Transitions**: Be aware of valid state transitions in your workflow
5. **Required Fields**: Make sure to include all required fields when creating entities
6. **Permissions**: Operations are limited by the authenticated user's permissions
7. **Error Handling**: Always check for errors and handle them appropriately