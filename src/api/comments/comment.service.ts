import fetch, { Response } from 'node-fetch';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ApiResponse } from '../client/api.types.js';
import { EntityValidator } from '../validation/entity-validator.js';

export interface CommentData {
  Id: number;
  Description: string;
  IsPrivate: boolean;
  CreateDate: string;
  Owner?: {
    Id: number;
    FirstName: string;
    LastName: string;
  };
  ParentId?: number;
  General?: {
    Id: number;
  };
}

export interface CreateCommentRequest {
  entityId: number;
  description: string;
  isPrivate?: boolean;
  parentCommentId?: number;
}

export interface CommentServiceDependencies {
  executeWithRetry: <T>(operation: () => Promise<T>, context: string) => Promise<T>;
  handleApiResponse: <T>(response: Response, context: string) => Promise<T>;
  getHeaders: () => Record<string, string>;
  baseUrl: string;
  entityValidator: EntityValidator;
}

/**
 * Service for managing comments on TargetProcess entities
 * Handles comment CRUD operations with hierarchical support
 */
export class CommentService {
  private readonly deps: CommentServiceDependencies;

  constructor(dependencies: CommentServiceDependencies) {
    this.deps = dependencies;
  }

  /**
   * Get comments for an entity with hierarchical structure
   */
  async getComments(entityType: string, entityId: number): Promise<CommentData[]> {
    try {
      // Validate entity type
      const validatedType = await this.deps.entityValidator.validateEntityTypeOrThrow(entityType);

      // Validate entity ID
      const idValidation = this.deps.entityValidator.validateEntityId(entityId);
      if (!idValidation.isValid) {
        throw new McpError(ErrorCode.InvalidRequest, idValidation.errors.join('; '));
      }

      return await this.deps.executeWithRetry(async () => {
        const endpoint = this.deps.entityValidator.getEndpointForEntityType(validatedType);
        const response = await fetch(`${this.deps.baseUrl}/${endpoint}/${entityId}/Comments`, {
          headers: this.deps.getHeaders()
        });

        const data = await this.deps.handleApiResponse<ApiResponse<CommentData>>(
          response,
          `get comments for ${validatedType} ${entityId}`
        );
        
        // Return the Items array, or empty array if no Items property
        const comments = data.Items || [];
        
        // Sort comments to show hierarchy (parent comments first, then replies)
        return this.sortCommentsHierarchically(comments);
      }, `get comments for ${validatedType} ${entityId}`);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get comments: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a comment on an entity
   */
  async createComment(request: CreateCommentRequest): Promise<CommentData> {
    try {
      // Validate entity ID
      const idValidation = this.deps.entityValidator.validateEntityId(request.entityId);
      if (!idValidation.isValid) {
        throw new McpError(ErrorCode.InvalidRequest, idValidation.errors.join('; '));
      }

      // Validate comment description
      if (!request.description || !request.description.trim()) {
        throw new McpError(ErrorCode.InvalidRequest, 'Comment description cannot be empty');
      }

      // Validate parent comment ID if provided
      if (request.parentCommentId !== undefined) {
        const parentIdValidation = this.deps.entityValidator.validateEntityId(request.parentCommentId);
        if (!parentIdValidation.isValid) {
          throw new McpError(ErrorCode.InvalidRequest, 'Invalid parent comment ID: ' + parentIdValidation.errors.join('; '));
        }
      }

      const commentData: any = {
        General: { Id: request.entityId },
        Description: request.description.trim()
      };

      if (request.isPrivate) {
        commentData.IsPrivate = true;
      }

      if (request.parentCommentId) {
        commentData.ParentId = request.parentCommentId;
      }

      return await this.deps.executeWithRetry(async () => {
        const response = await fetch(`${this.deps.baseUrl}/Comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.deps.getHeaders()
          },
          body: JSON.stringify(commentData)
        });

        return await this.deps.handleApiResponse<CommentData>(
          response,
          `create comment on entity ${request.entityId}`
        );
      }, `create comment on entity ${request.entityId}`);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create comment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a comment by ID
   */
  async deleteComment(commentId: number): Promise<boolean> {
    try {
      // Validate comment ID
      const idValidation = this.deps.entityValidator.validateEntityId(commentId);
      if (!idValidation.isValid) {
        throw new McpError(ErrorCode.InvalidRequest, idValidation.errors.join('; '));
      }

      return await this.deps.executeWithRetry(async () => {
        const response = await fetch(`${this.deps.baseUrl}/Comments/${commentId}`, {
          method: 'DELETE',
          headers: this.deps.getHeaders()
        });

        if (response.ok) {
          return true;
        } else {
          const errorText = await this.extractErrorMessage(response);
          throw new Error(`Failed to delete comment ${commentId}: ${response.status} - ${errorText}`);
        }
      }, `delete comment ${commentId}`);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to delete comment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update a comment (if supported by API)
   */
  async updateComment(commentId: number, description: string): Promise<CommentData> {
    try {
      // Validate comment ID
      const idValidation = this.deps.entityValidator.validateEntityId(commentId);
      if (!idValidation.isValid) {
        throw new McpError(ErrorCode.InvalidRequest, idValidation.errors.join('; '));
      }

      // Validate description
      if (!description || !description.trim()) {
        throw new McpError(ErrorCode.InvalidRequest, 'Comment description cannot be empty');
      }

      const updateData = {
        Description: description.trim()
      };

      return await this.deps.executeWithRetry(async () => {
        const response = await fetch(`${this.deps.baseUrl}/Comments/${commentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.deps.getHeaders()
          },
          body: JSON.stringify(updateData)
        });

        return await this.deps.handleApiResponse<CommentData>(
          response,
          `update comment ${commentId}`
        );
      }, `update comment ${commentId}`);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to update comment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a specific comment by ID
   */
  async getComment(commentId: number): Promise<CommentData> {
    try {
      // Validate comment ID
      const idValidation = this.deps.entityValidator.validateEntityId(commentId);
      if (!idValidation.isValid) {
        throw new McpError(ErrorCode.InvalidRequest, idValidation.errors.join('; '));
      }

      return await this.deps.executeWithRetry(async () => {
        const response = await fetch(`${this.deps.baseUrl}/Comments/${commentId}`, {
          headers: this.deps.getHeaders()
        });

        return await this.deps.handleApiResponse<CommentData>(
          response,
          `get comment ${commentId}`
        );
      }, `get comment ${commentId}`);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get comment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all replies to a specific comment
   */
  async getCommentReplies(parentCommentId: number): Promise<CommentData[]> {
    try {
      // Validate parent comment ID
      const idValidation = this.deps.entityValidator.validateEntityId(parentCommentId);
      if (!idValidation.isValid) {
        throw new McpError(ErrorCode.InvalidRequest, idValidation.errors.join('; '));
      }

      return await this.deps.executeWithRetry(async () => {
        const response = await fetch(`${this.deps.baseUrl}/Comments/${parentCommentId}/Replies`, {
          headers: this.deps.getHeaders()
        });

        const data = await this.deps.handleApiResponse<ApiResponse<CommentData>>(
          response,
          `get replies for comment ${parentCommentId}`
        );
        
        return data.Items || [];
      }, `get replies for comment ${parentCommentId}`);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get comment replies: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Sort comments hierarchically (parent comments first, then their replies)
   */
  private sortCommentsHierarchically(comments: CommentData[]): CommentData[] {
    const parentComments = comments.filter(c => !c.ParentId);
    const childComments = comments.filter(c => c.ParentId);
    
    // Sort parent comments by creation date
    parentComments.sort((a, b) => new Date(a.CreateDate).getTime() - new Date(b.CreateDate).getTime());
    
    const result: CommentData[] = [];
    
    for (const parent of parentComments) {
      result.push(parent);
      
      // Find and add child comments for this parent
      const children = childComments
        .filter(c => c.ParentId === parent.Id)
        .sort((a, b) => new Date(a.CreateDate).getTime() - new Date(b.CreateDate).getTime());
      
      result.push(...children);
    }
    
    // Add any orphaned child comments at the end
    const orphanedChildren = childComments.filter(c => 
      !parentComments.some(p => p.Id === c.ParentId)
    );
    result.push(...orphanedChildren);
    
    return result;
  }

  /**
   * Extract error message from response
   */
  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const data = await response.json() as { Message?: string; ErrorMessage?: string; Description?: string };
      return data.Message || data.ErrorMessage || data.Description || response.statusText;
    } catch {
      return response.statusText;
    }
  }

  /**
   * Check if a comment belongs to a specific entity
   */
  async isCommentOnEntity(commentId: number, entityId: number): Promise<boolean> {
    try {
      const comment = await this.getComment(commentId);
      return comment.General?.Id === entityId;
    } catch {
      return false;
    }
  }

  /**
   * Get comment statistics for an entity
   */
  async getCommentStats(entityType: string, entityId: number): Promise<{
    total: number;
    public: number;
    private: number;
    replies: number;
  }> {
    try {
      const comments = await this.getComments(entityType, entityId);
      
      return {
        total: comments.length,
        public: comments.filter(c => !c.IsPrivate).length,
        private: comments.filter(c => c.IsPrivate).length,
        replies: comments.filter(c => c.ParentId).length
      };
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get comment stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}