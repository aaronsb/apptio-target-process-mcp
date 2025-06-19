import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { 
  ExecutionContext, 
  PersonalityConfig,
  IPersonalityLoader
} from './interfaces/semantic-operation.interface.js';
import { logger } from '../utils/logger.js';

/**
 * Loads and manages personality configurations from JSON files
 * 
 * Each personality JSON file defines:
 * - availableOperations: Which semantic operations this role can access
 * - preferences: Default settings and behaviors
 * - workflowHints: Contextual suggestions for next actions
 */
export class PersonalityLoader implements IPersonalityLoader {
  private personalities: Map<string, PersonalityConfig> = new Map();
  private configPath: string;

  constructor(configPath: string = './config/personalities') {
    this.configPath = configPath;
    this.loadPersonalities();
  }

  private loadPersonalities(): void {
    // Try to load from JSON files first
    if (existsSync(this.configPath)) {
      try {
        const files = readdirSync(this.configPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = join(this.configPath, file);
            const content = readFileSync(filePath, 'utf8');
            const personality = JSON.parse(content) as PersonalityConfig;
            this.personalities.set(personality.id, personality);
            logger.info(`Loaded personality: ${personality.id} with ${personality.availableOperations.length} operations`);
          }
        }
      } catch (error) {
        console.warn(`Failed to load personalities from ${this.configPath}:`, error);
        this.loadDefaultPersonalities();
      }
    } else {
      logger.info(`Personalities directory not found at ${this.configPath}, loading defaults`);
      this.loadDefaultPersonalities();
    }
  }

  private loadDefaultPersonalities(): void {
    // Default personalities if no JSON files found
    const developerPersonality: PersonalityConfig = {
      id: 'developer',
      name: 'Developer',
      description: 'Software developer focused on task completion and code quality',
      availableOperations: [
        'show-my-tasks',
        'start-working-on',
        'update-progress',
        'complete-task',
        'pause-work',
        'show-my-bugs',
        'investigate-bug',
        'mark-bug-fixed',
        'log-time',
        'show-time-spent',
        'add-comment',
        'report-blocker',
        'request-review'
      ],
      preferences: {
        defaultTaskView: 'priority',
        includeCompletedTasks: false,
        autoAssignOnStart: true,
        showTimeTracking: true
      },
      workflowHints: {
        dailyStart: ['show-my-tasks'],
        taskCompleted: ['log-time', 'show-my-tasks'],
        bugFixed: ['request-review', 'show-my-bugs'],
        endOfDay: ['log-time', 'update-progress']
      }
    };

    const projectManagerPersonality: PersonalityConfig = {
      id: 'project-manager',
      name: 'Project Manager',
      description: 'Project manager focused on team coordination and delivery',
      availableOperations: [
        'show-team-tasks',
        'show-sprint-status',
        'reassign-task',
        'update-task-priority',
        'show-project-metrics',
        'show-team-velocity',
        'show-blockers',
        'schedule-meeting',
        'create-sprint-report',
        'manage-backlog'
      ],
      preferences: {
        defaultView: 'team',
        includeAllStates: true,
        showMetrics: true,
        trackVelocity: true
      },
      workflowHints: {
        dailyStart: ['show-team-tasks', 'show-blockers'],
        sprintPlanning: ['manage-backlog', 'show-team-velocity'],
        sprintEnd: ['create-sprint-report', 'show-project-metrics']
      }
    };

    const adminPersonality: PersonalityConfig = {
      id: 'administrator',
      name: 'Administrator',
      description: 'Full access to all operations',
      availableOperations: ['*'],  // Wildcard for all operations
      preferences: {
        showAdvancedOptions: true,
        allowBulkOperations: true
      }
    };

    this.personalities.set('developer', developerPersonality);
    this.personalities.set('project-manager', projectManagerPersonality);
    this.personalities.set('administrator', adminPersonality);
  }

  getPersonality(id: string): PersonalityConfig | undefined {
    return this.personalities.get(id);
  }

  getAllPersonalities(): PersonalityConfig[] {
    return Array.from(this.personalities.values());
  }

  getAvailableOperations(personalityId: string): string[] {
    const personality = this.getPersonality(personalityId);
    return personality?.availableOperations || [];
  }

  buildExecutionContext(
    personalityId: string,
    userData: {
      id: number;
      name: string;
      email?: string;
    },
    workspaceData?: {
      projectId?: number;
      teamId?: number;
      iterationId?: number;
    },
    conversationData?: {
      recentEntities?: Array<{ id: number; type: string }>;
      lastOperation?: string;
    }
  ): ExecutionContext {
    const personality = this.getPersonality(personalityId);
    if (!personality) {
      throw new Error(`Unknown personality: ${personalityId}`);
    }

    return {
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email || '',
        role: personalityId,
        teams: [],
        permissions: this.getPermissionsForPersonality(personality)
      },
      workspace: {
        currentProject: workspaceData?.projectId ? {
          id: workspaceData.projectId,
          name: '',  // Would be loaded from API
          process: ''
        } : undefined,
        recentEntities: conversationData?.recentEntities?.map(e => ({ ...e, name: '' })) || []
      },
      personality: {
        mode: personalityId,
        features: personality.availableOperations,
        restrictions: personality.capabilities || {}
      },
      conversation: {
        mentionedEntities: [],
        previousOperations: conversationData?.lastOperation ? [conversationData.lastOperation] : [],
        intent: ''
      },
      config: {
        apiUrl: process.env.TP_DOMAIN || '',
        maxResults: 100,
        timeout: 30000
      }
    };
  }

  private getPermissionsForPersonality(personality: PersonalityConfig): string[] {
    const permissions: string[] = [];
    
    // If wildcard operations, grant all permissions
    if (personality.availableOperations.includes('*')) {
      return ['all'];
    }
    
    // Map operations to permissions
    if (personality.availableOperations.some(op => op.includes('create'))) {
      permissions.push('create');
    }
    if (personality.availableOperations.some(op => op.includes('update') || op.includes('edit'))) {
      permissions.push('update');
    }
    if (personality.availableOperations.some(op => op.includes('delete'))) {
      permissions.push('delete');
    }
    if (personality.availableOperations.some(op => op.includes('show') || op.includes('view'))) {
      permissions.push('read');
    }
    
    return permissions;
  }
}

// Export a singleton instance
export const personalityLoader = new PersonalityLoader();
