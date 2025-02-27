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
  allow_informative_errors: z.boolean().optional().default(false),
});

export type GetEntityInput = z.infer<typeof getEntitySchema>;

/**
 * Handler for the get entity tool
 */
export class GetEntityTool {
  constructor(private service: TPService) {}

  async execute(args: unknown) {
    try {
      const { type, id, include, allow_informative_errors } = getEntitySchema.parse(args);

      try {
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
        // If informative errors are allowed, extract useful metadata
        if (allow_informative_errors) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Extract entity types from error messages if present
          const entityTypeMatch = errorMessage.match(/Valid entity types are: (.*)/);
          const entityTypes = entityTypeMatch && entityTypeMatch[1] 
            ? entityTypeMatch[1].split(', ') 
            : [];
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'metadata',
                  message: 'Operation failed but returned useful metadata',
                  entityTypes,
                  originalError: errorMessage
                }, null, 2),
              },
            ],
          };
        }
        
        // Otherwise, re-throw the error
        throw error;
      }
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
          allow_informative_errors: {
            type: 'boolean',
            description: 'When true, returns useful metadata even when operation fails',
            default: false
          }
        },
        required: ['type', 'id'],
      },
    } as const;
  }
}
