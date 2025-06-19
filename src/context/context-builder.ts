import { TPService } from '../api/client/tp.service.js';
import { logger } from '../utils/logger.js';

export interface TPContextInfo {
  projects: Array<{
    id: number;
    name: string;
    abbreviation: string;
    entityState: string;
    program?: string;
  }>;
  entityTypes: string[];
  programs: Array<{
    id: number;
    name: string;
  }>;
  entityStates: Array<{
    id: number;
    name: string;
    entityType?: string;
  }>;
  users: Array<{
    id: number;
    fullName: string;
    login: string;
  }>;
}

export class TPContextBuilder {
  constructor(private service: TPService) {}

  async buildContext(): Promise<TPContextInfo> {
    const context: TPContextInfo = {
      projects: [],
      entityTypes: [],
      programs: [],
      entityStates: [],
      users: []
    };

    // Fetch projects with error handling
    try {
      const projectsResult = await this.service.searchEntities<any>(
        'Project',
        undefined,
        ['EntityState', 'Program'],
        20
      );

      if (projectsResult && Array.isArray(projectsResult)) {
        context.projects = projectsResult.map((project: any) => ({
          id: project.Id,
          name: project.Name,
          abbreviation: project.Abbreviation || '',
          entityState: project.EntityState?.Name || 'Unknown',
          program: project.Program?.Name
        }));
      }
    } catch (error) {
      logger.error('Failed to fetch projects for context:', error);
    }

    // Fetch programs with error handling
    try {
      const programsResult = await this.service.searchEntities<any>(
        'Program',
        undefined,
        undefined,
        20
      );

      if (programsResult && Array.isArray(programsResult)) {
        context.programs = programsResult.map((program: any) => ({
          id: program.Id,
          name: program.Name
        }));
      }
    } catch (error) {
      logger.error('Failed to fetch programs for context:', error);
    }

    // Fetch entity states with error handling
    try {
      const statesResult = await this.service.searchEntities<any>(
        'EntityState',
        undefined,
        ['EntityType'],
        50
      );

      if (statesResult && Array.isArray(statesResult)) {
        context.entityStates = statesResult.map((state: any) => ({
          id: state.Id,
          name: state.Name,
          entityType: state.EntityType?.Name
        }));
      }
    } catch (error) {
      logger.error('Failed to fetch entity states for context:', error);
    }

    // Fetch users with error handling
    try {
      const usersResult = await this.service.searchEntities<any>(
        'GeneralUser',
        undefined,
        undefined,
        20
      );

      if (usersResult && Array.isArray(usersResult)) {
        context.users = usersResult.map((user: any) => ({
          id: user.Id,
          fullName: user.FullName,
          login: user.Login
        }));
      }
    } catch (error) {
      logger.error('Failed to fetch users for context:', error);
    }

    // Discover available entity types
    const entityTypes = new Set<string>();
    const baseTypes = ['Project', 'Program', 'EntityState', 'GeneralUser'];
    const commonTypes = ['UserStory', 'Bug', 'Task', 'Feature', 'Epic', 'Iteration', 'Team', 'Release', 'TestCase', 'TestPlan'];

    // Add base types that we know exist
    baseTypes.forEach(type => entityTypes.add(type));

    // Test common entity types
    for (const type of commonTypes) {
      try {
        const result = await this.service.searchEntities<any>(
          type,
          undefined,
          undefined,
          1
        );
        if (result && Array.isArray(result) && result.length > 0) {
          entityTypes.add(type);
        }
      } catch (error) {
        // Type doesn't exist or not accessible, skip silently
      }
    }

    context.entityTypes = Array.from(entityTypes).sort();

    return context;
  }

  generateContextDescription(context: TPContextInfo): string {
    const parts = [];

    parts.push(`This TargetProcess instance contains:`);

    if (context.projects.length > 0) {
      parts.push(`\n**Projects** (${context.projects.length} available):`);
      context.projects.slice(0, 10).forEach(p => {
        const program = p.program ? ` [${p.program}]` : '';
        parts.push(`- ${p.name} (${p.abbreviation}) - ${p.entityState}${program}`);
      });
      if (context.projects.length > 10) {
        parts.push(`... and ${context.projects.length - 10} more projects`);
      }
    }

    if (context.programs.length > 0) {
      parts.push(`\n**Programs** (${context.programs.length} available):`);
      context.programs.slice(0, 5).forEach(p => {
        parts.push(`- ${p.name}`);
      });
      if (context.programs.length > 5) {
        parts.push(`... and ${context.programs.length - 5} more programs`);
      }
    }

    if (context.entityTypes.length > 0) {
      parts.push(`\n**Available Entity Types:**`);
      parts.push(context.entityTypes.join(', '));
    }

    if (context.entityStates.length > 0) {
      parts.push(`\n**Entity States:**`);
      const statesByType = context.entityStates.reduce((acc, state) => {
        const type = state.entityType || 'General';
        if (!acc[type]) acc[type] = [];
        acc[type].push(state.name);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(statesByType).forEach(([type, states]) => {
        parts.push(`- ${type}: ${states.slice(0, 5).join(', ')}${states.length > 5 ? '...' : ''}`);
      });
    }

    return parts.join('\n');
  }
}