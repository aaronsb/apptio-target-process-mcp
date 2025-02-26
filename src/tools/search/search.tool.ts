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
  type: z.enum([
    'UserStory', 'Bug', 'Task', 'Feature', 
    'Epic', 'PortfolioEpic', 'Solution', 
    'Request', 'Impediment', 'TestCase', 'TestPlan',
    'Project', 'Team', 'Iteration', 'TeamIteration',
    'Release', 'Program'
  ]),
  where: z.string().optional().describe('Filter expression or use searchPresets for common filters'),
  include: z.array(z.string()).optional().describe('Related data to include (e.g., Project, Team, AssignedUser)'),
  take: z.number().min(1).max(1000).optional().describe('Number of items to return (default: 100)'),
  orderBy: z.array(z.string()).optional().describe('Fields to sort by (e.g., ["CreateDate desc"])'),
});

export type SearchToolInput = z.infer<typeof searchToolSchema>;

/**
 * Handler for the search entities tool
 */
export class SearchTool {
  constructor(private service: TPService) {}

  async execute(args: unknown) {
    try {
      const { type, where, include, take, orderBy } = searchToolSchema.parse(args);

      const results = await this.service.searchEntities(
        type,
        where,
        include,
        take,
        orderBy
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
      description: 'Search Target Process entities with powerful filtering capabilities and preset filters for common scenarios',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'UserStory', 'Bug', 'Task', 'Feature', 
              'Epic', 'PortfolioEpic', 'Solution', 
              'Request', 'Impediment', 'TestCase', 'TestPlan',
              'Project', 'Team', 'Iteration', 'TeamIteration',
              'Release', 'Program'
            ],
            description: 'Type of entity to search',
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
            description: 'Related data to include in results (e.g., ["Project", "Team", "AssignedUser"])',
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
            description: 'Sort order for results (e.g., ["CreateDate desc", "Name asc"])',
          },
        },
        required: ['type'],
      },
    } as const;
  }
}
