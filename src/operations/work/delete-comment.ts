import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation, OperationResult } from '../../core/interfaces/semantic-operation.interface.js';

export const deleteCommentSchema = z.object({
  commentId: z.coerce.number().describe('ID of the comment to delete')
});

export type DeleteCommentParams = z.infer<typeof deleteCommentSchema>;

/**
 * Delete Comment Operation
 * 
 * Safely deletes comments with ownership validation and context awareness.
 * 
 * Features:
 * - Ownership validation and warnings
 * - Context fetching to show what's being deleted
 * - Safe deletion with proper error handling
 * - Follow-up suggestions for next actions
 */
export class DeleteCommentOperation implements SemanticOperation<DeleteCommentParams> {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'delete-comment',
      name: 'Delete Comment',
      description: 'Delete comments with ownership validation and safety features',
      category: 'collaboration',
      requiredPersonalities: ['default', 'developer', 'tester', 'project-manager', 'product-owner'],
      examples: [
        'Delete comment 12345',
        'Remove comment 67890'
      ],
      tags: ['comment', 'communication', 'collaboration']
    };
  }

  getSchema() {
    return deleteCommentSchema;
  }

  async execute(context: ExecutionContext, params: DeleteCommentParams): Promise<OperationResult> {
    try {
      const validatedParams = deleteCommentSchema.parse(params);
      
      // Get comment context for user experience
      const commentContext = await this.getCommentContext(validatedParams.commentId);
      const warningMessage = this.buildWarningMessage(commentContext, context.user.id);
      
      // Perform deletion
      const deleteResult = await this.service.deleteComment(validatedParams.commentId);
      
      if (deleteResult) {
        return this.buildSuccessResponse(validatedParams.commentId, commentContext, warningMessage, context);
      } else {
        return this.buildFailureResponse(validatedParams.commentId);
      }

    } catch (error) {
      return this.buildErrorResponse(error);
    }
  }

  private async getCommentContext(commentId: number): Promise<any> {
    try {
      const comments = await this.service.searchEntities(
        'Comment',
        `Id = ${commentId}`,
        ['Id', 'Description', 'User', 'CreateDate', 'IsPrivate', 'General'],
        1
      );
      return (comments && comments.length > 0) ? comments[0] : null;
    } catch {
      return null; // Continue with deletion even if context fetch fails
    }
  }

  private buildWarningMessage(commentContext: any, userId: number): string {
    if (commentContext?.User && commentContext.User.Id !== userId) {
      return `⚠️ You are deleting a comment by ${commentContext.User.FirstName} ${commentContext.User.LastName}. `;
    }
    return '';
  }

  private buildSuccessResponse(commentId: number, commentContext: any, warningMessage: string, context: ExecutionContext): OperationResult {
    const contextText = commentContext 
      ? `Comment: "${this.cleanDescription(commentContext.Description)}" from ${commentContext.User?.FirstName} ${commentContext.User?.LastName}`
      : `Comment #${commentId}`;
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ ${warningMessage}Successfully deleted comment #${commentId}\n\n${contextText}`
        },
        {
          type: 'structured-data' as const,
          data: {
            deletedComment: {
              id: commentId,
              context: commentContext,
              deletedBy: context.user.name,
              deletedAt: new Date().toISOString(),
              wasOwnComment: commentContext?.User?.Id === context.user.id
            }
          }
        }
      ],
      suggestions: this.generateSuggestions(commentContext)
    };
  }

  private buildFailureResponse(commentId: number): OperationResult {
    return {
      content: [{
        type: 'error' as const,
        text: `Failed to delete comment #${commentId}. The comment may not exist or you may not have permission to delete it.`
      }]
    };
  }

  private buildErrorResponse(error: unknown): OperationResult {
    return {
      content: [{
        type: 'error' as const,
        text: `Failed to delete comment: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }

  /**
   * Clean HTML from comment description for display
   */
  private cleanDescription(description: string): string {
    return description
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#(\d+);/g, (match, code) => String.fromCharCode(code))
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .trim()
      .substring(0, 100) + (description.length > 100 ? '...' : '');
  }

  /**
   * Generate follow-up suggestions
   */
  private generateSuggestions(commentContext: any): string[] {
    const suggestions: string[] = [];
    
    if (commentContext?.General?.Id) {
      const entityType = commentContext.General.EntityType?.Name || 'Entity';
      const entityId = commentContext.General.Id;
      
      suggestions.push(`show-comments entityType:${entityType} entityId:${entityId} - View remaining comments`);
      suggestions.push(`add-comment entityType:${entityType} entityId:${entityId} comment:"Your comment here" - Add a new comment`);
      
      if (entityType === 'Task') {
        suggestions.push(`show-my-tasks - View your assigned tasks`);
      } else if (entityType === 'Bug') {
        suggestions.push(`show-my-bugs - View your assigned bugs`);
      }
    }
    
    suggestions.push(`search-work-items - Search for related work items`);
    
    return suggestions;
  }
}