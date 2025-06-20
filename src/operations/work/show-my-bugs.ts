import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext, SemanticOperation, OperationResult } from '../../core/interfaces/semantic-operation.interface.js';
import { logger } from '../../utils/logger.js';

export const showMyBugsSchema = z.object({
  includeClosed: z.boolean().optional().default(false),
  severity: z.enum(['all', 'critical', 'major', 'minor']).optional().default('all'),
  limit: z.number().optional().default(20)
});

export type ShowMyBugsParams = z.infer<typeof showMyBugsSchema>;

/**
 * Show My Bugs Operation
 * Displays bugs assigned to the current user with intelligent filtering and prioritization
 */
export class ShowMyBugsOperation implements SemanticOperation<ShowMyBugsParams> {
  constructor(private service: TPService) {}

  get metadata() {
    return {
      id: 'show-my-bugs',
      name: 'Show My Bugs',
      description: 'View bugs assigned to you with smart filtering and priority insights',
      category: 'bug-management',
      requiredPersonalities: ['developer', 'tester', 'administrator'],
      examples: [
        'Show my bugs',
        'What bugs am I working on?',
        'Show critical bugs assigned to me',
        'List my open bugs'
      ],
      tags: ['bug', 'personal', 'workflow', 'quality']
    };
  }

  getSchema() {
    return showMyBugsSchema;
  }

