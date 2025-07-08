import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { EntityRegistry } from '../../core/entity-registry.js';

// Input schema for create entity tool
export const createEntitySchema = z.object({
  type: z.string().describe('Entity type to create (e.g., UserStory, Bug, Task, Feature, Epic, Project, Team)'),
  name: z.string(),
  description: z.string().optional(),
  project: z.object({
    id: z.number(),
  }).optional(),  // Make project optional - we'll validate based on type later
  team: z.object({
    id: z.number(),
  }).optional(),
  assignedUser: z.object({
    id: z.number(),
  }).optional(),
}).refine(
  (data) => {
    // If creating anything other than a Project, project is required
    if (data.type !== 'Project' && !data.project) {
      return false;
    }
    return true;
  },
  {
    message: "Project ID is required for all entity types except Project"
  }
);

export type CreateEntityInput = z.infer<typeof createEntitySchema>;

/**
 * Handler for the create entity tool
 */
export class CreateEntityTool {
  constructor(private service: TPService) {}

  async execute(args: unknown) {
    try {
      const { type, ...data } = createEntitySchema.parse(args);
      
      // Validate entity type against registry
      if (!EntityRegistry.isValidEntityType(type)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid entity type: ${type}. Valid types include: ${EntityRegistry.getAllEntityTypes().slice(0, 10).join(', ')}, etc.`
        );
      }

      // Prepare API request object
      const apiRequest: any = {
        Name: data.name,
        Description: data.description,
        Team: data.team ? { Id: data.team.id } : undefined,
        AssignedUser: data.assignedUser ? { Id: data.assignedUser.id } : undefined
      };

      // Only include Project property if NOT creating a Project
      // This avoids circular reference when creating a Project
      if (type !== 'Project' && data.project) {
        apiRequest.Project = { Id: data.project.id };
      }

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
      description: 'Create a new Target Process entity. REQUIRED: All entities except Project must have a project.id. NOTE: Tasks may require a UserStory parent. OPTIONAL: team, assignedUser for work items.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Type of entity to create (e.g., UserStory, Bug, Task, Feature, Epic, Project, Team)',
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
                description: 'Project ID - REQUIRED for UserStory, Bug, Task, Feature, Epic. NOT used for Project itself.',
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
        required: ['type', 'name'],
      },
    } as const;
  }
}
