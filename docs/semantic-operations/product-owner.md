# Product Owner Semantic Operations

## Overview (Why)

The Product Owner role focuses on product strategy, backlog management, and stakeholder communication. Operations are designed to support product decisions, maximize business value delivery, and maintain alignment between development efforts and business objectives. This approach enables product owners to effectively prioritize work and communicate value to stakeholders.

### Core Principles
- **Value-Driven**: Operations emphasize business value and ROI optimization
- **Stakeholder-Centric**: Support for comprehensive stakeholder communication
- **Strategic Planning**: Long-term roadmap and release coordination capabilities
- **Evidence-Based**: Data-driven product decisions and performance tracking

## Available Operations (How)

### Shared Operations (Product Context)

#### add-comment (Product Context)
**Purpose**: Document product decisions, business rationale, and stakeholder feedback.

**Product-Specific Features**:
- Business decision documentation
- Stakeholder feedback capture
- Acceptance criteria clarification
- Strategic rationale recording

**Usage Patterns**:
- Product requirement clarification
- Business rule documentation
- Stakeholder communication records
- Strategic decision tracking

---

#### log-time (Product Context)
**Purpose**: Track product management activities for project accounting and capacity planning.

**Product-Specific Features**:
- Product management activity categorization
- Stakeholder meeting time
- Research and analysis effort
- Strategic planning activities

**Common Activities**:
- Stakeholder meetings and communication
- Product research and analysis
- Roadmap planning sessions
- Feature definition and refinement

---

### Product-Specific Operations

#### manage-product-backlog
**Purpose**: View and organize the product backlog with business value prioritization.

**Parameters**:
- `releaseId` (number, optional): Specific release (default: current release)
- `includeEstimates` (boolean, optional): Show effort estimates (default: true)
- `includeBusinessValue` (boolean, optional): Show business value scores (default: true)
- `limit` (number, optional): Items to display (default: 100)

**Returns**: Prioritized backlog with value/effort ratios and readiness indicators
**Next Actions**: `prioritize-features`, `refine-requirements`, `create-user-story`

---

#### prioritize-features
**Purpose**: Adjust feature priority based on business value and strategic alignment.

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
**Purpose**: Create new user story with acceptance criteria and business context.

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
**Purpose**: Add detail and clarity to existing requirements based on stakeholder feedback.

**Parameters**:
- `storyId` (number, required): User story to refine
- `additionalCriteria` (array, optional): New acceptance criteria
- `userFeedback` (string, optional): User feedback to incorporate
- `technicalNotes` (string, optional): Technical considerations

**Next Actions**: `update-acceptance-criteria`, `prioritize-features`

---

#### show-release-progress
**Purpose**: View release progress with feature completion and business impact assessment.

**Parameters**:
- `releaseId` (number, optional): Specific release (default: current release)
- `includeVelocity` (boolean, optional): Include velocity projections (default: true)
- `showRisks` (boolean, optional): Highlight delivery risks (default: true)

**Returns**: Release dashboard with completion forecast and business impact analysis
**Next Actions**: `review-sprint-deliverables`, `plan-roadmap`

---

#### stakeholder-report
**Purpose**: Generate comprehensive stakeholder progress report with business metrics.

**Parameters**:
- `reportType` (string, required): 'weekly', 'monthly', 'release'
- `includeMetrics` (boolean, optional): Include detailed metrics (default: true)
- `audienceLevel` (string, optional): 'executive', 'management', 'team' (default: 'management')

**Returns**: Formatted report with progress, business impact, and recommendations
**Next Actions**: `schedule-stakeholder-review`, `show-release-progress`

---

#### show-feature-metrics
**Purpose**: View feature usage and business impact metrics for product optimization.

**Parameters**:
- `featureId` (number, optional): Specific feature (default: all recent features)
- `timeframe` (string, optional): 'week', 'month', 'quarter' (default: 'month')
- `includeUserFeedback` (boolean, optional): Include user satisfaction data (default: true)

**Returns**: Feature performance dashboard with ROI and user adoption metrics
**Next Actions**: `prioritize-features`, `plan-roadmap`

---

#### plan-roadmap
**Purpose**: Create and update product roadmap with strategic milestones and business alignment.

**Parameters**:
- `timeframe` (string, optional): 'quarter', 'half-year', 'year' (default: 'quarter')
- `includeCapacity` (boolean, optional): Include team capacity planning (default: true)
- `strategicThemes` (array, optional): Strategic themes to emphasize

**Returns**: Visual roadmap with feature delivery timeline and business dependencies
**Next Actions**: `prioritize-features`, `show-feature-metrics`

---

## Workflow Patterns (Product Application)

### Daily Product Management Flow
```
1. manage-product-backlog      → Review current state and priorities
2. show-release-progress       → Check delivery status and business impact
3. add-comment                → Document daily observations and decisions
4. log-time                   → Track product management activities
```

### Backlog Refinement Flow
```
1. manage-product-backlog      → Assess current backlog state
2. refine-requirements         → Add detail to upcoming stories
3. prioritize-features         → Adjust priorities based on business value
4. create-user-story          → Add new stories as needed
```

### Stakeholder Communication Flow
```
1. show-feature-metrics        → Gather performance data
2. show-release-progress       → Assess delivery status
3. stakeholder-report         → Prepare comprehensive update
4. add-comment               → Document stakeholder feedback
```

### Strategic Planning Flow
```
1. show-feature-metrics        → Analyze current performance
2. plan-roadmap               → Strategic planning session
3. prioritize-features         → Align features with strategy
4. stakeholder-report         → Communicate strategic plans
```

## Product-Specific Adaptations

### Business Value Focus
- **ROI Analysis**: Operations emphasize return on investment calculations
- **Market Impact**: Assessment of features against market opportunities
- **User Value**: Direct connection between features and user satisfaction
- **Competitive Analysis**: Strategic positioning relative to market conditions

### Stakeholder Communication
- **Executive Reporting**: High-level summaries suitable for executive consumption
- **Development Coordination**: Clear requirements and acceptance criteria
- **Customer Feedback**: Integration of user feedback into product decisions
- **Market Intelligence**: External market data integration for strategic decisions

### Strategic Integration
- **Roadmap Alignment**: Feature decisions aligned with long-term product strategy
- **Resource Optimization**: Capacity planning integrated with business priorities
- **Release Planning**: Business-driven release content and timing decisions
- **Performance Tracking**: Continuous measurement of product success metrics

## Context-Aware Product Suggestions

### Business Cycle Adaptations
- **Planning Phase**: Focus on strategic roadmap and priority setting
- **Execution Phase**: Emphasis on refinement and stakeholder communication
- **Review Phase**: Performance analysis and strategic adjustments

### Market Timing
- **Feature Launch**: Coordination of feature delivery with market opportunities
- **Competitive Response**: Rapid prioritization for competitive positioning
- **User Feedback Integration**: Systematic incorporation of user insights

### Stakeholder Management
- **Executive Updates**: High-level progress and strategic alignment
- **Development Coordination**: Clear requirements and technical guidance
- **Customer Communication**: User-facing feature communication and feedback

## Implementation Notes

### Business Intelligence Integration
Operations integrate with business intelligence systems to provide comprehensive product performance data and market insights.

### Stakeholder Workflow Support
Complete support for stakeholder communication workflows, from requirements gathering through feature delivery and performance assessment.

### Strategic Planning Tools
Comprehensive roadmap planning capabilities that align tactical development work with strategic business objectives and market opportunities.