import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { AddCommentOperation } from '../../operations/work/add-comment.js';
import { ShowCommentsOperation } from '../../operations/work/show-comments.js';
import { DeleteCommentOperation } from '../../operations/work/delete-comment.js';
import { logger } from '../../utils/logger.js';

/**
 * Unified Comment Tool Schema
 * 
 * Consolidates add, show, and delete comment operations into a single semantic tool
 * with operation-specific parameters and cross-operation semantic hints.
 */
export const commentToolSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('add'),
    entityType: z.string().describe('Type of entity to comment on (Task, Bug, UserStory, etc.)'),
    entityId: z.coerce.number().describe('ID of the entity to comment on'),
    comment: z.string().min(1).describe('Comment text to add'),
    isPrivate: z.union([z.boolean(), z.string()]).optional().default(false).transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    }).describe('Whether the comment should be private (visible only to team members)'),
    parentCommentId: z.coerce.number().optional().describe('ID of the parent comment to reply to (leave empty for root comment)'),
    attachments: z.array(z.object({
      path: z.string().describe('Path to file to attach'),
      description: z.string().optional().describe('Description of attachment')
    })).optional().describe('Files to attach to the comment'),
    mentions: z.array(z.string()).optional().describe('User names or IDs to mention in comment'),
    useTemplate: z.string().optional().describe('Template name to use for formatting'),
    codeLanguage: z.string().optional().describe('Language for code snippet highlighting (e.g., javascript, python)'),
    linkedCommit: z.string().optional().describe('Git commit SHA to link to this comment'),
    linkedPR: z.string().optional().describe('Pull request URL or ID to link')
  }),
  z.object({
    operation: z.literal('show'),
    entityType: z.string().describe('Type of entity to show comments for (Task, Bug, UserStory, etc.)'),
    entityId: z.coerce.number().describe('ID of the entity to show comments for'),
    includePrivate: z.boolean().optional().default(true).describe('Whether to include private comments (default: true)'),
    filter: z.enum(['all', 'recent', 'mine', 'mentions', 'unread']).optional().default('all').describe('Filter comments by criteria'),
    groupBy: z.enum(['none', 'date', 'author', 'type']).optional().default('none').describe('Group comments by criteria'),
    sortOrder: z.enum(['newest', 'oldest', 'relevance']).optional().default('newest').describe('Sort order for comments'),
    limit: z.number().optional().default(50).describe('Maximum number of comments to retrieve')
  }),
  z.object({
    operation: z.literal('delete'),
    commentId: z.coerce.number().describe('ID of the comment to delete')
  }),
  z.object({
    operation: z.literal('analyze'),
    entityType: z.string().describe('Type of entity to analyze comments for'),
    entityId: z.coerce.number().describe('ID of the entity to analyze comments for'),
    analysisType: z.enum(['sentiment', 'patterns', 'blockers', 'decisions']).optional().default('patterns').describe('Type of analysis to perform')
  })
]);

export type CommentToolInput = z.infer<typeof commentToolSchema>;

/**
 * Unified Comment Tool
 * 
 * A single semantic tool that consolidates all comment operations (add, show, delete, analyze)
 * with intelligent cross-operation hints and contextual suggestions.
 * 
 * Features:
 * - Single entry point for all comment operations
 * - Operation-aware semantic hints and suggestions
 * - Consistent parameter validation and error handling
 * - Cross-operation workflow suggestions
 * - Maintains all existing functionality from individual operations
 */
export class CommentTool {
  private addCommentOp: AddCommentOperation;
  private showCommentsOp: ShowCommentsOperation;
  private deleteCommentOp: DeleteCommentOperation;

  constructor(private service: TPService) {
    this.addCommentOp = new AddCommentOperation(service);
    this.showCommentsOp = new ShowCommentsOperation(service);
    this.deleteCommentOp = new DeleteCommentOperation(service);
  }

  /**
   * Get tool definition for MCP registration
   */
  static getDefinition() {
    return {
      name: 'comment',
      description: 'Unified comment tool for adding, viewing, deleting, and analyzing comments on work items. Provides intelligent workflow suggestions and cross-operation semantic hints.',
      inputSchema: commentToolSchema
    };
  }

