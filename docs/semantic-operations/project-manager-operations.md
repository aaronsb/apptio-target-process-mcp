# Project Manager Semantic Operations

This document defines the semantic operations available for the Project Manager role in the TargetProcess MCP server.

## Overview

The Project Manager role focuses on team coordination, delivery management, and project oversight. Operations are designed to provide strategic visibility and team management capabilities rather than individual task execution.

## Core Operations

### Team Management

#### show-team-tasks
**Description**: View all tasks assigned to your team members with status and priority insights.

**Parameters**:
- `teamId` (number, optional): Specific team ID (default: all managed teams)
- `includeCompleted` (boolean, optional): Include completed tasks (default: false)
- `groupBy` (string, optional): Group by 'assignee', 'priority', 'project' (default: 'assignee')
- `timeframe` (string, optional): 'today', 'week', 'sprint' (default: 'sprint')

**Returns**: Team task overview with workload distribution and bottleneck identification

**Next Actions**: `reassign-task`, `update-task-priority`, `show-blockers`

---

#### reassign-task
**Description**: Reassign a task to balance team workload or address blockers.

**Parameters**:
- `taskId` (number, required): ID of the task to reassign
- `newAssignee` (string, required): Username or email of new assignee
- `reason` (string, optional): Reason for reassignment
- `notifyTeam` (boolean, optional): Notify team of change (default: true)

**Effects**:
- Changes task assignment
- Adds reassignment comment with reason
- Optionally notifies affected team members

**Next Actions**: `show-team-tasks`, `add-comment`

---

#### update-task-priority
**Description**: Adjust task priority to align with business objectives.

**Parameters**:
- `taskId` (number, required): ID of the task
- `newPriority` (string, required): 'Critical', 'High', 'Medium', 'Low'
- `businessJustification` (string, required): Why the priority changed

**Next Actions**: `show-team-tasks`, `show-sprint-status`

---

### Sprint & Delivery Management

#### show-sprint-status
**Description**: View current sprint progress with burndown and velocity metrics.

**Parameters**:
- `sprintId` (number, optional): Specific sprint (default: current sprint)
- `includeVelocity` (boolean, optional): Include velocity calculations (default: true)
- `showRisks` (boolean, optional): Highlight delivery risks (default: true)

**Returns**: Sprint burndown, velocity, completion forecast, and risk assessment

**Next Actions**: `show-blockers`, `create-sprint-report`, `manage-backlog`

---

#### show-team-velocity
**Description**: Analyze team velocity trends and capacity planning.

**Parameters**:
- `teamId` (number, optional): Specific team (default: all managed teams)
- `sprints` (number, optional): Number of past sprints to analyze (default: 6)
- `includeCapacity` (boolean, optional): Include capacity vs velocity (default: true)

**Returns**: Velocity trends, capacity utilization, and forecasting data

**Next Actions**: `manage-backlog`, `show-sprint-status`

---

#### create-sprint-report
**Description**: Generate comprehensive sprint retrospective report.

**Parameters**:
- `sprintId` (number, optional): Sprint to report on (default: current sprint)
- `includeMetrics` (boolean, optional): Include detailed metrics (default: true)
- `includeBlockers` (boolean, optional): Include blocker analysis (default: true)

**Returns**: Sprint summary with achievements, metrics, and recommendations

**Next Actions**: `show-team-velocity`, `manage-backlog`

---

### Backlog & Planning

#### manage-backlog
**Description**: View and prioritize the product backlog.

**Parameters**:
- `projectId` (number, optional): Specific project (default: all managed projects)
- `limit` (number, optional): Items to show (default: 50)
- `includeEstimates` (boolean, optional): Show effort estimates (default: true)

**Returns**: Prioritized backlog with effort estimates and sprint readiness

**Next Actions**: `update-task-priority`, `show-team-velocity`

---

### Risk & Issue Management

#### show-blockers
**Description**: View all team blockers and impediments requiring attention.

**Parameters**:
- `severity` (string, optional): Filter by severity 'all', 'critical', 'high' (default: 'all')
- `teamId` (number, optional): Specific team (default: all managed teams)
- `includeResolved` (boolean, optional): Include recently resolved (default: false)

**Returns**: Active blockers with impact assessment and suggested actions

**Next Actions**: `reassign-task`, `schedule-meeting`, `add-comment`

---

#### schedule-meeting
**Description**: Create calendar event for team coordination.

**Parameters**:
- `meetingType` (string, required): 'standup', 'planning', 'retrospective', 'review'
- `attendees` (string[], required): Team member emails
- `duration` (number, optional): Meeting duration in minutes (default: 60)
- `agenda` (string, optional): Meeting agenda items

**Effects**:
- Creates calendar entry
- Sends meeting invitations
- Links to relevant project items

**Next Actions**: `show-team-tasks`, `create-sprint-report`

---

### Metrics & Reporting

#### show-project-metrics
**Description**: View comprehensive project health metrics.

**Parameters**:
- `projectId` (number, optional): Specific project (default: all managed projects)
- `timeframe` (string, optional): 'week', 'month', 'quarter' (default: 'month')
- `includeTeamBreakdown` (boolean, optional): Break down by team (default: true)

**Returns**: Project health dashboard with KPIs and trend analysis

**Next Actions**: `show-team-velocity`, `create-sprint-report`

---

### Collaboration

#### add-comment
**Description**: Add strategic comments to any project entity.

**Parameters**:
- `entityId` (number, required): Entity ID
- `entityType` (string, required): Entity type
- `comment` (string, required): Comment text
- `isDirective` (boolean, optional): Mark as management directive (default: false)

**Next Actions**: Contextual based on entity type and team needs

---

## Workflow Patterns

### Daily Management Flow
```
1. show-team-tasks       → Check team workload
2. show-blockers        → Identify impediments  
3. reassign-task        → Balance workload
4. show-sprint-status   → Track delivery
5. add-comment         → Provide guidance
```

### Sprint Planning Flow
```
1. show-team-velocity   → Assess capacity
2. manage-backlog      → Prioritize items
3. show-project-metrics → Review objectives
4. schedule-meeting    → Plan sprint kickoff
```

### Sprint Review Flow
```
1. show-sprint-status   → Final status check
2. create-sprint-report → Document outcomes
3. show-team-velocity   → Update velocity
4. schedule-meeting    → Plan retrospective
```

### Issue Escalation Flow
```
1. show-blockers       → Identify critical issues
2. reassign-task       → Redistribute work
3. schedule-meeting    → Coordinate resolution
4. add-comment        → Document decisions
```

## Context-Aware Suggestions

The system provides management-focused suggestions based on:

- **Sprint Phase**: Different workflows for planning, execution, and review
- **Team Velocity**: Workload balancing recommendations
- **Delivery Risk**: Proactive issue identification and mitigation
- **Business Priority**: Strategic alignment suggestions

## Implementation Notes

Each operation should:
1. Provide team-wide visibility and aggregated metrics
2. Include trend analysis and forecasting
3. Highlight delivery risks and bottlenecks
4. Support strategic decision making
5. Enable proactive team management
6. Integrate with external calendaring and notification systems