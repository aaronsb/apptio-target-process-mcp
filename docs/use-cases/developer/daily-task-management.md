# Daily Task Management

A comprehensive guide for developers to manage their daily tasks using semantic operations.

## Overview

This use case covers the typical daily workflow of a developer:
1. Reviewing assigned tasks
2. Prioritizing work based on deadlines and importance
3. Starting work with proper state transitions
4. Managing task progress throughout the day

## Prerequisites

- Developer role configured (`TP_USER_ROLE=developer`)
- Valid user credentials with task assignments
- Understanding of your team's workflow states

## Scenarios

### 🌅 Morning Task Review

Start your day by getting an overview of your assigned work.

#### Basic Review

```typescript
// Show all my open tasks
await mcp.show_my_tasks({
  includeCompleted: false
});
```

**Expected Response:**
```json
{
  "tasks": [
    {
      "id": 12345,
      "name": "Implement user authentication",
      "priority": "High",
      "state": "Open",
      "age": "2 days",
      "estimate": 8,
      "project": "Mobile App",
      "deadline": "2024-01-15"
    },
    // ... more tasks
  ],
  "summary": {
    "total": 8,
    "highPriority": 3,
    "overdue": 1,
    "todaysDue": 2
  },
  "suggestions": [
    "You have 1 overdue task that needs attention",
    "3 high-priority tasks should be addressed first",
    "Consider starting with 'Fix critical login bug' (overdue)"
  ]
}
```

#### Filtered Views

```typescript
// Show only high-priority tasks
await mcp.show_my_tasks({
  priority: "high",
  includeCompleted: false
});

// Show tasks due this week
await mcp.show_my_tasks({
  dueWithin: "thisWeek",
  orderBy: "deadline"
});
```

### 🚀 Starting Work

Once you've identified what to work on, properly transition the task.

#### Start Working on a Task

```typescript
await mcp.start_working_on({
  taskId: 12345,
  comment: "Beginning implementation of OAuth2 flow"
});
```

**Expected Response:**
```json
{
  "success": true,
  "task": {
    "id": 12345,
    "name": "Implement user authentication",
    "state": "In Progress",
    "assignedTo": "current.user@company.com",
    "stateChangedAt": "2024-01-10T09:15:00Z"
  },
  "workflow": {
    "previousState": "Open",
    "newState": "In Progress",
    "automaticActions": [
      "Task assigned to you",
      "Team notified of progress",
      "Sprint burndown updated"
    ]
  },
  "suggestions": [
    "Remember to break down the task if it's too large",
    "Consider creating subtasks for testing",
    "Update your progress at least daily"
  ]
}
```

### 📊 Progress Management

Keep your tasks updated throughout the day.

#### Update Progress

```typescript
await mcp.update_progress({
  taskId: 12345,
  percentComplete: 60,
  comment: "OAuth2 integration complete, working on UI",
  remainingHours: 3
});
```

#### Handle Blockers

```typescript
await mcp.report_blocker({
  taskId: 12345,
  description: "Waiting for API credentials from DevOps",
  impact: "Cannot test authentication flow",
  needHelp: true
});
```

**System Response:**
- Creates impediment linked to task
- Notifies project manager
- Suggests alternative tasks to work on

### ⏸️ Context Switching

Handle interruptions and urgent requests professionally.

#### Pause Current Work

```typescript
await mcp.pause_work({
  taskId: 12345,
  reason: "Switching to urgent production bug",
  resumeReminder: "tomorrow",
  progressNote: "Completed auth flow, need to implement refresh tokens"
});
```

### ✅ Task Completion

Properly close tasks and log your effort.

#### Complete a Task

```typescript
await mcp.complete_task({
  taskId: 12345,
  timeSpent: 12,
  summary: "Implemented OAuth2 authentication with refresh token support"
});
```

**Expected Response:**
```json
{
  "success": true,
  "task": {
    "id": 12345,
    "state": "Done",
    "completedAt": "2024-01-10T17:30:00Z",
    "totalEffort": 12
  },
  "nextSteps": [
    "Time has been logged automatically",
    "Consider requesting code review",
    "You have 2 more high-priority tasks"
  ],
  "workflow": {
    "triggered": [
      "Sprint velocity updated",
      "Team capacity refreshed",
      "Completion notification sent"
    ]
  }
}
```

## Best Practices

### 1. Start Your Day Right
- Always begin with `show-my-tasks` for context
- Review overdue and high-priority items first
- Check for any overnight blockers or comments

### 2. Maintain Task Hygiene
- Update progress at least once per day
- Add comments when switching contexts
- Report blockers immediately

### 3. Use Workflow Intelligence
- Let the system guide you to next tasks
- Follow suggestions for better productivity
- Trust the priority recommendations

### 4. Time Tracking
- Log time when completing tasks
- Use pause/resume for accurate tracking
- Include meaningful work summaries

## Common Issues and Solutions

### "No tasks assigned"
- Check your user configuration
- Verify project assignments
- Contact project manager for work allocation

### "Cannot transition state"
- Task may be blocked by dependencies
- Check required fields
- Verify workflow permissions

### "Time logging failed"
- Ensure date is within allowed range
- Check maximum hours per day limits
- Verify time entry permissions

## Related Use Cases

- [Time Tracking Patterns](time-tracking.md)
- [Bug Investigation Workflow](bug-investigation.md)
- [Code Review Process](code-review.md)