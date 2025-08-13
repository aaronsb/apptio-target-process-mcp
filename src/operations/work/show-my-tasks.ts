import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation, OperationResult } from '../../core/interfaces/semantic-operation.interface.js';
import { logger } from '../../utils/logger.js';

export const showMyTasksSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']).optional().describe('Filter by priority level'),
  state: z.enum(['active', 'all']).optional().default('active').describe('Filter by task state'),
  project: z.coerce.number().optional().describe('Filter by project ID'),
  sprintFilter: z.coerce.number().optional().describe('Filter by sprint/iteration ID'),
  dueIn: z.coerce.number().optional().describe('Filter tasks due within X days'),
  limit: z.coerce.number().optional().default(25).describe('Maximum number of tasks to return'),
  sortBy: z.enum(['priority', 'dueDate', 'effort']).optional().default('priority').describe('Sort tasks by specified field')
});

export type ShowMyTasksParams = z.infer<typeof showMyTasksSchema>;

/**
 * Show My Tasks Operation
 * 
 * Developer-focused semantic operation that displays assigned tasks with intelligent
 * filtering, priority visualization, and workflow context.
 * 
 * Features (per acceptance criteria):
 * - Visual priority indicators (🔴🟡🔵)
 * - Multiple filtering options
 * - Overdue and blocked status detection
 * - Task age/staleness indicators
 * - Mobile-friendly formatting
 * - <1s performance target
 */
