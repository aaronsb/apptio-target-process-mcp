import { z } from 'zod';
import { 
  SemanticOperation, 
  ExecutionContext, 
  OperationResult 
} from '../../core/interfaces/semantic-operation.interface.js';
import { TPService } from '../../api/client/tp.service.js';

const AddCommentParamsSchema = z.object({
  entityType: z.string().describe('Type of entity to comment on (Task, Bug, UserStory, etc.)'),
  entityId: z.coerce.number().describe('ID of the entity to comment on'),
  comment: z.string().min(1).describe('Comment text to add'),
  isPrivate: z.coerce.boolean().optional().default(false).describe('Whether the comment should be private (visible only to team members)'),
  parentCommentId: z.coerce.number().optional().describe('ID of the parent comment to reply to (leave empty for root comment)')
});

type AddCommentParams = z.infer<typeof AddCommentParamsSchema>;

/**
 * Add Comment Operation
 * 
 * Enhanced comment creation with role-specific templates and rich text formatting.
 * 
 * Features:
 * - Role-based comment templates (Developer, Tester, Project Manager, Product Owner)
 * - Rich text formatting with HTML and basic Markdown support
 * - Context-aware follow-up suggestions
 * - Public and private comment support
 * - Entity validation and error handling
 * 
 * Role-specific templates:
 * - Developer: Technical notes, code reviews, bug fixes
 * - Tester: Test results, bug reproduction, quality observations
 * - Project Manager: Status updates, team coordination, risk management
 * - Product Owner: Business justification, stakeholder feedback, requirements
 */
export class AddCommentOperation implements SemanticOperation<AddCommentParams> {
  constructor(private service: TPService) {}

  metadata = {
    id: 'add-comment',
    name: 'Add Comment',
    description: 'Add comments to tasks, bugs, and other work items with smart context awareness and role-specific formatting',
    category: 'collaboration',
    requiredPersonalities: ['default', 'developer', 'tester', 'project-manager', 'product-manager'],
    examples: [
      'add-comment entityType:Task entityId:12345 comment:"Fixed the login issue, ready for testing"',
      'add-comment entityType:Bug entityId:67890 comment:"Cannot reproduce in dev environment" isPrivate:true',
      'add-comment entityType:UserStory entityId:11111 comment:"Added acceptance criteria based on customer feedback"',
      'add-comment entityType:UserStory entityId:11111 comment:"Thanks for the clarification!" parentCommentId:207218'
    ]
  };

  /**
   * Get role-specific comment templates
   */
  getTemplates(role: string): string[] {
    switch (role) {
      case 'developer':
        return [
          'Fixed: [Brief description of what was fixed]',
          'Code review: [Feedback on implementation]',
          'Technical note: [Implementation details or considerations]',
          'Testing: [Test results or testing approach]',
          'Blocked: [What is blocking progress and next steps]'
        ];
      
      case 'tester':
        return [
          'Test results: [Pass/Fail with details]',
          'Bug reproduction: [Steps to reproduce the issue]',
          'Test coverage: [Areas tested and coverage notes]',
          'Quality observation: [Quality concerns or improvements]',
          'Ready for testing: [Item ready for QA review]'
        ];
      
      case 'project-manager':
        return [
          'Status update: [Current status and next steps]',
          'Team coordination: [Team communication or assignments]',
          'Risk identified: [Risk description and mitigation plan]',
          'Meeting notes: [Key decisions or action items]',
          'Resource allocation: [Resource changes or needs]'
        ];
      
      case 'product-manager':
      case 'product-owner':
        return [
          'Business justification: [Why this change is important]',
          'Stakeholder feedback: [Input from stakeholders]',
          'Requirements clarification: [Clarification on requirements]',
          'Acceptance criteria: [Updated or new acceptance criteria]',
          'Priority change: [Priority adjustment with reasoning]'
        ];
      
      default:
        return [
          'Update: [General status update]',
          'Note: [General comment or observation]',
          'Follow-up: [Next steps or follow-up actions]'
        ];
    }
  }

  /**
   * Format comment content based on role and context
   */
  formatContent(content: string, role: string, entity?: any): string {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Convert basic markdown to HTML for TargetProcess
    const htmlContent = this.convertMarkdownToHtml(content);
    
    switch (role) {
      case 'developer':
        return `<div><strong>💻 Developer Update</strong> (${timestamp})</div><div><br/></div><div>${htmlContent}</div>`;
      
      case 'tester':
        return `<div><strong>🧪 QA Update</strong> (${timestamp})</div><div><br/></div><div>${htmlContent}</div>`;
      
      case 'project-manager':
        return `<div><strong>📋 Project Update</strong> (${timestamp})</div><div><br/></div><div>${htmlContent}</div>`;
      
      case 'product-manager':
      case 'product-owner':
        return `<div><strong>🎯 Product Update</strong> (${timestamp})</div><div><br/></div><div>${htmlContent}</div>`;
      
      default:
        return `<div><strong>📝 Update</strong> (${timestamp})</div><div><br/></div><div>${htmlContent}</div>`;
    }
  }

  /**
   * Convert basic markdown to HTML for TargetProcess
   */
  private convertMarkdownToHtml(content: string): string {
    return content
      // Bold: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code: `code`
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n\n/g, '</div><div><br/></div><div>')
      .replace(/\n/g, '<br/>')
      // Lists (basic support)
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }

  async execute(context: ExecutionContext, params: AddCommentParams): Promise<OperationResult> {
    try {
      const validatedParams = AddCommentParamsSchema.parse(params);
      
      // First, verify the entity exists and get its details
      const entity = await this.service.getEntity(
        validatedParams.entityType,
        validatedParams.entityId
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

      // Format comment based on user role (with fallback for default/unknown roles)
      const userRole = context.user.role || 'default';
      const formattedComment = this.formatContent(validatedParams.comment, userRole, entity);
      
      // Create the comment using the proper API method
      const comment = await this.service.createComment(
        validatedParams.entityId,
        formattedComment,
        validatedParams.isPrivate,
        validatedParams.parentCommentId
      );

      // Build response with context
      const contextInfo = this.buildEntityContext(entity);
      const suggestions = await this.generateFollowUpSuggestions(entity, validatedParams, context);

      return {
        content: [
          {
            type: 'text',
            text: this.formatSuccessMessage(entity, formattedComment, validatedParams.isPrivate, validatedParams.parentCommentId)
          },
          {
            type: 'structured-data',
            data: {
              comment: {
                id: comment.Id,
                description: formattedComment,
                user: comment.User,
                createdDate: comment.CreateDate,
                isPrivate: validatedParams.isPrivate,
                userRole: userRole
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

  private formatSuccessMessage(entity: any, comment: string, isPrivate: boolean, parentCommentId?: number): string {
    const privacy = isPrivate ? ' (private)' : '';
    const replyText = parentCommentId ? ' reply' : '';
    const preview = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;
    
    return `✅ Comment${replyText} added${privacy} to ${entity.Name}${parentCommentId ? ` (replying to comment #${parentCommentId})` : ''}\n\n💬 "${preview}"\n\n📋 Entity: ${entity.EntityState?.Name || 'Unknown'} | 👤 ${entity.AssignedUser?.FirstName ? `${entity.AssignedUser.FirstName} ${entity.AssignedUser.LastName}` : 'Unassigned'}`;
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