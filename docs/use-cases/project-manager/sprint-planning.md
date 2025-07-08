# Sprint Planning

A comprehensive guide for project managers to plan and manage sprints effectively using semantic operations.

## Overview

This use case covers the complete sprint planning workflow:
1. Analyzing team capacity and availability
2. Reviewing backlog and priorities
3. Allocating work based on skills and capacity
4. Setting sprint goals and commitments
5. Communicating the plan to stakeholders

## Prerequisites

- Project Manager role configured (`TP_USER_ROLE=project-manager`)
- Access to team and sprint management
- Understanding of team velocity and capacity

## Scenarios

### 📊 Pre-Planning Analysis

Before planning the sprint, gather intelligence about team and work.

#### Analyze Team Capacity

```typescript
await mcp.view_team_capacity({
  teamId: "mobile-team",
  sprintId: "upcoming",
  includeTimeOff: true
});
```

**Expected Response:**
```json
{
  "team": {
    "id": "mobile-team",
    "name": "Mobile Development Team",
    "members": 6,
    "velocity": {
      "average": 45,
      "lastSprint": 42,
      "trend": "stable"
    }
  },
  "capacity": {
    "totalHours": 240,
    "available": 216,
    "allocated": 0,
    "timeOff": [
      {
        "member": "John Doe",
        "hours": 16,
        "reason": "Training"
      }
    ]
  },
  "insights": [
    "Team velocity is stable at ~45 points",
    "24 hours less capacity due to training",
    "Consider planning for 40-42 points",
    "Frontend capacity is limited this sprint"
  ]
}
```

#### Review Previous Sprint

```typescript
await mcp.analyze_previous_sprint({
  teamId: "mobile-team",
  includeMetrics: true
});
```

### 📋 Backlog Preparation

Prepare and prioritize work for the sprint.

#### Get Prioritized Backlog

```typescript
await mcp.view_product_backlog({
  projectId: "mobile-app",
  state: "ready",
  orderBy: "priority",
  includeEstimates: true
});
```

**Expected Response:**
```json
{
  "backlog": [
    {
      "id": 5001,
      "type": "UserStory",
      "name": "User can reset password",
      "priority": "Must Have",
      "estimate": 8,
      "dependencies": [],
      "skills": ["backend", "frontend"],
      "readiness": {
        "score": 100,
        "acceptanceCriteria": true,
        "designs": true,
        "dependencies": "none"
      }
    }
    // ... more items
  ],
  "summary": {
    "totalReady": 125,
    "mustHave": 45,
    "shouldHave": 55,
    "niceToHave": 25
  },
  "recommendations": [
    "45 points of Must Have items match team velocity",
    "Consider including 2-3 Should Have items as stretch goals",
    "Story #5003 has unresolved dependencies"
  ]
}
```

### 🎯 Sprint Composition

Build the sprint with balanced work allocation.

#### Create Sprint Plan

```typescript
await mcp.plan_sprint({
  sprintId: "sprint-15",
  teamId: "mobile-team",
  items: [5001, 5002, 5004, 5007, 5009],
  goals: [
    "Complete user authentication flow",
    "Improve app performance by 20%",
    "Fix critical production bugs"
  ]
});
```

**Expected Response:**
```json
{
  "sprint": {
    "id": "sprint-15",
    "name": "Sprint 15",
    "startDate": "2024-01-15",
    "endDate": "2024-01-29",
    "workingDays": 10
  },
  "allocation": {
    "totalPoints": 43,
    "byMember": [
      {
        "name": "Alice Chen",
        "allocated": 8,
        "capacity": 10,
        "utilization": "80%"
      }
      // ... other members
    ],
    "bySkill": {
      "backend": { "required": 24, "available": 30 },
      "frontend": { "required": 16, "available": 15 },
      "testing": { "required": 8, "available": 12 }
    }
  },
  "risks": [
    "Frontend capacity is tight - only 1 hour buffer",
    "Story #5007 depends on external API delivery"
  ],
  "suggestions": [
    "Consider adding backup story if API is delayed",
    "Plan frontend work early in sprint",
    "Schedule mid-sprint check on progress"
  ]
}
```

### 📣 Communication and Alignment

Share the plan and get buy-in from the team.

#### Generate Sprint Report

```typescript
await mcp.generate_sprint_plan_report({
  sprintId: "sprint-15",
  format: "detailed",
  audience: "team"
});
```

#### Share with Stakeholders

```typescript
await mcp.communicate_sprint_plan({
  sprintId: "sprint-15",
  channels: ["team", "stakeholders"],
  includeRisks: true,
  scheduleReview: "mid-sprint"
});
```

## Best Practices

### 1. Data-Driven Planning
- Always check velocity trends before committing
- Consider capacity variations (holidays, training)
- Review impediments from previous sprints

### 2. Balanced Allocation
- Mix feature work with technical debt
- Include buffer for unplanned work
- Balance work across team members

### 3. Clear Communication
- Set explicit sprint goals
- Document assumptions and risks
- Schedule regular check-ins

### 4. Continuous Improvement
- Track planning accuracy
- Gather team feedback
- Adjust process based on retrospectives

## Common Issues and Solutions

### "Over-committed Sprint"
**Symptoms**: Team consistently fails to complete planned work

**Solution**:
- Reduce commitment to 80% of velocity
- Add more detailed estimation sessions
- Account for meeting time and context switching

### "Unbalanced Skills"
**Symptoms**: Some team members overloaded while others idle

**Solution**:
- Plan for cross-training opportunities
- Break stories to allow parallel work
- Consider skill development in allocation

### "Unclear Priorities"
**Symptoms**: Team unsure what to work on first

**Solution**:
- Set explicit sprint goals
- Rank all items clearly
- Use MoSCoW prioritization

## Metrics to Track

1. **Planning Accuracy**: Planned vs Completed points
2. **Velocity Trend**: Rolling 3-sprint average
3. **Capacity Utilization**: Actual vs Available hours
4. **Goal Achievement**: Sprint goals met percentage

## Related Use Cases

- [Team Workload Analysis](team-workload.md)
- [Risk Management](risk-management.md)
- [Status Reporting](status-reporting.md)