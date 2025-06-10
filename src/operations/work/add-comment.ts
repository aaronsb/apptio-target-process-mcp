import { z } from 'zod';
import { 
  SemanticOperation, 
  ExecutionContext, 
  OperationResult 
} from '../../core/interfaces/semantic-operation.interface.js';
import { TPService } from '../../api/client/tp.service.js';

const AddCommentParamsSchema = z.object({
  entityType: z.string().describe('Type of entity to comment on (Task, Bug, UserStory, etc.)'),
  entityId: z.number().describe('ID of the entity to comment on'),
  comment: z.string().min(1).describe('Comment text to add'),
  isPrivate: z.boolean().optional().default(false).describe('Whether the comment should be private (visible only to team members)')
});

type AddCommentParams = z.infer<typeof AddCommentParamsSchema>;

/**
 * Add Comment Operation
 * 
 * Adds comments to work items with context awareness and workflow suggestions.
 * Supports both public and private comments, validates entity existence,
 * and provides smart follow-up recommendations.
 */
export class AddCommentOperation implements SemanticOperation<AddCommentParams> {
  constructor(private service: TPService) {}

  metadata = {
    id: 'add-comment',
    name: 'Add Comment',
    description: 'Add comments to tasks, bugs, and other work items with smart context awareness',
    category: 'collaboration',
    requiredPersonalities: ['developer', 'tester', 'project-manager', 'product-manager'],
    examples: [
      'add-comment entityType:Task entityId:12345 comment:"Fixed the login issue, ready for testing"',
      'add-comment entityType:Bug entityId:67890 comment:"Cannot reproduce in dev environment" isPrivate:true',
      'add-comment entityType:UserStory entityId:11111 comment:"Added acceptance criteria based on customer feedback"'
    ]
  };

