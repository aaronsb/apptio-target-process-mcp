# Developer Semantic Operations

## Overview (Why)

The Developer role focuses on personal productivity and task management. Operations are designed to match natural developer workflows rather than exposing raw CRUD operations. This semantic approach allows developers to work with TargetProcess in a way that feels intuitive and reduces cognitive overhead.

### Core Principles
- **Workflow-Oriented**: Operations align with natural development processes
- **Context-Aware**: Suggestions adapt based on current work state
- **Progressive**: Support both beginner and advanced usage patterns
- **Time-Efficient**: Minimize steps required for common tasks

## Available Operations (How)

### Task Management

#### show-my-tasks
**Purpose**: View tasks assigned to you with intelligent filtering and prioritization.

**Parameters**:
- `includeCompleted` (string, optional): Include completed tasks ('true'/'false')
- `priority` (string, optional): Filter by priority ('all', 'critical', 'high', 'medium', 'low')
- `projectFilter` (string, optional): Filter by project name
- `limit` (string, optional): Maximum results (default: '20')

**Returns**: Tasks with priority indicators, context, and workflow suggestions

**Next Actions**: `start-working-on`, `add-comment`, `show-my-bugs`

---

#### start-working-on
**Purpose**: Begin work on a specific task, updating its state and logging the transition.

**Parameters**:
- `taskId` (number, required): ID of the task to start
- `comment` (string, optional): Optional comment about starting work

**Effects**:
- Changes task state to "In Progress" or equivalent
- Assigns task to current user if not already assigned
- Logs time tracking entry

**Next Actions**: `add-comment`, `complete-task`, `log-time`

---

#### complete-task
**Purpose**: Mark a task as completed with proper workflow transitions.

**Parameters**:
- `taskId` (number, required): ID of the task to complete
- `summary` (string, optional): Completion summary or notes
- `timeSpent` (string, optional): Hours spent on this task

**Effects**:
- Changes task state to "Done" or equivalent
- Logs completion time if provided
- Adds completion summary as comment

**Next Actions**: `show-my-tasks`, `log-time`

---

### Issue Management

#### show-my-bugs
**Purpose**: View bugs assigned to you with severity analysis and triage guidance.

**Parameters**:
- `includeClosed` (string, optional): Include closed bugs ('true'/'false')
- `severity` (string, optional): Filter by severity level
- `limit` (string, optional): Maximum results (default: '20')

**Returns**: Bugs with severity indicators, impact assessment, and suggested actions

**Next Actions**: `start-working-on`, `add-comment`, `log-time`

---

### Collaboration & Documentation

#### add-comment
**Purpose**: Add contextual comments to tasks, bugs, or other work items.

**Parameters**:
- `entityId` (number, required): ID of the entity to comment on
- `entityType` (string, required): Type of entity ('UserStory', 'Bug', 'Task', etc.)
- `comment` (string, required): Comment text
- `isStatusUpdate` (boolean, optional): Mark as status update (default: false)

**Effects**:
- Adds comment to the specified entity
- Notifies relevant team members
- Creates audit trail

**Next Actions**: Contextual based on current work

---

#### log-time
**Purpose**: Record time spent on development activities with proper categorization.

**Parameters**:
- `entityId` (number, required): ID of the task or bug
- `entityType` (string, optional): Type of entity (auto-detected if possible)
- `spent` (number, required): Hours spent (0.1 to 24 hours)
- `date` (string, optional): Date in YYYY-MM-DD format (defaults to today)
- `description` (string, optional): Description of work performed

**Effects**:
- Records time entry against the specified entity
- Updates project time tracking
- Provides data for velocity calculations

**Next Actions**: `show-my-tasks`, `complete-task`

---

## Workflow Patterns (Practical Application)

### Daily Development Flow
```
1. show-my-tasks          → Check assigned work and priorities
2. start-working-on       → Begin highest priority task
3. add-comment           → Document progress and findings
4. complete-task         → Finish and log completion
5. log-time              → Record time spent
```

### Bug Resolution Flow
```
1. show-my-bugs          → Review assigned bugs by severity
2. start-working-on      → Pick critical/high severity bug
3. add-comment          → Document investigation findings
4. complete-task        → Mark bug as resolved
5. log-time             → Record debugging effort
```

### Sprint Planning Flow
```
1. show-my-tasks        → Review upcoming sprint work
2. add-comment         → Add technical notes or concerns
3. start-working-on    → Begin sprint work
4. log-time           → Track sprint velocity
```

## Context-Aware Suggestions

The system provides intelligent next-step suggestions based on:

### Current Work State
- **No Active Tasks**: Suggests `show-my-tasks` to find work
- **Tasks In Progress**: Suggests `add-comment` for updates or `complete-task` for completion
- **Blocked Work**: Suggests `add-comment` to document blockers or `show-my-bugs` for alternative work

### Work Patterns
- **High Bug Count**: Prioritizes bug resolution workflows
- **Sprint End**: Emphasizes completion and time logging
- **New Sprint**: Focuses on task planning and startup

### Team Context
- **Collaborative Work**: Suggests communication operations
- **Independent Work**: Emphasizes individual productivity operations
- **Review Cycles**: Suggests documentation and status updates

## Implementation Notes

### Dynamic Discovery
Operations discover entity states, priorities, and other properties dynamically rather than using hard-coded values, ensuring compatibility across different TargetProcess configurations.

### Error Handling
When operations fail, the system provides:
- Clear error messages explaining what went wrong
- Alternative actions to achieve similar goals
- Guidance on resolving common issues

### Performance Optimization
- Client-side filtering reduces API calls
- Intelligent caching of user assignments
- Batch operations where possible

### Security Considerations
- All operations respect TargetProcess user permissions
- Time logging validates reasonable hour ranges
- Comments are sanitized for safety