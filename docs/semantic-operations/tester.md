# QA Tester Semantic Operations

## Overview (Why)

The QA Tester role focuses on quality assurance workflows, systematic testing, and defect management. Operations are designed to streamline testing processes while maintaining quality standards and providing comprehensive defect tracking. This approach enables testers to work efficiently through structured testing workflows while adapting to varying quality requirements.

### Core Principles
- **Quality-First**: Operations prioritize thoroughness and systematic testing
- **Risk-Based**: Testing efforts focus on high-impact and high-risk areas
- **Collaborative**: Seamless integration with development and product teams
- **Traceable**: Complete audit trail from requirements to test results

## Available Operations (How)

### Shared Operations (Tester Context)

#### show-my-bugs (Tester Context)
**Purpose**: View bugs assigned for verification with testing-specific insights.

**Tester-Specific Features**:
- Verification status tracking
- Regression testing needs
- Test environment requirements
- Resolution validation workflow

**Parameters**: Same as developer role
**Returns**: Bugs with testing-focused metadata and verification guidance
**Next Actions**: `start-testing`, `log-time`, `add-comment`

---

#### add-comment (Tester Context)
**Purpose**: Document testing findings, test results, and quality observations.

**Tester-Specific Features**:
- Test result documentation
- Defect reproduction steps
- Quality assessment notes
- Testing methodology documentation

**Usage Patterns**:
- Test execution results
- Bug reproduction details
- Quality sign-off documentation
- Testing environment issues

---

#### log-time (Tester Context)
**Purpose**: Track time spent on testing activities with proper categorization.

**Tester-Specific Features**:
- Testing activity breakdown
- Test environment setup time
- Manual vs automated testing time
- Defect investigation effort

**Common Activities**:
- Test case execution
- Bug reproduction and verification
- Test environment setup
- Quality analysis and reporting

---

### Tester-Specific Operations

#### show-items-for-testing
**Purpose**: View all items ready for testing with priority and complexity indicators.

**Parameters**:
- `includeRegression` (boolean, optional): Include regression testing items
- `priority` (string, optional): Filter by priority ('all', 'critical', 'high')
- `testType` (string, optional): 'functional', 'integration', 'regression'
- `limit` (number, optional): Maximum results (default: 20)

**Returns**: Test-ready items with complexity assessment and testing guidance
**Next Actions**: `start-testing`, `create-test-run`

---

#### start-testing
**Purpose**: Begin testing on an item, updating its state and assigning to yourself.

**Parameters**:
- `itemId` (number, required): ID of the item to test
- `itemType` (string, required): 'UserStory', 'Bug', 'Feature'
- `testPlan` (string, optional): Test plan or approach notes

**Effects**:
- Changes item state to "Testing" or "QA"
- Assigns to current tester
- Creates test execution record

**Next Actions**: `execute-test-suite`, `log-defect`, `approve-testing`

---

#### log-defect
**Purpose**: Document defects found during testing with systematic classification.

**Parameters**:
- `title` (string, required): Defect title
- `description` (string, required): Detailed defect description
- `severity` (string, required): 'Critical', 'Major', 'Minor', 'Trivial'
- `stepsToReproduce` (string, required): Reproduction steps
- `expectedBehavior` (string, required): What should happen
- `actualBehavior` (string, required): What actually happens
- `environment` (string, optional): Testing environment
- `parentItemId` (number, optional): Related item being tested

**Returns**: Created defect ID and triage recommendations
**Next Actions**: `reject-with-bugs`, `add-comment`

---

#### approve-testing
**Purpose**: Approve an item that has passed all testing requirements.

**Parameters**:
- `itemId` (number, required): ID of the tested item
- `testSummary` (string, required): Summary of testing performed
- `signOffNotes` (string, optional): Final QA sign-off notes

**Effects**:
- Changes item state to "Done" or "Ready for Deployment"
- Records test completion
- Adds QA approval comment

**Next Actions**: `show-items-for-testing`, `show-defect-metrics`

---

#### reject-with-bugs
**Purpose**: Reject an item due to defects found during testing.

**Parameters**:
- `itemId` (number, required): ID of the tested item
- `defects` (array, required): List of defects found
- `severity` (string, optional): Overall severity assessment
- `returnToDev` (boolean, optional): Return to developer (default: true)

**Effects**:
- Changes item state back to development
- Creates linked defect records
- Notifies development team

**Next Actions**: `log-defect`, `show-items-for-testing`

---

#### show-defect-metrics
**Purpose**: View defect trends and quality metrics for analysis.

**Parameters**:
- `timeframe` (string, optional): 'week', 'month', 'sprint' (default: 'sprint')
- `includeResolved` (boolean, optional): Include resolved defects
- `groupBy` (string, optional): 'severity', 'component', 'developer'

**Returns**: Defect analytics with quality trends and insights
**Next Actions**: `create-regression-suite`, `show-items-for-testing`

---

## Workflow Patterns (Testing Application)

### Daily Testing Flow
```
1. show-items-for-testing     → Check testing queue and priorities
2. start-testing             → Begin testing highest priority item
3. [Execute tests]
4. log-defect OR approve-testing → Document results
5. log-time                  → Record testing effort
```

### Test Execution Flow
```
1. start-testing             → Set up test execution
2. [Systematic testing]
3. add-comment              → Document test progress
4. log-defect               → Record any issues found
5. approve-testing          → Complete testing cycle
```

### Defect Investigation Flow
```
1. show-my-bugs             → Review bugs assigned for verification
2. start-testing            → Begin verification testing
3. add-comment             → Document verification findings
4. approve-testing OR log-defect → Complete verification
```

### Quality Review Flow
```
1. show-defect-metrics      → Analyze quality trends
2. show-items-for-testing   → Review testing pipeline
3. add-comment             → Document quality assessment
4. log-time                → Track quality review effort
```

## Testing-Specific Adaptations

### Quality Focus
- **Risk Assessment**: Testing operations emphasize risk-based testing approaches
- **Coverage Analysis**: Operations provide insights into test coverage and gaps
- **Regression Planning**: Systematic identification of regression testing needs

### Systematic Approach
- **Test Planning**: Structured approach to test case development and execution
- **Defect Classification**: Consistent severity and priority assignment
- **Quality Metrics**: Comprehensive tracking of quality indicators

### Collaborative Testing
- **Development Integration**: Seamless handoff between development and testing
- **Product Team Coordination**: Quality feedback integrated with product decisions
- **Stakeholder Communication**: Quality reports suitable for management review

## Context-Aware Testing Suggestions

### Testing Phase Adaptations
- **Initial Testing**: Focus on functional verification and core scenarios
- **Regression Testing**: Systematic validation of previously tested functionality
- **Release Testing**: Comprehensive quality assessment for deployment readiness

### Quality Risk Management
- **High-Risk Components**: Enhanced testing for areas with historical issues
- **Critical Path Items**: Priority testing for delivery-critical functionality
- **Integration Points**: Focused testing on system interfaces and dependencies

### Resource Optimization
- **Test Environment Management**: Efficient use of testing resources
- **Automation Opportunities**: Identification of repetitive testing suitable for automation
- **Parallel Testing**: Coordination of concurrent testing activities

## Implementation Notes

### Quality Assurance Integration
Operations integrate with quality management systems while maintaining flexibility for different testing methodologies and organizational structures.

### Traceability Support
Complete traceability from requirements through test execution to defect resolution, supporting compliance and audit requirements.

### Performance Optimization
Efficient handling of large test suites and defect volumes while maintaining responsive user experience for testing teams.