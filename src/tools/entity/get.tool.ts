import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';

// Input schema for get entity tool
export const getEntitySchema = z.object({
  type: z.enum([
    'UserStory', 'Bug', 'Task', 'Feature', 
    'Epic', 'PortfolioEpic', 'Solution', 
    'Request', 'Impediment', 'TestCase', 'TestPlan',
    'Project', 'Team', 'Iteration', 'TeamIteration',
    'Release', 'Program'
  ]),
  id: z.number(),
  include: z.array(z.string()).optional(),
});

export type GetEntityInput = z.infer<typeof getEntitySchema>;

/**
 * Handler for the get entity tool
 */
export class GetEntityTool {
  constructor(private service: TPService) {}

  async execute(args: unknown) {
    try {
      const { type, id, include } = getEntitySchema.parse(args);

      const result = await this.service.getEntity(
        type,
        id,
        include
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid get entity parameters: ${error.message}`
        );
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Get entity failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get tool definition for MCP
   */
  static getDefinition() {
    return {
      name: 'get_entity',
      description: 'Get details of a specific Target Process entity',
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
            description: 'Type of entity to retrieve',
          },
          id: {
            type: 'number',
            description: 'ID of the entity',
          },
          include: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Related data to include',
          },
        },
        required: ['type', 'id'],
      },
    } as const;
  }
}
