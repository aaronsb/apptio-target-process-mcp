import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation, OperationResult } from '../../core/interfaces/semantic-operation.interface.js';
import { logger } from '../../utils/logger.js';

export const showCommentsSchema = z.object({
  entityType: z.string().describe('Type of entity to show comments for (Task, Bug, UserStory, etc.)'),
  entityId: z.coerce.number().describe('ID of the entity to show comments for'),
  includePrivate: z.boolean().optional().default(true).describe('Whether to include private comments (default: true)'),
  filter: z.enum(['all', 'recent', 'mine', 'mentions', 'unread']).optional().default('all').describe('Filter comments by criteria'),
  groupBy: z.enum(['none', 'date', 'author', 'type']).optional().default('none').describe('Group comments by criteria'),
  sortOrder: z.enum(['newest', 'oldest', 'relevance']).optional().default('newest').describe('Sort order for comments'),
  limit: z.number().optional().default(50).describe('Maximum number of comments to retrieve')
});

export type ShowCommentsParams = z.infer<typeof showCommentsSchema>;

/**
 * Show Comments Semantic Operation
 * 
 * A semantic operation that intelligently displays comments with context awareness,
 * role-based insights, and workflow intelligence.
 * 
 * Semantic Features:
 * - Dynamic Discovery: Discovers comment types, notification rules, and patterns
 * - Entity Context: Analyzes entity state to provide relevant comment insights
 * - Role-Based Intelligence: Adapts display and suggestions based on user role
 * - Smart Filtering: Intelligent filtering based on relevance and context
 * - Pattern Recognition: Identifies comment patterns (blockers, decisions, etc.)
 * - Workflow Awareness: Suggests actions based on comment content
 * - Collaboration Insights: Highlights important discussions and decisions
 * 
 * Technical Features:
 * - Hierarchical comment organization with thread visualization
 * - Rich text rendering with proper formatting
 * - User mention highlighting and resolution
 * - Attachment and link detection
 * - Performance tracking (<500ms target)
 * - Graceful degradation on discovery failures
 */
