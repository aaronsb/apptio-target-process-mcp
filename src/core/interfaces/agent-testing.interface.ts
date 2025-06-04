/**
 * Interfaces for agent usability testing
 * Tests how well AI agents can use the MCP tools in practice
 */

/**
 * Represents a test scenario for an agent to perform
 */
export interface IAgentTestScenario {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'intermediate' | 'advanced' | 'error-handling';
  
  /**
   * The goal the agent should achieve
   */
  goal: string;
  
  /**
   * Expected tool calls in order (flexible matching)
   */
  expectedTools?: string[];
  
  /**
   * Success criteria to evaluate
   */
  successCriteria: ISuccessCriteria[];
  
  /**
   * Initial context or setup required
   */
  setup?: ITestSetup;
  
  /**
   * Hints that could be provided if agent struggles
   */
  hints?: string[];
}

/**
 * Success criteria for evaluating agent performance
 */
export interface ISuccessCriteria {
  type: 'tool-called' | 'data-found' | 'entity-created' | 'entity-updated' | 'error-handled';
  description: string;
  
  /**
   * Validation function or expected values
   */
  validation: {
    toolName?: string;
    parameters?: Record<string, any>;
    resultContains?: any;
    errorType?: string;
  };
}

/**
 * Test setup requirements
 */
export interface ITestSetup {
  /**
   * Entities to create before test
   */
  entities?: Array<{
    type: string;
    data: Record<string, any>;
  }>;
  
  /**
   * Mock data to provide
   */
  mockData?: Record<string, any>;
  
  /**
   * Environment variables or config
   */
  config?: Record<string, any>;
}

/**
 * Agent test result
 */
export interface IAgentTestResult {
  scenarioId: string;
  success: boolean;
  duration: number;
  
  /**
   * Tool calls made by agent
   */
  toolCalls: IToolCall[];
  
  /**
   * Criteria evaluation results
   */
  criteriaResults: Array<{
    criteria: ISuccessCriteria;
    passed: boolean;
    reason?: string;
  }>;
  
  /**
   * Agent's reasoning or thought process if available
   */
  agentReasoning?: string[];
  
  /**
   * Errors encountered
   */
  errors?: Array<{
    tool: string;
    error: string;
    recovered: boolean;
  }>;
  
  /**
   * Usability issues identified
   */
  usabilityIssues?: IUsabilityIssue[];
}

/**
 * Tool call made by agent
 */
export interface IToolCall {
  tool: string;
  parameters: any;
  result: any;
  duration: number;
  timestamp: Date;
}

/**
 * Usability issue identified during testing
 */
export interface IUsabilityIssue {
  severity: 'low' | 'medium' | 'high';
  type: 'unclear-description' | 'confusing-parameters' | 'unhelpful-error' | 'missing-capability' | 'inefficient-workflow';
  description: string;
  suggestion?: string;
  toolName?: string;
}

/**
 * Agent test runner interface
 */
export interface IAgentTestRunner {
  /**
   * Run a single test scenario
   */
  runScenario(scenario: IAgentTestScenario): Promise<IAgentTestResult>;
  
  /**
   * Run all test scenarios
   */
  runAll(): Promise<IAgentTestResult[]>;
  
  /**
   * Run scenarios by category
   */
  runByCategory(category: string): Promise<IAgentTestResult[]>;
  
  /**
   * Generate usability report
   */
  generateUsabilityReport(results: IAgentTestResult[]): IUsabilityReport;
}

/**
 * Usability report summarizing findings
 */
export interface IUsabilityReport {
  totalScenarios: number;
  passedScenarios: number;
  averageDuration: number;
  
  /**
   * Tool usage statistics
   */
  toolUsage: Record<string, {
    callCount: number;
    successRate: number;
    averageDuration: number;
    commonErrors: string[];
  }>;
  
  /**
   * Common usability issues
   */
  usabilityIssues: Array<{
    issue: IUsabilityIssue;
    frequency: number;
    scenarios: string[];
  }>;
  
  /**
   * Recommendations for improvement
   */
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    area: 'tool-descriptions' | 'parameter-schemas' | 'error-messages' | 'documentation' | 'new-features';
    recommendation: string;
    affectedTools?: string[];
  }>;
  
  /**
   * Agent efficiency metrics
   */
  efficiency: {
    unnecessaryToolCalls: number;
    optimalPathRate: number;
    errorRecoveryRate: number;
  };
}

/**
 * Agent simulator for testing without real AI
 */
export interface IAgentSimulator {
  /**
   * Simulate agent behavior for a scenario
   */
  simulate(scenario: IAgentTestScenario): Promise<IToolCall[]>;
  
  /**
   * Set agent behavior mode
   */
  setBehavior(mode: 'optimal' | 'exploratory' | 'confused' | 'error-prone'): void;
}

/**
 * Test scenario examples
 */
export const EXAMPLE_SCENARIOS: IAgentTestScenario[] = [
  {
    id: 'find-open-bugs',
    name: 'Find Open Bugs',
    description: 'Agent should find all open bugs in a project',
    category: 'basic',
    goal: 'Find all bugs with status "Open" in project ID 123',
    expectedTools: ['search_entities'],
    successCriteria: [
      {
        type: 'tool-called',
        description: 'Agent calls search_entities with correct parameters',
        validation: {
          toolName: 'search_entities',
          parameters: {
            type: 'Bug',
            where: (expect: any) => expect.toContain('EntityState.Name') && expect.toContain('Open')
          }
        }
      }
    ]
  },
  {
    id: 'create-and-assign-story',
    name: 'Create and Assign User Story',
    description: 'Agent should create a story and assign it to a user',
    category: 'intermediate',
    goal: 'Create a new user story "Implement login feature" in project 123 and assign it to user with email john@example.com',
    expectedTools: ['search_entities', 'create_entity', 'update_entity'],
    successCriteria: [
      {
        type: 'tool-called',
        description: 'Agent searches for user by email',
        validation: {
          toolName: 'search_entities',
          parameters: {
            type: 'GeneralUser',
            where: (expect: any) => expect.toContain('Email') && expect.toContain('john@example.com')
          }
        }
      },
      {
        type: 'entity-created',
        description: 'Agent creates user story',
        validation: {
          toolName: 'create_entity',
          resultContains: {
            Name: 'Implement login feature'
          }
        }
      }
    ]
  }
];