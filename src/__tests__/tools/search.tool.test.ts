import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SearchTool } from '../../tools/search/search.tool.js';
import { createMockTPService, createMockEntity } from '../mocks/tp-service.mock-utils.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

describe('SearchTool', () => {
  let searchTool: SearchTool;
  let mockService: ReturnType<typeof createMockTPService>;

  beforeEach(() => {
    mockService = createMockTPService();
    searchTool = new SearchTool(mockService);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should search entities with basic parameters', async () => {
      const mockStories = [
        createMockEntity('UserStory', { Name: 'Story 1' }),
        createMockEntity('UserStory', { Name: 'Story 2' })
      ];
      
      mockService.searchEntities.mockResolvedValue(mockStories);

      const result = await searchTool.execute({
        type: 'UserStory',
        take: 10
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'UserStory',
        undefined,  // where
        undefined,  // include
        10,         // take
        undefined   // orderBy
      );
      
      expect(result).toMatchObject({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockStories, null, 2)
          }
        ]
      });
    });

    it('should search with where clause', async () => {
      const mockBugs = [
        createMockEntity('Bug', { 
          Name: 'Critical Bug',
          Priority: { Name: 'Critical' }
        })
      ];
      
      mockService.searchEntities.mockResolvedValue(mockBugs);

      const result = await searchTool.execute({
        type: 'Bug',
        where: "Priority.Name eq 'Critical'",
        take: 25
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Bug',
        "Priority.Name eq 'Critical'",
        undefined,  // include
        25,         // take
        undefined   // orderBy
      );
      
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult).toHaveLength(1);
      expect(parsedResult[0].Priority.Name).toBe('Critical');
    });

    it('should search with includes', async () => {
      const mockTasks = [
        createMockEntity('Task', {
          UserStory: { Id: 1, Name: 'Parent Story' },
          AssignedUser: { Id: 2, Name: 'John Doe' }
        })
      ];
      
      mockService.searchEntities.mockResolvedValue(mockTasks);

      const result = await searchTool.execute({
        type: 'Task',
        include: ['UserStory', 'AssignedUser'],
        take: 10
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Task',
        undefined,                        // where
        ['UserStory', 'AssignedUser'],  // include
        10,                              // take
        undefined                        // orderBy
      );
    });

    it('should handle orderBy parameter', async () => {
      const mockFeatures = [
        createMockEntity('Feature', { Name: 'Feature 1' })
      ];
      
      mockService.searchEntities.mockResolvedValue(mockFeatures);

      await searchTool.execute({
        type: 'Feature',
        orderBy: ['CreateDate desc']
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Feature',
        undefined,      // where
        undefined,      // include
        undefined,      // take
        ['CreateDate']  // orderBy cleaned (desc removed)
      );
    });

    it('should handle multiple orderBy fields', async () => {
      const mockBugs = [
        createMockEntity('Bug', { Name: 'Bug 1' })
      ];
      
      mockService.searchEntities.mockResolvedValue(mockBugs);

      await searchTool.execute({
        type: 'Bug',
        orderBy: ['CreateDate', 'ModifyDate']
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Bug',
        undefined,                      // where
        undefined,                      // include
        undefined,                      // take
        ['CreateDate', 'ModifyDate']   // orderBy
      );
    });

    it('should process search presets', async () => {
      const mockBugs = [];
      mockService.searchEntities.mockResolvedValue(mockBugs);

      const result = await searchTool.execute({
        type: 'Bug',
        where: 'searchPresets.highPriority',
        take: 5
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Bug',
        'Priority.Name eq "High"',  // Expanded from preset
        undefined,                   // include
        5,                          // take
        undefined                   // orderBy
      );
    });

    it('should process date presets with actual dates', async () => {
      const mockTasks = [];
      mockService.searchEntities.mockResolvedValue(mockTasks);

      const result = await searchTool.execute({
        type: 'Task',
        where: 'searchPresets.createdToday',
        take: 5
      });

      // Check that the where clause has been expanded with real dates
      const callArgs = mockService.searchEntities.mock.calls[0];
      expect(callArgs[0]).toBe('Task');
      expect(callArgs[1]).toMatch(/CreateDate gte '\d{4}-\d{2}-\d{2}' and CreateDate lt '\d{4}-\d{2}-\d{2}'/);
      expect(callArgs[3]).toBe(5);
    });

    it('should handle invalid entity type', async () => {
      await expect(
        searchTool.execute({
          type: '',
          take: 10
        })
      ).rejects.toThrow(McpError);
    });

    it('should handle invalid take parameter', async () => {
      await expect(
        searchTool.execute({
          type: 'UserStory',
          take: -1
        })
      ).rejects.toThrow('Invalid search parameters');
    });

    it('should handle invalid preset name', async () => {
      await expect(
        searchTool.execute({
          type: 'UserStory',
          where: 'searchPresets.invalidPreset'
        })
      ).rejects.toThrow('Unknown search preset: invalidPreset');
    });

    it('should handle API errors gracefully', async () => {
      mockService.searchEntities.mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        searchTool.execute({
          type: 'UserStory'
        })
      ).rejects.toThrow('Search failed: Network error');
    });

    it('should handle complex where clauses', async () => {
      mockService.searchEntities.mockResolvedValue([]);

      await searchTool.execute({
        type: 'UserStory',
        where: "(Project.Id eq 123) and (EntityState.Name ne 'Done') and (Priority.Name eq 'High')"
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'UserStory',
        "(Project.Id eq 123) and (EntityState.Name ne 'Done') and (Priority.Name eq 'High')",
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe('getDefinition', () => {
    it('should return proper tool definition', () => {
      const definition = SearchTool.getDefinition();
      
      expect(definition.name).toBe('search_entities');
      expect(definition.description).toContain('Search Target Process entities');
      expect(definition.inputSchema.properties).toHaveProperty('type');
      expect(definition.inputSchema.properties).toHaveProperty('where');
      expect(definition.inputSchema.properties).toHaveProperty('include');
      expect(definition.inputSchema.properties).toHaveProperty('take');
      expect(definition.inputSchema.properties).toHaveProperty('orderBy');
      expect(definition.inputSchema.required).toEqual(['type']);
    });
  });
});