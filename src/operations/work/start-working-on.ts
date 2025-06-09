import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation, OperationResult } from '../../core/interfaces/semantic-operation.interface.js';

const startWorkingOnSchema = z.object({
  taskId: z.number().describe('ID of the task to start working on'),
  comment: z.string().optional().describe('Optional comment about starting work')
});

type StartWorkingOnParams = z.infer<typeof startWorkingOnSchema>;

/**
 * Start Working On Operation
 * Changes task state to "In Progress" and assigns to current user
 */
export class StartWorkingOnOperation implements SemanticOperation<StartWorkingOnParams> {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'start-working-on',
      name: 'Start Working On',
      description: 'Begin work on a task by updating its state to In Progress',
      category: 'task-workflow',
      requiredPersonalities: ['developer', 'tester', 'administrator'],
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
    return startWorkingOnSchema;
  }

  async execute(context: ExecutionContext, params: StartWorkingOnParams): Promise<OperationResult> {
    try {
      // First, get the current task to validate and gather context
      const task = await this.service.getEntity(
        'Task',
        params.taskId,
        ['EntityState', 'AssignedUser', 'Project', 'Priority']
      ) as any;

      if (!task) {
        return {
          content: [{
            type: 'error' as const,
            text: `Task ${params.taskId} not found`
          }]
        };
      }

      // Check if task is already in progress
      if (task.EntityState?.Name === 'In Progress') {
        return {
          content: [{
            type: 'text' as const,
            text: `Task "${task.Name}" is already in progress`
          }]
        };
      }

      // Find all task states and identify the "working" state (not initial, not final)
      const allTaskStates = await this.service.searchEntities(
        'EntityState',
        `EntityType.Name eq 'Task'`,
        ['EntityType', 'IsInitial', 'IsFinal'],
        20
      );

      // Look for a state that's not initial and not final (working state)
      const workingStates = allTaskStates.filter((s: any) => 
        !s.IsInitial && !s.IsFinal
      );

      if (workingStates.length === 0) {
        return {
          content: [{
            type: 'error' as const,
            text: 'Could not find a working state for tasks. Use inspect_object EntityState to see available states.'
          }]
        };
      }

      // Use the first working state found
      const inProgressState = workingStates[0] as any;

      if (!inProgressState) {
        return {
          content: [{
            type: 'error' as const,
            text: 'Could not find "In Progress" state for tasks'
          }]
        };
      }

      // Update the task
      const updateFields: any = {
        EntityState: { Id: inProgressState.Id }
      };

      // Assign to current user if not already assigned
      const assignedUsers = task.AssignedUser?.Items || [];
      const isAlreadyAssigned = assignedUsers.some((user: any) => user.Id === context.user.id);
      
      if (!isAlreadyAssigned) {
        updateFields.AssignedUser = { Id: context.user.id };
      }

      await this.service.updateEntity(
        'Task',
        params.taskId,
        updateFields
      );

      // TODO: Add comment creation once we understand the correct API
      // Comments need to be linked to their parent entity differently

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Started working on: "${task.Name}"`
          },
          {
            type: 'structured-data' as const,
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
          action: 'updated' as const
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'error' as const,
          text: `Failed to start working on task: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
}