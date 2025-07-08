import { SemanticOperation, ExecutionContext } from '../../core/interfaces/semantic-operation.interface.js';
import { TPService } from '../../api/client/tp.service.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';

const SearchWorkItemsParams = z.object({
  query: z.string().describe('Search query for work items'),
  projectId: z.number().optional().describe('Filter by project ID'),
  limit: z.number().min(1).max(100).default(20).describe('Maximum number of results')
});

type SearchWorkItemsInput = z.infer<typeof SearchWorkItemsParams>;

/**
 * General-purpose work item search for default users
 * Searches across UserStories, Bugs, Tasks, and Features
 */
export class SearchWorkItemsOperation implements SemanticOperation<SearchWorkItemsInput> {
  constructor(private service: TPService) {}

  metadata = {
    id: 'search-work-items',
    name: 'Search Work Items',
    description: 'Search for work items across all types (stories, bugs, tasks, features)',
    category: 'general-workflow',
    requiredPersonalities: ['default', 'all'],
    examples: [
      'search for login bug',
      'find all work items about authentication',
      'show items in project 123'
    ],
    tags: ['search', 'find', 'query', 'work items']
  };

  inputSchema = SearchWorkItemsParams;

  async execute(context: ExecutionContext, params: SearchWorkItemsInput): Promise<any> {
    try {
      const types = ['UserStory', 'Bug', 'Task', 'Feature'];
      const results: any[] = [];

      // Build where clause
      let whereClause = `Name contains '${params.query}' or Description contains '${params.query}'`;
      if (params.projectId) {
        whereClause = `(${whereClause}) and Project.Id = ${params.projectId}`;
      }

      // Search each entity type
      for (const type of types) {
        try {
          const items = await this.service.searchEntities(
            type,
            whereClause,
            ['Name', 'EntityState', 'Project', 'Priority'],
            Math.floor(params.limit / types.length),
            ['Priority.Importance desc', 'CreateDate desc']
          );

          results.push(...items.map((item: any) => ({
            ...item,
            EntityType: type
          })));
        } catch (error) {
          logger.warn(`Failed to search ${type}: ${error}`);
        }
      }

      // Sort combined results by priority
      results.sort((a, b) => {
        const aPriority = a.Priority?.Importance || 999;
        const bPriority = b.Priority?.Importance || 999;
        return aPriority - bPriority;
      });

      return {
        content: [{
          type: 'text',
          text: results.length > 0
            ? `Found ${results.length} work items:\n\n${this.formatResults(results)}`
            : `No work items found matching "${params.query}"`
        }]
      };
    } catch (error) {
      logger.error('Search work items failed:', error);
      throw error;
    }
  }

  private formatResults(items: any[]): string {
    return items.map((item, index) => {
      const priority = item.Priority?.Name || 'No Priority';
      const state = item.EntityState?.Name || 'Unknown';
      const project = item.Project?.Name || 'No Project';
      
      return `${index + 1}. [${item.EntityType}] ${item.Name}
   ID: ${item.Id}
   State: ${state}
   Priority: ${priority}
   Project: ${project}`;
    }).join('\n\n');
  }
}