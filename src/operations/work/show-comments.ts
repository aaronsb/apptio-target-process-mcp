import { z } from 'zod';
import { 
  SemanticOperation, 
  ExecutionContext, 
  OperationResult 
} from '../../core/interfaces/semantic-operation.interface.js';
import { TPService } from '../../api/client/tp.service.js';

const ShowCommentsParamsSchema = z.object({
  entityType: z.string().describe('Type of entity to show comments for (Task, Bug, UserStory, etc.)'),
  entityId: z.coerce.number().describe('ID of the entity to show comments for')
});

type ShowCommentsParams = z.infer<typeof ShowCommentsParamsSchema>;

/**
 * Show Comments Operation
 * 
 * Retrieves and displays all comments for a specific entity, including replies.
 * Shows comment hierarchy, IDs, authors, and timestamps for easy reference.
 */
export class ShowCommentsOperation implements SemanticOperation<ShowCommentsParams> {
  constructor(private service: TPService) {}

  metadata = {
    id: 'show-comments',
    name: 'Show Comments',
    description: 'Display all comments and replies for a specific entity with hierarchy and IDs',
    category: 'collaboration',
    requiredPersonalities: ['default', 'developer', 'tester', 'project-manager', 'product-manager'],
    examples: [
      'show-comments entityType:UserStory entityId:54356',
      'show-comments entityType:Task entityId:12345',
      'show-comments entityType:Bug entityId:67890'
    ]
  };

  async execute(context: ExecutionContext, params: ShowCommentsParams): Promise<OperationResult> {
    try {
      const validatedParams = ShowCommentsParamsSchema.parse(params);
      
      // Get comments for the entity
      const response = await this.service.getComments(
        validatedParams.entityType,
        validatedParams.entityId
      );

      if (!response?.Items || response.Items.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No comments found for ${validatedParams.entityType} ${validatedParams.entityId}`
          }],
          metadata: {
            executionTime: 0,
            apiCallsCount: 1,
            cacheHits: 0
          }
        };
      }

      // Organize comments by hierarchy
      const comments = this.organizeComments(response.Items);
      const formattedText = this.formatCommentsHierarchy(comments, validatedParams);

      return {
        content: [{
          type: 'text',
          text: formattedText
        }],
        metadata: {
          executionTime: 0,
          apiCallsCount: 1,
          cacheHits: 0
        }
      };

    } catch (error) {
      return {
        content: [{
          type: 'error',
          text: `Failed to show comments: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: {
            error: error instanceof Error ? error.message : 'Unknown error',
            params: params
          }
        }],
        metadata: {
          executionTime: 0,
          apiCallsCount: 1,
          cacheHits: 0
        }
      };
    }
  }

  /**
   * Organize comments into a hierarchy structure
   */
  private organizeComments(comments: any[]): any[] {
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.Id, { ...comment, replies: [] });
    });

    // Second pass: organize hierarchy
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.Id);
      
      if (comment.ParentId === null) {
        rootComments.push(commentWithReplies);
      } else {
        const parent = commentMap.get(comment.ParentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      }
    });

    // Sort root comments by creation date (newest first)
    return rootComments.sort((a, b) => {
      const dateA = this.parseDate(a.CreateDate);
      const dateB = this.parseDate(b.CreateDate);
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Format comments hierarchy for display
   */
  private formatCommentsHierarchy(comments: any[], params: ShowCommentsParams): string {
    const lines: string[] = [];
    const entityInfo = comments[0]?.General;
    
    lines.push(`💬 Comments for ${params.entityType} ${params.entityId}${entityInfo?.Name ? ` - ${entityInfo.Name}` : ''}`);
    lines.push('');

    if (comments.length === 0) {
      lines.push('No comments found.');
      return lines.join('\n');
    }

    comments.forEach((comment, index) => {
      this.formatComment(comment, lines, '', index === comments.length - 1);
    });

    return lines.join('\n');
  }

  /**
   * Format a single comment and its replies
   */
  private formatComment(comment: any, lines: string[], indent: string, isLast: boolean): void {
    const date = this.parseDate(comment.CreateDate);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    // Clean up description by removing HTML tags for display
    const cleanDescription = this.cleanHtmlDescription(comment.Description);
    
    // Comment header
    const prefix = indent + (isLast ? '└── ' : '├── ');
    lines.push(`${prefix}💬 Comment #${comment.Id}`);
    lines.push(`${indent}${isLast ? '    ' : '│   '}👤 ${comment.Owner?.FullName || 'Unknown'} (${comment.Owner?.Login || 'N/A'})`);
    lines.push(`${indent}${isLast ? '    ' : '│   '}🕐 ${formattedDate}`);
    
    // Comment content
    const contentLines = cleanDescription.split('\n');
    contentLines.forEach((line, lineIndex) => {
      if (line.trim()) {
        lines.push(`${indent}${isLast ? '    ' : '│   '}${lineIndex === 0 ? '📝 ' : '   '}${line.trim()}`);
      }
    });
    
    if (comment.IsPrivate) {
      lines.push(`${indent}${isLast ? '    ' : '│   '}🔒 Private comment`);
    }
    
    lines.push('');

    // Handle replies
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach((reply: any, replyIndex: number) => {
        const isLastReply = replyIndex === comment.replies.length - 1;
        const replyIndent = indent + (isLast ? '    ' : '│   ');
        this.formatComment(reply, lines, replyIndent, isLastReply);
      });
    }
  }

  /**
   * Parse TargetProcess date format
   */
  private parseDate(dateString: string): Date {
    // Parse format like "/Date(1752265210000+0200)/"
    const match = dateString.match(/\/Date\((\d+)([+-]\d{4})\)\//);
    if (match) {
      const timestamp = parseInt(match[1]);
      return new Date(timestamp);
    }
    return new Date(dateString);
  }

  /**
   * Clean HTML from description for display
   */
  private cleanHtmlDescription(description: string): string {
    return description
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#(\d+);/g, (match, code) => String.fromCharCode(code))
      .replace(/\r\n/g, '\n')
      .replace(/\n+/g, '\n')
      .trim();
  }
}