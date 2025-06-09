import { z } from 'zod';

/**
 * Execution context provided to all semantic operations
 * Contains user information, workspace state, and conversation context
 */
export interface ExecutionContext {
  /**
   * Current user information
   */
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    teams: Array<{
      id: number;
      name: string;
      role: string;
    }>;
    permissions: string[];
  };

  /**
   * Current workspace state
   */
  workspace: {
    currentProject?: {
      id: number;
      name: string;
      process: string;
    };
    currentIteration?: {
      id: number;
      name: string;
      startDate: Date;
      endDate: Date;
    };
    currentRelease?: {
      id: number;
      name: string;
    };
    recentProjects?: Array<{
      id: number;
      name: string;
    }>;
    recentEntities: Array<{
      id: number;
      type: string;
      name: string;
    }>;
  };

  /**
   * Active personality mode
   */
  personality: {
    mode: string;
    features: string[];
    restrictions: Record<string, any>;
  };

  /**
   * Conversation context
   */
  conversation: {
    mentionedEntities: Array<{
      id: number;
      type: string;
      name: string;
    }>;
    previousOperations: string[];
    intent: string;
    naturalLanguageQuery?: string;
  };

  /**
   * System configuration
   */
  config: {
    apiUrl: string;
    maxResults: number;
    timeout: number;
  };
}

/**
 * Result structure for semantic operations
 */
export interface OperationResult {
  /**
   * Main content to return to the user
   */
  content: Array<{
    type: 'text' | 'structured-data' | 'markdown' | 'error';
    text?: string;
    data?: any;
  }>;

  /**
   * Suggested next actions based on the result
   */
  suggestions?: string[];

  /**
   * Entities affected by this operation
   */
  affectedEntities?: Array<{
    id: number;
    type: string;
    action: 'created' | 'updated' | 'deleted';
  }>;

  /**
   * Metadata about the operation execution
   */
  metadata?: {
    executionTime: number;
    apiCallsCount: number;
    cacheHits: number;
  };
}

/**
 * Base interface for all semantic operations
 */
export interface SemanticOperation<TParams = any> {
  /**
   * Operation metadata
   */
  metadata: {
    id: string;
    name: string;
    description: string;
    category: string;
    requiredPersonalities: string[];
    examples: string[];
    tags?: string[];
  };

  /**
   * Execute the operation
   */
  execute(context: ExecutionContext, params: TParams): Promise<OperationResult>;

  /**
   * Validate if this operation can be executed in the current context
   */
  canExecute?(context: ExecutionContext): boolean;

  /**
   * Get the Zod schema for parameter validation
   */
  getSchema?(): z.ZodSchema<TParams>;
}

/**
 * Feature module that groups related operations
 */
export interface FeatureModule {
  /**
   * Feature metadata
   */
  metadata: {
    id: string;
    name: string;
    description: string;
    category: string;
    requiredPersonalities: string[];
  };

  /**
   * Operations provided by this feature
   */
  operations: Record<string, SemanticOperation>;

  /**
   * Initialize the feature (optional)
   */
  initialize?(context: ExecutionContext): Promise<void>;

  /**
   * Cleanup when feature is unloaded (optional)
   */
  cleanup?(): Promise<void>;
}

/**
 * Registry for managing semantic operations
 */
export interface OperationRegistry {
  /**
   * Register a new operation
   */
  register(operation: SemanticOperation): void;

  /**
   * Register a feature module
   */
  registerFeature(feature: FeatureModule): void;

  /**
   * Get an operation by ID
   */
  getOperation(id: string): SemanticOperation | undefined;

  /**
   * Get all operations available for a personality
   */
  getOperationsForPersonality(personality: string): SemanticOperation[];

  /**
   * Search operations by natural language query
   */
  findOperationByIntent(query: string, context: ExecutionContext): SemanticOperation | undefined;
}

/**
 * Workflow orchestrator for complex multi-step operations
 */
export interface WorkflowOrchestrator {
  /**
   * Execute a workflow composed of multiple operations
   */
  executeWorkflow(
    steps: Array<{
      operation: string;
      params: any;
      condition?: (previousResult: OperationResult) => boolean;
    }>,
    context: ExecutionContext
  ): Promise<OperationResult>;

  /**
   * Create a workflow from a template
   */
  createWorkflowFromTemplate(
    templateId: string,
    params: Record<string, any>,
    context: ExecutionContext
  ): Promise<Array<{ operation: string; params: any }>>;
}