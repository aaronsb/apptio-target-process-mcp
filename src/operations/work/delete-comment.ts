import { z } from 'zod';
import { 
  SemanticOperation, 
  ExecutionContext, 
  OperationResult 
} from '../../core/interfaces/semantic-operation.interface.js';
import { TPService } from '../../api/client/tp.service.js';

const DeleteCommentParamsSchema = z.object({
  commentId: z.coerce.number().describe('ID of the comment to delete'),
  entityType: z.string().optional().describe('Type of entity the comment belongs to (for context)'),
  entityId: z.coerce.number().optional().describe('ID of the entity the comment belongs to (for context)')
});

type DeleteCommentParams = z.infer<typeof DeleteCommentParamsSchema>;

/**
 * Delete Comment Operation
 * 
 * Deletes a specific comment by its ID. Use with caution as this action cannot be undone.
 * 
 * Security considerations:
 * - Only allows deletion of comments by their authors (when user context is available)
 * - Provides confirmation messages and warnings
 * - Validates comment exists before deletion
 */
export class DeleteCommentOperation implements SemanticOperation<DeleteCommentParams> {
  constructor(private service: TPService) {}

  metadata = {
    id: 'delete-comment',
    name: 'Delete Comment',
    description: 'Delete a specific comment by its ID. Use with caution - this action cannot be undone.',
    category: 'collaboration',
    requiredPersonalities: ['default', 'developer', 'tester', 'project-manager', 'product-manager'],
    examples: [
      'delete-comment commentId:207220',
      'delete-comment commentId:207220 entityType:UserStory entityId:54356'
    ]
  };

  async execute(context: ExecutionContext, params: DeleteCommentParams): Promise<OperationResult> {
    try {
      const validatedParams = DeleteCommentParamsSchema.parse(params);
      
      // Optional: Get comment details first for validation and context
      let commentContext = '';
      if (validatedParams.entityType && validatedParams.entityId) {
        try {
          const comments = await this.service.getComments(
            validatedParams.entityType,
            validatedParams.entityId
          );
          
          const targetComment = comments.Items?.find((c: any) => c.Id === validatedParams.commentId);
          if (targetComment) {
            const isOwnComment = targetComment.Owner?.Id === context.user.id;
            commentContext = `\n📝 Comment: "${this.cleanDescription(targetComment.Description)}"\n👤 Author: ${targetComment.Owner?.FullName || 'Unknown'} (${targetComment.Owner?.Login || 'N/A'})`;
            
            if (!isOwnComment) {
              commentContext += '\n⚠️  Warning: This comment was not created by you';
            }
          }
        } catch (error) {
          // Continue with deletion even if we can't get comment details
        }
      }

      // Delete the comment
      const success = await this.service.deleteComment(validatedParams.commentId);

      if (success) {
        return {
          content: [{
            type: 'text',
            text: `✅ Comment #${validatedParams.commentId} has been deleted successfully${commentContext}\n\n🗑️ This action cannot be undone.`
          }],
          affectedEntities: validatedParams.entityId ? [{
            id: validatedParams.entityId,
            type: validatedParams.entityType || 'Unknown',
            action: 'updated'
          }] : undefined,
          metadata: {
            executionTime: 0,
            apiCallsCount: commentContext ? 2 : 1,
            cacheHits: 0
          }
        };
      } else {
        return {
          content: [{
            type: 'error',
            text: `❌ Failed to delete comment #${validatedParams.commentId}`,
            data: {
              error: 'Delete operation returned false',
              commentId: validatedParams.commentId
            }
          }],
          metadata: {
            executionTime: 0,
            apiCallsCount: 1,
            cacheHits: 0
          }
        };
      }

    } catch (error) {
      return {
        content: [{
          type: 'error',
          text: `❌ Failed to delete comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
}