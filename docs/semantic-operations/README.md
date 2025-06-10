# Semantic Operations

## Overview

Semantic operations provide role-based workflow interfaces that abstract raw CRUD operations into meaningful, context-aware actions. Rather than requiring users to understand TargetProcess's internal data model, semantic operations align with natural work patterns and provide intelligent suggestions for next steps.

## Design Philosophy

### Pedagogical Approach (Why)
Semantic operations are designed to:
- **Reduce Cognitive Load**: Match natural workflows rather than forcing adaptation to system constraints
- **Provide Context**: Operations understand work state and provide relevant suggestions
- **Enable Progressive Disclosure**: Support both novice and expert usage patterns
- **Maintain Workflow Continuity**: Seamless transitions between related activities

### Functional Approach (How)
Operations achieve this through:
- **Dynamic Discovery**: Entity properties and states discovered at runtime, not hard-coded
- **Role-Based Adaptation**: Same operations provide different views based on user role
- **Intelligent Filtering**: Context-aware filtering reduces information overload
- **Workflow Hints**: Next-step suggestions based on current state and role

## Available Personalities

### [Developer](developer.md)
Focus on personal productivity and task management
- Task and bug management
- Time tracking and progress documentation
- Collaboration and communication
- Daily development workflows

### [Project Manager](project-manager.md)
Team coordination and delivery oversight
- Team workload and capacity management
- Risk identification and mitigation
- Stakeholder communication
- Resource allocation and planning

### [QA Tester](tester.md)
Quality assurance and systematic testing
- Test planning and execution
- Defect management and tracking
- Quality metrics and analysis
- Testing workflow coordination

### [Product Owner](product-owner.md)
Product strategy and stakeholder management
- Backlog prioritization and management
- Stakeholder communication and reporting
- Feature performance and ROI analysis
- Strategic roadmap planning

## Operation Types

### Shared Operations
Core operations used across all roles with role-specific adaptations:
- `show-my-tasks` - Task visibility with role-appropriate filtering
- `show-my-bugs` - Bug management with role-specific context
- `add-comment` - Documentation with role-appropriate templates
- `log-time` - Time tracking with activity categorization

### Role-Specific Operations
Specialized operations for specific workflow needs:
- **Testing**: `start-testing`, `log-defect`, `approve-testing`
- **Product Management**: `manage-product-backlog`, `stakeholder-report`, `plan-roadmap`

## Configuration

Semantic operations are configured through:

### Environment Variables
```bash
TP_USER_ROLE=developer          # Role-based operation filtering
TP_USER_ID=101734              # User identity for assignments
TP_USER_EMAIL=user@company.com # User identity for communication
```

### Personality Configuration
JSON files in `/config/personalities/` define:
- Available operations per role
- Default preferences and views
- Workflow hints and suggestions

### Example Configuration
```json
{
  "id": "developer",
  "name": "Developer",
  "availableOperations": [
    "show-my-tasks",
    "start-working-on",
    "complete-task",
    "show-my-bugs",
    "add-comment",
    "log-time"
  ],
  "workflowHints": {
    "dailyStart": ["show-my-tasks", "show-my-bugs"],
    "taskCompletion": ["complete-task", "log-time"]
  }
}
```

## Workflow Patterns

### Multi-Entry Workflows
Unlike traditional linear workflows, semantic operations support multiple entry points based on current context:
- **Daily Planning**: Starting fresh with work assessment
- **Active Work**: Continuing existing tasks and projects  
- **Issue Response**: Reacting to bugs or urgent requests
- **Collaboration**: Team coordination and communication

### Context-Aware Transitions
Operations provide intelligent next-step suggestions based on:
- Current work state and progress
- User role and capabilities
- Team context and dependencies
- Business priorities and deadlines

### Adaptive Suggestions
The system learns from usage patterns and provides:
- Workflow optimization recommendations
- Process improvement suggestions
- Risk identification and mitigation
- Resource allocation guidance

## Implementation Notes

### Dynamic Discovery
Operations avoid hard-coded assumptions by:
- Discovering entity states and properties at runtime
- Adapting to different TargetProcess configurations
- Graceful handling of missing or unexpected data
- Intelligent fallback for unsupported features

### Error Handling
When operations fail:
- Clear error messages explain what went wrong
- Alternative actions suggested to achieve similar goals
- Guidance provided for resolving common issues
- Graceful degradation for partial failures

### Performance Optimization
- Client-side filtering reduces API load
- Intelligent caching of frequently accessed data
- Batch operations where possible
- Efficient handling of large datasets

## Getting Started

1. **Configure Role**: Set `TP_USER_ROLE` environment variable
2. **Set Identity**: Configure `TP_USER_ID` and `TP_USER_EMAIL`
3. **Choose Personality**: Select appropriate personality configuration
4. **Start with Core Operations**: Begin with `show-my-tasks` or role-appropriate entry point
5. **Follow Suggestions**: Use provided next-step recommendations to learn workflows

## Advanced Usage

- **Custom Personalities**: Create additional role configurations
- **Workflow Extensions**: Add organization-specific operations
- **Integration Patterns**: Connect with external tools and systems
- **Metrics and Analytics**: Track workflow efficiency and optimization opportunities