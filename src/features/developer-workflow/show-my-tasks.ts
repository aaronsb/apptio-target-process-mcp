import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation } from '../../core/interfaces/semantic-operation.interface.js';

export const showMyTasksSchema = z.object({
  includeCompleted: z.boolean().optional().default(false),
  projectFilter: z.string().optional(),
  priority: z.enum(['all', 'high', 'medium', 'low']).optional().default('all'),
  limit: z.number().optional().default(20)
});

export type ShowMyTasksParams = z.infer<typeof showMyTasksSchema>;

/**
 * Semantic operation: show-my-tasks
 * 
 * This operation retrieves tasks assigned to the current user,
 * with smart filtering based on context and user preferences.
 */
export class ShowMyTasksOperation implements SemanticOperation {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'show-my-tasks',
      name: 'Show My Tasks',
      description: 'View tasks assigned to you with smart filtering',
      category: 'personal-workflow',
      requiredPersonalities: ['developer', 'project-manager', 'administrator'],
      examples: [
        'Show my tasks',
        'What am I working on?',
        'Show my high priority tasks',
        'List my tasks in Project Alpha'
      ]
    };
  }

  async execute(context: ExecutionContext, params: ShowMyTasksParams) {
    // Build the where clause based on context and parameters
    const whereConditions: string[] = [
      `AssignedUser.Id eq ${context.user.id}`
    ];

    // Add state filter
    if (!params.includeCompleted) {
      whereConditions.push(`EntityState.Name ne 'Done'`);
    }

    // Add project filter if specified
    if (params.projectFilter) {
      // Try to match project from context first
      const project = context.workspace.recentProjects?.find(
        p => p.name.toLowerCase().includes(params.projectFilter!.toLowerCase())
      );
      
      if (project) {
        whereConditions.push(`Project.Id eq ${project.id}`);
      } else {
        whereConditions.push(`Project.Name contains '${params.projectFilter}'`);
      }
    } else if (context.workspace.currentProject) {
      // Use current project from context if no filter specified
      whereConditions.push(`Project.Id eq ${context.workspace.currentProject.id}`);
    }

    // Add priority filter
    if (params.priority !== 'all') {
      const priorityMap = {
        high: [1, 2],
        medium: [3],
        low: [4, 5]
      };
      const priorities = priorityMap[params.priority];
      whereConditions.push(`Priority.Id in [${priorities.join(',')}]`);
    }

    // Search for tasks
    const tasks = await this.service.searchEntities({
      type: 'Task',
      where: whereConditions.join(' and '),
      include: ['Project', 'Priority', 'Iteration', 'EntityState', 'Tags'],
      orderBy: ['Priority.Importance', 'CreateDate desc'],
      take: params.limit
    });

    // Also search for bugs assigned to user
    const bugs = await this.service.searchEntities({
      type: 'Bug',
      where: whereConditions.join(' and '),
      include: ['Project', 'Priority', 'Severity', 'EntityState'],
      orderBy: ['Severity.Importance', 'Priority.Importance'],
      take: Math.floor(params.limit / 2)
    });

    // Enrich results with semantic information
    const enrichedTasks = this.enrichTaskData(tasks, context);
    const enrichedBugs = this.enrichBugData(bugs, context);

    // Generate natural language summary
    const summary = this.generateSummary(enrichedTasks, enrichedBugs, params);

    return {
      content: [
        {
          type: 'text',
          text: summary
        },
        {
          type: 'structured-data',
          data: {
            tasks: enrichedTasks,
            bugs: enrichedBugs,
            metadata: {
              totalItems: enrichedTasks.length + enrichedBugs.length,
              filters: params,
              context: {
                currentProject: context.workspace.currentProject?.name,
                currentIteration: context.workspace.currentIteration?.name
              }
            }
          }
        }
      ],
      // Semantic hints for next operations
      nextSteps: this.generateNextSteps(enrichedTasks, enrichedBugs, context),
      // Contextual suggestions based on current state
      suggestions: this.generateSuggestions(enrichedTasks, enrichedBugs, context)
    };
  }

  private enrichTaskData(tasks: any[], context: ExecutionContext) {
    return tasks.map(task => ({
      ...task,
      semanticInfo: {
        isOverdue: this.isOverdue(task),
        isInCurrentSprint: task.Iteration?.Id === context.workspace.currentIteration?.id,
        daysInProgress: this.calculateDaysInProgress(task),
        isBlocked: this.checkIfBlocked(task),
        urgency: this.calculateUrgency(task)
      }
    }));
  }

  private enrichBugData(bugs: any[], context: ExecutionContext) {
    return bugs.map(bug => ({
      ...bug,
      semanticInfo: {
        isCritical: bug.Severity?.Name === 'Critical',
        affectsCurrentRelease: this.checkReleaseImpact(bug, context),
        customerImpact: this.assessCustomerImpact(bug),
        urgency: this.calculateBugUrgency(bug)
      }
    }));
  }

  private generateSummary(tasks: any[], bugs: any[], params: ShowMyTasksParams): string {
    const total = tasks.length + bugs.length;
    
    if (total === 0) {
      return params.includeCompleted 
        ? "You don't have any tasks assigned."
        : "You don't have any active tasks assigned. Great job staying on top of things!";
    }

    const parts: string[] = [];
    
    // Overall summary
    parts.push(`You have ${total} ${params.includeCompleted ? '' : 'active '}items assigned:`);
    
    // Task breakdown
    if (tasks.length > 0) {
      const inProgress = tasks.filter(t => t.EntityState.Name === 'In Progress').length;
      const blocked = tasks.filter(t => t.semanticInfo.isBlocked).length;
      
      parts.push(`\n📋 ${tasks.length} tasks`);
      if (inProgress > 0) parts.push(`  - ${inProgress} in progress`);
      if (blocked > 0) parts.push(`  - ⚠️ ${blocked} blocked`);
    }

    // Bug breakdown
    if (bugs.length > 0) {
      const critical = bugs.filter(b => b.semanticInfo.isCritical).length;
      parts.push(`\n🐛 ${bugs.length} bugs`);
      if (critical > 0) parts.push(`  - 🔴 ${critical} critical`);
    }

    // Priority summary
    const highPriority = [...tasks, ...bugs].filter(
      item => item.Priority?.Importance <= 2
    ).length;
    
    if (highPriority > 0) {
      parts.push(`\n⚡ ${highPriority} high priority items need attention`);
    }

    return parts.join('\\n');
  }

  private generateNextSteps(tasks: any[], bugs: any[], context: ExecutionContext): string[] {
    const nextSteps: string[] = [];
    
    // Provide workflow guidance based on current state
    if (tasks.length === 0 && bugs.length === 0) {
      nextSteps.push(
        'Check with your team lead for new assignments',
        'Review the product backlog for items to pick up',
        'Consider helping teammates with their tasks'
      );
    } else {
      const inProgress = tasks.filter(t => t.EntityState.Name === 'In Progress');
      const blocked = tasks.filter(t => t.semanticInfo.isBlocked);
      const critical = [...tasks, ...bugs].filter(
        item => item.Priority?.Importance <= 2 || item.semanticInfo?.isCritical
      );

      if (critical.length > 0) {
        nextSteps.push('Focus on high-priority items first');
      }

      if (inProgress.length === 0) {
        nextSteps.push('Select a task to start working on');
      } else if (inProgress.length > 3) {
        nextSteps.push('Consider completing some in-progress tasks before starting new ones');
      }

      if (blocked.length > 0) {
        nextSteps.push('Address blocked items or escalate impediments');
      }

      nextSteps.push(
        'Update progress on in-progress tasks',
        'Check if any tasks need time logging'
      );
    }

    return nextSteps;
  }

  private generateSuggestions(tasks: any[], bugs: any[], context: ExecutionContext): string[] {
    const suggestions: string[] = [];
    
    // Generate specific operation suggestions
    const notStarted = tasks.filter(t => t.EntityState.Name === 'Open');
    if (notStarted.length > 0) {
      const highPriorityOpen = notStarted.find(t => t.Priority?.Importance <= 2);
      const taskToStart = highPriorityOpen || notStarted[0];
      suggestions.push(`start-working-on ${taskToStart.Id} # ${taskToStart.Name}`);
    }

    // In-progress tasks that might need updates
    const inProgress = tasks.filter(t => t.EntityState.Name === 'In Progress');
    const oldInProgress = inProgress.filter(t => t.semanticInfo.daysInProgress > 3);
    if (oldInProgress.length > 0) {
      suggestions.push(`update-progress ${oldInProgress[0].Id} # Been in progress for ${oldInProgress[0].semanticInfo.daysInProgress} days`);
    }

    // Blocked items
    const blocked = tasks.filter(t => t.semanticInfo.isBlocked);
    if (blocked.length > 0) {
      suggestions.push('show-impediments');
      suggestions.push(`resolve-blocker ${blocked[0].Id}`);
    }

    // Critical bugs
    const criticalBugs = bugs.filter(b => b.semanticInfo.isCritical);
    if (criticalBugs.length > 0) {
      suggestions.push(`investigate-bug ${criticalBugs[0].Id} # Critical: ${criticalBugs[0].Name}`);
    }

    // Time tracking
    if (inProgress.length > 0) {
      suggestions.push(`log-time ${inProgress[0].Id}`);
    }

    return suggestions;
  }

  // Helper methods
  private isOverdue(task: any): boolean {
    if (!task.PlannedEndDate) return false;
    const plannedEnd = new Date(parseInt(task.PlannedEndDate.match(/\\d+/)[0]));
    return plannedEnd < new Date() && task.EntityState.Name !== 'Done';
  }

  private calculateDaysInProgress(task: any): number {
    if (task.EntityState.Name !== 'In Progress' || !task.LastStateChangeDate) return 0;
    const stateChangeDate = new Date(parseInt(task.LastStateChangeDate.match(/\\d+/)[0]));
    const now = new Date();
    return Math.floor((now.getTime() - stateChangeDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private checkIfBlocked(task: any): boolean {
    // Check for blocked tags or impediment custom fields
    return task.Tags?.toLowerCase().includes('blocked') || 
           task.CustomFields?.some((f: any) => 
             f.Name === 'Impediment' && f.Value
           );
  }

  private calculateUrgency(task: any): 'critical' | 'high' | 'medium' | 'low' {
    if (task.semanticInfo.isOverdue || task.semanticInfo.isBlocked) return 'critical';
    if (task.Priority?.Importance <= 2) return 'high';
    if (task.Priority?.Importance === 3) return 'medium';
    return 'low';
  }

  private checkReleaseImpact(bug: any, context: ExecutionContext): boolean {
    return bug.Release?.Id === context.workspace.currentRelease?.id;
  }

  private assessCustomerImpact(bug: any): 'high' | 'medium' | 'low' {
    // Logic to assess customer impact based on bug properties
    if (bug.Tags?.includes('customer-reported')) return 'high';
    if (bug.Severity?.Name === 'Critical') return 'high';
    if (bug.Severity?.Name === 'Major') return 'medium';
    return 'low';
  }

  private calculateBugUrgency(bug: any): 'critical' | 'high' | 'medium' | 'low' {
    if (bug.Severity?.Name === 'Critical') return 'critical';
    if (bug.semanticInfo.customerImpact === 'high') return 'high';
    if (bug.Priority?.Importance <= 2) return 'high';
    return 'medium';
  }
}