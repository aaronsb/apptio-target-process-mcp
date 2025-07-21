import { jest } from '@jest/globals';
import { DeleteCommentOperation, deleteCommentSchema } from '../../operations/work/delete-comment.js';
import { TPService } from '../../api/client/tp.service.js';

// Mock TPService
const mockService = {
  deleteComment: jest.fn(),
  searchEntities: jest.fn(),
} as unknown as jest.Mocked<TPService>;

// Mock execution context
const mockContext = {
  user: {
    id: 101734,
    name: 'Test User',
    email: 'test@example.com',
    role: 'developer',
    teams: [],
    permissions: []
  },
  workspace: {
    recentEntities: []
  },
  personality: {
    mode: 'developer',
    features: [],
    restrictions: {}
  },
  conversation: {
    mentionedEntities: [],
    previousOperations: [],
    intent: 'test'
  },
  config: {
    apiUrl: 'https://test.tpondemand.com',
    maxResults: 25,
    timeout: 30000
  }
};

describe('DeleteCommentOperation', () => {
  let operation: DeleteCommentOperation;

  beforeEach(() => {
    operation = new DeleteCommentOperation(mockService);
    jest.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct metadata', () => {
      const metadata = operation.metadata;
      expect(metadata.id).toBe('delete-comment');
      expect(metadata.name).toBe('Delete Comment');
      expect(metadata.description).toContain('Delete comments');
      expect(metadata.category).toBe('collaboration');
      expect(metadata.requiredPersonalities).toContain('developer');
      expect(metadata.examples).toBeInstanceOf(Array);
      expect(metadata.tags).toContain('comment');
    });
  });

  describe('getSchema', () => {
    it('should return the correct schema', () => {
      const schema = operation.getSchema();
      expect(schema).toBe(deleteCommentSchema);
    });
  });

  describe('execute', () => {
    it('should successfully delete a comment', async () => {
      const mockCommentContext = {
        Id: 207218,
        Description: 'Test comment to delete',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/',
        IsPrivate: false,
        General: { Id: 54356, EntityType: { Name: 'Task' } }
      };

      mockService.searchEntities.mockResolvedValue([mockCommentContext]);
      mockService.deleteComment.mockResolvedValue(true);

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Successfully deleted comment #207218');
      expect(result.content[1].type).toBe('structured-data');
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('should delete comment with entity context', async () => {
      const mockCommentContext = {
        Id: 207218,
        Description: 'Test comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/',
        IsPrivate: false,
        General: { Id: 54356, EntityType: { Name: 'Task' } }
      };

      mockService.searchEntities.mockResolvedValue([mockCommentContext]);
      mockService.deleteComment.mockResolvedValue(true);

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[0].text).toContain('Test comment');
      expect(result.content[0].text).toContain('Test User');
      expect(mockService.deleteComment).toHaveBeenCalledWith(207218);
    });

    it('should warn when deleting others comments', async () => {
      const mockCommentContext = {
        Id: 207218,
        Description: 'Someone elses comment',
        User: { Id: 999999, FirstName: 'Other', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/',
        IsPrivate: false,
        General: { Id: 54356, EntityType: { Name: 'Task' } }
      };

      mockService.searchEntities.mockResolvedValue([mockCommentContext]);
      mockService.deleteComment.mockResolvedValue(true);

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[0].text).toContain('⚠️ You are deleting a comment by Other User');
      expect(result.content[0].text).toContain('Successfully deleted comment #207218');
    });

    it('should handle deletion failure', async () => {
      const mockCommentContext = {
        Id: 207218,
        Description: 'Test comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/',
        IsPrivate: false,
        General: { Id: 54356, EntityType: { Name: 'Task' } }
      };

      mockService.searchEntities.mockResolvedValue([mockCommentContext]);
      mockService.deleteComment.mockResolvedValue(false);

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('error');
      expect(result.content[0].text).toContain('Failed to delete comment #207218');
    });

    it('should handle service errors gracefully', async () => {
      mockService.searchEntities.mockRejectedValue(new Error('API Error'));

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('error');
      expect(result.content[0].text).toContain('Failed to delete comment');
    });

    it('should handle parameter validation errors', async () => {
      const params = {
        commentId: 'invalid'
      };

      const result = await operation.execute(mockContext, params as any);

      expect(result.content[0].type).toBe('error');
      expect(result.content[0].text).toContain('Failed to delete comment');
    });

    it('should continue deletion even if comment context fetch fails', async () => {
      mockService.searchEntities.mockRejectedValue(new Error('Context fetch failed'));
      mockService.deleteComment.mockResolvedValue(true);

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Successfully deleted comment #207218');
      expect(mockService.deleteComment).toHaveBeenCalledWith(207218);
    });

    it('should handle comment not found in context', async () => {
      mockService.searchEntities.mockResolvedValue([]);
      mockService.deleteComment.mockResolvedValue(true);

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Successfully deleted comment #207218');
      expect(result.content[0].text).toContain('Comment #207218');
    });

    it('should clean HTML from comment description in context', async () => {
      const mockCommentContext = {
        Id: 207218,
        Description: '<div><strong>HTML</strong> comment with <em>tags</em></div>',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/',
        IsPrivate: false,
        General: { Id: 54356, EntityType: { Name: 'Task' } }
      };

      mockService.searchEntities.mockResolvedValue([mockCommentContext]);
      mockService.deleteComment.mockResolvedValue(true);

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[0].text).toContain('HTML comment with tags');
      expect(result.content[0].text).not.toContain('<div>');
      expect(result.content[0].text).not.toContain('<strong>');
    });

    it('should truncate long comment descriptions in context', async () => {
      const longDescription = 'a'.repeat(200);
      const mockCommentContext = {
        Id: 207218,
        Description: longDescription,
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/',
        IsPrivate: false,
        General: { Id: 54356, EntityType: { Name: 'Task' } }
      };

      mockService.searchEntities.mockResolvedValue([mockCommentContext]);
      mockService.deleteComment.mockResolvedValue(true);

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[0].text).toContain('...');
      expect((result.content[0].text as string).length).toBeLessThan(longDescription.length + 100);
    });

    it('should handle string commentId parameter', async () => {
      const mockCommentContext = {
        Id: 207218,
        Description: 'Test comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/',
        IsPrivate: false,
        General: { Id: 54356, EntityType: { Name: 'Task' } }
      };

      mockService.searchEntities.mockResolvedValue([mockCommentContext]);
      mockService.deleteComment.mockResolvedValue(true);

      const params = {
        commentId: '207218'
      };

      await operation.execute(mockContext, params as any);

      expect(mockService.deleteComment).toHaveBeenCalledWith(207218);
    });

    it('should include correct metadata', async () => {
      const mockCommentContext = {
        Id: 207218,
        Description: 'Test comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/',
        IsPrivate: false,
        General: { Id: 54356, EntityType: { Name: 'Task' } }
      };

      mockService.searchEntities.mockResolvedValue([mockCommentContext]);
      mockService.deleteComment.mockResolvedValue(true);

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[1].type).toBe('structured-data');
      expect(result.content[1].data).toHaveProperty('deletedComment');
      expect(result.content[1].data.deletedComment).toHaveProperty('id', 207218);
      expect(result.content[1].data.deletedComment).toHaveProperty('deletedBy', 'Test User');
      expect(result.content[1].data.deletedComment).toHaveProperty('wasOwnComment', true);
    });

    it('should include correct metadata with context fetch', async () => {
      const mockCommentContext = {
        Id: 207218,
        Description: 'Test comment',
        User: { Id: 999999, FirstName: 'Other', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/',
        IsPrivate: false,
        General: { Id: 54356, EntityType: { Name: 'Task' } }
      };

      mockService.searchEntities.mockResolvedValue([mockCommentContext]);
      mockService.deleteComment.mockResolvedValue(true);

      const params = {
        commentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[1].data.deletedComment).toHaveProperty('wasOwnComment', false);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });
  });
});