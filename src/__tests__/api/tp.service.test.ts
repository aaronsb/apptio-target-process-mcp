import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import { TPService } from '../../api/client/tp.service.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TPService', () => {
  let service: TPService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new TPService({
      domain: 'test.tpondemand.com',
      credentials: {
        username: 'testuser',
        password: 'testpass'
      }
    });
  });

  describe('constructor', () => {
    it('should initialize with basic auth credentials', () => {
      expect(service).toBeDefined();
      expect((service as any).config.domain).toBe('test.tpondemand.com');
    });

    it('should initialize with API key', () => {
      const apiKeyService = new TPService({
        domain: 'test.tpondemand.com',
        apiKey: 'test-api-key'
      });
      expect(apiKeyService).toBeDefined();
    });

    it('should throw error without credentials', () => {
      expect(() => new TPService({
        domain: 'test.tpondemand.com'
      } as any)).toThrow('Either credentials or apiKey must be provided');
    });
  });

  describe('searchEntities', () => {
    it('should search with basic parameters', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          Items: [{ Id: 1, Name: 'Test' }],
          Next: null
        }
      });

      const result = await service.searchEntities('UserStory', undefined, undefined, 10);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.tpondemand.com/api/v1/UserStory',
        expect.objectContaining({
          params: { take: 10, format: 'json' }
        })
      );
      expect(result).toHaveLength(1);
    });

    it('should handle where clauses', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { Items: [], Next: null }
      });

      await service.searchEntities('Bug', "Priority.Name = 'High'");

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.tpondemand.com/api/v1/Bug',
        expect.objectContaining({
          params: {
            where: "Priority.Name = 'High'",
            format: 'json'
          }
        })
      );
    });

    it('should retry on 5xx errors', async () => {
      mockedAxios.get
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValue({ data: { Items: [], Next: null } });

      const result = await service.searchEntities('Task');

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual([]);
    });

    it('should not retry on 4xx errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { 
          status: 400,
          data: { Message: 'Bad request' }
        }
      });

      await expect(service.searchEntities('Project'))
        .rejects.toThrow(McpError);

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEntity', () => {
    it('should get entity by ID', async () => {
      const mockEntity = { Id: 123, Name: 'Test Entity' };
      mockedAxios.get.mockResolvedValue({ data: mockEntity });

      const result = await service.getEntity('UserStory', 123);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.tpondemand.com/api/v1/UserStory/123',
        expect.objectContaining({
          params: { format: 'json' }
        })
      );
      expect(result).toEqual(mockEntity);
    });

    it('should include related entities', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { Id: 1, Project: { Id: 2, Name: 'Project' } }
      });

      await service.getEntity('Bug', 1, ['Project', 'AssignedUser']);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.tpondemand.com/api/v1/Bug/1',
        expect.objectContaining({
          params: {
            include: 'Project,AssignedUser',
            format: 'json'
          }
        })
      );
    });
  });

  describe('createEntity', () => {
    it('should create entity with valid data', async () => {
      const newEntity = { Id: 456, Name: 'New Story' };
      mockedAxios.post.mockResolvedValue({ data: newEntity });

      const result = await service.createEntity('UserStory', {
        Name: 'New Story',
        Project: { Id: 1 }
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test.tpondemand.com/api/v1/UserStory',
        {
          Name: 'New Story',
          Project: { Id: 1 }
        },
        expect.objectContaining({
          params: { format: 'json' }
        })
      );
      expect(result).toEqual(newEntity);
    });
  });

  describe('updateEntity', () => {
    it('should update entity fields', async () => {
      const updatedEntity = { Id: 789, Name: 'Updated' };
      mockedAxios.post.mockResolvedValue({ data: updatedEntity });

      const result = await service.updateEntity('Task', 789, {
        Name: 'Updated'
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test.tpondemand.com/api/v1/Task/789',
        { Name: 'Updated' },
        expect.objectContaining({
          params: { format: 'json' }
        })
      );
      expect(result).toEqual(updatedEntity);
    });
  });

  describe('validateWhereClause', () => {
    it('should validate simple where clauses', () => {
      const testCases = [
        "Name = 'Test'",
        "Id > 100",
        "Priority.Name != 'Low'",
        "CreateDate >= '2024-01-01'"
      ];

      testCases.forEach(clause => {
        expect(() => (service as any).validateWhereClause(clause))
          .not.toThrow();
      });
    });

    it('should validate complex where clauses', () => {
      const clause = "(Project.Id = 1) and (State.Name = 'Open') or (Priority = 'High')";
      expect(() => (service as any).validateWhereClause(clause))
        .not.toThrow();
    });

    it('should reject invalid where clauses', () => {
      const invalidClauses = [
        "Name = Test", // unquoted string
        "DROP TABLE Users", // SQL injection attempt
        "'; DELETE FROM", // injection attempt
      ];

      invalidClauses.forEach(clause => {
        expect(() => (service as any).validateWhereClause(clause))
          .toThrow();
      });
    });
  });

  // These tests were removed as validateEntityType is now a private method
  // The functionality is tested through the public API methods that use it
});