import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';

// Input schema for search tool
export const searchToolSchema = z.object({
  type: z.enum(['UserStory', 'Bug', 'Task', 'Feature']),
  where: z.string().optional(),
  include: z.array(z.string()).optional(),
  take: z.number().min(1).max(1000).optional(),
  orderBy: z.array(z.string()).optional(),
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
      description: 'Search Target Process entities with filtering and includes',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['UserStory', 'Bug', 'Task', 'Feature'],
            description: 'Type of entity to search',
          },
          where: {
            type: 'string',
            description: 'Filter expression (Target Process query language)',
          },
          include: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Related data to include (e.g., Project, Team, AssignedUser)',
          },
          take: {
            type: 'number',
            description: 'Number of items to return (max 1000)',
            minimum: 1,
            maximum: 1000,
          },
          orderBy: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Fields to sort by (e.g., ["CreateDate desc", "Name"])',
          },
        },
        required: ['type'],
      },
    } as const;
  }
}
