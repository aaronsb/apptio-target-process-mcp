# Product Owner Semantic Operations

This document defines the semantic operations available for the Product Owner role in the TargetProcess MCP server.

## Overview

The Product Owner role focuses on product strategy, backlog management, and stakeholder communication. Operations are designed to support product decisions and maximize business value delivery.

## Core Operations

### Backlog Management

#### manage-product-backlog
**Description**: View and organize the product backlog with business value prioritization.

**Parameters**:
- `releaseId` (number, optional): Specific release (default: current release)
- `includeEstimates` (boolean, optional): Show effort estimates (default: true)
- `includeBusinessValue` (boolean, optional): Show business value scores (default: true)
- `limit` (number, optional): Items to display (default: 100)

**Returns**: Prioritized backlog with value/effort ratios and readiness indicators

**Next Actions**: `prioritize-features`, `refine-requirements`, `create-user-story`

---

#### prioritize-features
**Description**: Adjust feature priority based on business value and strategic alignment.

**Parameters**:
- `featureId` (number, required): Feature to reprioritize
- `newPriority` (number, required): New priority ranking (1-100)
- `businessJustification` (string, required): Business rationale for change
- `impactAssessment` (string, optional): Expected impact of the change

**Effects**:
- Updates feature priority
- Adjusts dependent item priorities
- Notifies affected teams

**Next Actions**: `manage-product-backlog`, `plan-roadmap`

---

#### create-user-story
**Description**: Create new user story with acceptance criteria and business context.

**Parameters**:
- `title` (string, required): User story title
- `description` (string, required): User story description
- `acceptanceCriteria` (array, required): List of acceptance criteria
- `businessValue` (number, optional): Business value score (1-100)
- `userPersona` (string, optional): Target user persona
- `epicId` (number, optional): Parent epic ID

**Returns**: Created user story with estimated effort and business value

**Next Actions**: `refine-requirements`, `manage-product-backlog`

---

#### refine-requirements
**Description**: Add detail and clarity to existing requirements.

**Parameters**:
- `storyId` (number, required): User story to refine
- `additionalCriteria` (array, optional): New acceptance criteria
- `userFeedback` (string, optional): User feedback to incorporate
- `technicalNotes` (string, optional): Technical considerations

**Next Actions**: `update-acceptance-criteria`, `prioritize-features`

---

### Release Management

#### show-release-progress
**Description**: View release progress with feature completion and risk assessment.

**Parameters**:
- `releaseId` (number, optional): Specific release (default: current release)
- `includeVelocity` (boolean, optional): Include velocity projections (default: true)
- `showRisks` (boolean, optional): Highlight delivery risks (default: true)

**Returns**: Release dashboard with completion forecast and risk mitigation suggestions

**Next Actions**: `review-sprint-deliverables`, `plan-roadmap`

---

#### review-sprint-deliverables
**Description**: Review and accept sprint deliverables against acceptance criteria.

**Parameters**:
- `sprintId` (number, optional): Sprint to review (default: current sprint)
- `includeDemo` (boolean, optional): Include demo preparation (default: true)
- `stakeholderFeedback` (string, optional): Stakeholder feedback to incorporate

**Returns**: Sprint acceptance status with demo-ready features

**Next Actions**: `stakeholder-report`, `manage-product-backlog`

---

#### plan-roadmap
**Description**: Create and update product roadmap with strategic milestones.

**Parameters**:
- `timeframe` (string, optional): 'quarter', 'half-year', 'year' (default: 'quarter')
- `includeCapacity` (boolean, optional): Include team capacity planning (default: true)
- `strategicThemes` (array, optional): Strategic themes to emphasize

**Returns**: Visual roadmap with feature delivery timeline and dependencies

**Next Actions**: `prioritize-features`, `show-feature-metrics`

---

### Stakeholder Communication

#### stakeholder-report
**Description**: Generate comprehensive stakeholder progress report.

