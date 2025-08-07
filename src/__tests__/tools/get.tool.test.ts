import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GetEntityTool } from '../../tools/entity/get.tool.js';
import { createMockTPService, createMockEntity } from '../mocks/tp-service.mock-utils.js';

describe('GetEntityTool', () => {
  let getTool: GetEntityTool;
  let mockService: ReturnType<typeof createMockTPService>;

  beforeEach(() => {
    mockService = createMockTPService();
    getTool = new GetEntityTool(mockService);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should get entity by ID', async () => {
      const mockStory = createMockEntity('UserStory', {
        Id: 123,
        Name: 'Test Story',
        Description: 'Test Description'
      });
      
      mockService.getEntity.mockResolvedValue(mockStory);

      const result = await getTool.execute({
        type: 'UserStory',
        id: 123
      });

      expect(mockService.getEntity).toHaveBeenCalledWith(
        'UserStory',
        123,
        undefined
      );
      
      expect(result.content[0].text).toContain('Test Story');
    });

    it('should get entity with includes', async () => {
      const mockBug = createMockEntity('Bug', {
        Id: 456,
        Project: { Id: 1, Name: 'Test Project' },
        AssignedUser: { Id: 2, Name: 'John Doe' },
        AttachedFiles: [
          { Id: 1, Name: 'screenshot.png' }
        ]
      });
      
      mockService.getEntity.mockResolvedValue(mockBug);

      const result = await getTool.execute({
        type: 'Bug',
        id: 456,
        include: ['Project', 'AssignedUser', 'AttachedFiles']
      });

      expect(mockService.getEntity).toHaveBeenCalledWith(
        'Bug',
        456,
        ['Project', 'AssignedUser', 'AttachedFiles']
      );
      
      expect(result.content[0].text).toContain('Test Project');
    });

    it('should handle entity not found', async () => {
      mockService.getEntity.mockRejectedValue(
        new Error('Entity not found')
      );

      await expect(getTool.execute({
        type: 'Task',
        id: 99999
      })).rejects.toThrow('Entity not found');
    });

    it('should validate entity type', async () => {
      mockService.getEntity.mockRejectedValue(
        new Error('Entity type InvalidType is not supported')
      );

      await expect(getTool.execute({
        type: 'InvalidType',
        id: 1
      })).rejects.toThrow('Entity type InvalidType is not supported');
    });

    it('should handle different entity types', async () => {
      const testCases = [
        { type: 'Project', id: 1 },
        { type: 'Team', id: 2 },
        { type: 'Iteration', id: 3 },
        { type: 'Release', id: 4 },
        { type: 'Feature', id: 5 },
        { type: 'Epic', id: 6 }
      ];

      for (const testCase of testCases) {
        const mockEntity = createMockEntity(testCase.type, {
          Id: testCase.id
        });
        
        mockService.getEntity.mockResolvedValue(mockEntity);

        const result = await getTool.execute({
          type: testCase.type,
          id: testCase.id
        });

        expect(result.content[0].text).toContain(testCase.id.toString());
      }
    });

    it('should handle complex includes', async () => {
      const mockFeature = createMockEntity('Feature', {
        Id: 789,
        Project: { 
          Id: 1, 
          Name: 'Test Project',
          Program: { Id: 1, Name: 'Test Program' }
        },
        UserStories: [
          { Id: 101, Name: 'Story 1' },
          { Id: 102, Name: 'Story 2' }
        ]
      });
      
      mockService.getEntity.mockResolvedValue(mockFeature);

      const result = await getTool.execute({
        type: 'Feature',
        id: 789,
        include: ['Project[Program]', 'UserStories']
      });

      expect(mockService.getEntity).toHaveBeenCalledWith(
        'Feature',
        789,
        ['Project[Program]', 'UserStories']
      );
      
      expect(result.content[0].text).toContain('Test Program');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockService.getEntity.mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(getTool.execute({
        type: 'UserStory',
        id: 1
      })).rejects.toThrow('Network timeout');
    });

    it('should handle unauthorized access', async () => {
      const error = new Error('Unauthorized') as any;
      error.response = { status: 401 };
      mockService.getEntity.mockRejectedValue(error);

      await expect(getTool.execute({
        type: 'Project',
        id: 1
      })).rejects.toThrow('Unauthorized');
    });
  });
});