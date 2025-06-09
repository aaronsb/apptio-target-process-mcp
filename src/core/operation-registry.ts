import { 
  SemanticOperation, 
  FeatureModule, 
  OperationRegistry as IOperationRegistry,
  ExecutionContext 
} from './interfaces/semantic-operation.interface.js';

/**
 * Central registry for managing semantic operations and feature modules.
 * Provides discovery, filtering, and lifecycle management for operations.
 */
export class OperationRegistry implements IOperationRegistry {
  private operations = new Map<string, SemanticOperation>();
  private features = new Map<string, FeatureModule>();
  private personalityFilters = new Map<string, Set<string>>();

  constructor() {
    this.setupDefaultPersonalities();
  }

  /**
   * Register a standalone operation
   */
  register(operation: SemanticOperation): void {
    if (this.operations.has(operation.metadata.id)) {
      throw new Error(`Operation ${operation.metadata.id} is already registered`);
    }

    this.operations.set(operation.metadata.id, operation);
    this.updatePersonalityFilters(operation);
  }

  /**
   * Register a feature module (multiple related operations)
   */
  registerFeature(feature: FeatureModule): void {
    if (this.features.has(feature.metadata.id)) {
      throw new Error(`Feature ${feature.metadata.id} is already registered`);
    }

    this.features.set(feature.metadata.id, feature);

    // Register all operations from the feature
    Object.entries(feature.operations).forEach(([operationId, operation]) => {
      this.operations.set(operationId, operation);
      this.updatePersonalityFilters(operation);
    });
  }

  /**
   * Get an operation by ID
   */
  getOperation(id: string): SemanticOperation | undefined {
    return this.operations.get(id);
  }

  /**
   * Get all operations available for a specific personality
   */
  getOperationsForPersonality(personality: string): SemanticOperation[] {
    const allowedOperations = this.personalityFilters.get(personality) || new Set();
    
    return Array.from(this.operations.values()).filter(operation =>
      operation.metadata.requiredPersonalities.includes(personality) ||
      operation.metadata.requiredPersonalities.includes('all') ||
      allowedOperations.has(operation.metadata.id)
    );
  }

  /**
   * Find operation by natural language intent analysis
   */
  findOperationByIntent(query: string, context: ExecutionContext): SemanticOperation | undefined {
    const normalizedQuery = query.toLowerCase();
    const availableOps = this.getOperationsForPersonality(context.personality.mode);
    
    // Score operations based on query matching
    const scoredOps = availableOps.map(op => ({
      operation: op,
      score: this.calculateIntentScore(op, normalizedQuery, context)
    })).filter(({ score }) => score > 0);

    // Sort by score and return best match
    scoredOps.sort((a, b) => b.score - a.score);
    return scoredOps[0]?.operation;
  }

  /**
   * Get all registered operations
   */
  getAllOperations(): SemanticOperation[] {
    return Array.from(this.operations.values());
  }

  /**
   * Get all registered features
   */
  getAllFeatures(): FeatureModule[] {
    return Array.from(this.features.values());
  }

  /**
   * Initialize a feature (if it has initialization logic)
   */
  async initializeFeature(featureId: string, context: ExecutionContext): Promise<void> {
    const feature = this.features.get(featureId);
    if (feature?.initialize) {
      await feature.initialize(context);
    }
  }

  /**
   * Cleanup a feature when unloading
   */
  async cleanupFeature(featureId: string): Promise<void> {
    const feature = this.features.get(featureId);
    if (feature?.cleanup) {
      await feature.cleanup();
    }
  }

  /**
   * Get operations by category
   */
  getOperationsByCategory(category: string): SemanticOperation[] {
    return Array.from(this.operations.values()).filter(
      op => op.metadata.category === category
    );
  }

  /**
   * Search operations by tags
   */
  searchOperationsByTags(tags: string[]): SemanticOperation[] {
    return Array.from(this.operations.values()).filter(op =>
      op.metadata.tags?.some(tag => tags.includes(tag))
    );
  }

  /**
   * Validate that an operation can execute in the current context
   */
  canExecuteOperation(operationId: string, context: ExecutionContext): boolean {
    const operation = this.getOperation(operationId);
    if (!operation) return false;

    // Check personality restrictions
    if (!this.getOperationsForPersonality(context.personality.mode).includes(operation)) {
      return false;
    }

    // Check operation-specific validation
    return operation.canExecute ? operation.canExecute(context) : true;
  }

