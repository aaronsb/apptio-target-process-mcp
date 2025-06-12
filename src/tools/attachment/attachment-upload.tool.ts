import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TPService } from '../../api/client/tp.service.js';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../../types/attachment.js';

// Input schema for attachment upload tool
export const attachmentUploadSchema = z.object({
  entityType: z.string().describe('Entity type (e.g., UserStory, Bug, Task)'),
  entityId: z.number().describe('Entity ID to attach the file to'),
  filename: z.string().describe('Name of the file to upload'),
  fileData: z.string().describe('Base64 encoded file data'),
  description: z.string().optional().describe('Optional description for the attachment'),
  mimeType: z.string().optional().describe('MIME type of the file (auto-detected if not provided)')
});

export type AttachmentUploadInput = z.infer<typeof attachmentUploadSchema>;

/**
 * Tool for uploading attachments to Target Process entities
 */
export class AttachmentUploadTool {
  constructor(private service: TPService) {}

  async execute(args: unknown) {
    try {
      const { entityType, entityId, filename, fileData, description, mimeType } = attachmentUploadSchema.parse(args);

      // Validate file size (approximate from base64)
      const fileSizeBytes = Math.floor((fileData.length * 3) / 4);
      if (fileSizeBytes > MAX_FILE_SIZE) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `File size (${fileSizeBytes} bytes) exceeds maximum allowed size (${MAX_FILE_SIZE} bytes)`
        );
      }      // Detect or validate MIME type
      const detectedMimeType = mimeType || this.detectMimeType(filename);
      if (!ALLOWED_MIME_TYPES.includes(detectedMimeType as any)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `File type '${detectedMimeType}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
        );
      }

      // Upload the attachment
      const result = await this.service.uploadAttachment(
        entityType,
        entityId,
        fileData,
        filename,
        description,
        detectedMimeType
      );

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `Successfully uploaded attachment "${filename}" to ${entityType} ${entityId}\n\nDetails:\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to upload attachment: ${result.message}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to upload attachment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Simple MIME type detection based on file extension
   */
  private detectMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'zip': 'application/zip'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Get tool definition for MCP
   */
  static getDefinition() {
    return {
      name: 'upload_attachment',
      description: 'Upload an attachment to a Target Process entity',
      inputSchema: {
        type: 'object',
        properties: {
          entityType: {
            type: 'string',
            description: 'Entity type (e.g., UserStory, Bug, Task)',
          },
          entityId: {
            type: 'number',
            description: 'Entity ID to attach the file to',
          },
          filename: {
            type: 'string',
            description: 'Name of the file to upload',
          },
          fileData: {
            type: 'string',
            description: 'Base64 encoded file data',
          },
          description: {
            type: 'string',
            description: 'Optional description for the attachment',
          },
          mimeType: {
            type: 'string',
            description: 'MIME type of the file (auto-detected if not provided)',
          },
        },
        required: ['entityType', 'entityId', 'filename', 'fileData'],
      },
    } as const;
  }
}