  async execute(context: ExecutionContext, params: ShowMyBugsParams): Promise<OperationResult> {
    try {
      // Build where conditions
      const whereConditions: string[] = [];
      
      // Add state filter - discover final states dynamically
      if (!params.includeClosed) {
        try {
          const finalStates = await this.service.searchEntities(
            'EntityState',
            `(EntityType.Name eq 'Bug') and (IsFinal eq true)`,
            ['EntityType', 'IsFinal'],
            10
          );
          
          if (finalStates.length > 0) {
            const finalStateNames = finalStates.map((s: any) => s.Name);
            finalStateNames.forEach(stateName => {
              whereConditions.push(`EntityState.Name ne '${stateName}'`);
            });
          } else {
            // Fallback to common closed states if discovery fails
            whereConditions.push(`EntityState.Name ne 'Closed'`);
            whereConditions.push(`EntityState.Name ne 'Fixed'`);
          }
        } catch (stateError) {
          // Fallback to common closed states if discovery fails
          logger.warn('Failed to discover final states:', stateError);
          whereConditions.push(`EntityState.Name ne 'Closed'`);
          whereConditions.push(`EntityState.Name ne 'Fixed'`);
        }
      }

      // Add severity filter - discover available severities dynamically
      if (params.severity !== 'all') {
        try {
          const severities = await this.service.searchEntities(
            'Severity',
            undefined,
            ['Name', 'Importance'],
            20
          );
          
          // Group severities by user's filter preference
          let targetSeverities: string[] = [];
          if (params.severity === 'critical') {
            // Find highest importance (usually lowest number)
            const sortedByImportance = severities.sort((a: any, b: any) => 
              (a.Importance || 999) - (b.Importance || 999)
            );
            targetSeverities = sortedByImportance.slice(0, 1).map((s: any) => s.Name);
          } else if (params.severity === 'major') {
            // Find middle importance levels
            const sortedByImportance = severities.sort((a: any, b: any) => 
              (a.Importance || 999) - (b.Importance || 999)
            );
            const midIndex = Math.floor(sortedByImportance.length / 2);
            targetSeverities = sortedByImportance.slice(midIndex, midIndex + 1).map((s: any) => s.Name);
          } else if (params.severity === 'minor') {
            // Find lower importance levels
            const sortedByImportance = severities.sort((a: any, b: any) => 
              (a.Importance || 999) - (b.Importance || 999)
            );
            targetSeverities = sortedByImportance.slice(-2).map((s: any) => s.Name);
          }
          
          if (targetSeverities.length > 0) {
            whereConditions.push(`Severity.Name in ['${targetSeverities.join("','")}']`);
          }
        } catch (severityError) {
          // If severity discovery fails, continue without severity filter
          logger.warn('Failed to discover severities:', severityError);
        }
      }

      const whereClause = whereConditions.length > 0 ? whereConditions.join(' and ') : undefined;
      logger.error('ShowMyBugs - User ID:', context.user.id);
      logger.error('ShowMyBugs - Where clause:', whereClause || '(none)');
      
      // Search for bugs
      const allBugs = await this.service.searchEntities(
        'Bug',
        whereClause,
        ['Project', 'Priority', 'Severity', 'EntityState', 'Tags', 'AssignedUser'],
        params.limit * 10 // Get more to filter
      );
      
      // Filter for assigned user in code (same pattern as show-my-tasks)
      const bugs = allBugs.filter((bug: any) => {
        const assignedUsers = bug.AssignedUser?.Items || [];
        return assignedUsers.some((user: any) => user.Id === context.user.id);
      }).slice(0, params.limit);

      // Generate summary
      const summary = this.generateSummary(bugs, params);

      return {
        content: [
          {
            type: 'text' as const,
            text: summary
          },
          {
            type: 'structured-data' as const,
            data: {
              bugs: bugs.map(bug => {
                const bugData = bug as any;
                return {
                  id: bugData.Id,
                  name: bugData.Name,
                  severity: bugData.Severity,
                  priority: bugData.Priority,
                  entityState: bugData.EntityState,
                  project: bugData.Project,
                  assignedUser: bugData.AssignedUser,
                  tags: bugData.Tags,
                  semanticInfo: this.enrichBugData(bug)
                };
              }),
              metadata: {
                totalItems: bugs.length,
                filters: params,
                severityBreakdown: this.getSeverityBreakdown(bugs),
                priorityBreakdown: this.getPriorityBreakdown(bugs)
              }
            }
          }
        ],
        suggestions: this.generateSuggestions(bugs)
      };
    } catch (error) {
      return {
        content: [{
          type: 'error' as const,
          text: `Failed to fetch bugs: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private generateSummary(bugs: any[], params: ShowMyBugsParams): string {
    if (bugs.length === 0) {
      return params.includeClosed 
        ? "You don't have any bugs assigned."
        : "You don't have any open bugs assigned. Great work on quality! 🎉";
    }

    const parts: string[] = [];
    parts.push(`🐛 You have ${bugs.length} ${params.includeClosed ? '' : 'open '}bugs assigned:`);
    
    // Severity breakdown
    const bySeverity = this.getSeverityBreakdown(bugs);
    if (Object.keys(bySeverity).length > 0) {
      parts.push('\n📊 **By Severity:**');
      Object.entries(bySeverity).forEach(([severity, count]) => {
        // Use severity importance for icons (lower number = higher importance = red)
        const severityData = bugs.find(b => b.Severity?.Name === severity)?.Severity;
        const importance = severityData?.Importance || 999;
        const icon = importance <= 2 ? '🔴' : importance <= 4 ? '🟠' : '🟡';
        parts.push(`  ${icon} ${count} ${severity}`);
      });
    }

    // State breakdown
    const byState = bugs.reduce((acc, bug) => {
      const state = bug.EntityState?.Name || 'Unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(byState).length > 0) {
      parts.push('\n📋 **By State:**');
      Object.entries(byState).forEach(([state, count]) => {
        parts.push(`  • ${count} ${state}`);
      });
    }

    return parts.join('\n');
  }

  private enrichBugData(bug: any) {
    // Use dynamic importance levels instead of hard-coded names
    const severityImportance = bug.Severity?.Importance || 999;
    const priorityImportance = bug.Priority?.Importance || 999;
    const isInitialState = bug.EntityState?.IsInitial || false;
    
    return {
      isCritical: severityImportance <= 2,
      isHighPriority: priorityImportance <= 2,
      needsAttention: severityImportance <= 2 || 
                     (priorityImportance <= 2 && isInitialState),
      severity: bug.Severity?.Name || 'Unknown',
      priority: bug.Priority?.Name || 'Unknown'
    };
  }

  private getSeverityBreakdown(bugs: any[]): Record<string, number> {
    return bugs.reduce((acc, bug) => {
      const severity = bug.Severity?.Name || 'Unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getPriorityBreakdown(bugs: any[]): Record<string, number> {
    return bugs.reduce((acc, bug) => {
      const priority = bug.Priority?.Name || 'Unknown';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateSuggestions(bugs: any[]): string[] {
    const suggestions: string[] = [];
    
    if (bugs.length === 0) {
      // No bugs - suggest other work
      suggestions.push('show-my-tasks - Check for tasks to work on');
      suggestions.push('search_entities type:Bug - Find available bugs to investigate');
    } else {
      // Have bugs - suggest actions
      const criticalBugs = bugs.filter(b => (b.Severity?.Importance || 999) <= 2);
      const openBugs = bugs.filter(b => b.EntityState?.IsInitial || (!b.EntityState?.IsFinal && !b.EntityState?.IsInitial));
      
      if (criticalBugs.length > 0) {
        suggestions.push(`investigate-bug ${criticalBugs[0].Id} - Start with critical bug: ${criticalBugs[0].Name}`);
      } else if (openBugs.length > 0) {
        suggestions.push(`investigate-bug ${openBugs[0].Id} - Investigate: ${openBugs[0].Name}`);
      }

      // General suggestions
      suggestions.push('search_entities type:EntityState where:EntityType.Name=="Bug" - See all bug states');
      suggestions.push('show-my-tasks - Check tasks between bug work');
    }

    return suggestions;
  }
}