  /**
   * Get operation suggestions based on current context and conversation state
   */
  getSuggestedOperations(context: ExecutionContext, limit: number = 5): SemanticOperation[] {
    const availableOps = this.getOperationsForPersonality(context.personality.mode);
    
    // Score operations based on context relevance
    const scoredOps = availableOps.map(op => ({
      operation: op,
      score: this.calculateContextRelevance(op, context)
    }));

    // Sort by relevance and return top suggestions
    scoredOps.sort((a, b) => b.score - a.score);
    return scoredOps.slice(0, limit).map(({ operation }) => operation);
  }

  private setupDefaultPersonalities(): void {
    // Developer personality - focused on task management and technical workflows
    this.personalityFilters.set('developer', new Set([
      'show-my-tasks',
      'start-working-on',
      'update-progress',
      'complete-task',
      'log-time',
      'resolve-blocker',
      'show-impediments'
    ]));

    // Product Manager personality - focused on planning and backlog management
    this.personalityFilters.set('product-manager', new Set([
      'manage-backlog',
      'prioritize-features',
      'plan-iteration',
      'show-team-capacity',
      'track-release-progress',
      'review-feedback'
    ]));

    // Project Manager personality - focused on coordination and reporting
    this.personalityFilters.set('project-manager', new Set([
      'show-team-tasks',
      'track-project-health',
      'generate-status-report',
      'identify-risks',
      'manage-dependencies'
    ]));

    // QA/Tester personality - focused on testing workflows
    this.personalityFilters.set('tester', new Set([
      'show-test-assignments',
      'create-test-run',
      'log-defect',
      'update-test-results',
      'review-test-coverage'
    ]));

    // Administrator personality - has access to all operations
    this.personalityFilters.set('administrator', new Set());
  }

  private updatePersonalityFilters(operation: SemanticOperation): void {
    // Add operation to appropriate personality filters
    operation.metadata.requiredPersonalities.forEach(personality => {
      if (personality !== 'all') {
        const filterSet = this.personalityFilters.get(personality) || new Set();
        filterSet.add(operation.metadata.id);
        this.personalityFilters.set(personality, filterSet);
      }
    });
  }

  private calculateIntentScore(
    operation: SemanticOperation, 
    query: string, 
    context: ExecutionContext
  ): number {
    let score = 0;

    // Match against operation name (high weight)
    if (operation.metadata.name.toLowerCase().includes(query)) {
      score += 10;
    }

    // Match against operation description
    if (operation.metadata.description.toLowerCase().includes(query)) {
      score += 5;
    }

    // Match against examples (very high weight)
    const exampleMatches = operation.metadata.examples.filter(example =>
      example.toLowerCase().includes(query) || query.includes(example.toLowerCase())
    );
    score += exampleMatches.length * 15;

    // Match against tags
    if (operation.metadata.tags?.some(tag => query.includes(tag.toLowerCase()))) {
      score += 3;
    }

    // Context-specific scoring
    score += this.calculateContextRelevance(operation, context) * 2;

    return score;
  }

  private calculateContextRelevance(
    operation: SemanticOperation, 
    context: ExecutionContext
  ): number {
    let relevance = 0;

    // Boost operations relevant to current workspace state
    if (context.workspace.currentProject) {
      if (operation.metadata.category === 'project-workflow') relevance += 3;
    }

    if (context.workspace.currentIteration) {
      if (operation.metadata.category === 'iteration-workflow') relevance += 3;
    }

    // Boost operations based on recent conversation context
    if (context.conversation.previousOperations.length > 0) {
      const lastOperation = context.conversation.previousOperations[context.conversation.previousOperations.length - 1];
      
      // Suggest logical next steps
      if (lastOperation === 'show-my-tasks' && operation.metadata.id === 'start-working-on') {
        relevance += 5;
      }
      if (lastOperation === 'start-working-on' && operation.metadata.id === 'update-progress') {
        relevance += 5;
      }
    }

    // Boost operations matching mentioned entities
    if (context.conversation.mentionedEntities.length > 0) {
      const entityTypes = context.conversation.mentionedEntities.map(e => e.type.toLowerCase());
      if (entityTypes.includes('task') && operation.metadata.category === 'task-workflow') {
        relevance += 4;
      }
      if (entityTypes.includes('bug') && operation.metadata.category === 'bug-workflow') {
        relevance += 4;
      }
    }

    return relevance;
  }
}

export const operationRegistry = new OperationRegistry();