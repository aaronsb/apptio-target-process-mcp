import { TPService } from '../api/client/tp.service.js';
import { TPContextInfo } from '../context/context-builder.js';

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

export class ResourceProvider {
  constructor(
    private service: TPService,
    private context: TPContextInfo | null
  ) {}

  /**
   * Get all available resources
   */
  getAvailableResources() {
    return [
      {
        uri: 'targetprocess://schema',
        name: 'TargetProcess Schema',
        description: 'Entity types, fields, and relationships available in this TP instance',
        mimeType: 'application/json'
      },
      {
        uri: 'targetprocess://projects',
        name: 'Projects Overview',
        description: 'Current projects with details, states, and progress',
        mimeType: 'application/json'
      },
      {
        uri: 'targetprocess://workflows',
        name: 'Workflow States',
        description: 'Available entity states and workflow information',
        mimeType: 'application/json'
      },
      {
        uri: 'targetprocess://query-examples',
        name: 'Query Examples',
        description: 'Common TargetProcess query patterns and examples',
        mimeType: 'text/markdown'
      }
    ];
  }

  /**
   * Get resource content by URI
   */
  async getResourceContent(uri: string): Promise<ResourceContent> {
    switch (uri) {
      case 'targetprocess://schema':
        return await this.getSchemaResource();
      case 'targetprocess://projects':
        return await this.getProjectsResource();
      case 'targetprocess://workflows':
        return await this.getWorkflowsResource();
      case 'targetprocess://query-examples':
        return this.getQueryExamplesResource();
      default:
        throw new Error(`Unknown resource URI: ${uri}`);
    }
  }

  private async getSchemaResource(): Promise<ResourceContent> {
    const schema = {
      entityTypes: this.context?.entityTypes || [],
      commonFields: {
        all: ['Id', 'Name', 'CreateDate', 'ModifyDate', 'EntityType'],
        assignable: ['AssignedUser', 'Owner', 'EntityState', 'Project', 'Priority'],
        workItems: ['Effort', 'EffortCompleted', 'EffortToDo', 'Description'],
        hierarchical: ['Parent', 'Children']
      },
      relationships: {
        Project: ['Program', 'Team', 'Process', 'EntityState'],
        UserStory: ['Project', 'AssignedUser', 'Owner', 'EntityState', 'Iteration', 'Feature'],
        Bug: ['Project', 'AssignedUser', 'Owner', 'EntityState', 'UserStory'],
        Task: ['Project', 'AssignedUser', 'Owner', 'EntityState', 'UserStory', 'Iteration'],
        Feature: ['Project', 'Owner', 'EntityState', 'Epic'],
        Epic: ['Project', 'Owner', 'EntityState', 'Program']
      },
      customFields: 'Available via inspect_object tool - varies by entity type and configuration'
    };

    return {
      uri: 'targetprocess://schema',
      mimeType: 'application/json',
      text: JSON.stringify(schema, null, 2)
    };
  }

  private async getProjectsResource(): Promise<ResourceContent> {
    const projects = {
      summary: {
        total: this.context?.projects.length || 0,
        programs: this.context?.projects ? [...new Set(this.context.projects.map(p => p.program).filter(Boolean))] : []
      },
      projects: this.context?.projects ? this.context.projects.map(p => ({
        id: p.id,
        name: p.name,
        abbreviation: p.abbreviation,
        state: p.entityState,
        program: p.program,
        uri: `targetprocess://projects/${p.id}`
      })) : [],
      programs: this.context?.programs || []
    };

    return {
      uri: 'targetprocess://projects',
      mimeType: 'application/json',
      text: JSON.stringify(projects, null, 2)
    };
  }

  private async getWorkflowsResource(): Promise<ResourceContent> {
    const workflows = {
      entityStates: this.context?.entityStates || [],
      statesByEntityType: this.context?.entityStates ? this.context.entityStates.reduce((acc, state) => {
        const type = state.entityType || 'General';
        if (!acc[type]) acc[type] = [];
        acc[type].push(state.name);
        return acc;
      }, {} as Record<string, string[]>) : {},
      commonWorkflows: {
        'Project': ['Evaluating', 'Emerging', 'Investing', 'Running', 'Retiring'],
        'UserStory': ['Open', 'In Progress', 'Testing', 'Done'],
        'Bug': ['Open', 'In Progress', 'Testing', 'Closed'],
        'Task': ['Open', 'In Progress', 'Done']
      }
    };

    return {
      uri: 'targetprocess://workflows',
      mimeType: 'application/json',
      text: JSON.stringify(workflows, null, 2)
    };
  }

  private getQueryExamplesResource(): ResourceContent {
    const examples = `# TargetProcess Query Examples

## Basic Filtering

### By Entity State
\`\`\`
EntityState.Name eq 'Open'
EntityState.Name in ('Open', 'In Progress')
\`\`\`

### By Project
\`\`\`
Project.Name eq 'Digital Transformation'
Project.Id eq ${this.context?.projects[0]?.id || 12345}
\`\`\`

### By Assignment
\`\`\`
AssignedUser.Login eq 'john.doe'
Owner.FullName eq 'John Doe'
\`\`\`

### By Date
\`\`\`
CreateDate gte '2024-01-01'
ModifyDate gte Today.AddDays(-7)
\`\`\`

## Advanced Filtering

### Multiple Conditions
\`\`\`
(EntityState.Name eq 'Open') and (Project.Name eq 'MyProject')
(Priority.Name eq 'High') or (Priority.Name eq 'Critical')
\`\`\`

### Effort and Progress
\`\`\`
Effort gt 0
EffortToDo gt 0
Progress lt 1
\`\`\`

### Hierarchical Queries
\`\`\`
Parent.Name eq 'Epic Name'
Children.Count gt 0
\`\`\`

## Useful Presets

Available via search tool:
- \`searchPresets.open\` - Open items
- \`searchPresets.myTasks\` - Assigned to current user
- \`searchPresets.highPriority\` - High/Critical priority
- \`searchPresets.createdToday\` - Created today
- \`searchPresets.modifiedThisWeek\` - Modified this week

## Date Functions

- \`Today\` - Current date
- \`Today.AddDays(7)\` - Week from now
- \`Today.AddDays(-30)\` - Month ago
- \`ThisWeek.StartDate\` - Start of current week
- \`ThisMonth.StartDate\` - Start of current month
`;

    return {
      uri: 'targetprocess://query-examples',
      mimeType: 'text/markdown',
      text: examples
    };
  }
}