export class ShowCommentsOperation implements SemanticOperation<ShowCommentsParams> {
  private readonly PERFORMANCE_TARGET = 500; // ms
  
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'show-comments',
      name: 'Show Comments',
      description: 'View comments with intelligent context awareness, role-based insights, and workflow suggestions',
      category: 'collaboration',
      requiredPersonalities: ['default', 'developer', 'tester', 'project-manager', 'product-owner'],
      examples: [
        'Show comments for task 123',
        'View recent comments on bug 456',
        'Show my comments on story 789',
        'List unread comments for epic 101',
        'Show comments mentioning me in task 202'
      ],
      tags: ['comment', 'communication', 'collaboration', 'discussion', 'feedback', 'review']
    };
  }

  getSchema() {
    return showCommentsSchema;
  }

  async execute(context: ExecutionContext, params: ShowCommentsParams): Promise<OperationResult> {
    const startTime = Date.now();
    
    try {
      // Parse and validate parameters
      const validatedParams = showCommentsSchema.parse(params);
      
      // Fetch entity context and comments in parallel
      const [entity, comments, capabilities] = await Promise.all([
        this.fetchEntityWithContext(validatedParams.entityType, validatedParams.entityId),
        this.service.getComments(validatedParams.entityType, validatedParams.entityId),
        this.discoverCommentCapabilities(validatedParams.entityType)
      ]);
      
      if (!entity) {
        return this.generateEntityNotFoundResult(validatedParams, context);
      }
      
      if (!comments || comments.length === 0) {
        return this.generateNoCommentsResult(entity, validatedParams, context);
      }

      // Analyze entity context for intelligent insights
      const entityContext = await this.analyzeEntityContext(entity, validatedParams.entityType);
      
      // Apply intelligent filtering based on params and context
      const filteredComments = await this.applyIntelligentFiltering(
        comments, 
        validatedParams, 
        context, 
        entityContext
      );
      
      // Analyze comment patterns and insights
      const commentInsights = await this.analyzeCommentPatterns(
        filteredComments,
        context.user,
        entityContext
      );
      
      // Organize comments with enhanced metadata
      const organizedComments = this.organizeCommentsWithContext(
        filteredComments,
        commentInsights,
        validatedParams
      );
      
      // Generate role-based display
      const display = await this.generateRoleBasedDisplay(
        organizedComments,
        entity,
        entityContext,
        commentInsights,
        context,
        validatedParams
      );
      
      // Track performance
      const executionTime = Date.now() - startTime;
      if (executionTime > this.PERFORMANCE_TARGET) {
        logger.warn(`ShowComments performance warning: ${executionTime}ms`);
      }
      
      // Add performance data to structured content instead of metadata
      const performanceData = {
        type: 'structured-data' as const,
        data: {
          performance: {
            executionTime,
            totalComments: comments.length,
            displayedComments: filteredComments.length,
            insights: commentInsights,
            capabilities: capabilities,
            target: this.PERFORMANCE_TARGET,
            actual: executionTime,
            withinTarget: executionTime <= this.PERFORMANCE_TARGET
          }
        }
      };
      
      return {
        content: [...display.content, performanceData],
        suggestions: display.suggestions,
        metadata: {
          executionTime,
          apiCallsCount: 3, // entity, comments, capabilities
          cacheHits: 0
        }
      };
    } catch (error) {
      logger.error('ShowComments operation failed:', error);
      return this.generateErrorResult(error, params, context);
    }
  }

  /**
   * Fetch entity with full context
   */
  private async fetchEntityWithContext(entityType: string, entityId: number): Promise<any> {
    try {
      const includes = [
        'EntityState', 
        'Project', 
        'Team', 
        'Priority', 
        'AssignedUser',
        'Tags',
        'CustomFields'
      ];
      
      // Add type-specific includes
      if (entityType === 'Bug') {
        includes.push('Severity', 'BuildFound', 'BuildFixed');
      } else if (entityType === 'UserStory' || entityType === 'Feature') {
        includes.push('Feature', 'Epic');
      }
      
      return await this.service.getEntity(entityType, entityId, includes);
    } catch (error) {
      logger.warn(`Failed to fetch entity with full context: ${error}`);
      // Try with minimal includes as fallback
      try {
        return await this.service.getEntity(entityType, entityId, ['EntityState', 'Project', 'AssignedUser']);
      } catch (fallbackError) {
        logger.error(`Failed to fetch entity ${entityType} ${entityId} even with minimal includes:`, fallbackError);
        return null;
      }
    }
  }
  
  /**
   * Discover comment-related capabilities dynamically
   */
  private async discoverCommentCapabilities(entityType: string): Promise<any> {
    const capabilities: any = {
      hasCommentTypes: false,
      hasNotificationRules: false,
      hasMentions: true, // Assume mentions work
      hasAttachments: true, // Assume attachments work
      discoveryTime: 0
    };
    
    const discoveryStart = Date.now();
    
    try {
      // Try to discover comment types and notification rules in parallel
      const [commentTypes, notificationRules] = await Promise.all([
        this.service.searchEntities(
          'CommentType',
          `EntityType.Name eq '${entityType}'`,
          ['Name', 'Description'],
          5
        ).catch(() => []),
        
        this.service.searchEntities(
          'NotificationRule',
          `EntityType.Name contains 'Comment'`,
          ['Name', 'IsActive'],
          5
        ).catch(() => [])
      ]);
      
      capabilities.hasCommentTypes = commentTypes.length > 0;
      capabilities.commentTypes = commentTypes;
      capabilities.hasNotificationRules = notificationRules.length > 0;
      capabilities.notificationRules = notificationRules;
      
    } catch (error) {
      logger.debug('Comment capability discovery failed:', error);
    }
    
    capabilities.discoveryTime = Date.now() - discoveryStart;
    return capabilities;
  }
  
  /**
   * Analyze entity context for intelligent insights
   */
  private async analyzeEntityContext(entity: any, entityType: string): Promise<any> {
    const context: any = {
      workflowStage: {
        current: entity.EntityState?.Name || 'Unknown',
        isInitial: entity.EntityState?.IsInitial || false,
        isFinal: entity.EntityState?.IsFinal || false,
        isBlocked: false,
        isOverdue: false,
        lastStateChange: entity.EntityState?.ModifyDate
      },
      assignment: {
        isAssigned: !!entity.AssignedUser,
        assignedTo: entity.AssignedUser?.Items?.map((u: any) => ({
          id: u.Id,
          name: `${u.FirstName} ${u.LastName}`.trim()
        })) || [],
        team: entity.Team?.Name
      },
      priority: {
        level: entity.Priority?.Name || 'Normal',
        importance: entity.Priority?.Importance || 999
      },
      timing: {
        age: this.calculateAge(entity.CreateDate),
        lastModified: this.calculateAge(entity.ModifyDate),
        dueDate: entity.EndDate,
        isOverdue: this.isOverdue(entity.EndDate)
      },
      relationships: {
        project: entity.Project?.Name,
        iteration: entity.Iteration?.Name,
        epic: entity.Epic?.Name,
        feature: entity.Feature?.Name
      }
    };
    
    // Check for blocked status
    if (entity.Tags?.Items?.some((tag: any) => 
      tag.Name?.toLowerCase().includes('block') || 
      tag.Name?.toLowerCase().includes('stuck')
    )) {
      context.workflowStage.isBlocked = true;
    }
    
    // Add type-specific context
    if (entityType === 'Bug' && entity.Severity) {
      context.severity = {
        level: entity.Severity.Name,
        importance: entity.Severity.Importance || 999,
        isCritical: entity.Severity.Importance === 1
      };
    }
    
    return context;
  }
  
  /**
   * Apply intelligent filtering based on parameters and context
   */
  private async applyIntelligentFiltering(
    comments: any[], 
    params: ShowCommentsParams, 
    context: ExecutionContext,
    entityContext: any
  ): Promise<any[]> {
    let filtered = [...comments];
    
    // Filter by privacy settings
    if (!params.includePrivate) {
      filtered = filtered.filter(c => !c.IsPrivate);
    }
    
    // Apply smart filters
    switch (params.filter) {
      case 'recent': {
        // Show comments from last 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(c => {
          const date = this.parseDate(c.CreateDate);
          return date > weekAgo;
        });
        break;
      }
        
      case 'mine':
        // Show user's own comments
        filtered = filtered.filter(c => 
          c.Owner?.Id === context.user.id || 
          c.User?.Id === context.user.id
        );
        break;
        
      case 'mentions':
        // Show comments that might mention the user
        filtered = filtered.filter(c => {
          const content = this.cleanHtmlDescription(c.Description).toLowerCase();
          const userName = context.user.name?.toLowerCase() || '';
          const userEmail = context.user.email?.toLowerCase() || '';
          
          return content.includes(userName) || 
                 content.includes(userEmail) ||
                 content.includes('@' + userName);
        });
        break;
        
      case 'unread': {
        // Simulate unread by showing recent comments not by user
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        filtered = filtered.filter(c => {
          const date = this.parseDate(c.CreateDate);
          const isRecent = date > dayAgo;
          const isNotMine = c.Owner?.Id !== context.user.id;
          return isRecent && isNotMine;
        });
        break;
      }
    }
    
    // Apply sorting
    filtered = this.applySorting(filtered, params.sortOrder, entityContext);
    
    // Apply limit
    if (params.limit > 0) {
      filtered = filtered.slice(0, params.limit);
    }
    
    return filtered;
  }
  
  /**
   * Apply intelligent sorting
   */
  private applySorting(comments: any[], sortOrder: string, _entityContext: any): any[] {
    const sorted = [...comments];
    
    switch (sortOrder) {
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = this.parseDate(a.CreateDate);
          const dateB = this.parseDate(b.CreateDate);
          return dateA.getTime() - dateB.getTime();
        });
        
      case 'relevance':
        // Sort by relevance based on context
        return sorted.sort((a, b) => {
          let scoreA = 0, scoreB = 0;
          
          // Recent comments are more relevant
          const ageA = this.calculateAge(a.CreateDate);
          const ageB = this.calculateAge(b.CreateDate);
          if (ageA < 1) scoreA += 3;
          if (ageB < 1) scoreB += 3;
          
          // Comments with mentions are relevant
          const contentA = this.cleanHtmlDescription(a.Description).toLowerCase();
          const contentB = this.cleanHtmlDescription(b.Description).toLowerCase();
          if (contentA.includes('@')) scoreA += 2;
          if (contentB.includes('@')) scoreB += 2;
          
          // Comments about blockers are relevant
          if (contentA.includes('block')) scoreA += 2;
          if (contentB.includes('block')) scoreB += 2;
          
          // Longer comments might be more substantial
          if (contentA.length > 200) scoreA += 1;
          if (contentB.length > 200) scoreB += 1;
          
          return scoreB - scoreA;
        });
        
      case 'newest':
      default:
        return sorted.sort((a, b) => {
          const dateA = this.parseDate(a.CreateDate);
          const dateB = this.parseDate(b.CreateDate);
          return dateB.getTime() - dateA.getTime();
        });
    }
  }

  /**
   * Analyze comment patterns for insights
   */
  private async analyzeCommentPatterns(
    comments: any[], 
    _user: any,
    _entityContext: any
  ): Promise<any> {
    const insights: any = {
      patterns: [],
      statistics: {
        total: comments.length,
        byAuthor: new Map(),
        byDate: new Map(),
        averageLength: 0,
        totalLength: 0
      },
      keyDiscussions: [],
      decisions: [],
      blockers: [],
      mentions: []
    };
    
    let totalLength = 0;
    
    for (const comment of comments) {
      const content = this.cleanHtmlDescription(comment.Description).toLowerCase();
      const author = this.extractUserName(comment);
      const date = this.parseDate(comment.CreateDate);
      const dateKey = date.toISOString().split('T')[0];
      
      // Track statistics
      totalLength += content.length;
      insights.statistics.byAuthor.set(
        author, 
        (insights.statistics.byAuthor.get(author) || 0) + 1
      );
      insights.statistics.byDate.set(
        dateKey,
        (insights.statistics.byDate.get(dateKey) || 0) + 1
      );
      
      // Pattern detection
      if (content.includes('block') || content.includes('stuck') || content.includes('waiting')) {
        insights.blockers.push({
          commentId: comment.Id,
          author,
          date,
          excerpt: this.extractExcerpt(content, ['block', 'stuck', 'waiting'])
        });
      }
      
      if (content.includes('decided') || content.includes('decision') || content.includes('agreed')) {
        insights.decisions.push({
          commentId: comment.Id,
          author,
          date,
          excerpt: this.extractExcerpt(content, ['decided', 'decision', 'agreed'])
        });
      }
      
      if (content.includes('@')) {
        const mentions = this.extractMentions(content);
        insights.mentions.push(...mentions.map(m => ({
          commentId: comment.Id,
          author,
          date,
          mentioned: m
        })));
      }
      
      // Identify key discussions (long threads or many participants)
      if (comment.replies && comment.replies.length > 2) {
        insights.keyDiscussions.push({
          commentId: comment.Id,
          author,
          date,
          replyCount: comment.replies.length,
          participants: this.getUniqueParticipants(comment)
        });
      }
    }
    
    insights.statistics.averageLength = comments.length > 0 
      ? Math.round(totalLength / comments.length) 
      : 0;
    insights.statistics.totalLength = totalLength;
    
    // Convert Maps to objects for serialization
    insights.statistics.byAuthor = Object.fromEntries(insights.statistics.byAuthor);
    insights.statistics.byDate = Object.fromEntries(insights.statistics.byDate);
    
    return insights;
  }
  
  /**
   * Organize comments with enhanced context
   */
  private organizeCommentsWithContext(
    comments: any[],
    insights: any,
    params: ShowCommentsParams
  ): any[] {
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map with enhanced metadata
    comments.forEach(comment => {
      const enhanced = {
        ...comment,
        replies: [],
        metadata: {
          isBlocker: insights.blockers.some((b: any) => b.commentId === comment.Id),
          isDecision: insights.decisions.some((d: any) => d.commentId === comment.Id),
          hasMentions: insights.mentions.some((m: any) => m.commentId === comment.Id),
          isKeyDiscussion: insights.keyDiscussions.some((k: any) => k.commentId === comment.Id)
        }
      };
      commentMap.set(comment.Id, enhanced);
    });

    // Second pass: organize hierarchy
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.Id);
      
      if (comment.ParentId === null || comment.ParentId === undefined) {
        rootComments.push(commentWithReplies);
      } else {
        const parent = commentMap.get(comment.ParentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        } else {
          // Orphaned reply - add as root
          rootComments.push(commentWithReplies);
        }
      }
    });
    
    // Apply grouping if requested
    if (params.groupBy !== 'none') {
      return this.groupComments(rootComments, params.groupBy);
    }

    return rootComments;
  }
  
  /**
   * Group comments by specified criteria
   */
  private groupComments(comments: any[], groupBy: string): any[] {
    switch (groupBy) {
      case 'date': {
        const byDate = new Map<string, any[]>();
        comments.forEach(comment => {
          const date = this.parseDate(comment.CreateDate);
          const dateKey = date.toISOString().split('T')[0];
          if (!byDate.has(dateKey)) {
            byDate.set(dateKey, []);
          }
          byDate.get(dateKey)!.push(comment);
        });
        return Array.from(byDate.entries()).map(([date, comments]) => ({
          groupType: 'date',
          groupValue: date,
          comments
        }));
      }
        
      case 'author': {
        const byAuthor = new Map<string, any[]>();
        comments.forEach(comment => {
          const author = this.extractUserName(comment);
          if (!byAuthor.has(author)) {
            byAuthor.set(author, []);
          }
          byAuthor.get(author)!.push(comment);
        });
        return Array.from(byAuthor.entries()).map(([author, comments]) => ({
          groupType: 'author',
          groupValue: author,
          comments
        }));
      }
        
      case 'type': {
        const byType = {
          decisions: [] as any[],
          blockers: [] as any[],
          mentions: [] as any[],
          discussions: [] as any[],
          general: [] as any[]
        };
        
        comments.forEach(comment => {
          if (comment.metadata.isDecision) {
            byType.decisions.push(comment);
          } else if (comment.metadata.isBlocker) {
            byType.blockers.push(comment);
          } else if (comment.metadata.hasMentions) {
            byType.mentions.push(comment);
          } else if (comment.metadata.isKeyDiscussion) {
            byType.discussions.push(comment);
          } else {
            byType.general.push(comment);
          }
        });
        
        return Object.entries(byType)
          .filter(([_, comments]) => comments.length > 0)
          .map(([type, comments]) => ({
            groupType: 'type',
            groupValue: type,
            comments
          }));
      }
        
      default:
        return comments;
    }
  }

  /**
   * Generate role-based display with intelligent formatting
   */
  private async generateRoleBasedDisplay(
    comments: any[],
    entity: any,
    entityContext: any,
    insights: any,
    context: ExecutionContext,
    params: ShowCommentsParams
  ): Promise<{ content: any[], suggestions: string[] }> {
    const content: any[] = [];
    const role = context.personality?.mode || context.user.role || 'default';
    
    // Generate header with context
    const header = this.generateContextualHeader(entity, entityContext, insights, params);
    content.push({
      type: 'text' as const,
      text: header
    });
    
    // Add insights summary if relevant
    if (insights.blockers.length > 0 || insights.decisions.length > 0 || insights.keyDiscussions.length > 0) {
      content.push({
        type: 'text' as const,
        text: this.generateInsightsSummary(insights, role)
      });
    }
    
    // Format comments based on grouping
    const formattedComments = this.formatCommentsForRole(comments, role, params, insights);
    content.push({
      type: 'text' as const,
      text: formattedComments
    });
    
    // Add structured data
    content.push({
      type: 'structured-data' as const,
      data: {
        entity: {
          type: params.entityType,
          id: params.entityId,
          name: entity.Name,
          state: entityContext.workflowStage.current
        },
        comments: comments,
        insights: insights,
        filters: {
          applied: params.filter,
          groupBy: params.groupBy,
          sortOrder: params.sortOrder,
          includePrivate: params.includePrivate
        },
        metadata: {
          totalComments: insights.statistics.total,
          displayedComments: comments.length,
          hasMore: comments.length < insights.statistics.total
        }
      }
    });
    
    // Generate role-specific suggestions
    const suggestions = this.generateRoleBasedSuggestions(
      entity,
      entityContext,
      insights,
      role,
      params
    );
    
    return { content, suggestions };
  }
  
  /**
   * Generate contextual header for comment display
   */
  private generateContextualHeader(
    entity: any,
    entityContext: any,
    insights: any,
    params: ShowCommentsParams
  ): string {
    const parts: string[] = [];
    
    // Main header
    const emoji = this.getEntityEmoji(params.entityType);
    parts.push(`${emoji} **Comments for ${params.entityType} #${params.entityId}** - ${entity.Name}`);
    
    // Context indicators
    const contextIndicators: string[] = [];
    
    if (entityContext.workflowStage.isBlocked) {
      contextIndicators.push('🚧 Blocked');
    }
    if (entityContext.timing.isOverdue) {
      contextIndicators.push('⚠️ Overdue');
    }
    if (entityContext.workflowStage.isFinal) {
      contextIndicators.push('✅ Completed');
    }
    if (!entityContext.assignment.isAssigned) {
      contextIndicators.push('👤 Unassigned');
    }
    
    if (contextIndicators.length > 0) {
      parts.push(`Status: ${contextIndicators.join(' | ')}`);
    }
    
    // Filter/view info
    if (params.filter !== 'all') {
      parts.push(`Filter: ${this.getFilterDescription(params.filter)}`);
    }
    
    // Summary stats
    parts.push(`\n📊 **Comment Activity**: ${insights.statistics.total} comments`);
    
    const topAuthors = Object.entries(insights.statistics.byAuthor)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([author, count]) => `${author} (${count})`);
    
    if (topAuthors.length > 0) {
      parts.push(`Top Contributors: ${topAuthors.join(', ')}`);
    }
    
    return parts.join('\n');
  }
  
  /**
   * Generate insights summary
   */
  private generateInsightsSummary(insights: any, _role: string): string {
    const parts: string[] = ['\n📌 **Key Insights**\n'];
    
    if (insights.blockers.length > 0) {
      parts.push(`🚧 **Blockers Identified** (${insights.blockers.length})`);
      insights.blockers.slice(0, 2).forEach((b: any) => {
        parts.push(`  • ${b.author}: "${b.excerpt}"`);
      });
    }
    
    if (insights.decisions.length > 0) {
      parts.push(`\n✓ **Decisions Made** (${insights.decisions.length})`);
      insights.decisions.slice(0, 2).forEach((d: any) => {
        parts.push(`  • ${d.author}: "${d.excerpt}"`);
      });
    }
    
    if (insights.keyDiscussions.length > 0) {
      parts.push(`\n💬 **Active Discussions** (${insights.keyDiscussions.length})`);
      insights.keyDiscussions.slice(0, 2).forEach((k: any) => {
        parts.push(`  • Thread by ${k.author} with ${k.replyCount} replies`);
      });
    }
    
    return parts.join('\n');
  }
  
  /**
   * Format comments for specific role
   */
  private formatCommentsForRole(
    comments: any[],
    role: string,
    params: ShowCommentsParams,
    insights: any
  ): string {
    const lines: string[] = ['\n---\n'];
    
    // Handle grouped display
    if (Array.isArray(comments) && comments.length > 0 && comments[0].groupType) {
      comments.forEach(group => {
        lines.push(`\n**${this.formatGroupHeader(group.groupType, group.groupValue)}**\n`);
        group.comments.forEach((comment: any) => {
          this.formatEnhancedComment(comment, lines, 0, role, insights);
        });
      });
    } else {
      // Regular hierarchical display
      comments.forEach((comment, index) => {
        this.formatEnhancedComment(comment, lines, 0, role, insights);
        
        // Add separator between root comments
        if (index < comments.length - 1) {
          lines.push('\n---\n');
        }
      });
    }
    
    return lines.join('\n');
  }
  
  /**
   * Format a single comment with enhancements
   */
  private formatEnhancedComment(
    comment: any, 
    lines: string[], 
    depth: number,
    role: string,
    insights: any
  ): void {
    const indent = '  '.repeat(depth);
    const replyIndicator = depth > 0 ? '↳ ' : '';
    
    // Build indicators
    const indicators: string[] = [];
    if (comment.IsPrivate) indicators.push('🔒');
    if (comment.metadata?.isBlocker) indicators.push('🚧');
    if (comment.metadata?.isDecision) indicators.push('✓');
    if (comment.metadata?.hasMentions) indicators.push('@');
    if (comment.metadata?.isKeyDiscussion) indicators.push('💬');
    
    const indicatorStr = indicators.length > 0 ? indicators.join(' ') + ' ' : '';
    
    // Comment header
    const createDate = this.parseDate(comment.CreateDate);
    const dateString = this.formatDateForRole(createDate, role);
    const userName = this.extractUserName(comment);
    
    lines.push(`${indent}${replyIndicator}${indicatorStr}**${userName}** - ${dateString} (#${comment.Id})`);
    
    // Comment content with formatting
    const content = this.cleanHtmlDescription(comment.Description);
    const formattedContent = this.formatContentForRole(content, role);
    
    const contentLines = formattedContent.split('\n');
    contentLines.forEach(line => {
      if (line.trim()) {
        lines.push(`${indent}  ${line.trim()}`);
      }
    });
    
    // Add attachments if any
    if (comment.Attachments?.length > 0) {
      lines.push(`${indent}  📎 Attachments: ${comment.Attachments.length}`);
    }
    
    // Process replies
    if (comment.replies && comment.replies.length > 0) {
      lines.push('');
      comment.replies.forEach((reply: any) => {
        this.formatEnhancedComment(reply, lines, depth + 1, role, insights);
      });
    }
  }
  
  /**
   * Generate role-based suggestions
   */
  private generateRoleBasedSuggestions(
    entity: any,
    entityContext: any,
    insights: any,
    role: string,
    params: ShowCommentsParams
  ): string[] {
    const suggestions: string[] = [];
    
    // Common suggestions
    suggestions.push(
      `add-comment entityType:${params.entityType} entityId:${params.entityId} comment:"Your response" - Add a reply`
    );
    
    // Filter variations
    if (params.filter !== 'recent') {
      suggestions.push(`show-comments entityType:${params.entityType} entityId:${params.entityId} filter:recent - Show recent comments only`);
    }
    if (params.filter !== 'mine') {
      suggestions.push(`show-comments entityType:${params.entityType} entityId:${params.entityId} filter:mine - Show your comments`);
    }
    
    // Role-specific suggestions
    switch (role) {
      case 'developer':
        if (entityContext.workflowStage.isBlocked) {
          suggestions.push(`add-comment entityType:${params.entityType} entityId:${params.entityId} comment:"Unblocked: [solution]" - Report unblocking`);
        }
        if (insights.blockers.length > 0) {
          suggestions.push(`start-working-on id:${params.entityId} - Start work after reviewing blockers`);
        }
        break;
        
      case 'project-manager':
        if (insights.decisions.length === 0) {
          suggestions.push(`add-comment entityType:${params.entityType} entityId:${params.entityId} comment:"Decision: [decision details]" - Record a decision`);
        }
        suggestions.push(`show-comments entityType:${params.entityType} entityId:${params.entityId} groupBy:author - View by team member`);
        break;
        
      case 'tester':
        suggestions.push(`add-comment entityType:${params.entityType} entityId:${params.entityId} comment:"Test results: [pass/fail]" attachments:[{path:"results.png"}] - Add test results`);
        break;
        
      case 'product-owner':
        suggestions.push(`show-comments entityType:${params.entityType} entityId:${params.entityId} groupBy:type - View by comment type`);
        break;
    }
    
    // Context-specific suggestions
    if (insights.mentions.length > 0) {
      suggestions.push(`show-comments entityType:${params.entityType} entityId:${params.entityId} filter:mentions - Show comments mentioning you`);
    }
    
    if (insights.statistics.total > 20) {
      suggestions.push(`show-comments entityType:${params.entityType} entityId:${params.entityId} sortOrder:relevance - Sort by relevance`);
    }
    
    return suggestions;
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
   * Generate error result with helpful guidance
   */
  private generateErrorResult(error: any, params: ShowCommentsParams, _context: ExecutionContext): OperationResult {
    logger.error('ShowComments error:', error);
    
    const content: any[] = [{
      type: 'text' as const,
      text: '## 🔍 Comment Discovery Issue\n\nI encountered an issue while fetching comments. Let me help you troubleshoot:'
    }];
    
    // Analyze error type
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      content.push({
        type: 'text' as const,
        text: `### Entity Not Found\n\nThe ${params.entityType} with ID ${params.entityId} doesn't exist or you don't have access to it.`
      });
    } else if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
      content.push({
        type: 'text' as const,
        text: '### Access Issue\n\nYou may not have permission to view comments for this entity.'
      });
    } else {
      content.push({
        type: 'text' as const,
        text: `### Technical Issue\n\n${error.message || 'An unexpected error occurred'}`
      });
    }
    
    // Provide helpful suggestions
    const suggestions = [
      `search_entities type:${params.entityType} - Find available ${params.entityType}s`,
      'show-my-tasks - View your tasks',
      'get_entity type:Task id:123 - Check a specific entity'
    ];
    
    return { content, suggestions };
  }
  
  /**
   * Generate result when entity not found
   */
  private generateEntityNotFoundResult(params: ShowCommentsParams, _context: ExecutionContext): OperationResult {
    return {
      content: [
        {
          type: 'text' as const,
          text: `## 🔍 Entity Not Found\n\n${params.entityType} #${params.entityId} doesn't exist or you don't have access to it.`
        },
        {
          type: 'text' as const,
          text: '### Smart Suggestions\n\n• Check if the ID is correct\n• Verify you have access to this entity\n• Try searching for similar entities'
        }
      ],
      suggestions: [
        `search_entities type:${params.entityType} - Find available ${params.entityType}s`,
        `show-my-tasks - View your assigned tasks`,
        'search-work-items - Search across all work items'
      ]
    };
  }
  
  /**
   * Generate result when no comments found
   */
  private generateNoCommentsResult(entity: any, params: ShowCommentsParams, context: ExecutionContext): OperationResult {
    const role = context.personality?.mode || context.user.role || 'default';
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `## 💬 No Comments Yet\n\n${params.entityType} #${params.entityId} - **${entity.Name}** has no comments.`
        },
        {
          type: 'text' as const,
          text: this.getNoCommentsAdvice(entity, role)
        }
      ],
      suggestions: this.getNoCommentsSuggestions(entity, params, role)
    };
  }
  
  /**
   * Get role-specific advice when no comments
   */
  private getNoCommentsAdvice(entity: any, role: string): string {
    const parts: string[] = ['### Be the first to comment!\n'];
    
    switch (role) {
      case 'developer':
        parts.push('• Share implementation approach\n• Note any technical considerations\n• Ask questions about requirements');
        break;
      case 'tester':
        parts.push('• Document test scenarios\n• Share testing approach\n• Note any concerns about testability');
        break;
      case 'project-manager':
        parts.push('• Set expectations\n• Clarify timeline\n• Identify dependencies');
        break;
      case 'product-owner':
        parts.push('• Clarify requirements\n• Share context\n• Define acceptance criteria');
        break;
      default:
        parts.push('• Share your thoughts\n• Ask questions\n• Provide updates');
    }
    
    return parts.join('\n');
  }
  
  /**
   * Get suggestions when no comments
   */
  private getNoCommentsSuggestions(entity: any, params: ShowCommentsParams, role: string): string[] {
    const suggestions: string[] = [];
    
    // Primary action
    suggestions.push(
      `add-comment entityType:${params.entityType} entityId:${params.entityId} comment:"${this.getStarterComment(role)}" - Start the discussion`
    );
    
    // Context actions
    suggestions.push(
      `get_entity type:${params.entityType} id:${params.entityId} - View full details`
    );
    
    // Role-specific
    if (role === 'developer' && !entity.AssignedUser) {
      suggestions.push('start-working-on id:' + params.entityId + ' - Assign to yourself and start');
    }
    
    return suggestions;
  }
  
  /**
   * Get starter comment suggestion by role
   */
  private getStarterComment(role: string): string {
    switch (role) {
      case 'developer':
        return 'Starting work on this. Initial thoughts: [approach]';
      case 'tester':
        return 'Test approach: [scenarios to cover]';
      case 'project-manager':
        return 'Timeline update: [expected completion]';
      case 'product-owner':
        return 'Clarification on requirements: [details]';
      default:
        return 'Initial thoughts: [your comment]';
    }
  }
  
  /**
   * Utility: Calculate age in days
   */
  private calculateAge(dateString: string): number {
    if (!dateString) return 0;
    const date = this.parseDate(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Utility: Check if overdue
   */
  private isOverdue(dateString: string): boolean {
    if (!dateString) return false;
    const date = this.parseDate(dateString);
    return date < new Date();
  }
  
  /**
   * Utility: Get entity emoji
   */
  private getEntityEmoji(entityType: string): string {
    const emojiMap: Record<string, string> = {
      'Task': '📋',
      'Bug': '🐛',
      'UserStory': '📖',
      'Feature': '⭐',
      'Epic': '🎯',
      'TestCase': '🧪',
      'TestPlan': '📊',
      'Request': '💡'
    };
    return emojiMap[entityType] || '📄';
  }
  
  /**
   * Utility: Get filter description
   */
  private getFilterDescription(filter: string): string {
    const descriptions: Record<string, string> = {
      'recent': 'Recent comments (last 7 days)',
      'mine': 'Your comments only',
      'mentions': 'Comments mentioning you',
      'unread': 'Recent unread comments'
    };
    return descriptions[filter] || filter;
  }
  
  /**
   * Utility: Format group header
   */
  private formatGroupHeader(groupType: string, groupValue: string): string {
    switch (groupType) {
      case 'date': {
        const date = new Date(groupValue);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }
      case 'author':
        return `Comments by ${groupValue}`;
      case 'type': {
        const typeLabels: Record<string, string> = {
          'decisions': '✓ Decisions',
          'blockers': '🚧 Blockers',
          'mentions': '@ Mentions',
          'discussions': '💬 Key Discussions',
          'general': '💭 General Comments'
        };
        return typeLabels[groupValue] || groupValue;
      }
      default:
        return groupValue;
    }
  }
  
  /**
   * Utility: Format date for role
   */
  private formatDateForRole(date: Date, role: string): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Recent comments show relative time
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    
    // Older comments show date
    if (role === 'developer' || role === 'tester') {
      // Technical roles might prefer ISO-like format
      return date.toISOString().split('T')[0];
    } else {
      // Management roles might prefer readable format
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  
  /**
   * Utility: Format content for role
   */
  private formatContentForRole(content: string, role: string): string {
    // Technical roles might see code blocks highlighted
    if (role === 'developer' || role === 'tester') {
      // Detect and format code-like content
      return content.replace(/`([^`]+)`/g, '**`$1`**');
    }
    
    return content;
  }
  
  /**
   * Utility: Extract excerpt around keywords
   */
  private extractExcerpt(content: string, keywords: string[]): string {
    for (const keyword of keywords) {
      const index = content.indexOf(keyword);
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(content.length, index + keyword.length + 30);
        let excerpt = content.substring(start, end);
        
        if (start > 0) excerpt = '...' + excerpt;
        if (end < content.length) excerpt = excerpt + '...';
        
        return excerpt.trim();
      }
    }
    return content.substring(0, 60) + '...';
  }
  
  /**
   * Utility: Extract mentions from content
   */
  private extractMentions(content: string): string[] {
    const mentions: string[] = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  }
  
  /**
   * Utility: Get unique participants in a thread
   */
  private getUniqueParticipants(comment: any): string[] {
    const participants = new Set<string>();
    
    const addParticipant = (c: any) => {
      const name = this.extractUserName(c);
      participants.add(name);
      
      if (c.replies) {
        c.replies.forEach((reply: any) => addParticipant(reply));
      }
    };
    
    addParticipant(comment);
    return Array.from(participants);
  }
}