import { TPService } from '../../api/client/tp.service.js';
import { 
  FeatureModule, 
  ExecutionContext,
  SemanticOperation 
} from '../../core/interfaces/semantic-operation.interface.js';
import { ShowMyTasksOperation } from './show-my-tasks.js';
import { StartWorkingOnOperation } from './start-working-on.js';
import { CompleteTaskOperation } from './complete-task.js';
import { ShowMyBugsOperation } from './show-my-bugs.js';
import { LogTimeOperation } from './log-time.js';
import { ShowCommentsOperation } from './show-comments.js';
import { DeleteCommentOperation } from './delete-comment.js';
import { logger } from '../../utils/logger.js';

/**
 * Work Operations Module
 * 
 * Provides semantic operations for managing work items (tasks, bugs, features)
 * across all roles. Includes task state management, progress tracking, and
 * time management operations.
 */
export class WorkOperations implements FeatureModule {
  public operations: Record<string, SemanticOperation> = {};

  constructor(private tpService: TPService) {
    this.initializeOperations();
  }

  get metadata() {
    return {
      id: 'work-operations',
      name: 'Work Operations',
      description: 'Task, bug, and work item management operations',
      category: 'operations',
      requiredPersonalities: ['developer', 'tester', 'project-manager', 'product-manager', 'administrator']
    };
  }

  async initialize(context: ExecutionContext): Promise<void> {
    // Initialize any required state or connections
    logger.info(`Initializing Work Operations for user: ${context.user.name}`);
  }

  async cleanup(): Promise<void> {
    // Cleanup resources if needed
    logger.info('Cleaning up Work Operations module');
  }

  private initializeOperations(): void {
    // Task Management Operations
    this.operations['show-my-tasks'] = new ShowMyTasksOperation(this.tpService);
    this.operations['start-working-on'] = new StartWorkingOnOperation(this.tpService);
    this.operations['complete-task'] = new CompleteTaskOperation(this.tpService);
    
    // Bug Management Operations
    this.operations['show-my-bugs'] = new ShowMyBugsOperation(this.tpService);
    
    // Time Management Operations
    this.operations['log-time'] = new LogTimeOperation(this.tpService);
    
    // Comment Operations
    this.operations['show-comments'] = new ShowCommentsOperation(this.tpService);
    this.operations['delete-comment'] = new DeleteCommentOperation(this.tpService);
    
    
    // TODO: Implement these operations
    // this.operations['update-progress'] = new UpdateProgressOperation(this.tpService);
    // this.operations['pause-work'] = new PauseWorkOperation(this.tpService);
    // this.operations['investigate-bug'] = new InvestigateBugOperation(this.tpService);
    // this.operations['mark-bug-fixed'] = new MarkBugFixedOperation(this.tpService);
    // this.operations['show-time-spent'] = new ShowTimeSpentOperation(this.tpService);
  }
}

export default WorkOperations;