  /**
   * Execute the unified comment tool
   */
  async execute(input: unknown, context: any): Promise<any> {
    try {
      const validatedInput = commentToolSchema.parse(input);
      
      // Build execution context from the provided context
      const executionContext = this.buildExecutionContext(context);

      switch (validatedInput.operation) {
        case 'add':
          return await this.handleAddComment(validatedInput, executionContext);
          
        case 'show':
          return await this.handleShowComments(validatedInput, executionContext);
          
        case 'delete':
          return await this.handleDeleteComment(validatedInput, executionContext);
          
        case 'analyze':
          return await this.handleAnalyzeComments(validatedInput, executionContext);
          
        default:
          throw new McpError(
            ErrorCode.InvalidParams,
            `Unsupported comment operation: ${(validatedInput as any).operation}`
          );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        );
      }
      
      if (error instanceof McpError) {
        throw error;
      }
      
      logger.error('Comment tool execution failed:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Comment operation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle add comment operation
   */
  private async handleAddComment(input: Extract<CommentToolInput, { operation: 'add' }>, context: any) {
    const params = {
      entityType: input.entityType,
      entityId: input.entityId,
      comment: input.comment,
      isPrivate: input.isPrivate,
      parentCommentId: input.parentCommentId,
      attachments: input.attachments,
      mentions: input.mentions,
      useTemplate: input.useTemplate,
      codeLanguage: input.codeLanguage,
      linkedCommit: input.linkedCommit,
      linkedPR: input.linkedPR
    };

    const result = await this.addCommentOp.execute(context, params);
    
    // Add cross-operation semantic hints
    return this.enhanceResultWithSemanticHints(result, 'add', {
      entityType: input.entityType,
      entityId: input.entityId
    });
  }

  /**
   * Handle show comments operation
   */
  private async handleShowComments(input: Extract<CommentToolInput, { operation: 'show' }>, context: any) {
    const params = {
      entityType: input.entityType,
      entityId: input.entityId,
      includePrivate: input.includePrivate,
      filter: input.filter,
      groupBy: input.groupBy,
      sortOrder: input.sortOrder,
      limit: input.limit
    };

    const result = await this.showCommentsOp.execute(context, params);
    
    // Add cross-operation semantic hints
    return this.enhanceResultWithSemanticHints(result, 'show', {
      entityType: input.entityType,
      entityId: input.entityId
    });
  }

  /**
   * Handle delete comment operation
   */
  private async handleDeleteComment(input: Extract<CommentToolInput, { operation: 'delete' }>, context: any) {
    const params = {
      commentId: input.commentId
    };

    const result = await this.deleteCommentOp.execute(context, params);
    
    // Add cross-operation semantic hints
    return this.enhanceResultWithSemanticHints(result, 'delete', {
      commentId: input.commentId
    });
  }

  /**
   * Handle analyze comments operation (future enhancement)
   */
  private async handleAnalyzeComments(input: Extract<CommentToolInput, { operation: 'analyze' }>, context: any) {
    // For now, delegate to show comments with analysis focus
    const showParams = {
      entityType: input.entityType,
      entityId: input.entityId,
      includePrivate: true,
      filter: 'all' as const,
      groupBy: 'none' as const,
      sortOrder: 'newest' as const,
      limit: 100
    };

    const result = await this.showCommentsOp.execute(context, showParams);
    
    // Enhance with analysis-specific insights
    return {
      ...result,
      analysisType: input.analysisType,
      suggestedActions: [
        'comment operation:add - Add follow-up comment based on analysis',
        'comment operation:show filter:recent - View recent comment activity',
        'search_entities - Find related work items mentioned in comments'
      ]
    };
  }

  /**
   * Build execution context from MCP context
   */
  private buildExecutionContext(mcpContext: any): any {
    // Extract user information from MCP context or use defaults
    return {
      user: {
        id: mcpContext?.user?.id || parseInt(process.env.TP_USER_ID || '0'),
        name: mcpContext?.user?.name || 'Unknown User',
        email: mcpContext?.user?.email || process.env.TP_USER_EMAIL || 'unknown@example.com',
        role: mcpContext?.user?.role || process.env.TP_USER_ROLE || 'developer',
        teams: mcpContext?.user?.teams || [],
        permissions: mcpContext?.user?.permissions || []
      },
      workspace: {
        recentEntities: mcpContext?.workspace?.recentEntities || []
      },
      personality: {
        mode: mcpContext?.personality?.mode || process.env.TP_USER_ROLE || 'developer',
        features: mcpContext?.personality?.features || [],
        restrictions: mcpContext?.personality?.restrictions || {}
      },
      conversation: {
        mentionedEntities: mcpContext?.conversation?.mentionedEntities || [],
        previousOperations: mcpContext?.conversation?.previousOperations || [],
        intent: mcpContext?.conversation?.intent || 'comment-operation'
      },
      config: {
        apiUrl: `https://${process.env.TP_DOMAIN}`,
        maxResults: 25,
        timeout: 30000
      }
    };
  }

  /**
   * Enhance operation results with cross-operation semantic hints
   */
  private enhanceResultWithSemanticHints(result: any, operation: string, context: any): any {
    const baseResult = result;
    
    // Add operation-specific semantic hints
    const semanticHints = this.generateSemanticHints(operation, context, result);
    
    return {
      ...baseResult,
      operation: operation,
      semanticHints: semanticHints,
      suggestedActions: [
        ...baseResult.suggestedActions || [],
        ...semanticHints
      ]
    };
  }

  /**
   * Generate cross-operation semantic hints
   */
  private generateSemanticHints(operation: string, context: any, result: any): string[] {
    const hints: string[] = [];

    switch (operation) {
      case 'add':
        hints.push(
          `comment operation:show entityType:${context.entityType} entityId:${context.entityId} - View all comments on this item`,
          `comment operation:show entityType:${context.entityType} entityId:${context.entityId} filter:mine - View your comments only`
        );
        break;
        
      case 'show':
        hints.push(
          `comment operation:add entityType:${context.entityType} entityId:${context.entityId} comment:"Your response" - Add a new comment`,
          `comment operation:analyze entityType:${context.entityType} entityId:${context.entityId} - Analyze comment patterns and insights`
        );
        
        // Add delete hints if user has comments
        if (result.comments && result.comments.some((c: any) => c.Owner?.Login === process.env.TP_USERNAME)) {
          hints.push('comment operation:delete commentId:ID - Delete one of your comments');
        }
        break;
        
      case 'delete':
        hints.push(
          'comment operation:show - View remaining comments on this item',
          'comment operation:add - Add a replacement comment if needed'
        );
        break;
        
      case 'analyze':
        hints.push(
          `comment operation:add entityType:${context.entityType} entityId:${context.entityId} - Add comment based on analysis`,
          `comment operation:show entityType:${context.entityType} entityId:${context.entityId} filter:recent - View recent activity`
        );
        break;
    }

    return hints;
  }
}