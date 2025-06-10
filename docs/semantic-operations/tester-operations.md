# QA Tester Semantic Operations

This document defines the semantic operations available for the QA Tester role in the TargetProcess MCP server.

## Overview

The QA Tester role focuses on quality assurance workflows, test execution, and defect management. Operations are designed to streamline testing processes and provide quality insights.

## Core Operations

### Test Management

#### show-items-for-testing
**Description**: View all items ready for testing with priority and complexity indicators.

**Parameters**:
- `includeRegression` (boolean, optional): Include regression testing items (default: false)
- `priority` (string, optional): Filter by priority 'all', 'critical', 'high' (default: 'all')
- `testType` (string, optional): 'functional', 'integration', 'regression' (default: 'all')
- `limit` (number, optional): Maximum results (default: 20)

**Returns**: Test-ready items with complexity assessment and testing guidance

**Next Actions**: `start-testing`, `create-test-run`, `show-my-test-cases`

---

#### start-testing
**Description**: Begin testing on an item, updating its state and assigning to yourself.

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

#### create-test-run
**Description**: Create a formal test run for systematic testing.

**Parameters**:
- `itemId` (number, required): Item being tested
- `testSuiteId` (number, optional): Specific test suite to run
- `environment` (string, optional): Testing environment
- `notes` (string, optional): Test execution notes

**Returns**: Test run ID and execution guidance

**Next Actions**: `execute-test-suite`, `log-defect`

---

#### execute-test-suite
**Description**: Execute test cases and record results.

**Parameters**:
- `testRunId` (number, required): Test run to execute
- `testCaseResults` (array, optional): Batch test case results
- `environment` (string, optional): Testing environment details

**Returns**: Test execution summary with pass/fail metrics

**Next Actions**: `approve-testing`, `log-defect`, `add-comment`

---

### Quality Assessment

#### approve-testing
**Description**: Approve an item that has passed all testing requirements.

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
**Description**: Reject an item due to defects found during testing.

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

### Defect Management

#### log-defect
**Description**: Log a new defect found during testing.

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

#### show-defect-metrics
**Description**: View defect trends and quality metrics.

**Parameters**:
- `timeframe` (string, optional): 'week', 'month', 'sprint' (default: 'sprint')
- `includeResolved` (boolean, optional): Include resolved defects (default: true)
- `groupBy` (string, optional): 'severity', 'component', 'developer' (default: 'severity')

**Returns**: Defect analytics with quality trends and insights

**Next Actions**: `create-regression-suite`, `show-items-for-testing`

---

### Test Case Management

#### show-my-test-cases
**Description**: View test cases assigned to you or relevant to current testing.

**Parameters**:
- `status` (string, optional): 'active', 'pending', 'all' (default: 'active')
- `priority` (string, optional): Filter by priority (default: 'all')
- `testType` (string, optional): 'manual', 'automated', 'all' (default: 'all')

**Returns**: Test cases with execution status and priority

**Next Actions**: `execute-test-suite`, `create-test-run`

---

#### create-regression-suite
**Description**: Create regression test suite based on recent defects.

**Parameters**:
- `timeframe` (string, optional): Period to analyze for regression needs (default: 'month')
- `includeComponents` (array, optional): Specific components to include
- `automationLevel` (string, optional): 'manual', 'automated', 'mixed' (default: 'mixed')

**Returns**: Created regression suite with recommended test cases

**Next Actions**: `execute-test-suite`, `show-defect-metrics`

---

### Time & Collaboration

#### log-time
**Description**: Record time spent on testing activities.

**Parameters**:
- `entityId` (number, required): Item or test case ID
- `entityType` (string, required): 'UserStory', 'Bug', 'TestCase'
- `hours` (number, required): Hours spent testing
- `activity` (string, optional): 'test-planning', 'test-execution', 'defect-verification'
- `description` (string, optional): What testing was performed

**Next Actions**: `show-defect-metrics`, `approve-testing`

---

#### add-comment
**Description**: Add testing-specific comments to any entity.

**Parameters**:
- `entityId` (number, required): Entity ID
- `entityType` (string, required): Entity type
- `comment` (string, required): Comment text
- `isTestingNote` (boolean, optional): Mark as testing-specific note (default: true)

**Next Actions**: Contextual based on testing phase

---

## Workflow Patterns

### Daily Testing Flow
```
1. show-items-for-testing  → Check testing queue
2. start-testing          → Pick highest priority
3. execute-test-suite     → Run test cases
4. log-defect            → Document issues
5. approve-testing       → Sign off quality
```

### Test Execution Flow
```
1. create-test-run       → Set up test execution
2. execute-test-suite    → Run systematic tests
3. log-defect           → Record any issues
4. approve-testing      → Complete testing cycle
```

### Defect Investigation Flow
```
1. log-defect           → Document the issue
2. reject-with-bugs     → Return to development
3. add-comment         → Provide reproduction details
4. <wait for fix>
5. start-testing       → Verify the fix
```

### Quality Review Flow
```
1. show-defect-metrics    → Analyze quality trends
2. create-regression-suite → Plan regression testing
3. execute-test-suite    → Run regression tests
4. show-items-for-testing → Continue testing cycle
```

## Context-Aware Suggestions

The system provides testing-focused suggestions based on:

- **Testing Phase**: Different workflows for initial testing vs regression
- **Defect Density**: More thorough testing for high-risk components
- **Release Timeline**: Prioritization based on delivery deadlines
- **Quality History**: Focus on components with past issues

## Implementation Notes

Each operation should:
1. Integrate with test case management systems
2. Provide defect trend analysis and quality metrics
3. Support both manual and automated testing workflows
4. Enable traceability from requirements to test results
5. Support collaborative testing with development teams
6. Include environment and configuration tracking