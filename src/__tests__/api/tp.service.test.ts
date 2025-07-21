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

  describe('comment methods', () => {
    // Mock fetch globally for comment methods that use fetch instead of axios
    const mockFetch = jest.fn() as jest.Mock;
    // @ts-ignore - global fetch mock for tests
    // eslint-disable-next-line no-undef
    (global as any).fetch = mockFetch;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    describe('getComments', () => {
      it('should get comments for an entity', async () => {
        const mockResponse = {
          Items: [
            {
              Id: 207220,
              Description: 'Test comment',
              ParentId: null,
              CreateDate: '/Date(1752265210000+0200)/',
              IsPrivate: false,
              General: { Id: 54356, Name: 'Test Story' },
              Owner: { Id: 101732, FullName: 'Test User', Login: 'test@example.com' }
            }
          ]
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockResponse
        } as any);

        const result = await service.getComments('UserStory', 54356);

        expect(result).toEqual(mockResponse.Items);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://test.tpondemand.com/api/v1/UserStory/54356/Comments',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Basic')
            })
          })
        );
      });

      it('should handle invalid entity type', async () => {
        await expect(service.getComments('InvalidType', 54356))
          .rejects
          .toThrow(McpError);
      });

      it('should handle API errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => 'Entity not found'
        } as any);

        await expect(service.getComments('UserStory', 99999))
          .rejects
          .toThrow();
      });

      it('should retry on failure', async () => {
        // First call fails, second succeeds
        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Server error'
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ Items: [] })
          } as any);

        const result = await service.getComments('Task', 12345);

        expect(result).toEqual([]);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('createComment', () => {
      it('should create a basic comment', async () => {
        const mockComment = {
          Id: 207221,
          Description: 'New comment',
          CreateDate: '/Date(1752265210000+0200)/',
          General: { Id: 54356 }
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockComment
        } as any);

        const result = await service.createComment(54356, 'New comment');

        expect(result).toEqual(mockComment);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://test.tpondemand.com/api/v1/Comments',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': expect.stringContaining('Basic')
            }),
            body: JSON.stringify({
              General: { Id: 54356 },
              Description: 'New comment'
            })
          })
        );
      });

      it('should create a private comment', async () => {
        const mockComment = {
          Id: 207222,
          Description: 'Private comment',
          IsPrivate: true,
          General: { Id: 54356 }
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockComment
        } as any);

        await service.createComment(54356, 'Private comment', true);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test.tpondemand.com/api/v1/Comments',
          expect.objectContaining({
            body: JSON.stringify({
              General: { Id: 54356 },
              Description: 'Private comment',
              IsPrivate: true
            })
          })
        );
      });

      it('should create a reply comment', async () => {
        const mockReply = {
          Id: 207223,
          Description: 'Reply comment',
          ParentId: 207220,
          General: { Id: 54356 }
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockReply
        } as any);

        await service.createComment(54356, 'Reply comment', false, 207220);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test.tpondemand.com/api/v1/Comments',
          expect.objectContaining({
            body: JSON.stringify({
              General: { Id: 54356 },
              Description: 'Reply comment',
              ParentId: 207220
            })
          })
        );
      });

      it('should create a private reply comment', async () => {
        const mockReply = {
          Id: 207224,
          Description: 'Private reply',
          ParentId: 207220,
          IsPrivate: true,
          General: { Id: 54356 }
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockReply
        } as any);

        await service.createComment(54356, 'Private reply', true, 207220);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test.tpondemand.com/api/v1/Comments',
          expect.objectContaining({
            body: JSON.stringify({
              General: { Id: 54356 },
              Description: 'Private reply',
              IsPrivate: true,
              ParentId: 207220
            })
          })
        );
      });

      it('should handle API errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: async () => 'Invalid comment data'
        } as any);

        await expect(service.createComment(54356, 'Test comment'))
          .rejects
          .toThrow();
      });

      it('should retry on failure', async () => {
        const mockComment = { Id: 207225, Description: 'Retry comment' };

        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            text: async () => 'Service temporarily unavailable'
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockComment
          } as any);

        const result = await service.createComment(54356, 'Retry comment');

        expect(result).toEqual(mockComment);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('deleteComment', () => {
      it('should delete a comment successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200
        } as any);

        const result = await service.deleteComment(207220);

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://test.tpondemand.com/api/v1/Comments/207220',
          expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Basic')
            })
          })
        );
      });

      it('should handle delete failures', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => 'Comment not found'
        } as any);

        await expect(service.deleteComment(999999))
          .rejects
          .toThrow('Failed to delete comment 999999: 404 - Comment not found');
      });

      it('should handle unauthorized deletion', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          text: async () => 'Insufficient permissions'
        } as any);

        await expect(service.deleteComment(207220))
          .rejects
          .toThrow('Failed to delete comment 207220: 403 - Insufficient permissions');
      });

      it('should retry on transient failures', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Temporary server error'
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            status: 200
          } as any);

        const result = await service.deleteComment(207220);

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('should not retry on 4xx errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: async () => 'Invalid comment ID'
        } as any);

        await expect(service.deleteComment(-1))
          .rejects
          .toThrow();

        expect(mockFetch).toHaveBeenCalledTimes(1); // No retry on 4xx
      });

      it('should handle network failures', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        await expect(service.deleteComment(207220))
          .rejects
          .toThrow();
      });
    });
  });
});