  async execute(context: ExecutionContext, params: AddCommentParams): Promise<OperationResult> {
    try {
      const validatedParams = AddCommentParamsSchema.parse(params);
      
      // First, verify the entity exists and get its details
      const entity = await this.service.getEntity(
        validatedParams.entityType,
        validatedParams.entityId,
        ['Name', 'EntityState', 'AssignedUser', 'Project', 'Priority', 'Severity']
      ) as any;

      if (!entity) {
        return {
          content: [{
            type: 'error',
            text: `${validatedParams.entityType} with ID ${validatedParams.entityId} not found`,
            data: {
              error: 'Entity not found',
              entityType: validatedParams.entityType,
              entityId: validatedParams.entityId
            }
          }],
          metadata: {
            executionTime: 0,
            apiCallsCount: 1,
            cacheHits: 0
          }
        };
      }

      // Create the comment
      const commentData: any = {
        Name: `Comment on ${validatedParams.entityType} ${validatedParams.entityId}`,
        Description: validatedParams.comment,
        General: { Id: validatedParams.entityId },
        User: { Id: context.user.id }
      };

      // Add privacy settings if supported
      if (validatedParams.isPrivate) {
        commentData.IsPrivate = true;
      }

      const comment = await this.service.createEntity('Comment', commentData) as any;

      // Build response with context
      const contextInfo = this.buildEntityContext(entity);
      const suggestions = await this.generateFollowUpSuggestions(entity, validatedParams, context);

      return {
        content: [
          {
            type: 'text',
            text: this.formatSuccessMessage(entity, validatedParams.comment, validatedParams.isPrivate)
          },
          {
            type: 'structured-data',
            data: {
              comment: {
                id: comment.Id,
                description: comment.Description,
                user: comment.User,
                createdDate: comment.CreateDate,
                isPrivate: validatedParams.isPrivate
              },
              entity: {
                id: entity.Id,
                name: entity.Name,
                type: validatedParams.entityType,
                state: entity.EntityState?.Name,
                assignedUser: entity.AssignedUser?.FirstName && entity.AssignedUser?.LastName 
                  ? `${entity.AssignedUser.FirstName} ${entity.AssignedUser.LastName}`
                  : 'Unassigned',
                project: entity.Project?.Name || 'Unknown'
              },
              contextInfo,
              nextSteps: suggestions
            }
          }
        ],
        suggestions: suggestions,
        affectedEntities: [{
          id: validatedParams.entityId,
          type: validatedParams.entityType,
          action: 'updated'
        }],
        metadata: {
          executionTime: 0,
          apiCallsCount: 2,
          cacheHits: 0
        }
      };

    } catch (error) {
      return {
        content: [{
          type: 'error',
          text: `Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

  private formatSuccessMessage(entity: any, comment: string, isPrivate: boolean): string {
    const privacy = isPrivate ? ' (private)' : '';
    const preview = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;
    
    return `✅ Comment added${privacy} to ${entity.Name}\n\n💬 "${preview}"\n\n📋 Entity: ${entity.EntityState?.Name || 'Unknown'} | 👤 ${entity.AssignedUser?.FirstName ? `${entity.AssignedUser.FirstName} ${entity.AssignedUser.LastName}` : 'Unassigned'}`;
  }

  private buildEntityContext(entity: any): string {
    const parts: string[] = [];
    
    // Entity state and assignment
    if (entity.EntityState?.Name) {
      const stateIcon = entity.EntityState.IsFinal ? '✅' : entity.EntityState.IsInitial ? '🆕' : '🔄';
      parts.push(`${stateIcon} State: ${entity.EntityState.Name}`);
    }

    // Priority/Severity for different entity types
    if (entity.Priority?.Name) {
      const priorityIcon = (entity.Priority.Importance || 999) <= 2 ? '🔴' : (entity.Priority.Importance || 999) <= 4 ? '🟡' : '🟢';
      parts.push(`${priorityIcon} Priority: ${entity.Priority.Name}`);
    }

    if (entity.Severity?.Name) {
      const severityIcon = (entity.Severity.Importance || 999) <= 2 ? '🔴' : (entity.Severity.Importance || 999) <= 4 ? '🟠' : '🟡';
      parts.push(`${severityIcon} Severity: ${entity.Severity.Name}`);
    }

    return parts.join(' | ');
  }

  private async generateFollowUpSuggestions(
    entity: any, 
    params: AddCommentParams, 
    context: ExecutionContext
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Context-aware suggestions based on entity state and type
    const isAssignedToMe = entity.AssignedUser?.Items?.some((user: any) => user.Id === context.user.id) ||
                          entity.AssignedUser?.Id === context.user.id;
    
    const isInitialState = entity.EntityState?.IsInitial;
    const isFinalState = entity.EntityState?.IsFinal;

    if (params.entityType === 'Task') {
      if (isAssignedToMe && !isFinalState) {
        if (isInitialState) {
          suggestions.push(`start-working-on ${params.entityId} - Begin work on this task`);
        } else {
          suggestions.push(`complete-task ${params.entityId} - Mark task as complete`);
          suggestions.push(`log-time entityId:${params.entityId} spent:1.0 - Log time spent`);
        }
      }
      
      if (!isAssignedToMe && isInitialState) {
        suggestions.push(`update_entity type:Task id:${params.entityId} - Assign to yourself or update details`);
      }
    }

    if (params.entityType === 'Bug') {
      if (isAssignedToMe) {
        suggestions.push(`start-working-on ${params.entityId} - Start investigating this bug`);
        suggestions.push(`log-time entityId:${params.entityId} spent:0.5 - Log investigation time`);
      }
      
      suggestions.push(`show-my-bugs - View all your assigned bugs`);
    }

    // General suggestions
    suggestions.push(`get_entity type:${params.entityType} id:${params.entityId} - View updated entity details`);
    
    if (entity.Project?.Id) {
      suggestions.push(`search_entities type:Comment where:"General.Id eq ${params.entityId}" - View all comments on this item`);
    }

    return suggestions;
  }
}