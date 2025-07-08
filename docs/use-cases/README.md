# Targetprocess MCP Use Cases

This directory contains role-based use cases aligned with our semantic operations personalities. Each role has specific workflows, requirements, and testable scenarios.

## 🎭 Use Cases by Personality

Our use cases are organized by the four primary personalities (roles) supported by the MCP server:

### 👨‍💻 [Developer](developer/)
Software developers focused on task completion and code quality.

**Key Use Cases:**
- [Daily Task Management](developer/daily-task-management.md) - Start your day, prioritize work
- [Bug Investigation Workflow](developer/bug-investigation.md) - Reproduce, investigate, and fix bugs
- [Time Tracking Patterns](developer/time-tracking.md) - Log time effectively
- [Code Review Process](developer/code-review.md) - Request and handle reviews

**Available Operations:** `show-my-tasks`, `start-working-on`, `complete-task`, `log-time`, `add-comment`

### 📊 [Project Manager](project-manager/)
Team coordination, resource management, and delivery oversight.

**Key Use Cases:**
- [Sprint Planning](project-manager/sprint-planning.md) - Plan and manage iterations
- [Team Workload Analysis](project-manager/team-workload.md) - Balance team capacity
- [Risk Management](project-manager/risk-management.md) - Identify and mitigate risks
- [Status Reporting](project-manager/status-reporting.md) - Generate progress reports

**Available Operations:** `manage-sprints`, `track-velocity`, `generate-reports`, `manage-impediments`

### 🧪 [QA Tester](tester/)
Quality assurance professionals ensuring product quality.

**Key Use Cases:**
- [Test Planning](tester/test-planning.md) - Create and organize test plans
- [Defect Management](tester/defect-management.md) - Report and track bugs
- [Test Execution](tester/test-execution.md) - Run tests and log results
- [Quality Metrics](tester/quality-metrics.md) - Track quality indicators

**Available Operations:** `start-testing`, `log-defect`, `verify-fix`, `generate-test-report`

### 🎯 [Product Owner](product-owner/)
Product strategy, backlog management, and stakeholder communication.

**Key Use Cases:**
- [Backlog Prioritization](product-owner/backlog-prioritization.md) - Manage product backlog
- [Feature Planning](product-owner/feature-planning.md) - Plan features and epics
- [Stakeholder Communication](product-owner/stakeholder-communication.md) - Reports and updates
- [ROI Analysis](product-owner/roi-analysis.md) - Measure feature value

**Available Operations:** `manage-backlog`, `prioritize-features`, `plan-iterations`, `stakeholder-report`

## 📋 Requirements Structure

Each use case includes a `requirements.yaml` file that makes the scenarios testable and shareable:

```yaml
# Example: developer/daily-task-management/requirements.yaml
name: Daily Task Management
personality: developer
description: Start the day by reviewing and prioritizing tasks

prerequisites:
  - User has developer role configured
  - At least 5 open tasks assigned
  - Tasks have different priorities

scenarios:
  - name: Morning task review
    steps:
      - operation: show-my-tasks
        input:
          includeCompleted: false
          orderBy: priority
        expected:
          - Returns list of open tasks
          - Tasks ordered by priority
          - Shows task age and estimates
    
  - name: Start high-priority task
    steps:
      - operation: show-my-tasks
        input:
          priority: high
      - operation: start-working-on
        input:
          taskId: "{{first_high_priority_task}}"
        expected:
          - Task state changes to "In Progress"
          - Task assigned to current user
          - Returns workflow suggestions

success_criteria:
  - Developer can see all assigned tasks
  - Can filter by priority
  - Can transition task states
  - Receives helpful next-step guidance
```

## 🧪 Testing Use Cases

Each personality directory contains:
- **Use case documents** - Detailed workflows with examples
- **Requirements files** - Testable scenarios in YAML format
- **Example outputs** - Expected responses and behaviors

To test a use case:
1. Set your personality: `export TP_USER_ROLE=developer`
2. Run the scenario using the MCP inspector
3. Verify outputs match requirements

## 📚 Reference Documents

### Core Operations
- [Basic Operations](basic-operations.md) - Fundamental CRUD operations
- [Advanced Queries](advanced-queries.md) - Complex filtering and searches
- [Data Analysis](data-analysis.md) - Analytics and reporting patterns

### Enterprise Patterns
- [Enterprise Use Cases](enterprise-use-cases.md) - Large-scale scenarios
- [Advanced Usage](advanced-usage.md) - Performance optimization
- [Integration Patterns](enterprise-use-cases.md#cross-system-integration) - System integration

## 🎯 Choosing Your Path

1. **Identify your role** - Developer, PM, Tester, or Product Owner
2. **Browse role-specific use cases** - Find workflows that match your needs
3. **Review requirements** - Understand prerequisites and success criteria
4. **Follow the examples** - Step-by-step guidance for each scenario

Remember: These use cases demonstrate semantic operations in action - intelligent, context-aware workflows that understand how you work!