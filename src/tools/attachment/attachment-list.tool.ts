import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TPService } from '../../api/client/tp.service.js';

// Input schema for attachment list tool
export const attachmentListSchema = z.object({
  entityType: z.string().describe('Entity type (e.g., UserStory, Bug, Task)'),
  entityId: z.number().describe('Entity ID to list attachments for')
});

export type AttachmentListInput = z.infer<typeof attachmentListSchema>;

/**
 * Tool for listing attachments of Target Process entities
 */
export class AttachmentListTool {
  constructor(private service: TPService) {}

  async execute(args: unknown) {
    try {
      const { entityType, entityId } = attachmentListSchema.parse(args);

      // Get attachments for the entity
      const attachments = await this.service.getAttachmentsForEntity(entityType, entityId);

      if (attachments.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No attachments found for ${entityType} ${entityId}`,
            },
          ],
        };
      }      // Format attachment list
      const attachmentList = attachments.map((attachment, index) => 
        `${index + 1}. ${attachment.Name || 'Unnamed'}\n` +
        `   ID: ${attachment.Id}\n` +
        `   Description: ${attachment.Description || 'No description'}\n` +
        `   File Size: ${attachment.Size ? `${attachment.Size} bytes` : 'Unknown'}\n` +
        `   Created: ${attachment.Date || 'Unknown'}\n` +
        `   Owner: ${attachment.Owner?.FirstName || attachment.Owner?.LastName ? 
          `${attachment.Owner.FirstName || ''} ${attachment.Owner.LastName || ''}`.trim() : 'Unknown'}`
      ).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${attachments.length} attachment(s) for ${entityType} ${entityId}:\n\n${attachmentList}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to list attachments: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get tool definition for MCP
   */
  static getDefinition() {
    return {
      name: 'list_attachments',
      description: 'List all attachments for a Target Process entity',
      inputSchema: {
        type: 'object',
        properties: {
          entityType: {
            type: 'string',
            description: 'Entity type (e.g., UserStory, Bug, Task)',
          },
          entityId: {
            type: 'number',
            description: 'Entity ID to list attachments for',
          },
        },
        required: ['entityType', 'entityId'],
      },
    } as const;
  }
}