**Parameters**:
- `reportType` (string, required): 'weekly', 'monthly', 'release'
- `includeMetrics` (boolean, optional): Include detailed metrics (default: true)
- `audienceLevel` (string, optional): 'executive', 'management', 'team' (default: 'management')

**Returns**: Formatted report with progress, risks, and recommendations

**Next Actions**: `schedule-stakeholder-review`, `show-release-progress`

---

#### schedule-stakeholder-review
**Description**: Organize stakeholder review meeting with demo preparation.

**Parameters**:
- `reviewType` (string, required): 'sprint-review', 'release-demo', 'roadmap-review'
- `stakeholders` (array, required): Stakeholder email addresses
- `demoFeatures` (array, optional): Features to demonstrate
- `duration` (number, optional): Meeting duration in minutes (default: 90)

**Effects**:
- Creates calendar event
- Prepares demo script
- Sends stakeholder invitations

**Next Actions**: `review-sprint-deliverables`, `stakeholder-report`

---

### Quality & Acceptance

#### update-acceptance-criteria
**Description**: Modify acceptance criteria based on new insights or feedback.

**Parameters**:
- `storyId` (number, required): User story to update
- `newCriteria` (array, required): Updated acceptance criteria
- `changeReason` (string, required): Reason for criteria changes
- `impactAssessment` (string, optional): Impact on development effort

**Next Actions**: `refine-requirements`, `review-sprint-deliverables`

---

### Analytics & Insights

#### show-feature-metrics
**Description**: View feature usage and business impact metrics.

**Parameters**:
- `featureId` (number, optional): Specific feature (default: all recent features)
- `timeframe` (string, optional): 'week', 'month', 'quarter' (default: 'month')
- `includeUserFeedback` (boolean, optional): Include user satisfaction data (default: true)

**Returns**: Feature performance dashboard with ROI and user adoption metrics

**Next Actions**: `prioritize-features`, `plan-roadmap`

---

### Collaboration

#### add-comment
**Description**: Add product-focused comments with business context.

**Parameters**:
- `entityId` (number, required): Entity ID
- `entityType` (string, required): Entity type
- `comment` (string, required): Comment text
- `isBusinessDecision` (boolean, optional): Mark as business decision (default: false)

**Next Actions**: Contextual based on product priorities

---

## Workflow Patterns

### Daily Product Flow
```
1. manage-product-backlog    → Review priorities
2. show-release-progress     → Check delivery status
3. refine-requirements       → Add clarity to stories
4. prioritize-features       → Adjust based on feedback
```

### Sprint Planning Flow
```
1. manage-product-backlog    → Prepare for planning
2. prioritize-features       → Final priority adjustments
3. refine-requirements       → Ensure story readiness
4. update-acceptance-criteria → Clarify expectations
```

### Sprint Review Flow
```
1. review-sprint-deliverables → Accept completed work
2. stakeholder-report        → Prepare status update
3. schedule-stakeholder-review → Plan demo session
4. show-feature-metrics      → Analyze delivered value
```

### Roadmap Planning Flow
```
1. show-feature-metrics      → Analyze current performance
2. plan-roadmap             → Strategic planning session
3. prioritize-features       → Align with strategy
4. stakeholder-report       → Communicate plans
```

## Context-Aware Suggestions

The system provides product-focused suggestions based on:

- **Business Cycles**: Different priorities for planning vs execution phases
- **Stakeholder Feedback**: Incorporation of user and business feedback
- **Market Timing**: Feature prioritization based on market opportunities
- **Technical Dependencies**: Understanding of implementation constraints

## Implementation Notes

Each operation should:
1. Emphasize business value and ROI calculations
2. Provide stakeholder-ready reporting and communication
3. Support evidence-based product decisions
4. Enable collaborative requirement refinement
5. Track feature performance and user satisfaction
6. Integrate with business intelligence and analytics systems