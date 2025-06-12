import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TPService } from '../../api/client/tp.service.js';

export const attachmentAnalysisSchema = z.object({
  attachmentId: z.number().describe('ID of the attachment to analyze'),
  analysisType: z.enum(['basic', 'detailed']).optional().default('basic').describe('Type of analysis to perform')
});

export type AttachmentAnalysisInput = z.infer<typeof attachmentAnalysisSchema>;

export class AttachmentAnalysisTool {
  constructor(private service: TPService) {}

  async execute(args: unknown) {    try {
      const { attachmentId, analysisType } = attachmentAnalysisSchema.parse(args);

      const attachmentInfo = await this.service.getAttachmentInfo(attachmentId);
      const downloadResult = await this.service.downloadAttachment(attachmentId, 'base64');
      
      if (!downloadResult.base64Content) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Unable to download content for attachment ${attachmentId}.\n\nAttachment info:\n${JSON.stringify(attachmentInfo, null, 2)}`,
            },
          ],
        };      }

      const isImage = downloadResult.mimeType?.startsWith('image/') || 
                     downloadResult.filename?.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i);
      
      let analysisResult = `🔍 **Attachment Analysis Report**\n\n`;
      analysisResult += `📁 **File Information:**\n`;
      analysisResult += `- Name: ${downloadResult.filename}\n`;
      analysisResult += `- Type: ${downloadResult.mimeType}\n`;
      analysisResult += `- Size: ${downloadResult.size ? `${Math.round(downloadResult.size / 1024)} KB` : 'Unknown'}\n`;
      analysisResult += `- Upload Date: ${downloadResult.uploadDate || 'Unknown'}\n`;
      analysisResult += `- Owner: ${downloadResult.owner?.name || 'Unknown'}\n\n`;      if (isImage) {
        analysisResult += `🖼️ **Image Analysis:**\n`;
        analysisResult += `- Format: ${downloadResult.mimeType}\n`;        analysisResult += `- Content available for direct AI analysis in this chat\n`;
        
        const base64Data = downloadResult.base64Content;
        const dataUrl = `data:${downloadResult.mimeType};base64,${base64Data}`;
        
        analysisResult += `- Data URL length: ${dataUrl.length} characters\n`;
        analysisResult += `- Base64 content preview: ${base64Data.substring(0, 64)}...\n\n`;
        
        if (analysisType === 'detailed') {
          analysisResult += `🤖 **Ready for AI Vision Analysis:**\n`;
          analysisResult += `The image below can be analyzed directly by Claude's vision capabilities. The AI can:\n`;
          analysisResult += `- Describe what's shown in the image\n`;
          analysisResult += `- Extract and read text from screenshots\n`;
          analysisResult += `- Identify UI elements, forms, buttons, and interface components\n`;
          analysisResult += `- Analyze technical diagrams, charts, or workflows\n`;
          analysisResult += `- Correlate visual content with bug report: "${attachmentInfo.General?.Name || 'Unknown'}"\n\n`;
          
          analysisResult += `📊 **Image for Direct Analysis:**\n\n`;
          analysisResult += `![Attachment ${attachmentId}](${dataUrl})\n\n`;
            analysisResult += `🔍 **Claude can analyze this image directly!**\n\n`;
          analysisResult += `The image above is from Target Process Attachment ${attachmentId} and is ready for detailed analysis. You can now ask:\n`;
          analysisResult += `- "What does this image show?"\n`;
          analysisResult += `- "What UI elements are visible?"\n`;
          analysisResult += `- "What text can be read in the image?"\n`;
          analysisResult += `- "How does this relate to Bug ${attachmentInfo.General?.Id}?"\n\n`;
          analysisResult += `🎯 **Attachment Context:**\n`;
          analysisResult += `- Bug: ${attachmentInfo.General?.Name || 'Unknown'}\n`;
          analysisResult += `- File: ${downloadResult.filename}\n`;
          analysisResult += `- Size: ${downloadResult.size ? `${Math.round(downloadResult.size / 1024)} KB` : 'Unknown'}\n`;
          analysisResult += `- Upload: ${downloadResult.uploadDate || 'Unknown'}\n`;
          analysisResult += `- By: ${downloadResult.owner?.name || 'Unknown'}\n`;
        } else {
          analysisResult += `\n💡 **Image preview available:** Use analysisType='detailed' to see the image directly in chat and have it analyzed by Claude.\n`;
        }
      } else {
        analysisResult += `📄 **File Analysis:**\n`;
        analysisResult += `- This is not an image file\n`;
        analysisResult += `- Content type: ${downloadResult.mimeType}\n`;
        
        if (downloadResult.filename?.match(/\.(xlsx?|csv|txt|pdf)$/i)) {
          analysisResult += `- This appears to be a document/spreadsheet\n`;
          analysisResult += `- Specialized tools may be needed for content analysis\n`;
        }
        
        analysisResult += `\n💡 **Note:** Non-image files require specialized analysis tools.\n`;      }

      if (attachmentInfo.General) {
        analysisResult += `\n🔗 **Associated Bug/Entity:**\n`;
        analysisResult += `- ID: ${attachmentInfo.General.Id}\n`;
        analysisResult += `- Title: "${attachmentInfo.General.Name}"\n`;
        analysisResult += `- This attachment was uploaded to help document or illustrate the issue\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: analysisResult,
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid attachment analysis parameters: ${error.message}`
        );
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Attachment analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }  }

  static getDefinition() {
    return {
      name: 'analyze_attachment',
      description: 'Analyze Target Process attachments, especially images, and display them directly in chat for AI vision analysis',
      inputSchema: {
        type: 'object',
        properties: {
          attachmentId: {
            type: 'number',
            description: 'ID of the attachment to analyze',
          },
          analysisType: {
            type: 'string',
            enum: ['basic', 'detailed'],
            description: 'Type of analysis: basic (metadata only) or detailed (includes image display for direct Claude analysis)',
            default: 'basic',
          },
        },
        required: ['attachmentId'],
      },
    } as const;
  }
}
