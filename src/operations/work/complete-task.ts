import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation, OperationResult } from '../../core/interfaces/semantic-operation.interface.js';
import { logger } from '../../utils/logger.js';

const completeTaskSchema = z.object({
  taskId: z.number().describe('ID of the task to complete'),
  timeSpent: z.number().optional().describe('Hours spent on this task (optional)'),
  summary: z.string().optional().describe('Optional completion summary or notes')
});

type CompleteTaskParams = z.infer<typeof completeTaskSchema>;

/**
 * Complete Task Operation
 * Moves task to final state, optionally logs time, and suggests next actions
 */
export class CompleteTaskOperation implements SemanticOperation<CompleteTaskParams> {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'complete-task',
      name: 'Complete Task',
      description: 'Mark a task as completed and handle workflow transitions',
      category: 'task-workflow',
      requiredPersonalities: ['developer', 'tester', 'administrator'],
      examples: [
        'Complete task 1234',
        'Mark this task as done',
        'Finish task with 3 hours logged',
        'Complete task with summary'
      ],
      tags: ['task', 'completion', 'workflow', 'time']
    };
  }

  getSchema() {
    return completeTaskSchema;
  }

  async execute(context: ExecutionContext, params: CompleteTaskParams): Promise<OperationResult> {
    try {
      // First, get the current task to validate and gather context
      const task = await this.service.getEntity(
        'Task',
        params.taskId,
        ['EntityState', 'AssignedUser', 'Project', 'Priority', 'Name']
      ) as any;

      if (!task) {
        return {
          content: [{
            type: 'error' as const,
            text: `Task ${params.taskId} not found`
          }]
        };
      }

      // Check if task is already completed
      if (task.EntityState?.IsFinal) {
        return {
          content: [{
            type: 'text' as const,
            text: `Task "${task.Name}" is already completed (${task.EntityState.Name})`
          }]
        };
      }

      // Find the completion state (IsFinal = true)
      const completionStates = await this.service.searchEntities(
        'EntityState',
        `(EntityType.Name eq 'Task') and (IsFinal eq true)`,
        ['EntityType', 'IsFinal'],
        10
      );

      if (completionStates.length === 0) {
        return {
          content: [{
            type: 'error' as const,
            text: 'Could not find a completion state for tasks. Use search_entities to see available states.'
          }]
        };
      }

      const doneState = completionStates[0] as any;

      // Update the task to completed state
      await this.service.updateEntity(
        'Task',
        params.taskId,
        { EntityState: { Id: doneState.Id } }
      );

      // Log time if provided
      let timeLoggedMessage = '';
      if (params.timeSpent && params.timeSpent > 0) {
        try {
          // Create a time entry
          await this.service.createEntity(
            'Time',
            {
              Name: `Time logged for task completion`,
              Description: params.summary || 'Task completion time',
              Spent: params.timeSpent,
              User: { Id: context.user.id },
              Assignable: { Id: params.taskId }
            }
          );
          timeLoggedMessage = `\n⏱️ Logged ${params.timeSpent} hours`;
        } catch (timeError) {
          // Don't fail the whole operation if time logging fails
          timeLoggedMessage = `\n⚠️ Task completed but time logging failed: ${timeError instanceof Error ? timeError.message : String(timeError)}`;
        }
      }

      // Add completion comment if summary provided
      if (params.summary) {
        try {
          await this.service.createEntity(
            'Comment',
            {
              Name: 'Task Completion',
              Description: `Task completed: ${params.summary}`,
              General: { Id: params.taskId }
            }
          );
        } catch (commentError) {
          // Don't fail if comment creation fails
          logger.error('Failed to add completion comment:', commentError);
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Completed task: "${task.Name}"${timeLoggedMessage}${params.summary ? `\n📝 Summary: ${params.summary}` : ''}`
          },
          {
            type: 'structured-data' as const,
            data: {
              completedTask: {
                id: task.Id,
                name: task.Name,
                project: task.Project?.Name,
                previousState: task.EntityState?.Name,
                newState: doneState.Name,
                timeLogged: params.timeSpent || 0,
                summary: params.summary
              }
            }
          }
        ],
        suggestions: this.generateCompletionSuggestions(task, context),
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
          text: `Failed to complete task: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private generateCompletionSuggestions(completedTask: any, context: ExecutionContext): string[] {
    const suggestions: string[] = [];
    
    // Always suggest checking for more work
    suggestions.push('show-my-tasks - Check for next task to work on');
    
    // If no time was logged, suggest reviewing time
    suggestions.push('show-time-spent - Review time tracking');
    
    // Check for related work
    if (completedTask.Project) {
      suggestions.push(`search_entities type:Task where:Project.Id==${completedTask.Project.Id} - Find related tasks in ${completedTask.Project.Name}`);
    }
    
    // Bug workflow suggestions
    suggestions.push('show-my-bugs - Check for bugs to work on');
    
    // Suggest documenting or reviewing
    suggestions.push('add-comment - Add any final notes or documentation');
    
    return suggestions;
  }
}