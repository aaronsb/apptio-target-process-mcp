import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { 
  FeatureModule, 
  ExecutionContext,
  SemanticOperation 
} from '../../core/interfaces/semantic-operation.interface.js';
import { ShowMyTasksOperation } from './show-my-tasks.js';

/**
 * Developer Workflow Feature Module
 * 
 * Provides semantic operations specifically designed for software developers
 * working with TargetProcess. Focuses on personal task management, progress
 * tracking, and workflow optimization.
 */
export class DeveloperWorkflowFeature implements FeatureModule {
  private operations: Record<string, SemanticOperation> = {};

  constructor(private tpService: TPService) {
    this.initializeOperations();
  }

  get metadata() {
    return {
      id: 'developer-workflow',
      name: 'Developer Workflow',
      description: 'Personal task management and development workflow operations',
      category: 'workflow',
      requiredPersonalities: ['developer', 'administrator']
    };
  }

  async initialize(context: ExecutionContext): Promise<void> {
    // Initialize any required state or connections
    console.log(`Initializing Developer Workflow for user: ${context.user.name}`);
  }

  async cleanup(): Promise<void> {
    // Cleanup resources if needed
    console.log('Cleaning up Developer Workflow feature');
  }

  private initializeOperations(): void {
    // Register the show-my-tasks operation
    this.operations['show-my-tasks'] = new ShowMyTasksOperation(this.tpService);

    // Additional operations can be added here
    this.operations['start-working-on'] = new StartWorkingOnOperation(this.tpService);
    this.operations['update-progress'] = new UpdateProgressOperation(this.tpService);
    this.operations['complete-task'] = new CompleteTaskOperation(this.tpService);
  }
}

/**
 * Start Working On Operation
 * Changes task state to "In Progress" and assigns to current user
 */
