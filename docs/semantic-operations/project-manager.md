# Project Manager Semantic Operations

## Overview (Why)

The Project Manager role focuses on team coordination, resource management, and delivery oversight. Operations are designed to provide visibility into team performance, identify bottlenecks, and facilitate strategic decision-making. This semantic approach enables managers to maintain project health without micromanaging individual contributors.

### Core Principles
- **Team-Level Visibility**: Operations provide aggregated views of team performance
- **Risk-Oriented**: Early identification of delivery risks and impediments
- **Resource-Aware**: Understanding of team capacity and allocation
- **Stakeholder-Focused**: Information suitable for executive reporting

## Available Operations (How)

Project Managers primarily use shared operations with management-specific context and filtering.

### Team Oversight

#### show-my-tasks (Manager Context)
**Purpose**: View team assignments and workload distribution with capacity analysis.

**Manager-Specific Features**:
- Team-wide view of all assignments
- Workload balance assessment
- Capacity utilization metrics
- Delivery risk indicators

**Parameters**: Same as developer role, but results aggregated by team
**Returns**: Team workload summary with management insights
**Next Actions**: Resource rebalancing, stakeholder communication

---

#### show-my-bugs (Manager Context)
**Purpose**: View team bug assignments with impact and severity analysis.

**Manager-Specific Features**:
- Team bug distribution
- Severity trend analysis
- Quality metrics and patterns
- Resolution time tracking

**Parameters**: Same as developer role, with team-level aggregation
**Returns**: Quality dashboard with risk assessment
**Next Actions**: Quality improvement initiatives, resource allocation

---

### Communication & Documentation

#### add-comment (Manager Context)
**Purpose**: Document management decisions, status updates, and strategic guidance.

**Manager-Specific Features**:
- Status update templates
- Stakeholder communication formats
- Decision documentation
- Escalation tracking

**Usage Patterns**:
- Weekly status summaries
- Risk escalation documentation
- Resource allocation decisions
- Strategic guidance for team

---

#### log-time (Manager Context)
**Purpose**: Track management activities and meeting time for project accounting.

**Manager-Specific Features**:
- Management activity categorization
- Meeting time tracking
- Project overhead accounting
- Resource planning data

**Common Activities**:
- Team meetings and coordination
- Stakeholder communication
- Planning and estimation sessions
- Risk assessment and mitigation

---

## Workflow Patterns (Management Application)

### Daily Management Flow
```
1. show-my-tasks (team view)    → Assess team workload and capacity
2. show-my-bugs (team view)     → Identify quality risks and patterns
3. add-comment                  → Document observations and decisions
4. log-time                     → Track management activities
```

### Sprint Planning Flow
```
1. show-my-tasks               → Review team capacity and available work
2. add-comment                 → Document planning decisions and rationale
3. log-time                    → Track planning effort
```

### Issue Escalation Flow
```
1. show-my-bugs               → Assess issue severity and team impact
2. add-comment               → Document escalation and decisions
3. [External stakeholder communication]
```

### Stakeholder Communication Flow
```
1. show-my-tasks             → Gather progress data
2. show-my-bugs              → Assess quality metrics
3. add-comment              → Prepare executive summary
4. log-time                 → Track communication effort
```

## Management-Specific Adaptations

### Aggregated Views
- **Individual Task View**: Developer sees personal assignments
- **Team Task View**: Manager sees all team assignments with workload distribution
- **Capacity Metrics**: Additional data on team utilization and availability

### Risk Assessment
- **Quality Indicators**: Bug density, severity trends, resolution times
- **Delivery Risks**: Overloaded team members, blocked work items
- **Resource Constraints**: Skills gaps, availability issues

### Reporting Context
- **Executive Summaries**: High-level status suitable for stakeholder consumption
- **Trend Analysis**: Historical data for performance assessment
- **Actionable Insights**: Specific recommendations for management intervention

## Context-Aware Management Suggestions

### Team Performance States
- **High Utilization**: Suggests resource rebalancing or scope adjustment
- **Quality Issues**: Recommends quality improvement initiatives
- **Delivery Risks**: Provides escalation and mitigation options

### Stakeholder Communication
- **Regular Updates**: Templates for weekly/monthly status reports
- **Issue Escalation**: Structured formats for problem communication
- **Success Metrics**: Positive indicators to highlight team achievements

### Resource Management
- **Overallocation**: Identifies team members with excessive workload
- **Underutilization**: Suggests additional work assignment opportunities
- **Skills Matching**: Indicates optimal task-to-team-member assignments

## Implementation Notes

### Role-Based Filtering
Operations automatically adapt based on user role, providing management-appropriate views without requiring different tool implementations.

### Delegation Support
While managers use the same operations, results emphasize delegation opportunities and team coordination rather than individual task execution.

### Strategic Integration
Management views integrate with business objectives, showing how tactical work aligns with strategic goals and delivery commitments.