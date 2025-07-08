# Project Manager Use Cases

This directory contains use cases designed for project managers using the Targetprocess MCP with the project-manager personality.

## Available Use Cases

### 📅 [Sprint Planning](sprint-planning.md)
Plan iterations, allocate resources, and balance team capacity.

**Requirements:** [sprint-planning-requirements.yaml](sprint-planning-requirements.yaml)

### 👥 [Team Workload Analysis](team-workload.md)
Monitor team capacity, identify bottlenecks, and optimize assignments.

**Requirements:** [team-workload-requirements.yaml](team-workload-requirements.yaml)

### ⚠️ [Risk Management](risk-management.md)
Identify project risks, track impediments, and implement mitigation strategies.

**Requirements:** [risk-management-requirements.yaml](risk-management-requirements.yaml)

### 📊 [Status Reporting](status-reporting.md)
Generate progress reports, track velocity, and communicate with stakeholders.

**Requirements:** [status-reporting-requirements.yaml](status-reporting-requirements.yaml)

## Project Manager Personality Configuration

The project manager personality provides these semantic operations:

```json
{
  "availableOperations": [
    "manage-sprints",
    "view-team-capacity",
    "track-velocity",
    "manage-impediments",
    "generate-reports",
    "plan-iterations",
    "balance-workload",
    "forecast-delivery",
    "analyze-risks",
    "coordinate-releases"
  ]
}
```

## Workflow Hints

The system provides intelligent hints for project management:

- **Sprint Start**: Begin with `view-team-capacity` and `manage-impediments`
- **Daily Standup**: Use `track-velocity` and `view-team-progress`
- **Sprint End**: Generate reports with `generate-sprint-report`
- **Planning**: Combine `analyze-capacity` with `plan-iterations`

## Testing Your Workflows

To test these use cases:

1. Set your role:
   ```bash
   export TP_USER_ROLE=project-manager
   export TP_USER_ID=your-user-id
   ```

2. Ensure you have access to:
   - Team management permissions
   - Sprint/iteration configuration
   - Reporting capabilities

3. Follow the scenarios in each requirements file

## Common Patterns

### Sprint Planning Workflow
1. `view-team-capacity` - Understand available resources
2. `analyze-previous-sprint` - Learn from past performance
3. `plan-iterations` - Create balanced sprint
4. `communicate-plan` - Share with stakeholders

### Daily Management
1. `track-velocity` - Monitor sprint progress
2. `manage-impediments` - Address blockers
3. `balance-workload` - Redistribute if needed
4. `update-forecasts` - Adjust expectations

### Reporting Cycle
1. `generate-sprint-report` - Compile metrics
2. `analyze-trends` - Identify patterns
3. `prepare-stakeholder-update` - Create summary
4. `schedule-review` - Plan improvement actions

## Success Metrics

As a project manager, track these key indicators:

- **Velocity Stability**: Consistent story points per sprint
- **Impediment Resolution**: Time to resolve blockers
- **Capacity Utilization**: Team allocation efficiency
- **Forecast Accuracy**: Planned vs actual delivery