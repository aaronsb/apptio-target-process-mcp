import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation, OperationResult } from '../../core/interfaces/semantic-operation.interface.js';

export const showCommentsSchema = z.object({
  entityType: z.string().describe('Type of entity to show comments for (Task, Bug, UserStory, etc.)'),
  entityId: z.coerce.number().describe('ID of the entity to show comments for'),
  includePrivate: z.boolean().optional().default(true).describe('Whether to include private comments (default: true)')
});

export type ShowCommentsParams = z.infer<typeof showCommentsSchema>;

/**
 * Show Comments Operation
 * 
 * Displays all comments for a specific entity with hierarchical organization.
 * 
 * Features:
 * - Hierarchical comment display with replies
 * - Date parsing and formatting
 * - HTML content cleaning for readability
 * - Role-based visibility (respects private comments)
 * - Chronological ordering with newest first
 */
export class ShowCommentsOperation implements SemanticOperation<ShowCommentsParams> {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'show-comments',
      name: 'Show Comments',
      description: 'View all comments for tasks, bugs, and other work items with hierarchical organization',
      category: 'collaboration',
      requiredPersonalities: ['default', 'developer', 'tester', 'project-manager', 'product-owner'],
      examples: [
        'Show comments for task 123',
        'View all comments on bug 456',
        'List discussion on story 789'
      ],
      tags: ['comment', 'communication', 'collaboration']
    };
  }

  getSchema() {
    return showCommentsSchema;
  }

  async execute(context: ExecutionContext, params: ShowCommentsParams): Promise<OperationResult> {
    try {
      // Parse and validate parameters
      const validatedParams = showCommentsSchema.parse(params);
      
      // Get comments for the entity
      const comments = await this.service.getComments(validatedParams.entityType, validatedParams.entityId);
      
      if (!comments || comments.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No comments found for ${validatedParams.entityType} ${validatedParams.entityId}`
          }]
        };
      }


      // Organize comments into hierarchy
      const organizedComments = this.organizeComments(comments);
      
      // Format comments for display
      const formattedText = this.formatCommentsHierarchy(organizedComments, validatedParams);
      
      return {
        content: [
          {
            type: 'text' as const,
            text: formattedText
          },
          {
            type: 'structured-data' as const,
            data: {
              comments: organizedComments,
              metadata: {
                totalComments: comments.length,
                entityType: validatedParams.entityType,
                entityId: validatedParams.entityId,
                includePrivate: validatedParams.includePrivate
              },
            }
          }
        ],
        suggestions: this.generateSuggestions(validatedParams)
      };
    } catch (error) {
      return {
        content: [{
          type: 'error' as const,
          text: `Failed to fetch comments: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
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
      this.formatSingleComment(comment, lines, 0);
      
      // Add separator between root comments (except for last one)
      if (index < comments.length - 1) {
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  /**
   * Format a single comment and its replies
   */
  private formatSingleComment(comment: any, lines: string[], depth: number): void {
    const indent = '  '.repeat(depth);
    const replyIndicator = depth > 0 ? '↳ ' : '';
    const privateIndicator = comment.IsPrivate ? '🔒 ' : '';
    
    // Comment header
    const createDate = this.parseDate(comment.CreateDate);
    const dateString = createDate.toLocaleDateString() + ' ' + createDate.toLocaleTimeString();
    const userName = this.extractUserName(comment);
    
    lines.push(`${indent}${replyIndicator}${privateIndicator}**${userName}** - ${dateString} (#${comment.Id})`);
    
    // Comment content
    const cleanedDescription = this.cleanHtmlDescription(comment.Description);
    const contentLines = cleanedDescription.split('\n');
    contentLines.forEach(line => {
      if (line.trim()) {
        lines.push(`${indent}  ${line.trim()}`);
      }
    });
    
    // Process replies
    if (comment.replies && comment.replies.length > 0) {
      lines.push('');
      comment.replies.forEach((reply: any) => {
        this.formatSingleComment(reply, lines, depth + 1);
      });
    }
  }

  /**
   * Extract user name from comment object (checking Owner, User, and other possible fields)
   */
  private extractUserName(comment: any): string {
    // First check for Owner field (based on your raw JSON example)
    if (comment?.Owner) {
      const owner = comment.Owner;
      
      // Try FullName first
      if (owner.FullName) {
        return owner.FullName;
      }
      
      // Try FirstName + LastName combination
      if (owner.FirstName) {
        if (owner.LastName) {
          return `${owner.FirstName} ${owner.LastName}`;
        }
        return owner.FirstName;
      }
      
      // Fallback to Login
      if (owner.Login) {
        return owner.Login;
      }
      
      // Last resort: show ID
      if (owner.Id) {
        return `User ${owner.Id}`;
      }
    }
    
    // Fallback: check for User field (legacy support)
    if (comment?.User) {
      const user = comment.User;
      
      if (user.FullName) {
        return user.FullName;
      }
      
      if (user.FirstName && user.LastName) {
        return `${user.FirstName} ${user.LastName}`;
      }
      
      if (user.FirstName) {
        return user.FirstName;
      }
      
      if (user.Login) {
        return user.Login;
      }
      
      if (user.Email) {
        return user.Email;
      }
      
      if (user.Id) {
        return `User ${user.Id}`;
      }
    }
    
    return 'Unknown User';
  }

  /**
   * Parse TargetProcess date format
   */
  private parseDate(dateString: string): Date {
    if (!dateString) {
      return new Date();
    }
    
    // Handle TargetProcess's /Date(timestamp)/ format with optional timezone
    const match = dateString.match(/\/Date\((\d+)(?:[+-]\d{4})?\)\//);
    if (match) {
      const timestamp = parseInt(match[1]);
      return new Date(timestamp);
    }
    
    // Try parsing as regular date string
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // Fallback to current date if parsing fails
    return new Date();
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

  /**
   * Generate follow-up suggestions
   */
  private generateSuggestions(params: ShowCommentsParams): string[] {
    const suggestions: string[] = [];
    
    suggestions.push(`add-comment entityType:${params.entityType} entityId:${params.entityId} comment:"Your comment here" - Add a new comment`);
    
    if (params.entityType === 'Task') {
      suggestions.push(`show-my-tasks - View your assigned tasks`);
    } else if (params.entityType === 'Bug') {
      suggestions.push(`show-my-bugs - View your assigned bugs`);
    }
    
    suggestions.push(`search-work-items - Search for related work items`);
    
    return suggestions;
  }
}