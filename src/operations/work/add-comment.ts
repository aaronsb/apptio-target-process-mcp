import { z } from 'zod';
import { 
  SemanticOperation, 
  ExecutionContext, 
  OperationResult 
} from '../../core/interfaces/semantic-operation.interface.js';
import { TPService } from '../../api/client/tp.service.js';

export const addCommentSchema = z.object({
  entityType: z.string().describe('Type of entity to comment on (Task, Bug, UserStory, etc.)'),
  entityId: z.coerce.number().describe('ID of the entity to comment on'),
  comment: z.string().min(1).describe('Comment text to add'),
  isPrivate: z.union([z.boolean(), z.string()]).optional().default(false).transform((val) => {
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true';
    }
    return val;
  }).describe('Whether the comment should be private (visible only to team members)'),
  parentCommentId: z.coerce.number().optional().describe('ID of the parent comment to reply to (leave empty for root comment)')
});

export type AddCommentParams = z.infer<typeof addCommentSchema>;

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

  get metadata() {
    return {
      id: 'add-comment',
      name: 'Add Comment',
      description: 'Add comments to tasks, bugs, and other work items with smart context awareness and role-specific formatting',
      category: 'collaboration',
      requiredPersonalities: ['default', 'developer', 'tester', 'project-manager', 'product-owner'],
      examples: [
        'Add comment to task 123: "Fixed the login issue"',
        'Comment on bug 456: "Unable to reproduce on staging"',
        'Add private comment to story 789: "Need to discuss with stakeholders"'
      ],
      tags: ['comment', 'communication', 'collaboration']
    };
  }

  getSchema() {
    return addCommentSchema;
  }

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
          'Update: [General update or note]',
          'Question: [Question or clarification needed]',
          'Follow-up: [Next steps or follow-up actions]'
        ];
    }
  }

  /**
   * Format comment content based on role and context
   */
  formatContent(content: string, role: string, _entity?: any): string {
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
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }

  async execute(context: ExecutionContext, params: AddCommentParams): Promise<OperationResult> {
    try {
      const validatedParams = addCommentSchema.parse(params);
      
      // Validate entity exists
      const entity = await this.validateEntity(validatedParams.entityType, validatedParams.entityId);
      if (!entity) {
        return this.createErrorResponse(`${validatedParams.entityType} with ID ${validatedParams.entityId} not found`);
      }

      // Create formatted comment
      const userRole = context.user.role || 'default';
      const formattedComment = this.formatContent(validatedParams.comment, userRole, entity);
      
      // Create comment via API
      const comment = await this.service.createComment(
        validatedParams.entityId,
        formattedComment,
        validatedParams.isPrivate,
        validatedParams.parentCommentId
      );

      // Build response
      return this.buildSuccessResponse(entity, comment, validatedParams, userRole, formattedComment, context);

    } catch (error) {
      return this.createErrorResponse(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateEntity(entityType: string, entityId: number): Promise<any> {
    return await this.service.getEntity(entityType, entityId) as any;
  }

  private createErrorResponse(message: string): OperationResult {
    return {
      content: [{
        type: 'error' as const,
        text: message
      }]
    };
  }

  private async buildSuccessResponse(
    entity: any, 
    comment: any, 
    params: AddCommentParams, 
    userRole: string, 
    formattedComment: string,
    context: ExecutionContext
  ): Promise<OperationResult> {
    const contextInfo = this.buildEntityContext(entity);
    const suggestions = await this.generateFollowUpSuggestions(entity, params, context);
    const successMessage = this.formatSuccessMessage(entity, formattedComment, params.isPrivate, params.parentCommentId);

    return {
      content: [
        { type: 'text' as const, text: successMessage },
        {
          type: 'structured-data' as const,
          data: {
            comment: this.buildCommentData(comment, params.isPrivate, userRole, formattedComment),
            entity: this.buildEntityData(entity, params.entityType),
            contextInfo,
            nextSteps: suggestions
          }
        }
      ],
      suggestions: suggestions
    };
  }

  private buildCommentData(comment: any, isPrivate: boolean, userRole: string, formattedComment: string) {
    return {
      id: comment.Id,
      description: formattedComment,
      user: comment.User,
      createdDate: comment.CreateDate,
      isPrivate: isPrivate,
      userRole: userRole
    };
  }

  private buildEntityData(entity: any, entityType: string) {
    return {
      id: entity.Id,
      name: entity.Name,
      type: entityType,
      state: entity.EntityState?.Name,
      assignedUser: entity.AssignedUser?.FirstName && entity.AssignedUser?.LastName 
        ? `${entity.AssignedUser.FirstName} ${entity.AssignedUser.LastName}`
        : 'Unassigned',
      project: entity.Project?.Name || 'Unknown'
    };
  }

  private formatSuccessMessage(entity: any, comment: string, isPrivate?: boolean, parentCommentId?: number): string {
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
    const entityState = this.getEntityStateInfo(entity);
    const isAssignedToMe = this.isEntityAssignedToUser(entity, context.user.id);
    
    // Add entity-specific suggestions
    this.addTaskSuggestions(suggestions, params, entityState, isAssignedToMe);
    this.addBugSuggestions(suggestions, params, entityState, isAssignedToMe);
    this.addGeneralSuggestions(suggestions, entity, params);

    return suggestions;
  }

  private getEntityStateInfo(entity: any) {
    return {
      isInitial: entity.EntityState?.IsInitial,
      isFinal: entity.EntityState?.IsFinal
    };
  }

  private isEntityAssignedToUser(entity: any, userId: number): boolean {
    return entity.AssignedUser?.Items?.some((user: any) => user.Id === userId) ||
           entity.AssignedUser?.Id === userId;
  }

  private addTaskSuggestions(suggestions: string[], params: AddCommentParams, entityState: any, isAssignedToMe: boolean) {
    if (params.entityType !== 'Task') return;

    if (isAssignedToMe && !entityState.isFinal) {
      if (entityState.isInitial) {
        suggestions.push(`start-working-on ${params.entityId} - Begin work on this task`);
      } else {
        suggestions.push(`complete-task ${params.entityId} - Mark task as complete`);
        suggestions.push(`log-time entityId:${params.entityId} spent:1.0 - Log time spent`);
      }
    }
    
    if (!params.parentCommentId) {
      suggestions.push(`show-comments entityType:${params.entityType} entityId:${params.entityId} - View all comments`);
    }
  }

  private addBugSuggestions(suggestions: string[], params: AddCommentParams, entityState: any, isAssignedToMe: boolean) {
    if (params.entityType === 'Bug' && isAssignedToMe && !entityState.isFinal) {
      suggestions.push(`show-my-bugs - View all your assigned bugs`);
    }
  }

  private addGeneralSuggestions(suggestions: string[], entity: any, _params: AddCommentParams) {
    if (entity.Project?.Id) {
      suggestions.push(`search-work-items project:"${entity.Project.Name}" - View related work items`);
    }
  }
}