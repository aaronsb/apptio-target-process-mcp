import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TPService } from '../../api/client/tp.service.js';

// Input schema for attachment download tool
export const attachmentDownloadSchema = z.object({
  attachmentId: z.number().describe('ID of the attachment to download'),
  responseFormat: z.enum(['url', 'info', 'base64']).optional().default('url').describe('Response format: url (download link), info (metadata), or base64 (encoded content)')
});

export type AttachmentDownloadInput = z.infer<typeof attachmentDownloadSchema>;

/**
 * Tool for downloading Target Process attachments
 */
export class AttachmentDownloadTool {
  constructor(private service: TPService) {}
  async execute(args: unknown) {
    try {
      const { attachmentId, responseFormat } = attachmentDownloadSchema.parse(args);

      if (responseFormat === 'info') {
        // Return attachment metadata only
        const attachmentInfo = await this.service.getAttachmentInfo(attachmentId);
        return {
          content: [
            {
              type: 'text',
              text: `Attachment Information:\n\n${JSON.stringify(attachmentInfo, null, 2)}`,
            },
          ],
        };
      } else if (responseFormat === 'base64') {
        // Download the actual file content as base64
        const result = await this.service.downloadAttachment(attachmentId, 'base64');
        
        if (result.base64Content) {
          // Determine if it's an image for basic analysis
          const isImage = result.mimeType?.startsWith('image/') || 
                         result.filename?.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i);
          
          let analysisText = `Attachment downloaded successfully:\n\n`;
          analysisText += `📁 Filename: ${result.filename}\n`;
          analysisText += `🔧 MIME Type: ${result.mimeType}\n`;
          analysisText += `📏 Size: ${result.size ? `${Math.round(result.size / 1024)} KB (${result.size} bytes)` : 'Unknown'}\n`;
          analysisText += `📅 Upload Date: ${result.uploadDate || 'Unknown'}\n`;
          analysisText += `👤 Owner: ${result.owner?.name || 'Unknown'}\n`;
          analysisText += `📂 Content Type: ${isImage ? '🖼️ Image' : '📄 File'}\n\n`;
          
          if (isImage) {
            analysisText += `🖼️ **Image Content Analysis Available:**\n`;
            analysisText += `- This is a ${result.mimeType} image file\n`;
            analysisText += `- Base64 data length: ${result.base64Content.length} characters\n`;
            analysisText += `- Preview: data:${result.mimeType};base64,${result.base64Content.substring(0, 100)}...\n\n`;
            analysisText += `💡 **Note:** You can now use image analysis tools to describe what's shown in this image.\n`;
            analysisText += `The full base64 data is available for AI image analysis.`;
          } else {
            analysisText += `📄 **File Content Downloaded:**\n`;
            analysisText += `- Base64 encoded content is available\n`;
            analysisText += `- Content length: ${result.base64Content.length} characters\n`;
            analysisText += `- File analysis depends on the specific file type\n\n`;
            analysisText += `💡 **Note:** Non-image files require specialized tools for content analysis.`;
          }
          
          return {
            content: [
              {
                type: 'text',
                text: analysisText,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to download attachment content.\n\nOnly metadata is available:\n\n${JSON.stringify(result, null, 2)}`,
              },
            ],
          };
        }
      } else {
        // Default: return download URL
        const result = await this.service.downloadAttachment(attachmentId, 'url');
        return {
          content: [
            {
              type: 'text',
              text: `🔗 Attachment Download URL:\n\n${result.downloadUrl}\n\n📁 Filename: ${result.filename}\n📏 Size: ${result.size ? `${Math.round(result.size / 1024)} KB (${result.size} bytes)` : 'Unknown'}\n🔧 MIME Type: ${result.mimeType || 'Unknown'}\n📅 Upload Date: ${result.uploadDate || 'Unknown'}\n👤 Owner: ${result.owner?.name || 'Unknown'}\n\n💡 **Note:** This URL can be used to download the attachment directly.`,
            },
          ],
        };
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to download attachment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  /**
   * Get tool definition for MCP
   */
  static getDefinition() {
    return {
      name: 'download_attachment',
      description: 'Download or get information about a Target Process attachment with optional content analysis',
      inputSchema: {
        type: 'object',
        properties: {
          attachmentId: {
            type: 'number',
            description: 'ID of the attachment to download',
          },
          responseFormat: {
            type: 'string',
            enum: ['url', 'info', 'base64'],
            description: 'Response format: url (download link), info (metadata only), or base64 (download content for analysis)',
            default: 'url',
          },
        },
        required: ['attachmentId'],
      },
    } as const;
  }
}
