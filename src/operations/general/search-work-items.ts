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

      // Build where clause using the exact format that works in curl tests
      let whereClause = `Name contains '${params.query}'`;
      if (params.projectId) {
        whereClause = `${whereClause} and Project.Id eq ${params.projectId}`;
      }

      // Search each entity type sequentially (not concurrently) to avoid issues
      for (const type of types) {
        try {
          const items = await this.service.searchEntities(
            type,
            whereClause,
            undefined, // Don't specify include to match working curl calls
            Math.floor(params.limit / types.length),
            undefined  // Don't specify orderBy to match working curl calls
          );

          results.push(...items.map((item: any) => ({
            ...item,
            EntityType: type
          })));
        } catch (error) {
          logger.warn(`Failed to search ${type}: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with other entity types even if one fails
        }
      }

      // Sort combined results by priority if available
      results.sort((a, b) => {
        const aPriority = a.Priority?.Importance || a.NumericPriority || 999;
        const bPriority = b.Priority?.Importance || b.NumericPriority || 999;
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
      const description = item.Description ? `\n   Description: ${item.Description.substring(0, 100)}${item.Description.length > 100 ? '...' : ''}` : '';
      
      return `${index + 1}. [${item.EntityType}] ${item.Name}
   ID: ${item.Id}
   State: ${state}
   Priority: ${priority}
   Project: ${project}${description}`;
    }).join('\n\n');
  }
}