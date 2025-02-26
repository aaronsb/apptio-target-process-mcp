import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';

// Input schema for create entity tool
export const createEntitySchema = z.object({
  type: z.enum([
    'UserStory', 'Bug', 'Task', 'Feature', 
    'Epic', 'PortfolioEpic', 'Solution', 
    'Request', 'Impediment', 'TestCase', 'TestPlan',
    'Project', 'Team', 'Iteration', 'TeamIteration',
    'Release', 'Program'
  ]),
  name: z.string(),
  description: z.string().optional(),
  project: z.object({
    id: z.number(),
  }),
  team: z.object({
    id: z.number(),
  }).optional(),
  assignedUser: z.object({
    id: z.number(),
  }).optional(),
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;

/**
 * Handler for the create entity tool
 */
export class CreateEntityTool {
  constructor(private service: TPService) {}

  async execute(args: unknown) {
    try {
      const { type, ...data } = createEntitySchema.parse(args);

      const apiRequest = {
        Name: data.name,
        Description: data.description,
        Project: data.project ? { Id: data.project.id } : undefined,
        Team: data.team ? { Id: data.team.id } : undefined,
        AssignedUser: data.assignedUser ? { Id: data.assignedUser.id } : undefined
      };

      const result = await this.service.createEntity(
        type,
        apiRequest
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
          `Invalid create entity parameters: ${error.message}`
        );
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Create entity failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get tool definition for MCP
   */
  static getDefinition() {
    return {
      name: 'create_entity',
      description: 'Create a new Target Process entity',
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
            description: 'Type of entity to create',
          },
          name: {
            type: 'string',
            description: 'Name/title of the entity',
          },
          description: {
            type: 'string',
            description: 'Description of the entity',
          },
          project: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                description: 'Project ID',
              },
            },
            required: ['id'],
          },
          team: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                description: 'Team ID',
              },
            },
          },
          assignedUser: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                description: 'User ID to assign',
              },
            },
          },
        },
        required: ['type', 'name', 'project'],
      },
    } as const;
  }
}
