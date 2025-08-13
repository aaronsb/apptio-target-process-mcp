import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { searchPresets, applyPresetFilter } from './presets.js';

/**
 * Search tool for Target Process entities
 * 
 * Common usage examples:
 * 1. Basic search (returns all items of a type):
 *    search_entities({ type: "UserStory" })
 * 
 * 2. Using preset filters:
 *    search_entities({ 
 *      type: "Bug", 
 *      where: searchPresets.open 
 *    })
 * 
 * 3. Using date-based filters:
 *    search_entities({
 *      type: "Task",
 *      where: searchPresets.createdToday
 *    })
 * 
 * 4. Using variables in filters:
 *    search_entities({
 *      type: "UserStory",
 *      where: applyPresetFilter("myTasks", { currentUser: "john@example.com" })
 *    })
 * 
 * 5. Including related data:
 *    search_entities({
 *      type: "Bug",
 *      where: searchPresets.open,
 *      include: ["Project", "AssignedUser"]
 *    })
 */

export const searchToolSchema = z.object({
  type: z.string().describe('Entity type to search for (e.g., UserStory, Bug, Task, Feature, Epic, Project, Team, etc.)'),
  where: z.string().optional().describe('Filter expression using TargetProcess query language.\n\nPreset filters: searchPresets.open, .notDone, .myOpenTasks, .activeItems, etc.\n\nQuery syntax:\n- Use "eq" for equals: EntityState.Name eq "Open"\n- Use "ne" for not equals: EntityState.Name ne "Done"\n- Use "and"/"or": Priority.Name eq "High" and EntityState.Name ne "Done"\n- Date macros: CreateDate gt @Today\n\nExample: searchPresets.activeItems or "EntityState.Name ne \'Done\'"'),
  include: z.array(z.string()).optional().describe('Related data to include (e.g., Project, Team, AssignedUser)'),
  take: z.number().min(1).max(1000).optional().describe('Number of items to return (default: 100)'),
  orderBy: z.array(z.string()).optional().describe('Fields to sort by - field names only (e.g., ["CreateDate", "Name"]). Note: TargetProcess API does not support direction keywords like "desc" or "asc".'),
});

export type SearchToolInput = z.infer<typeof searchToolSchema>;

/**
 * Handler for the search entities tool
 */
export class SearchTool {
  constructor(private service: TPService) {}

  /**
   * Get date values for filter substitution
   */
  private getDateValues() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get start of week (Monday)
    const weekStart = new Date(today);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + daysToMonday);
    
    return {
      todayDate: `'${today.toISOString().split('T')[0]}'`,
      tomorrowDate: `'${tomorrow.toISOString().split('T')[0]}'`,
      weekStartDate: `'${weekStart.toISOString().split('T')[0]}'`
    };
  }

  /**
   * Process orderBy to handle various input formats
   * Converts to single field or array format based on what's provided
   */
  private processOrderBy(orderBy?: string[]): string[] | undefined {
    if (!orderBy || orderBy.length === 0) {
      return undefined;
    }

    // If only one field, return as-is (TargetProcess handles single fields well)
    if (orderBy.length === 1) {
      // Strip any desc/asc keywords
      const field = orderBy[0].replace(/\s+(desc|asc)$/i, '').trim();
      return [field];
    }

    // For multiple fields, we'll need special handling in the query builder
    // Just clean them up here
    return orderBy.map(field => field.replace(/\s+(desc|asc)$/i, '').trim());
  }

  async execute(args: unknown) {
    try {
      const { type, where, include, take, orderBy } = searchToolSchema.parse(args);

      // Process search presets if used
      let processedWhere = where;
      if (where && where.startsWith('searchPresets.')) {
        const presetName = where.replace('searchPresets.', '') as keyof typeof searchPresets;
        if (presetName in searchPresets) {
          processedWhere = searchPresets[presetName];
          
          // Apply variable substitution
          const dateValues = this.getDateValues();
          
          // Replace date variables
          for (const [key, value] of Object.entries(dateValues)) {
            processedWhere = processedWhere.replace(`\${${key}}`, value);
          }
          
          // Replace user variable (should be enhanced with actual user context)
          if (processedWhere.includes('${currentUser}')) {
            // TODO: Get actual user email from context
            processedWhere = processedWhere.replace('${currentUser}', 'system');
          }
        } else {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Unknown search preset: ${presetName}. Available presets: ${Object.keys(searchPresets).join(', ')}`
          );
        }
      }

      // Process orderBy for compatibility
      const processedOrderBy = this.processOrderBy(orderBy);

      const results = await this.service.searchEntities(
        type,
        processedWhere,
        include,
        take,
        processedOrderBy
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid search parameters: ${error.message}`
        );
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Search failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get tool definition for MCP
   */
  static getDefinition() {
    return {
      name: 'search_entities',
      description: 'Search Target Process entities with powerful filtering capabilities and preset filters for common scenarios. Common usage patterns: basic search by type only, preset filters for status/assignments, simple field-only sorting.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Type of entity to search (e.g., UserStory, Bug, Task, Feature, Epic, Project, Team)',
          },
          where: {
            type: 'string',
            description: `Filter expression using Target Process query language. Common preset filters available:
- Status filters: searchPresets.open, .inProgress, .done
- Assignment filters: searchPresets.myTasks, .unassigned  
- Time-based filters: searchPresets.createdToday, .modifiedToday, .createdThisWeek
- Priority filters: searchPresets.highPriority
- Combined filters: searchPresets.myOpenTasks, .highPriorityUnassigned

Example: searchPresets.open or "EntityState.Name eq 'Open'"`,
          },
          include: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Related data to include in results. Common reliable options: ["Project", "AssignedUser", "EntityState", "Priority"]. AVOID: Complex nested includes that may cause errors.',
          },
          take: {
            type: 'number',
            description: 'Number of items to return (default: 100)',
            minimum: 1,
            maximum: 1000,
          },
          orderBy: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Fields to sort by - field names only (e.g., ["CreateDate", "Name"]). TargetProcess API does not support "desc" or "asc" keywords.',
          },
        },
        required: ['type'],
      },
    } as const;
  }
}