export class ShowMyTasksOperation implements SemanticOperation<ShowMyTasksParams> {
  private entityStateCache: Map<string, any> = new Map();
  private priorityCache: Map<string, any> = new Map();
  private lastDiscoveryTime: number = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'show-my-tasks',
      name: 'Show My Tasks',
      description: 'View your assigned tasks with smart filtering, priority indicators, and workflow insights',
      category: 'work',
      requiredPersonalities: ['developer'], // Developer-only operation
      examples: [
        'Show my tasks',
        'Show high priority tasks',
        'Show tasks due in 7 days',
        'Show active tasks for project 123'
      ],
      tags: ['tasks', 'assignments', 'developer', 'workflow']
    };
  }

  getSchema() {
    return showMyTasksSchema;
  }

  async execute(context: ExecutionContext, params: ShowMyTasksParams): Promise<OperationResult> {
    const startTime = Date.now();
    
    try {
      const validatedParams = showMyTasksSchema.parse(params);
      
      // Perform dynamic discovery
      await this.performDynamicDiscovery();
      
      // Build and execute query
      const tasks = await this.fetchUserTasks(context.user.id, validatedParams);
      
      // Analyze and format results
      const result = this.formatTaskResults(tasks, validatedParams, context);
      
      // Add performance metadata
      result.metadata = {
        executionTime: Date.now() - startTime,
        apiCallsCount: 1 + (this.lastDiscoveryTime === startTime ? 2 : 0),
        cacheHits: this.lastDiscoveryTime !== startTime ? 2 : 0
      };
      
      return result;
      
    } catch (error) {
      logger.error('ShowMyTasksOperation error:', error);
      return this.buildErrorResponse(error);
    }
  }

  /**
   * Perform dynamic discovery of EntityStates and Priorities
   */
  private async performDynamicDiscovery(): Promise<void> {
    const now = Date.now();
    
    // Check cache validity
    if (now - this.lastDiscoveryTime < this.CACHE_TTL) {
      return;
    }
    
    try {
      // Discover EntityStates
      const states = await this.service.searchEntities(
        'EntityState',
        '',
        ['Id', 'Name', 'IsFinal', 'IsInitial', 'NumericPriority'],
        100
      );
      
      if (states && states.length > 0) {
        states.forEach((state: any) => {
          this.entityStateCache.set(state.Name, state);
        });
        logger.debug(`Discovered ${states.length} entity states`);
      }
      
      // Discover Priorities
      const priorities = await this.service.searchEntities(
        'Priority',
        '',
        ['Id', 'Name', 'Importance'],
        20
      );
      
      if (priorities && priorities.length > 0) {
        priorities.forEach((priority: any) => {
          this.priorityCache.set(priority.Name, priority);
        });
        logger.debug(`Discovered ${priorities.length} priorities`);
      }
      
      this.lastDiscoveryTime = now;
      
    } catch (error) {
      logger.warn('Dynamic discovery failed, using defaults:', error);
      // Continue with defaults if discovery fails
    }
  }

  /**
   * Fetch user's assigned tasks with filters
   */
  private async fetchUserTasks(userId: number, params: ShowMyTasksParams): Promise<any[]> {
    try {
      // Fetch user with their assignables included
      const user = await this.service.getEntity<any>(
        'GeneralUser',
        userId,
        [
          'Assignables[Id,Name,Description,Priority,NumericPriority,EntityState,EndDate,Project,Release,Iteration,TeamIteration]'
        ]
      );
      
      // Extract assignables from user response
      let tasks = user?.Assignables?.Items || [];
      
      // Apply filters
      // State filter
      if (params.state === 'active') {
        tasks = tasks.filter((task: any) => !task.EntityState?.IsFinal);
      }
      
      // Project filter
      if (params.project) {
        tasks = tasks.filter((task: any) => task.Project?.Id === params.project);
      }
      
      // Sprint/Iteration filter
      if (params.sprintFilter) {
        tasks = tasks.filter((task: any) => 
          task.Iteration?.Id === params.sprintFilter ||
          task.TeamIteration?.Id === params.sprintFilter
        );
      }
      
      // Due date filter
      if (params.dueIn) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + params.dueIn);
        tasks = tasks.filter((task: any) => {
          if (!task.EndDate) return false;
          const endDate = new Date(task.EndDate);
          return endDate <= futureDate;
        });
      }
      
      // Apply sorting based on sortBy parameter
      if (tasks.length > 0) {
        switch (params.sortBy) {
          case 'dueDate':
            tasks.sort((a: any, b: any) => {
              if (!a.EndDate && !b.EndDate) return 0;
              if (!a.EndDate) return 1; // Tasks without due dates go to end
              if (!b.EndDate) return -1;
              return new Date(a.EndDate).getTime() - new Date(b.EndDate).getTime();
            });
            break;
            
          case 'effort':
            tasks.sort((a: any, b: any) => {
              const aEffort = a.TimeRemain || a.Effort || 0;
              const bEffort = b.TimeRemain || b.Effort || 0;
              return bEffort - aEffort; // Higher effort first
            });
            break;
            
          case 'priority':
          default:
            tasks.sort((a: any, b: any) => {
              const aImportance = a.Priority?.Importance || 999;
              const bImportance = b.Priority?.Importance || 999;
              return aImportance - bImportance;
            });
            break;
        }
      }
      
      // Priority filter
      if (params.priority) {
        const priorityRanges = this.getPriorityRanges();
        tasks = tasks.filter((task: any) => {
          const importance = task.Priority?.Importance || 999;
          const range = priorityRanges[params.priority!];
          return importance >= range.min && importance <= range.max;
        });
      }
      
      // Apply limit
      if (params.limit && tasks.length > params.limit) {
        tasks = tasks.slice(0, params.limit);
      }
      
      return tasks;
      
    } catch (error) {
      logger.error('Failed to fetch user tasks:', error);
      throw error;
    }
  }

  /**
   * Get priority importance ranges based on discovered data
   */
  private getPriorityRanges(): Record<string, { min: number; max: number }> {
    // Use discovered priorities to determine ranges
    const importanceValues = Array.from(this.priorityCache.values())
      .map(p => p.Importance)
      .sort((a, b) => a - b);
    
    if (importanceValues.length >= 3) {
      const third = Math.floor(importanceValues.length / 3);
      return {
        high: { min: 0, max: importanceValues[third] },
        medium: { min: importanceValues[third] + 1, max: importanceValues[third * 2] },
        low: { min: importanceValues[third * 2] + 1, max: 999 }
      };
    }
    
    // Fallback ranges
    return {
      high: { min: 0, max: 2 },
      medium: { min: 3, max: 4 },
      low: { min: 5, max: 999 }
    };
  }

  /**
   * Format task results with visual indicators and context
   */
  private formatTaskResults(tasks: any[], params: ShowMyTasksParams, context: ExecutionContext): OperationResult {
    if (!tasks || tasks.length === 0) {
      return this.buildEmptyResponse(params);
    }
    
    const summary = this.buildTaskSummary(tasks);
    const suggestions = this.generateSuggestions(tasks, context);
    const groupedTasksText = this.formatGroupedTasks(tasks);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `📋 **Your Tasks** (${tasks.length} ${params.state === 'all' ? 'total' : 'active'})\n\n${summary}`
        },
        {
          type: 'text' as const,
          text: groupedTasksText
        },
        {
          type: 'structured-data' as const,
          data: {
            totalTasks: tasks.length,
            byPriority: this.groupByPriority(tasks),
            byState: this.groupByState(tasks),
            overdueTasks: tasks.filter(t => this.isOverdue(t)).length,
            blockedTasks: tasks.filter(t => this.isBlocked(t)).length
          }
        }
      ],
      suggestions
    };
  }

  /**
   * Format tasks grouped by priority
   */
  private formatGroupedTasks(tasks: any[]): string {
    const ranges = this.getPriorityRanges();
    
    // Group tasks by priority
    const highPriorityTasks = tasks.filter(t => {
      const importance = t.Priority?.Importance || 999;
      return importance <= ranges.high.max;
    });
    
    const mediumPriorityTasks = tasks.filter(t => {
      const importance = t.Priority?.Importance || 999;
      return importance > ranges.high.max && importance <= ranges.medium.max;
    });
    
    const lowPriorityTasks = tasks.filter(t => {
      const importance = t.Priority?.Importance || 999;
      return importance > ranges.medium.max;
    });
    
    const sections: string[] = [];
    
    // Format high priority section
    if (highPriorityTasks.length > 0) {
      sections.push(`🔴 **HIGH PRIORITY (${highPriorityTasks.length})**`);
      highPriorityTasks.forEach((task, index) => {
        const isLast = index === highPriorityTasks.length - 1;
        const prefix = isLast ? '└─' : '├─';
        sections.push(`${prefix} ${this.formatTaskLine(task)}`);
        const details = this.formatTaskDetails(task, isLast ? '   ' : '│  ');
        if (details) sections.push(details);
      });
    }
    
    // Format medium priority section
    if (mediumPriorityTasks.length > 0) {
      if (sections.length > 0) sections.push(''); // Add blank line between sections
      sections.push(`🟡 **MEDIUM PRIORITY (${mediumPriorityTasks.length})**`);
      mediumPriorityTasks.forEach((task, index) => {
        const isLast = index === mediumPriorityTasks.length - 1;
        const prefix = isLast ? '└─' : '├─';
        sections.push(`${prefix} ${this.formatTaskLine(task)}`);
        const details = this.formatTaskDetails(task, isLast ? '   ' : '│  ');
        if (details) sections.push(details);
      });
    }
    
    // Format low priority section
    if (lowPriorityTasks.length > 0) {
      if (sections.length > 0) sections.push(''); // Add blank line between sections
      sections.push(`🔵 **LOW PRIORITY (${lowPriorityTasks.length})**`);
      lowPriorityTasks.forEach((task, index) => {
        const isLast = index === lowPriorityTasks.length - 1;
        const prefix = isLast ? '└─' : '├─';
        sections.push(`${prefix} ${this.formatTaskLine(task)}`);
        const details = this.formatTaskDetails(task, isLast ? '   ' : '│  ');
        if (details) sections.push(details);
      });
    }
    
    return sections.join('\n');
  }

  /**
   * Format a single task line for grouped display
   */
  private formatTaskLine(task: any): string {
    const status = this.getTaskStatus(task);
    return `[${task.EntityType?.Name || 'TASK'}-${task.Id}] ${task.Name}${status ? ' ' + status : ''}`;
  }

  /**
   * Format task details for grouped display
   */
  private formatTaskDetails(task: any, indent: string): string {
    const parts: string[] = [];
    
    // Add project info
    const projectInfo = `Project: ${task.Project?.Name || 'Unknown'}`;
    if (task.Release) {
      parts.push(`${indent}└─ ${projectInfo} | Release: ${task.Release.Name}`);
    } else if (task.Iteration) {
      parts.push(`${indent}└─ ${projectInfo} | Sprint: ${task.Iteration.Name}`);
    } else {
      parts.push(`${indent}└─ ${projectInfo}`);
    }
    
    // Add timing/effort info
    const timingParts: string[] = [];
    if (task.EndDate) {
      const endDate = new Date(task.EndDate);
      const now = new Date();
      const daysUntil = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0) {
        timingParts.push(`Due: ${Math.abs(daysUntil)} days ago`);
      } else if (daysUntil === 0) {
        timingParts.push('Due: Today');
      } else if (daysUntil === 1) {
        timingParts.push('Due: Tomorrow');
      } else {
        timingParts.push(`Due: ${daysUntil} days`);
      }
    }
    
    if (task.TimeRemain) {
      timingParts.push(`${task.TimeRemain}h remaining`);
    }
    
    if (timingParts.length > 0) {
      parts.push(`${indent}   ${timingParts.join(' | ')}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Format a single task with visual indicators
   */
  private formatSingleTask(task: any): string {
    const priority = this.getPriorityIndicator(task.Priority);
    const state = this.getStateDisplay(task.EntityState);
    const status = this.getTaskStatus(task);
    const age = this.getTaskAge(task);
    const effort = this.getEffortDisplay(task);
    
    // Mobile-friendly format
    const header = `${priority} **${task.Name}** ${status}`;
    const metadata = `${state} | ${task.EntityType?.Name || 'Task'} #${task.Id} | ${age}`;
    const project = `📁 ${task.Project?.Name || 'Unknown Project'}${task.Release ? ` → ${task.Release.Name}` : ''}`;
    const details = effort ? `⏱️ ${effort}` : '';
    
    return [header, metadata, project, details].filter(Boolean).join('\n');
  }

  /**
   * Get visual priority indicator
   */
  private getPriorityIndicator(priority: any): string {
    if (!priority) return '⚪';
    
    const importance = priority.Importance || 999;
    const ranges = this.getPriorityRanges();
    
    if (importance <= ranges.high.max) return '🔴';
    if (importance <= ranges.medium.max) return '🟡';
    return '🔵';
  }

  /**
   * Get state display with workflow context
   */
  private getStateDisplay(state: any): string {
    if (!state) return '❓ Unknown';
    
    const stateName = state.Name;
    const cached = this.entityStateCache.get(stateName);
    
    if (cached?.IsInitial) return `🆕 ${stateName}`;
    if (cached?.IsFinal) return `✅ ${stateName}`;
    if (stateName.toLowerCase().includes('progress')) return `🔄 ${stateName}`;
    
    return `📌 ${stateName}`;
  }

  /**
   * Get task status indicators (overdue, blocked, etc.)
   */
  private getTaskStatus(task: any): string {
    const statuses: string[] = [];
    
    if (this.isOverdue(task)) {
      statuses.push('⚠️ Overdue');
    }
    
    if (this.isBlocked(task)) {
      statuses.push('🚧 Blocked');
    }
    
    if (task.IsNow) {
      statuses.push('👉 Current');
    } else if (task.IsNext) {
      statuses.push('⏭️ Next');
    }
    
    return statuses.length > 0 ? `(${statuses.join(', ')})` : '';
  }

  /**
   * Check if task is overdue
   */
  private isOverdue(task: any): boolean {
    if (!task.EndDate) return false;
    
    const endDate = new Date(task.EndDate);
    const now = new Date();
    return endDate < now && !task.EntityState?.IsFinal;
  }

  /**
   * Check if task is blocked
   */
  private isBlocked(task: any): boolean {
    // Check Tags for 'blocked'
    if (task.Tags?.Items) {
      const hasBlockedTag = task.Tags.Items.some((tag: any) => 
        tag.Name?.toLowerCase().includes('blocked')
      );
      if (hasBlockedTag) return true;
    }
    
    // Check Impediments
    if (task.Impediments?.Items && task.Impediments.Items.length > 0) {
      return true;
    }
    
    return false;
  }

  /**
   * Get task age display
   */
  private getTaskAge(task: any): string {
    if (!task.CreateDate) return '';
    
    const created = new Date(task.CreateDate);
    const now = new Date();
    const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Created today';
    if (days === 1) return 'Created yesterday';
    if (days < 7) return `${days} days old`;
    if (days < 30) return `${Math.floor(days / 7)} weeks old`;
    
    // Mark as stale if over 30 days
    return `⚡ ${Math.floor(days / 30)} months old`;
  }

  /**
   * Get effort display
   */
  private getEffortDisplay(task: any): string {
    const parts: string[] = [];
    
    if (task.Progress) {
      parts.push(`${Math.round(task.Progress)}% complete`);
    }
    
    if (task.TimeSpent) {
      parts.push(`${task.TimeSpent}h spent`);
    }
    
    if (task.TimeRemain) {
      parts.push(`${task.TimeRemain}h remaining`);
    }
    
    return parts.join(' | ');
  }

  /**
   * Build task summary
   */
  private buildTaskSummary(tasks: any[]): string {
    const overdue = tasks.filter(t => this.isOverdue(t)).length;
    const blocked = tasks.filter(t => this.isBlocked(t)).length;
    const inProgress = tasks.filter(t => t.EntityState?.Name?.toLowerCase().includes('progress')).length;
    
    const parts: string[] = [];
    
    if (overdue > 0) parts.push(`⚠️ ${overdue} overdue`);
    if (blocked > 0) parts.push(`🚧 ${blocked} blocked`);
    if (inProgress > 0) parts.push(`🔄 ${inProgress} in progress`);
    
    return parts.length > 0 ? parts.join(' | ') : 'All tasks up to date';
  }

  /**
   * Group tasks by priority
   */
  private groupByPriority(tasks: any[]): Record<string, number> {
    const groups = { high: 0, medium: 0, low: 0 };
    const ranges = this.getPriorityRanges();
    
    tasks.forEach(task => {
      const importance = task.Priority?.Importance || 999;
      if (importance <= ranges.high.max) groups.high++;
      else if (importance <= ranges.medium.max) groups.medium++;
      else groups.low++;
    });
    
    return groups;
  }

  /**
   * Group tasks by state
   */
  private groupByState(tasks: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    tasks.forEach(task => {
      const stateName = task.EntityState?.Name || 'Unknown';
      groups[stateName] = (groups[stateName] || 0) + 1;
    });
    
    return groups;
  }

  /**
   * Generate intelligent suggestions
   */
  private generateSuggestions(tasks: any[], context: ExecutionContext): string[] {
    const suggestions: string[] = [];
    
    // Find highest priority unblocked task
    const highPriorityTask = tasks
      .filter(t => !this.isBlocked(t) && !t.EntityState?.IsFinal)
      .sort((a, b) => (a.Priority?.Importance || 999) - (b.Priority?.Importance || 999))[0];
    
    if (highPriorityTask) {
      suggestions.push(`start-working-on entityType:${highPriorityTask.EntityType?.Name || 'Task'} entityId:${highPriorityTask.Id} - Start highest priority task`);
    }
    
    // Blocked tasks
    const blockedTask = tasks.find(t => this.isBlocked(t));
    if (blockedTask) {
      suggestions.push(`show-comments entityType:${blockedTask.EntityType?.Name || 'Task'} entityId:${blockedTask.Id} - Check blocked task discussion`);
    }
    
    // Overdue tasks
    const overdueTask = tasks.find(t => this.isOverdue(t));
    if (overdueTask) {
      suggestions.push(`update-entity type:${overdueTask.EntityType?.Name || 'Task'} id:${overdueTask.Id} fields:{} - Update overdue task`);
    }
    
    // Filter variations
    if (tasks.length > 5) {
      suggestions.push('show-my-tasks priority:high - Focus on high priority only');
    }
    
    suggestions.push('show-my-bugs - View assigned bugs');
    
    return suggestions;
  }

  /**
   * Build empty response
   */
  private buildEmptyResponse(params: ShowMyTasksParams): OperationResult {
    const filters = [];
    if (params.priority) filters.push(`priority: ${params.priority}`);
    if (params.project) filters.push(`project: ${params.project}`);
    if (params.dueIn) filters.push(`due in ${params.dueIn} days`);
    
    const filterText = filters.length > 0 ? ` with filters: ${filters.join(', ')}` : '';
    
    return {
      content: [{
        type: 'text' as const,
        text: `📋 **No tasks found**${filterText}\n\nYou don't have any ${params.state === 'all' ? '' : 'active '}assigned tasks${filterText}.`
      }],
      suggestions: [
        'show-my-tasks state:all - Show all tasks including completed',
        'search-entities type:Task - Search for unassigned tasks',
        'create-entity type:Task fields:{Name:"New task"} - Create a new task'
      ]
    };
  }

  /**
   * Build error response with helpful guidance
   */
  private buildErrorResponse(error: unknown): OperationResult {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      content: [
        {
          type: 'text' as const,
          text: '❌ **Failed to fetch tasks**'
        },
        {
          type: 'text' as const,
          text: `Error: ${message}\n\nThis might be due to:\n• Invalid user configuration (check TP_USER_ID)\n• API connectivity issues\n• Invalid filter parameters`
        }
      ],
      suggestions: [
        'search-entities type:Task where:"AssignedUser.Id = YOUR_ID" - Manual task search',
        'get-entity type:GeneralUser id:YOUR_ID - Verify your user ID'
      ]
    };
  }
}