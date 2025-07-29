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
   * Discover and get role-specific comment templates
   */
  async getTemplates(role: string, entityType: string, entityContext: any): Promise<any[]> {
    const templates: any[] = [];
    
    try {
      // Try to discover comment templates from TP instance
      const discoveredTemplates = await this.service.searchEntities(
        'CommentTemplate',
        `(EntityType.Name eq '${entityType}' or EntityType eq null) and (Role.Name eq '${role}' or Role eq null)`,
        ['Name', 'Description', 'Content', 'Role', 'EntityType'],
        20
      ).catch(() => []);

      if (discoveredTemplates.length > 0) {
        return discoveredTemplates.map((t: any) => ({
          id: t.Id,
          name: t.Name,
          description: t.Description,
          content: t.Content,
          isDefault: t.Role?.Name === role && t.EntityType?.Name === entityType
        }));
      }
    } catch (error) {
      logger.debug('CommentTemplate entity not available, using defaults');
    }

    // Fallback to intelligent defaults based on role and context
    return this.getDefaultTemplates(role, entityType, entityContext);
  }

  private getDefaultTemplates(role: string, entityType: string, entityContext: any): any[] {
    const templates: any[] = [];
    const isBlocked = entityContext?.workflowStage?.isBlocked;
    const isInitial = entityContext?.workflowStage?.isInitial;
    const isFinal = entityContext?.workflowStage?.isFinal;

    // Base templates for all roles
    if (isBlocked) {
      templates.push({
        name: 'Unblocking Update',
        content: 'Resolved blocker: [describe what was blocking and how it was resolved]',
        priority: 1
      });
    }

    // Role-specific templates
    switch (role) {
      case 'developer':
        if (entityType === 'Bug') {
          templates.push(
            { name: 'Bug Fixed', content: `Fixed: [root cause]\nSolution: [what was changed]\nTesting: [how to verify]`, priority: 1 },
            { name: 'Cannot Reproduce', content: `Unable to reproduce on [environment]\nSteps tried: [list steps]\nNeed more info: [what's needed]`, priority: 2 }
          );
        }
        if (entityType === 'Task') {
          templates.push(
            { name: 'Implementation Complete', content: `Completed: [what was implemented]\nCode location: [files/modules]\nNext steps: [testing/review needed]`, priority: 1 },
            { name: 'Code Review', content: `Review feedback:\n✅ Good: [positive aspects]\n⚠️ Concerns: [issues found]\n💡 Suggestions: [improvements]`, priority: 2 }
          );
        }
        templates.push(
          { name: 'Technical Blocker', content: `Blocked by: [technical issue]\nAttempted solutions: [what was tried]\nHelp needed: [specific assistance required]`, priority: 3 },
          { name: 'Progress Update', content: `Progress: [percentage]%\nCompleted: [what's done]\nRemaining: [what's left]\nETA: [estimated completion]`, priority: 4 }
        );
        break;
      
      case 'tester':
        templates.push(
          { name: 'Test Pass', content: `✅ Testing PASSED\nEnvironment: [test env]\nScenarios tested: [list]\nEvidence: [screenshots/logs attached]`, priority: 1 },
          { name: 'Test Fail', content: `❌ Testing FAILED\nEnvironment: [test env]\nFailure: [what failed]\nSteps to reproduce:\n1. [step 1]\n2. [step 2]\nExpected: [expected result]\nActual: [actual result]`, priority: 1 },
          { name: 'Regression Found', content: `🐛 Regression detected\nWorking in: [previous version]\nBroken in: [current version]\nImpact: [severity and affected areas]`, priority: 2 }
        );
        if (entityType === 'Bug') {
          templates.push(
            { name: 'Bug Verified', content: `Verified fixed in [version/environment]\nTest steps: [verification steps]\nNo regression found`, priority: 1 }
          );
        }
        break;
      
      case 'project-manager':
        templates.push(
          { name: 'Status Report', content: `Status: [Red/Yellow/Green]\nProgress: [summary]\nBlockers: [list blockers]\nNext milestone: [date and deliverable]`, priority: 1 },
          { name: 'Risk Alert', content: `⚠️ Risk identified: [risk description]\nImpact: [potential impact]\nProbability: [High/Medium/Low]\nMitigation: [proposed actions]`, priority: 2 },
          { name: 'Team Update', content: `Team update:\n- [team member 1]: [status]\n- [team member 2]: [status]\nOverall velocity: [on track/behind/ahead]`, priority: 3 }
        );
        if (isFinal) {
          templates.push(
            { name: 'Completion Report', content: `✅ Completed\nDelivered: [what was delivered]\nLessons learned: [key takeaways]\nFollow-up items: [if any]`, priority: 1 }
          );
        }
        break;
      
      case 'product-owner':
      case 'product-manager':
        templates.push(
          { name: 'Requirement Clarification', content: `Clarification on requirement:\nOriginal: [original requirement]\nClarified: [updated requirement]\nReason: [why the change]`, priority: 1 },
          { name: 'Stakeholder Decision', content: `Decision: [decision made]\nStakeholders: [who was involved]\nRationale: [business reasoning]\nImpact: [what this affects]`, priority: 2 },
          { name: 'Priority Adjustment', content: `Priority changed: [old] → [new]\nReason: [business justification]\nImpact on roadmap: [timeline changes]`, priority: 3 }
        );
        if (isInitial) {
          templates.push(
            { 
              name: 'Acceptance Criteria', 
              content: 'Acceptance Criteria:\n' +
                '1. Given [context], When [action], Then [outcome]\n' +
                '2. Given [context], When [action], Then [outcome]\n\n' +
                'Definition of Done:\n' +
                '- [ ] [criterion 1]\n' +
                '- [ ] [criterion 2]', 
              priority: 1 
            }
          );
        }
        break;
    }

    // Add generic templates for all
    templates.push(
      { name: 'Custom', content: '', priority: 99 },
      { name: 'Question', content: 'Question: [your question]\nContext: [why you\'re asking]\nNeeded by: [when you need answer]', priority: 98 }
    );

    return templates.sort((a, b) => a.priority - b.priority);
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
   * Convert rich markdown to HTML for TargetProcess with enhanced features
   */
  private convertMarkdownToHtml(content: string, options?: any): string {
    let html = content;
    
    // Code blocks with syntax highlighting
    if (options?.codeLanguage) {
      html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || options.codeLanguage || 'text';
        return `<div class="code-block" data-language="${language}"><pre><code>${this.escapeHtml(code.trim())}</code></pre></div>`;
      });
    } else {
      // Simple code blocks
      html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    }
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // User mentions
    if (options?.mentions?.length > 0) {
      options.mentions.forEach((user: any) => {
        const mentionPattern = new RegExp(`@${user.name}|@${user.login}`, 'gi');
        html = html.replace(mentionPattern, `<span class="mention" data-user-id="${user.id}">@${user.name}</span>`);
      });
    }
    
    // Links to commits/PRs
    if (options?.linkedCommit) {
      html = html.replace(/commit:(\w+)/gi, `<a href="#" class="commit-link" data-commit="${options.linkedCommit}">commit:${options.linkedCommit.substring(0, 7)}</a>`);
    }
    if (options?.linkedPR) {
      html = html.replace(/PR#(\d+)/gi, `<a href="${options.linkedPR}" class="pr-link">PR#$1</a>`);
    }
    
    // Tables (GitHub-flavored markdown)
    html = html.replace(/\n\|(.+)\|\n\|(:?-+:?\|)+\n((?:\|.+\|\n?)+)/g, (match, header, separator, body) => {
      const headers = header.split('|').filter(Boolean).map((h: string) => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });
    
    // Checklists
    html = html.replace(/^- \[([ x])\] (.+)$/gm, (match, checked, text) => {
      const isChecked = checked.toLowerCase() === 'x';
      return `<div class="checklist-item"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled> ${text}</div>`;
    });
    
    // Bold and italic (order matters)
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Lists
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)(?!.*<\/[uo]l>)/s, '<ol>$1</ol>');
    
    // Line breaks and paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br/>');
    
    // Wrap in div for TargetProcess
    html = `<div>${html}</div>`;
    
    // Attachments section
    if (options?.attachments?.length > 0) {
      const attachmentHtml = options.attachments.map((att: any) => 
        `<div class="attachment">📎 ${att.description || att.path}</div>`
      ).join('');
      html += `<div class="attachments-section"><hr/><strong>Attachments:</strong>${attachmentHtml}</div>`;
    }
    
    return html;
  }
  
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  async execute(context: ExecutionContext, params: AddCommentParams): Promise<OperationResult> {
    const startTime = Date.now();
    
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
      
      // Get available templates
      const availableTemplates = await this.getTemplates(context.user.role, validatedParams.entityType, entityContext);
      
      // Process mentions if provided
      const mentionedUsers = validatedParams.mentions ? 
        await this.resolveMentions(validatedParams.mentions) : [];
      
      // Apply template if requested
      let processedComment = validatedParams.comment;
      if (validatedParams.useTemplate) {
        const template = availableTemplates.find(t => t.name === validatedParams.useTemplate);
        if (template) {
          processedComment = this.applyTemplate(template.content, validatedParams.comment);
        }
      }
      
      // Generate role-based comment with discovered context
      const formattedComment = await this.generateIntelligentComment(
        processedComment, 
        context.user.role,
        entity,
        entityContext,
        commentCapabilities,
        {
          mentions: mentionedUsers,
          codeLanguage: validatedParams.codeLanguage,
          linkedCommit: validatedParams.linkedCommit,
          linkedPR: validatedParams.linkedPR,
          attachments: validatedParams.attachments
        }
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
        formattedComment,
        startTime
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
    capabilities: any,
    options?: any
  ): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const startTime = Date.now();
    
    // Convert rich markdown to HTML with all features
    const htmlContent = this.convertMarkdownToHtml(content, options);
    
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
    
    // Add performance metric
    const processingTime = Date.now() - startTime;
    logger.debug(`Comment formatting took ${processingTime}ms`);

    return `<div><strong>${prefix}</strong></div><div><br/></div>${htmlContent}`;
  }
  
  private async resolveMentions(mentions: string[]): Promise<any[]> {
    const resolvedUsers: any[] = [];
    
    for (const mention of mentions) {
      try {
        // Try to find user by name or login
        const users = await this.service.searchEntities(
          'GeneralUser',
          `(FirstName contains '${mention}') or (LastName contains '${mention}') or (Login eq '${mention}') or (Email eq '${mention}')`,
          ['FirstName', 'LastName', 'Login', 'Email'],
          5
        );
        
        if (users.length > 0) {
          const user = users[0] as any;
          resolvedUsers.push({
            id: user.Id,
            name: `${user.FirstName || ''} ${user.LastName || ''}`.trim(),
            login: user.Login,
            email: user.Email
          });
        }
      } catch (error) {
        logger.warn(`Failed to resolve mention for ${mention}`);
      }
    }
    
    return resolvedUsers;
  }
  
  private applyTemplate(templateContent: string, userInput: string): string {
    // Simple template application - replace first placeholder or append
    if (templateContent.includes('[')) {
      // Replace first placeholder with user input
      return templateContent.replace(/\[.*?\]/, userInput);
    } else {
      // Append user input to template
      return `${templateContent}\n\n${userInput}`;
    }
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
    const issues = error.issues.map((e: z.ZodIssue) => `• ${e.path.join('.')}: ${e.message}`).join('\n');
    
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
    formattedComment: string,
    startTime?: number
  ): Promise<OperationResult> {
    const suggestions = await this.generateWorkflowAwareSuggestions(
      entity,
      params,
      context,
      entityContext
    );

    const preview = this.extractCommentPreview(formattedComment);
    const executionTime = startTime ? Date.now() - startTime : 0;
    
    // Get available templates for suggestions
    const templates = await this.getTemplates(context.user.role, params.entityType, entityContext);
    const templateNames = templates.slice(0, 3).map(t => t.name);
    
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
              preview: preview,
              hasAttachments: (params.attachments?.length || 0) > 0,
              hasMentions: (params.mentions?.length || 0) > 0,
              hasCodeBlock: params.codeLanguage ? true : false
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
            },
            templates: {
              available: templateNames,
              count: templates.length
            }
          }
        }
      ],
      suggestions: suggestions,
      affectedEntities: [{
        id: params.entityId,
        type: params.entityType,
        action: 'updated' as const
      }],
      metadata: {
        executionTime: executionTime,
        apiCallsCount: 5, // Approximate based on operations
        cacheHits: 0
      }
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
    
    // Template suggestions based on role and context
    const templates = await this.getTemplates(context.user.role, params.entityType, entityContext);
    if (templates.length > 0 && !params.useTemplate) {
      const topTemplate = templates[0];
      suggestions.push(`add-comment entityType:${params.entityType} entityId:${params.entityId} useTemplate:"${topTemplate.name}" - Use ${topTemplate.name} template`);
    }
    
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
    
    // Code and documentation suggestions for developers
    if (context.user.role === 'developer' && params.entityType === 'Task') {
      suggestions.push(`add-comment entityType:${params.entityType} entityId:${params.entityId} codeLanguage:javascript - Add code snippet`);
      if (params.linkedCommit) {
        suggestions.push(`search_entities type:Task where:"Description contains '${params.linkedCommit}'" - Find related tasks`);
      }
    }
    
    // Testing suggestions for testers
    if (context.user.role === 'tester' && params.entityType === 'Bug') {
      suggestions.push(`add-comment entityType:${params.entityType} entityId:${params.entityId} attachments:[{path:"screenshot.png"}] - Add test evidence`);
    }
    
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