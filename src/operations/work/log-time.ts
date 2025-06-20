import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation, OperationResult } from '../../core/interfaces/semantic-operation.interface.js';
import { logger } from '../../utils/logger.js';

const logTimeSchema = z.object({
  entityId: z.number().describe('ID of the task or bug to log time against'),
  entityType: z.enum(['Task', 'Bug', 'UserStory']).optional().default('Task').describe('Type of entity'),
  spent: z.number().min(0.1).max(24).describe('Hours spent (0.1 to 24 hours)'),
  description: z.string().optional().describe('Optional description of work done'),
  date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to today)')
});

type LogTimeParams = z.infer<typeof logTimeSchema>;

/**
 * Log Time Operation
 * Records time spent on tasks, bugs, or user stories with smart defaults
 */
export class LogTimeOperation implements SemanticOperation<LogTimeParams> {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'log-time',
      name: 'Log Time',
      description: 'Record time spent on tasks, bugs, or user stories',
      category: 'time-management',
      requiredPersonalities: ['developer', 'tester', 'project-manager', 'administrator'],
      examples: [
        'Log 2 hours on task 1234',
        'Record 0.5 hours for bug investigation',
        'Log time with description of work done',
        'Log 4 hours on user story'
      ],
      tags: ['time', 'tracking', 'productivity']
    };
  }

  getSchema() {
    return logTimeSchema;
  }

  async execute(context: ExecutionContext, params: LogTimeParams): Promise<OperationResult> {
    try {
      // First, validate that the entity exists and user has access
      const entity = await this.service.getEntity(
        params.entityType,
        params.entityId,
        ['Name', 'Project', 'AssignedUser', 'EntityState']
      ) as any;

      if (!entity) {
        return {
          content: [{
            type: 'error' as const,
            text: `${params.entityType} ${params.entityId} not found`
          }]
        };
      }

      // Check if user is assigned (optional validation)
      const assignedUsers = entity.AssignedUser?.Items || [];
      const isAssigned = assignedUsers.some((user: any) => user.Id === context.user.id);
      
      if (!isAssigned) {
        // Warn but don't prevent - user might be helping or have permission
        logger.warn(`User ${context.user.id} logging time on unassigned ${params.entityType} ${params.entityId}`);
      }

      // Prepare time entry data
      const timeEntryData: any = {
        Name: `Time entry for ${params.entityType} ${params.entityId}`,
        Description: params.description || `Work on ${entity.Name}`,
        Spent: params.spent,
        User: { Id: context.user.id },
        Assignable: { Id: params.entityId }
      };

      // Add date if provided
      if (params.date) {
        try {
          const date = new Date(params.date);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
          }
          timeEntryData.Date = `/Date(${date.getTime()})/`;
        } catch (dateError) {
          return {
            content: [{
              type: 'error' as const,
              text: `Invalid date format: ${params.date}. Use YYYY-MM-DD format.`
            }]
          };
        }
      }

      // Create the time entry - try different time tracking approaches
      let timeEntry: any;
      let timeEntityType = 'Time';
      
      try {
        timeEntry = await this.service.createEntity('Time', timeEntryData);
      } catch (timeError) {
        // If 'Time' fails, try 'TimeRecord' (common in customized instances)
        try {
          timeEntityType = 'TimeRecord';
          timeEntry = await this.service.createEntity('TimeRecord', timeEntryData);
        } catch (timeRecordError) {
          // If both fail, provide semantic guidance
          return {
            content: [{
              type: 'text',
              text: `💡 **Time Logging Discovery**: Neither 'Time' nor 'TimeRecord' entities are available for time tracking in this TargetProcess instance.`
            }, {
              type: 'text',
              text: `🔍 **Smart Suggestions:**\n• This instance may use a different time tracking method\n• Try: \`search_entities type:TimeSheet\` to check for timesheet entities\n• Check if time is logged differently via the web interface\n• Use \`inspect_object\` to explore available entity types\n\n**Debug Info:**\n• Time entity error: ${timeError instanceof Error ? timeError.message : String(timeError)}\n• TimeRecord entity error: ${timeRecordError instanceof Error ? timeRecordError.message : String(timeRecordError)}`
            }],
            suggestions: [
              'search_entities type:CustomActivity - Check for custom time tracking entities',
              'inspect_object action:list_types - See all available entity types',
              'get_entity type:Task id:' + params.entityId + ' - Check if time can be added to the task directly'
            ],
            metadata: {
              executionTime: 0,
              apiCallsCount: 3,
              cacheHits: 0
            }
          };
        }
      }

      // Get user's recent time entries for context using the discovered entity type
      const recentTimeEntries = await this.service.searchEntities(
        timeEntityType,
        `User.Id eq ${context.user.id}`,
        ['Assignable', 'Spent'],
        5
      ).catch(() => []);

      const todaysTotal = this.calculateTodaysTotal(recentTimeEntries);
      const weeklyTotal = this.calculateWeeklyTotal(recentTimeEntries);

      return {
        content: [
          {
            type: 'text' as const,
            text: this.formatTimeLogResult(entity, params, todaysTotal, weeklyTotal)
          },
          {
            type: 'structured-data' as const,
            data: {
              timeEntry: {
                id: (timeEntry as any).Id,
                entityId: params.entityId,
                entityType: params.entityType,
                entityName: entity.Name,
                spent: params.spent,
                description: params.description,
                date: params.date || new Date().toISOString().split('T')[0]
              },
              timeStats: {
                todaysTotal,
                weeklyTotal,
                thisEntry: params.spent
              }
            }
          }
        ],
        suggestions: this.generateTimeSuggestions(params, entity, todaysTotal),
        affectedEntities: [{
          id: params.entityId,
          type: params.entityType,
          action: 'updated' as const
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'error' as const,
          text: `Failed to log time: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private formatTimeLogResult(entity: any, params: LogTimeParams, todaysTotal: number, weeklyTotal: number): string {
    const parts: string[] = [];
    
    parts.push(`⏱️ **Logged ${params.spent} hours** on ${params.entityType.toLowerCase()}: "${entity.Name}"`);
    
    if (params.description) {
      parts.push(`📝 Work done: ${params.description}`);
    }
    
    parts.push(`\n📊 **Time Summary:**`);
    parts.push(`• This entry: ${params.spent}h`);
    parts.push(`• Today's total: ${todaysTotal.toFixed(1)}h`);
    parts.push(`• This week: ${weeklyTotal.toFixed(1)}h`);
    
    return parts.join('\n');
  }

  private calculateTodaysTotal(timeEntries: any[]): number {
    const today = new Date().toDateString();
    return timeEntries
      .filter(entry => {
        if (!entry.Date) return false;
        const entryDate = new Date(parseInt(entry.Date.match(/\d+/)[0]));
        return entryDate.toDateString() === today;
      })
      .reduce((total, entry) => total + (entry.Spent || 0), 0);
  }

  private calculateWeeklyTotal(timeEntries: any[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return timeEntries
      .filter(entry => {
        if (!entry.Date) return false;
        const entryDate = new Date(parseInt(entry.Date.match(/\d+/)[0]));
        return entryDate >= oneWeekAgo;
      })
      .reduce((total, entry) => total + (entry.Spent || 0), 0);
  }

  private generateTimeSuggestions(params: LogTimeParams, entity: any, todaysTotal: number): string[] {
    const suggestions: string[] = [];
    
    // Workflow suggestions based on time logged
    if (params.entityType === 'Task') {
      suggestions.push('complete-task - Mark task as done if work is finished');
      suggestions.push('update-progress - Update task progress');
    }
    
    // Time tracking suggestions
    suggestions.push('show-time-spent - Review your time tracking');
    
    // Work suggestions based on today's total
    if (todaysTotal >= 8) {
      suggestions.push('show-my-tasks - Check if you have remaining priority work');
    } else {
      suggestions.push('show-my-tasks - Find next task to work on');
    }
    
    // Project context
    if (entity.Project) {
      suggestions.push(`search_entities type:Time where:Assignable.Project.Id==${entity.Project.Id} - See project time tracking`);
    }
    
    return suggestions;
  }
}