import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { EntityRegistry } from '../../core/entity-registry.js';

// Input schema for update entity tool
export const updateEntitySchema = z.object({
  type: z.string().describe('Entity type to update (e.g., UserStory, Bug, Task, Feature, Epic, Project, Team)'),
  id: z.number(),
  fields: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.object({
      id: z.number(),
    }).optional(),
    assignedUser: z.object({
      id: z.number(),
    }).optional(),
  }),
});

export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;

/**
 * Handler for the update entity tool
 */
export class UpdateEntityTool {
  constructor(private service: TPService) {}

  async execute(args: unknown) {
    try {
      const { type, id, fields } = updateEntitySchema.parse(args);

      const apiRequest = {
        Name: fields.name,
        Description: fields.description,
        EntityState: fields.status ? { Id: fields.status.id } : undefined,
        AssignedUser: fields.assignedUser ? { Id: fields.assignedUser.id } : undefined
      };

      const result = await this.service.updateEntity(
        type,
        id,
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
          `Invalid update entity parameters: ${error.message}`
        );
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Update entity failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get tool definition for MCP
   */
  static getDefinition() {
    return {
      name: 'update_entity',
      description: 'Update an existing Target Process entity',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Type of entity to update (e.g., UserStory, Bug, Task, Feature, Epic, Project, Team)',
          },
          id: {
            type: 'number',
            description: 'ID of the entity to update',
          },
          fields: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'New name for the entity',
              },
              description: {
                type: 'string',
                description: 'New description for the entity',
              },
              status: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                    description: 'Status ID to set',
                  },
                },
                required: ['id'],
              },
              assignedUser: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                    description: 'User ID to assign',
                  },
                },
                required: ['id'],
              },
            },
          },
        },
        required: ['type', 'id', 'fields'],
      },
    } as const;
  }
}
