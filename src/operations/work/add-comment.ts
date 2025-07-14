import { z } from 'zod';
import { 
  SemanticOperation, 
  ExecutionContext, 
  OperationResult 
} from '../../core/interfaces/semantic-operation.interface.js';
import { TPService } from '../../api/client/tp.service.js';
import { logger } from '../../utils/logger.js';

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
      
      // Validate and analyze entity with full context
      const entity = await this.fetchEntityWithContext(validatedParams.entityType, validatedParams.entityId);
      if (!entity) {
        return this.createNotFoundResponse(validatedParams.entityType, validatedParams.entityId);
      }

      // Discover comment capabilities for this entity type
      const commentCapabilities = await this.discoverCommentCapabilities(validatedParams.entityType);
      
      // Analyze entity context for intelligent suggestions
      const entityContext = await this.analyzeEntityContext(entity, validatedParams.entityType);
      
      // Generate role-based comment with discovered context
      const formattedComment = await this.generateIntelligentComment(
        validatedParams.comment, 
        context.user.role,
        entity,
        entityContext,
        commentCapabilities
      );
      
      // Create comment with proper error handling
      let comment;
      try {
        comment = await this.service.createComment(
          validatedParams.entityId,
          formattedComment,
          validatedParams.isPrivate,
          validatedParams.parentCommentId
        );
      } catch (commentError) {
        // Provide intelligent fallback guidance
        return this.createCommentErrorResponse(commentError, entity, validatedParams, commentCapabilities);
      }

      // Build response with workflow-aware suggestions
      return this.buildIntelligentResponse(
        entity, 
        comment, 
        validatedParams, 
        context,
        entityContext,
        formattedComment
      );

    } catch (error) {
      // Educational error handling
      if (error instanceof z.ZodError) {
        return this.createValidationErrorResponse(error);
      }
      return this.createDiscoveryErrorResponse(error);
    }
  }


  // New methods for true semantic operation behavior

  private async fetchEntityWithContext(entityType: string, entityId: number): Promise<any> {
    const includes = [
      'EntityState',
      'Project',
      'AssignedUser',
      'Owner',
      'Team',
      'Priority',
      'Severity',
      'Tags',
      'CustomFields',
      'StartDate',
      'EndDate',
      'CreateDate',
      'ModifyDate'
    ];

    // Add type-specific includes
    if (entityType === 'UserStory' || entityType === 'Bug') {
      includes.push('Feature', 'Epic', 'Release');
    }
    if (entityType === 'Task') {
      includes.push('UserStory', 'Iteration');
    }

    try {
      return await this.service.getEntity(entityType, entityId, includes);
    } catch (error) {
      logger.warn(`Failed to fetch entity with full context: ${error}`);
      // Try with minimal includes
      return await this.service.getEntity(entityType, entityId, ['EntityState', 'Project', 'AssignedUser']);
    }
  }

  private async discoverCommentCapabilities(entityType: string): Promise<any> {
    const capabilities: any = {
      supportsPrivateComments: true,
      supportsRichText: true,
      supportsAttachments: false,
      supportsThreading: true,
      commentTypes: [],
      notificationRules: []
    };

    try {
      // Try to discover comment types
      const commentTypes = await this.service.searchEntities(
        'CommentType',
        `EntityType.Name eq '${entityType}'`,
        ['Name', 'Description'],
        10
      ).catch(() => []);

      if (commentTypes.length > 0) {
        capabilities.commentTypes = commentTypes.map((t: any) => ({
          id: t.Id,
          name: t.Name,
          description: t.Description
        }));
      }
    } catch (error) {
      logger.debug('CommentType entity not available in this TP instance');
    }

    // Discover notification patterns (this is illustrative - actual TP may differ)
    try {
      const notifications = await this.service.searchEntities(
        'NotificationRule',
        undefined,
        ['Name', 'EntityType'],
        5
      ).catch(() => []);

      capabilities.notificationRules = notifications.filter((n: any) => 
        n.EntityType?.Name === entityType || n.EntityType?.Name === 'Comment'
      );
    } catch (error) {
      logger.debug('NotificationRule discovery not available');
    }

    return capabilities;
  }

  private async analyzeEntityContext(entity: any, entityType: string): Promise<any> {
    const context: any = {
      workflowStage: {
        currentState: entity.EntityState?.Name || 'Unknown',
        isInitial: entity.EntityState?.IsInitial || false,
        isFinal: entity.EntityState?.IsFinal || false,
        isBlocked: await this.detectIfBlocked(entity)
      },
      teamContext: {
        assignedUsers: this.extractAssignedUsers(entity),
        projectName: entity.Project?.Name || 'Unknown',
        hasAssignees: false
      },
      timing: {
        daysInCurrentState: this.calculateDaysSince(entity.EntityState?.ModifyDate || entity.ModifyDate),
        isOverdue: false
      },
      relatedMetrics: {}
    };

    // Check assignment
    context.teamContext.hasAssignees = context.teamContext.assignedUsers.length > 0;

    // Check if overdue
    if (entity.EndDate) {
      const endDate = new Date(entity.EndDate);
      context.timing.isOverdue = endDate < new Date();
    }

    // Analyze priority/severity
    if (entity.Priority) {
      context.relatedMetrics.priorityLevel = entity.Priority.Importance || 999;
      context.relatedMetrics.priorityName = entity.Priority.Name;
    }
    if (entity.Severity) {
      context.relatedMetrics.severityLevel = entity.Severity.Importance || 999;
      context.relatedMetrics.severityName = entity.Severity.Name;
    }

    return context;
  }

  private async generateIntelligentComment(
    content: string,
    role: string,
    entity: any,
    entityContext: any,
    capabilities: any
  ): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Convert basic markdown to HTML
    const htmlContent = this.convertMarkdownToHtml(content);
    
    // Add contextual prefix based on entity state and role
    let prefix = this.getRolePrefix(role, timestamp);
    
    // Add workflow context if relevant
    if (entityContext.workflowStage.isBlocked && content.toLowerCase().includes('unblock')) {
      prefix += ' 🚧 Unblocking';
    } else if (entityContext.workflowStage.isFinal) {
      prefix += ' ✅ Final State';
    } else if (entityContext.timing.isOverdue) {
      prefix += ' ⚠️ Overdue';
    }

    return `<div><strong>${prefix}</strong></div><div><br/></div><div>${htmlContent}</div>`;
  }

  private getRolePrefix(role: string, timestamp: string): string {
    switch (role) {
      case 'developer':
        return `💻 Developer Update (${timestamp})`;
      case 'tester':
        return `🧪 QA Update (${timestamp})`;
      case 'project-manager':
        return `📋 Project Update (${timestamp})`;
      case 'product-manager':
      case 'product-owner':
        return `🎯 Product Update (${timestamp})`;
      default:
        return `📝 Update (${timestamp})`;
    }
  }

  private async detectIfBlocked(entity: any): Promise<boolean> {
    const blockedIndicators = [
      entity.Tags?.Items?.some((t: any) => t.Name.toLowerCase().includes('blocked')),
      entity.CustomFields?.IsBlocked === true,
      entity.Name?.toLowerCase().includes('blocked'),
      entity.Description?.toLowerCase().includes('waiting for')
    ];
    
    return blockedIndicators.some(indicator => indicator === true);
  }

  private extractAssignedUsers(entity: any): any[] {
    const users: any[] = [];
    
    if (entity.AssignedUser?.Items?.length > 0) {
      entity.AssignedUser.Items.forEach((user: any) => {
        users.push({
          id: user.Id,
          name: `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Unknown'
        });
      });
    } else if (entity.AssignedUser?.Id) {
      users.push({
        id: entity.AssignedUser.Id,
        name: `${entity.AssignedUser.FirstName || ''} ${entity.AssignedUser.LastName || ''}`.trim() || 'Unknown'
      });
    }
    
    return users;
  }

  private calculateDaysSince(date: string | Date): number {
    if (!date) return 0;
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private createNotFoundResponse(entityType: string, entityId: number): OperationResult {
    return {
      content: [{
        type: 'text',
        text: `💡 **Entity Discovery**: Could not find ${entityType} with ID ${entityId}`
      }, {
        type: 'text',
        text: `🔍 **Smart Suggestions:**
• The entity might have been deleted or archived
• You might not have permissions to view this ${entityType}
• The ID might be incorrect

Try these alternatives:`
      }],
      suggestions: [
        `search_entities type:${entityType} - Find available ${entityType}s`,
        `get_entity type:${entityType} id:${entityId} - Get more details about the error`,
        'show-my-tasks - View your assigned work items'
      ]
    };
  }

  private createCommentErrorResponse(
    error: any,
    entity: any,
    params: AddCommentParams,
    capabilities: any
  ): OperationResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      content: [{
        type: 'text',
        text: `💡 **Comment Creation Discovery**: Unable to add comment to ${entity.Name}`
      }, {
        type: 'text',
        text: `🔍 **What we learned:**
• Entity exists and is in ${entity.EntityState?.Name || 'Unknown'} state
• Comment capabilities: ${capabilities.supportsPrivateComments ? 'Private comments supported' : 'Only public comments'}
• Threading: ${capabilities.supportsThreading ? 'Reply threads supported' : 'Flat comments only'}

**Error details:** ${errorMessage}

**Possible causes:**
• Comments might be disabled for ${params.entityType} in ${entity.EntityState?.Name} state
• Parent comment ID ${params.parentCommentId} might not exist
• Your role might not have comment permissions`
      }],
      suggestions: [
        `show-comments entityType:${params.entityType} entityId:${params.entityId} - View existing comments`,
        `get_entity type:Comment id:${params.parentCommentId || 'ID'} - Verify parent comment exists`,
        'inspect_object type:Comment - Learn about comment structure'
      ]
    };
  }

  private createValidationErrorResponse(error: z.ZodError): OperationResult {
    const issues = error.errors.map(e => `• ${e.path.join('.')}: ${e.message}`).join('\n');
    
    return {
      content: [{
        type: 'text',
        text: `❌ **Validation Error**: Invalid parameters for adding comment`
      }, {
        type: 'text',
        text: `**Issues found:**
${issues}

**Valid parameters:**
• entityType: Type of entity (Task, Bug, UserStory, etc.)
• entityId: Numeric ID of the entity
• comment: Your comment text (required, non-empty)
• isPrivate: true/false for private comments (optional)
• parentCommentId: ID of comment to reply to (optional)`
      }],
      suggestions: [
        'show-my-tasks - View your tasks to get valid IDs',
        'show-my-bugs - View your bugs to get valid IDs'
      ]
    };
  }

  private createDiscoveryErrorResponse(error: any): OperationResult {
    return {
      content: [{
        type: 'text',
        text: `⚠️ **Discovery Process Failed**: Unable to analyze entity context`
      }, {
        type: 'text',
        text: `This might mean:
• The TargetProcess API is temporarily unavailable
• Your session might have expired
• Network connectivity issues

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

You can still try adding a basic comment without advanced features.`
      }],
      suggestions: [
        'search_entities type:Task take:1 - Test API connectivity',
        'show-my-tasks - Verify your session is active'
      ]
    };
  }

  private async buildIntelligentResponse(
    entity: any,
    comment: any,
    params: AddCommentParams,
    context: ExecutionContext,
    entityContext: any,
    formattedComment: string
  ): Promise<OperationResult> {
    const suggestions = await this.generateWorkflowAwareSuggestions(
      entity,
      params,
      context,
      entityContext
    );

    const preview = this.extractCommentPreview(formattedComment);
    
    return {
      content: [
        {
          type: 'text',
          text: this.formatIntelligentSuccessMessage(entity, params, entityContext, preview)
        },
        {
          type: 'structured-data',
          data: {
            comment: {
              id: comment.Id,
              entityId: params.entityId,
              entityType: params.entityType,
              isPrivate: params.isPrivate || false,
              parentId: params.parentCommentId,
              preview: preview
            },
            entity: {
              id: entity.Id,
              name: entity.Name,
              type: params.entityType,
              state: entity.EntityState?.Name,
              project: entity.Project?.Name
            },
            context: {
              workflowStage: entityContext.workflowStage.currentState,
              isBlocked: entityContext.workflowStage.isBlocked,
              daysInState: entityContext.timing.daysInCurrentState,
              assigneeCount: entityContext.teamContext.assignedUsers.length
            }
          }
        }
      ],
      suggestions: suggestions,
      affectedEntities: [{
        id: params.entityId,
        type: params.entityType,
        action: 'updated' as const
      }]
    };
  }

  private extractCommentPreview(htmlComment: string): string {
    // Strip HTML tags for preview
    const textOnly = htmlComment.replace(/<[^>]*>/g, ' ').trim();
    return textOnly.length > 100 ? textOnly.substring(0, 100) + '...' : textOnly;
  }

  private formatIntelligentSuccessMessage(
    entity: any,
    params: AddCommentParams,
    context: any,
    preview: string
  ): string {
    let message = `✅ Comment added to ${entity.Name}`;
    
    // Add context-aware information
    if (params.isPrivate) {
      message += ' 🔒 (Private)';
    }
    if (params.parentCommentId) {
      message += ` 💬 (Reply to #${params.parentCommentId})`;
    }
    
    message += `\n\n📋 **Current State:** ${context.workflowStage.currentState}`;
    
    if (context.workflowStage.isBlocked) {
      message += ' 🚧 (Blocked)';
    }
    if (context.timing.isOverdue) {
      message += ' ⚠️ (Overdue)';
    }
    
    message += `\n💬 **Preview:** "${preview}"`;
    
    if (context.teamContext.assignedUsers.length === 0) {
      message += `\n\n⚠️ **Note:** This ${params.entityType} is currently unassigned`;
    }
    
    return message;
  }

  private async generateWorkflowAwareSuggestions(
    entity: any,
    params: AddCommentParams,
    context: ExecutionContext,
    entityContext: any
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Context-aware suggestions based on entity state
    if (entityContext.workflowStage.isInitial && entityContext.teamContext.assignedUsers.length === 0) {
      suggestions.push(`assign-to user:"${context.user.name}" - Assign this ${params.entityType} to yourself`);
    }
    
    if (entityContext.workflowStage.isBlocked) {
      suggestions.push(`search_entities type:${params.entityType} where:"Tags.Name contains 'blocked'" - Find other blocked items`);
      suggestions.push('escalate-to-manager - Escalate this blocker');
    }
    
    if (!entityContext.workflowStage.isFinal && entityContext.teamContext.hasAssignees) {
      const isAssignedToMe = entityContext.teamContext.assignedUsers.some(
        (u: any) => u.id === context.user.id
      );
      
      if (isAssignedToMe) {
        if (params.entityType === 'Task') {
          suggestions.push(`start-working-on ${params.entityId} - Begin work on this task`);
        }
        suggestions.push(`update-progress entityId:${params.entityId} - Update progress`);
      }
    }
    
    // Comment-specific suggestions
    suggestions.push(`show-comments entityType:${params.entityType} entityId:${params.entityId} - View all comments`);
    
    if (entityContext.timing.daysInCurrentState > 5) {
      suggestions.push(`analyze-blockers entityId:${params.entityId} - Identify why this is taking longer than usual`);
    }
    
    // Project-level suggestions
    if (entity.Project?.Id) {
      suggestions.push(`search-work-items project:"${entity.Project.Name}" state:"${entityContext.workflowStage.currentState}" - Find similar items`);
    }
    
    return suggestions;
  }
}