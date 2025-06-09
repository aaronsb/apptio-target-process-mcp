# Developer Semantic Operations

This document defines the semantic operations available for the Developer role in the TargetProcess MCP server.

## Overview

The Developer role focuses on personal productivity and task management. Operations are designed to match natural developer workflows rather than exposing raw CRUD operations.

## Core Operations

### Task Management

#### show-my-tasks
**Description**: View tasks assigned to you with intelligent filtering and prioritization.

**Parameters**:
- `includeCompleted` (boolean, optional): Include completed tasks (default: false)
- `priority` (string, optional): Filter by priority - 'all', 'high', 'medium', 'low' (default: 'all')
- `projectFilter` (string, optional): Filter by project name
- `limit` (number, optional): Maximum results to return (default: 20)

**Returns**: Prioritized list of tasks with semantic enrichment (overdue status, blockers, etc.)

**Next Actions**: `start-working-on`, `update-progress`, `report-blocker`

---

#### start-working-on
**Description**: Begin work on a task by updating its state to "In Progress" and assigning to yourself.

**Parameters**:
- `taskId` (number, required): ID of the task to start
- `comment` (string, optional): Comment about starting work

**Effects**:
- Changes task state to "In Progress"
- Assigns task to current user if not already assigned
- Adds optional comment

**Next Actions**: `update-progress`, `log-time`, `report-blocker`

---

#### update-progress
**Description**: Add progress updates and adjust completion percentage.

**Parameters**:
- `taskId` (number, required): ID of the task to update
- `progress` (string, required): Progress description
- `percentComplete` (number, optional): Percentage complete (0-100)

**Next Actions**: `complete-task`, `log-time`, `request-review`

---

#### complete-task
**Description**: Mark a task as completed and handle completion workflow.

**Parameters**:
- `taskId` (number, required): ID of the task to complete
- `completionNote` (string, optional): Final notes about the task

**Effects**:
- Changes task state to "Done"
- Sets progress to 100%
- Adds completion comment

**Next Actions**: `show-my-tasks`, `log-time`

---

#### pause-work
**Description**: Temporarily pause work on a task with reason.

**Parameters**:
- `taskId` (number, required): ID of the task to pause
- `reason` (string, required): Reason for pausing
- `moveToOpen` (boolean, optional): Move back to Open state (default: true)

**Next Actions**: `show-my-tasks`, `report-blocker`

---

### Bug Management

#### show-my-bugs
**Description**: View bugs assigned to you, prioritized by severity and customer impact.

**Parameters**:
- `includeClosed` (boolean, optional): Include closed bugs (default: false)
- `severity` (string, optional): Filter by severity - 'all', 'critical', 'major', 'minor'
- `limit` (number, optional): Maximum results (default: 10)

**Returns**: Bugs with severity indicators and customer impact assessment

**Next Actions**: `investigate-bug`, `show-my-tasks`

---

#### investigate-bug
**Description**: Start investigating a bug, moving it to appropriate state.

**Parameters**:
- `bugId` (number, required): ID of the bug to investigate
- `initialFindings` (string, optional): Initial investigation notes

**Effects**:
- Changes bug state to "Investigating" or "In Progress"
- Assigns to current user
- Adds investigation comment

**Next Actions**: `add-comment`, `link-commit`, `mark-bug-fixed`

---

#### mark-bug-fixed
**Description**: Mark a bug as fixed with resolution details.

**Parameters**:
- `bugId` (number, required): ID of the bug
- `resolution` (string, required): How the bug was fixed
- `linkedCommits` (string[], optional): Related commit hashes

**Next Actions**: `request-review`, `show-my-bugs`

---

### Time Management

#### log-time
**Description**: Record time spent on a task or bug.

**Parameters**:
- `entityId` (number, required): Task or Bug ID
- `entityType` (string, required): 'Task' or 'Bug'
- `hours` (number, required): Hours spent
- `description` (string, optional): What was done
- `date` (string, optional): Date of work (default: today)

**Next Actions**: `update-progress`, `show-time-spent`

---

#### show-time-spent
**Description**: View your time tracking for current period.

**Parameters**:
- `period` (string, optional): 'today', 'week', 'sprint' (default: 'week')
- `groupBy` (string, optional): 'task', 'project', 'day' (default: 'task')

**Returns**: Time summary with totals and breakdown

---

### Collaboration

#### add-comment
**Description**: Add a comment to any entity.

**Parameters**:
- `entityId` (number, required): Entity ID
- `entityType` (string, required): Entity type
- `comment` (string, required): Comment text
- `isPrivate` (boolean, optional): Private comment (default: false)

**Next Actions**: Contextual based on entity type

---

#### report-blocker
**Description**: Report an impediment blocking your work.

**Parameters**:
- `taskId` (number, required): Blocked task ID
- `description` (string, required): Blocker description
- `severity` (string, optional): 'high', 'medium', 'low'
- `needsHelp` (boolean, optional): Escalate to team lead

**Effects**:
- Creates impediment entity
- Links to task
- Optionally notifies team lead

**Next Actions**: `pause-work`, `show-my-tasks`

---

#### request-review
**Description**: Request code review or QA for completed work.

**Parameters**:
- `entityId` (number, required): Task or Bug ID
- `entityType` (string, required): 'Task' or 'Bug'
- `reviewer` (string, optional): Specific reviewer username
- `notes` (string, optional): Review notes

**Effects**:
- Changes state to "Review" or "Testing"
- Notifies reviewer
- Adds review request comment

**Next Actions**: `show-my-tasks`, `add-comment`

---

## Workflow Patterns

### Daily Development Flow
```
1. show-my-tasks         → View current assignments
2. start-working-on      → Pick highest priority
3. update-progress       → Regular updates
4. log-time             → Track effort
5. complete-task        → Finish work
6. show-my-tasks        → Next item
```

### Bug Investigation Flow
```
1. show-my-bugs         → Check critical bugs
2. investigate-bug      → Start investigation  
3. add-comment         → Document findings
4. mark-bug-fixed      → Complete fix
5. request-review      → Send to QA
```

### Blocked Task Flow
```
1. report-blocker      → Create impediment
2. pause-work         → Set task aside
3. show-my-tasks      → Find unblocked work
4. <blocker resolved>
5. start-working-on   → Resume blocked task
```

## Context-Aware Suggestions

The system provides intelligent next-action suggestions based on:

- **Task State**: Different suggestions for Open, In Progress, Blocked, Review states
- **Time of Day**: End-of-day suggestions for time logging and progress updates
- **Sprint Phase**: Different workflows for sprint start, mid-sprint, and sprint end
- **Work Patterns**: Learn from user's typical workflow patterns

## Implementation Notes

Each operation should:
1. Validate user permissions and entity ownership
2. Check state transition validity
3. Provide clear error messages
4. Return structured data with semantic enrichment
5. Include relevant next-action suggestions
6. Update related entities (e.g., sprint velocity)