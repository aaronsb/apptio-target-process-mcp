import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation, OperationResult } from '../../core/interfaces/semantic-operation.interface.js';
import { logger } from '../../utils/logger.js';

export const showMyTasksSchema = z.object({
  includeCompleted: z.boolean().optional().default(false),
  projectFilter: z.string().optional(),
  priority: z.enum(['all', 'high', 'medium', 'low']).optional().default('all'),
  limit: z.number().optional().default(20)
});

export type ShowMyTasksParams = z.infer<typeof showMyTasksSchema>;

/**
 * Semantic operation: show-my-tasks
 * 
 * This operation retrieves tasks assigned to the current user,
 * with smart filtering based on context and user preferences.
 */
export class ShowMyTasksOperation implements SemanticOperation<ShowMyTasksParams> {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'show-my-tasks',
      name: 'Show My Tasks',
      description: 'View tasks assigned to you with smart filtering',
      category: 'task-management',
      requiredPersonalities: ['developer', 'tester', 'project-manager', 'administrator'],
      examples: [
        'Show my tasks',
        'What am I working on?',
        'Show my high priority tasks',
        'List my tasks in Project Alpha'
      ],
      tags: ['task', 'personal', 'workflow']
    };
  }

  getSchema() {
    return showMyTasksSchema;
  }

  async execute(context: ExecutionContext, params: ShowMyTasksParams): Promise<OperationResult> {
    // Build the where clause based on context and parameters
    const whereConditions: string[] = [];
    
    // For now, let's get all tasks and filter in code
    // TODO: Find correct syntax for AssignedUser filtering

    // Add state filter - discover final states dynamically
    if (!params.includeCompleted) {
      try {
        const finalStates = await this.service.searchEntities(
          'EntityState',
          `(EntityType.Name eq 'Task') and (IsFinal eq true)`,
          ['EntityType', 'IsFinal'],
          10
        );
        
        if (finalStates.length > 0) {
          const finalStateNames = finalStates.map((s: any) => s.Name);
          finalStateNames.forEach(stateName => {
            whereConditions.push(`EntityState.Name ne '${stateName}'`);
          });
        } else {
          // Fallback to common completed state if discovery fails
          whereConditions.push(`EntityState.Name ne 'Done'`);
        }
      } catch (stateError) {
        // Fallback to common completed state if discovery fails
        logger.warn('Failed to discover final states:', stateError);
        whereConditions.push(`EntityState.Name ne 'Done'`);
      }
    }

    // Add project filter if specified
    if (params.projectFilter) {
      whereConditions.push(`Project.Name contains '${params.projectFilter}'`);
    }

    // Add priority filter - discover available priorities dynamically
    if (params.priority !== 'all') {
      try {
        const priorities = await this.service.searchEntities(
          'Priority',
          undefined,
          ['Name', 'Importance'],
          20
        );
        
        // Group priorities by user's filter preference based on Importance
        let targetPriorities: string[] = [];
        if (params.priority === 'high') {
          // Find highest importance (usually lowest number)
          const sortedByImportance = priorities.sort((a: any, b: any) => 
            (a.Importance || 999) - (b.Importance || 999)
          );
          targetPriorities = sortedByImportance.slice(0, 2).map((p: any) => p.Name);
        } else if (params.priority === 'medium') {
          // Find middle importance levels
          const sortedByImportance = priorities.sort((a: any, b: any) => 
            (a.Importance || 999) - (b.Importance || 999)
          );
          const midIndex = Math.floor(sortedByImportance.length / 2);
          targetPriorities = sortedByImportance.slice(midIndex, midIndex + 1).map((p: any) => p.Name);
        } else if (params.priority === 'low') {
          // Find lower importance levels
          const sortedByImportance = priorities.sort((a: any, b: any) => 
            (a.Importance || 999) - (b.Importance || 999)
          );
          targetPriorities = sortedByImportance.slice(-2).map((p: any) => p.Name);
        }
        
        if (targetPriorities.length > 0) {
          whereConditions.push(`Priority.Name in ['${targetPriorities.join("','")}']`);
        }
      } catch (priorityError) {
        // If priority discovery fails, continue without priority filter
        logger.warn('Failed to discover priorities:', priorityError);
      }
    }

    try {
      const whereClause = whereConditions.length > 0 ? whereConditions.join(' and ') : undefined;
      logger.error('ShowMyTasks - User ID:', context.user.id);
      logger.error('ShowMyTasks - Params:', JSON.stringify(params));
      logger.error('ShowMyTasks - Where conditions:', whereConditions);
      logger.error('ShowMyTasks - Where clause:', whereClause || '(none)');
      
      // Search for tasks
      const allTasks = await this.service.searchEntities(
        'Task',
        whereClause, // Already undefined if no conditions
        ['Project', 'Priority', 'Iteration', 'EntityState', 'Tags', 'AssignedUser'],
        params.limit * 10 // Get more to filter
        // TODO: Fix orderBy parameter format
      );
      
      // Filter for assigned user in code
      const tasks = allTasks.filter((task: any) => {
        const assignedUsers = task.AssignedUser?.Items || [];
        return assignedUsers.some((user: any) => user.Id === context.user.id);
      }).slice(0, params.limit);

      // Generate summary
      const summary = this.generateSummary(tasks, params);

      return {
        content: [
          {
            type: 'text' as const,
            text: summary
          },
          {
            type: 'structured-data' as const,
            data: {
              tasks,
              metadata: {
                totalItems: tasks.length,
                filters: params
              }
            }
          }
        ],
        suggestions: this.generateSuggestions(tasks)
      };
    } catch (error) {
      return {
        content: [{
          type: 'error' as const,
          text: `Failed to fetch tasks: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private generateSummary(tasks: any[], params: ShowMyTasksParams): string {
    if (tasks.length === 0) {
      return params.includeCompleted 
        ? "You don't have any tasks assigned."
        : "You don't have any active tasks assigned. Great job staying on top of things!";
    }

    const parts: string[] = [];
    parts.push(`You have ${tasks.length} ${params.includeCompleted ? '' : 'active '}tasks assigned:`);
    
    // State breakdown
    const byState = tasks.reduce((acc, task) => {
      const state = task.EntityState?.Name || 'Unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(byState).forEach(([state, count]) => {
      parts.push(`- ${count} ${state}`);
    });

    return parts.join('\n');
  }

  private generateSuggestions(tasks: any[]): string[] {
    const suggestions: string[] = [];
    
    if (tasks.length === 0) {
      // No tasks - suggest discovery
      suggestions.push('search_entities type:Task - Find available tasks');
      suggestions.push('show-my-bugs - Check for bugs instead');
      suggestions.push('inspect_object type:Task - Learn about task properties');
    } else {
      // Have tasks - suggest actions
      const openTasks = tasks.filter(t => t.EntityState?.IsInitial || (!t.EntityState?.IsFinal && !t.EntityState?.IsInitial));
      if (openTasks.length > 0) {
        suggestions.push(`start-working-on ${openTasks[0].Id} - Begin work on highest priority task`);
      }

      // In-progress tasks (not initial, not final)
      const inProgress = tasks.filter(t => !t.EntityState?.IsInitial && !t.EntityState?.IsFinal);
      if (inProgress.length > 0) {
        suggestions.push('update-progress - Update task progress');
        suggestions.push('log-time - Record time spent');
      }

      // Discovery suggestions
      suggestions.push('search_entities type:EntityState where:EntityType.Name=="Task" - See all task states');
    }

    return suggestions;
  }
}