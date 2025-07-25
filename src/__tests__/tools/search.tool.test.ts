import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SearchTool } from '../../tools/search/search.tool.js';
import { createMockTPService, createMockEntity, createMockSearchResponse } from '../mocks/tp-service.mock-utils.js';

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
        entityType: 'UserStory',
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
        entityType: 'Bug',
        where: "Priority.Name = 'Critical'",
        take: 25
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Bug',
        { 
          where: "Priority.Name = 'Critical'",
          take: 25 
        }
      );
      
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].Priority.Name).toBe('Critical');
    });

    it('should search with includes', async () => {
      const mockTasks = [
        createMockEntity('Task', {
          UserStory: { Id: 1, Name: 'Parent Story' },
          AssignedUser: { Id: 2, Name: 'John Doe' }
        })
      ];
      
      mockService.searchEntities.mockResolvedValue(
        createMockSearchResponse(mockTasks)
      );

      const result = await searchTool.execute({
        entityType: 'Task',
        include: 'UserStory,AssignedUser',
        take: 10
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Task',
        { 
          include: 'UserStory,AssignedUser',
          take: 10 
        }
      );
    });

    it('should handle pagination', async () => {
      const mockProjects = Array(25).fill(null).map((_, i) => 
        createMockEntity('Project', { Name: `Project ${i}` })
      );
      
      mockService.searchEntities.mockResolvedValue(
        createMockSearchResponse(mockProjects, 50)
      );

      const result = await searchTool.execute({
        entityType: 'Project',
        take: 25,
        skip: 0
      });

      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(50);
      expect(result.entities).toHaveLength(25);
    });

    it('should handle complex where clauses', async () => {
      mockService.searchEntities.mockResolvedValue(
        createMockSearchResponse([])
      );

      await searchTool.execute({
        entityType: 'UserStory',
        where: "(Project.Id = 123) and (EntityState.Name != 'Done') and (Priority.Name in ['High', 'Critical'])"
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'UserStory',
        { 
          where: "(Project.Id = 123) and (EntityState.Name != 'Done') and (Priority.Name in ['High', 'Critical'])",
          take: 25 
        }
      );
    });

    it('should handle errors gracefully', async () => {
      mockService.searchEntities.mockRejectedValue(
        new Error('Network error')
      );

      await expect(searchTool.execute({
        entityType: 'UserStory'
      })).rejects.toThrow('Network error');
    });

    it('should validate entity type', async () => {
      mockService.validateEntityType.mockRejectedValue(
        new Error('Invalid entity type: InvalidType')
      );

      await expect(searchTool.execute({
        entityType: 'InvalidType'
      })).rejects.toThrow('Invalid entity type');
    });

    it('should apply default take value', async () => {
      mockService.searchEntities.mockResolvedValue(
        createMockSearchResponse([])
      );

      await searchTool.execute({
        entityType: 'Epic'
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Epic',
        { take: 25 }
      );
    });

    it('should handle orderBy parameter', async () => {
      mockService.searchEntities.mockResolvedValue(
        createMockSearchResponse([])
      );

      await searchTool.execute({
        entityType: 'Feature',
        orderBy: 'CreateDate desc'
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Feature',
        { 
          orderBy: 'CreateDate desc',
          take: 25 
        }
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty results', async () => {
      mockService.searchEntities.mockResolvedValue(
        createMockSearchResponse([])
      );

      const result = await searchTool.execute({
        entityType: 'Bug',
        where: "Name = 'Non-existent'"
      });

      expect(result.success).toBe(true);
      expect(result.entities).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle very large take values', async () => {
      mockService.searchEntities.mockResolvedValue(
        createMockSearchResponse([])
      );

      await searchTool.execute({
        entityType: 'Task',
        take: 1000
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Task',
        { take: 1000 }
      );
    });
  });
});