import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation, OperationResult } from '../../core/interfaces/semantic-operation.interface.js';

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

    // Add state filter - this is false by default
    if (!params.includeCompleted) {
      whereConditions.push(`EntityState.Name ne 'Done'`);
    }

    // Add project filter if specified
    if (params.projectFilter) {
      whereConditions.push(`Project.Name contains '${params.projectFilter}'`);
    }

    // Add priority filter
    if (params.priority !== 'all') {
      const priorityMap = {
        high: [1, 2],
        medium: [3],
        low: [4, 5]
      };
      const priorities = priorityMap[params.priority];
      whereConditions.push(`Priority.Id in [${priorities.join(',')}]`);
    }

    try {
      const whereClause = whereConditions.length > 0 ? whereConditions.join(' and ') : undefined;
      console.error('ShowMyTasks - User ID:', context.user.id);
      console.error('ShowMyTasks - Params:', JSON.stringify(params));
      console.error('ShowMyTasks - Where conditions:', whereConditions);
      console.error('ShowMyTasks - Where clause:', whereClause || '(none)');
      
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
      const openTasks = tasks.filter(t => t.EntityState?.Name === 'Open' || t.EntityState?.Name === 'Planned');
      if (openTasks.length > 0) {
        suggestions.push(`start-working-on ${openTasks[0].Id} - Begin work on highest priority task`);
      }

      // In-progress tasks
      const inProgress = tasks.filter(t => t.EntityState?.Name === 'In Dev');
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