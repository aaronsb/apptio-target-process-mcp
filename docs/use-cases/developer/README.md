# Developer Use Cases

This directory contains use cases specifically designed for software developers using the Targetprocess MCP with the developer personality.

## Available Use Cases

### 📋 [Daily Task Management](daily-task-management.md)
Start your day by reviewing assigned tasks, prioritizing work, and managing your workload.

**Requirements:** [daily-task-management-requirements.yaml](daily-task-management-requirements.yaml)

### 🐛 [Bug Investigation Workflow](bug-investigation.md)
Efficiently investigate, reproduce, and fix bugs with intelligent workflow guidance.

**Requirements:** [bug-investigation-requirements.yaml](bug-investigation-requirements.yaml)

### ⏱️ [Time Tracking Patterns](time-tracking.md)
Log time effectively, track effort, and maintain accurate records.

**Requirements:** [time-tracking-requirements.yaml](time-tracking-requirements.yaml)

### 👀 [Code Review Process](code-review.md)
Request reviews, handle feedback, and complete the review cycle.

**Requirements:** [code-review-requirements.yaml](code-review-requirements.yaml)

## Developer Personality Configuration

The developer personality provides these semantic operations:

```json
{
  "availableOperations": [
    "show-my-tasks",
    "start-working-on",
    "update-progress",
    "complete-task",
    "pause-work",
    "show-my-bugs",
    "investigate-bug",
    "mark-bug-fixed",
    "log-time",
    "show-time-spent",
    "add-comment",
    "report-blocker",
    "request-review"
  ]
}
```

## Workflow Hints

The system provides intelligent hints based on your workflow:

- **Daily Start**: Begin with `show-my-tasks`
- **Task Completed**: Follow up with `log-time`, then `show-my-tasks`
- **Bug Fixed**: Consider `request-review`, then `show-my-bugs`
- **End of Day**: Remember to `log-time` and `update-progress`

## Testing Your Workflows

To test these use cases:

1. Set your role:
   ```bash
   export TP_USER_ROLE=developer
   export TP_USER_ID=your-user-id
   ```

2. Use the MCP inspector:
   ```bash
   npm run inspector
   ```

3. Follow the scenarios in each requirements file

## Common Patterns

### Morning Routine
1. `show-my-tasks` - See what's on your plate
2. Review priorities and deadlines
3. `start-working-on` - Begin with highest priority

### Context Switching
1. `pause-work` - Save progress on current task
2. `add-comment` - Document where you left off
3. `start-working-on` - Switch to urgent task

### End of Sprint
1. `show-time-spent` - Review your effort
2. `update-progress` - Update all task statuses
3. `complete-task` - Close finished items