class StartWorkingOnOperation implements SemanticOperation {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'start-working-on',
      name: 'Start Working On',
      description: 'Begin work on a task by updating its state to In Progress',
      category: 'task-workflow',
      requiredPersonalities: ['developer', 'administrator'],
      examples: [
        'Start working on task 1234',
        'Begin work on the login bug',
        'I want to start this feature',
        'Pick up task #5678'
      ],
      tags: ['task', 'progress', 'workflow']
    };
  }

  getSchema() {
    return z.object({
      taskId: z.number().describe('ID of the task to start working on'),
      comment: z.string().optional().describe('Optional comment about starting work')
    });
  }

  async execute(context: ExecutionContext, params: { taskId: number; comment?: string }) {
    try {
      // First, get the current task to validate and gather context
      const task = await this.service.getEntity({
        type: 'Task',
        id: params.taskId,
        include: ['EntityState', 'AssignedUser', 'Project', 'Priority']
      });

      if (!task) {
        return {
          content: [{
            type: 'error',
            text: `Task ${params.taskId} not found`
          }]
        };
      }

      // Check if task is already in progress
      if (task.EntityState?.Name === 'In Progress') {
        return {
          content: [{
            type: 'text',
            text: `Task "${task.Name}" is already in progress`
          }]
        };
      }

      // Find the "In Progress" state ID for this project
      const states = await this.service.searchEntities({
        type: 'EntityState',
        where: `Process.Id eq ${task.EntityType?.Process?.Id} and Name eq 'In Progress'`,
        take: 1
      });

      if (states.length === 0) {
        return {
          content: [{
            type: 'error', 
            text: 'Could not find "In Progress" state for this task'
          }]
        };
      }

      const inProgressStateId = states[0].Id;

      // Update the task
      const updateFields: any = {
        entityState: { id: inProgressStateId }
      };

      // Assign to current user if not already assigned
      if (!task.AssignedUser || task.AssignedUser.Id !== context.user.id) {
        updateFields.assignedUser = { id: context.user.id };
      }

      await this.service.updateEntity({
        type: 'Task',
        id: params.taskId,
        fields: updateFields
      });

      // Add a comment if provided
      if (params.comment) {
        await this.service.createEntity({
          type: 'Comment',
          name: params.comment,
          description: `Started working on task: ${task.Name}`,
          // Link to the task
          general: { id: params.taskId }
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Started working on: "${task.Name}"`
          },
          {
            type: 'structured-data',
            data: {
              task: {
                id: task.Id,
                name: task.Name,
                project: task.Project?.Name,
                priority: task.Priority?.Name,
                previousState: task.EntityState?.Name,
                newState: 'In Progress'
              }
            }
          }
        ],
        suggestions: [
          'update-progress',
          'log-time',
          'show-my-tasks'
        ],
        affectedEntities: [{
          id: params.taskId,
          type: 'Task',
          action: 'updated'
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'error',
          text: `Failed to start working on task: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
}

/**
 * Update Progress Operation
 * Add progress updates and comments to tasks
 */
class UpdateProgressOperation implements SemanticOperation {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'update-progress',
      name: 'Update Progress',
      description: 'Add progress updates and comments to your tasks',
      category: 'task-workflow', 
      requiredPersonalities: ['developer', 'administrator'],
      examples: [
        'Update progress on task 1234',
        'Add progress note to current task',
        'Log progress: completed the API integration',
        'Update task with current status'
      ],
      tags: ['task', 'progress', 'comment']
    };
  }

  getSchema() {
    return z.object({
      taskId: z.number().describe('ID of the task to update'),
      progress: z.string().describe('Progress description or update'),
      percentComplete: z.number().min(0).max(100).optional().describe('Percentage completion (0-100)')
    });
  }

  async execute(context: ExecutionContext, params: { taskId: number; progress: string; percentComplete?: number }) {
    try {
      // Get task details
      const task = await this.service.getEntity({
        type: 'Task',
        id: params.taskId,
        include: ['EntityState', 'Project']
      });

      if (!task) {
        return {
          content: [{
            type: 'error',
            text: `Task ${params.taskId} not found`
          }]
        };
      }

      // Add progress comment
      await this.service.createEntity({
        type: 'Comment',
        name: 'Progress Update',
        description: params.progress,
        general: { id: params.taskId }
      });

      // Update percentage if provided
      const updateFields: any = {};
      if (params.percentComplete !== undefined) {
        updateFields.percentComplete = params.percentComplete;
      }

      if (Object.keys(updateFields).length > 0) {
        await this.service.updateEntity({
          type: 'Task',
          id: params.taskId,
          fields: updateFields
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: `📝 Progress updated for: "${task.Name}"`
          },
          {
            type: 'structured-data',
            data: {
              task: {
                id: task.Id,
                name: task.Name,
                project: task.Project?.Name,
                progressUpdate: params.progress,
                percentComplete: params.percentComplete
              }
            }
          }
        ],
        suggestions: [
          params.percentComplete === 100 ? 'complete-task' : 'update-progress',
          'log-time',
          'show-my-tasks'
        ],
        affectedEntities: [{
          id: params.taskId,
          type: 'Task',
          action: 'updated'
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'error',
          text: `Failed to update progress: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
}

/**
 * Complete Task Operation
 * Mark task as done and handle completion workflow
 */
class CompleteTaskOperation implements SemanticOperation {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'complete-task',
      name: 'Complete Task',
      description: 'Mark a task as completed and update its state to Done',
      category: 'task-workflow',
      requiredPersonalities: ['developer', 'administrator'],
      examples: [
        'Complete task 1234',
        'Mark this task as done',
        'Finish task',
        'Task completed'
      ],
      tags: ['task', 'completion', 'workflow']
    };
  }

  getSchema() {
    return z.object({
      taskId: z.number().describe('ID of the task to complete'),
      completionNote: z.string().optional().describe('Optional completion notes')
    });
  }

  async execute(context: ExecutionContext, params: { taskId: number; completionNote?: string }) {
    try {
      // Get task details
      const task = await this.service.getEntity({
        type: 'Task',
        id: params.taskId,
        include: ['EntityState', 'Project', 'EntityType']
      });

      if (!task) {
        return {
          content: [{
            type: 'error',
            text: `Task ${params.taskId} not found`
          }]
        };
      }

      // Check if already completed
      if (task.EntityState?.Name === 'Done') {
        return {
          content: [{
            type: 'text',
            text: `Task "${task.Name}" is already completed`
          }]
        };
      }

      // Find the "Done" state for this process
      const states = await this.service.searchEntities({
        type: 'EntityState',
        where: `Process.Id eq ${task.EntityType?.Process?.Id} and Name eq 'Done'`,
        take: 1
      });

      if (states.length === 0) {
        return {
          content: [{
            type: 'error',
            text: 'Could not find "Done" state for this task'
          }]
        };
      }

      // Update task to completed state
      await this.service.updateEntity({
        type: 'Task',
        id: params.taskId,
        fields: {
          entityState: { id: states[0].Id },
          percentComplete: 100
        }
      });

      // Add completion comment if provided
      if (params.completionNote) {
        await this.service.createEntity({
          type: 'Comment',
          name: 'Task Completed',
          description: params.completionNote,
          general: { id: params.taskId }
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: `🎉 Completed task: "${task.Name}"`
          },
          {
            type: 'structured-data',
            data: {
              task: {
                id: task.Id,
                name: task.Name,
                project: task.Project?.Name,
                completedAt: new Date().toISOString(),
                completionNote: params.completionNote
              }
            }
          }
        ],
        suggestions: [
          'show-my-tasks',
          'log-time',
          'start-working-on'
        ],
        affectedEntities: [{
          id: params.taskId,
          type: 'Task',
          action: 'updated'
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'error',
          text: `Failed to complete task: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
}

export default DeveloperWorkflowFeature;