import { jest } from '@jest/globals';
import { ShowCommentsOperation, showCommentsSchema } from '../../operations/work/show-comments.js';
import { TPService } from '../../api/client/tp.service.js';

// Mock TPService
const mockService = {
  getComments: jest.fn(),
  getEntity: jest.fn(),
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

describe('ShowCommentsOperation', () => {
  let operation: ShowCommentsOperation;

  beforeEach(() => {
    operation = new ShowCommentsOperation(mockService);
    jest.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct metadata', () => {
      const metadata = operation.metadata;
      expect(metadata.id).toBe('show-comments');
      expect(metadata.name).toBe('Show Comments');
      expect(metadata.description).toContain('View comments with intelligent context awareness');
      expect(metadata.category).toBe('collaboration');
      expect(metadata.requiredPersonalities).toContain('developer');
      expect(metadata.examples).toBeInstanceOf(Array);
      expect(metadata.tags).toContain('comment');
    });
  });

  describe('getSchema', () => {
    it('should return the correct schema', () => {
      const schema = operation.getSchema();
      expect(schema).toBe(showCommentsSchema);
    });
  });

  describe('execute', () => {
    it('should handle no comments found', async () => {
      mockService.getComments.mockResolvedValue([]);
      mockService.getEntity.mockResolvedValue({
        Id: 54356,
        Name: 'Test Task',
        EntityType: { Name: 'Task' },
        EntityState: { Name: 'In Progress' }
      });
      mockService.searchEntities.mockResolvedValue([]);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        includePrivate: true,
        filter: 'all' as const,
        groupBy: 'none' as const,
        sortOrder: 'newest' as const,
        limit: 50
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('No Comments Yet');
      expect(result.content[1].type).toBe('text');
      expect(result.content[1].text).toContain('Be the first to comment');
    });

    it('should handle null or undefined Items', async () => {
      // The service now returns empty array when no comments found
      mockService.getComments.mockResolvedValue([]);
      mockService.getEntity.mockResolvedValue({
        Id: 54356,
        Name: 'Test Task',
        EntityType: { Name: 'Task' },
        EntityState: { Name: 'In Progress' }
      });
      mockService.searchEntities.mockResolvedValue([]);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        includePrivate: true,
        filter: 'all' as const,
        groupBy: 'none' as const,
        sortOrder: 'newest' as const,
        limit: 50
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('No Comments Yet');
      expect(result.content[1].type).toBe('text');
      expect(result.content[1].text).toContain('Be the first to comment');
    });

    it('should organize and display comments with replies', async () => {
      const mockComments = [
        {
          Id: 207218,
          Description: 'Root comment',
          User: { Id: 101734, FirstName: 'John', LastName: 'Doe' },
          CreateDate: '/Date(1234567890000)/',
          IsPrivate: false,
          ParentId: null
        },
        {
          Id: 207219,
          Description: 'Reply comment',
          User: { Id: 101735, FirstName: 'Jane', LastName: 'Smith' },
          CreateDate: '/Date(1234567891000)/',
          IsPrivate: false,
          ParentId: 207218
        }
      ];

      mockService.getComments.mockResolvedValue(mockComments);
      mockService.getEntity.mockResolvedValue({
        Id: 54356,
        Name: 'Test Task',
        EntityType: { Name: 'Task' },
        EntityState: { Name: 'In Progress' }
      });
      mockService.searchEntities.mockResolvedValue([]);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        includePrivate: true,
        filter: 'all' as const,
        groupBy: 'none' as const,
        sortOrder: 'newest' as const,
        limit: 50
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content.length).toBeGreaterThanOrEqual(2);
      expect(result.content[0].type).toBe('text');
      
      // Find the content that contains the comments
      const textContent = result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
      expect(textContent).toContain('Task #54356');
      expect(textContent).toContain('John Doe');
      expect(textContent).toContain('Jane Smith');
      
      // Check for structured data
      const structuredData = result.content.find(c => c.type === 'structured-data');
      expect(structuredData).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('should handle TargetProcess date format correctly', async () => {
      const mockComments = [
        {
          Id: 207218,
          Description: 'Test comment',
          User: { Id: 101734, FirstName: 'John', LastName: 'Doe' },
          CreateDate: '/Date(1234567890000)/',
          IsPrivate: false,
          ParentId: null
        }
      ];

      mockService.getComments.mockResolvedValue(mockComments);
      mockService.getEntity.mockResolvedValue({
        Id: 54356,
        Name: 'Test Task',
        EntityType: { Name: 'Task' },
        EntityState: { Name: 'In Progress' }
      });
      mockService.searchEntities.mockResolvedValue([]);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        includePrivate: true,
        filter: 'all' as const,
        groupBy: 'none' as const,
        sortOrder: 'newest' as const,
        limit: 50
      };

      const result = await operation.execute(mockContext, params);

      // Find the content that contains the comments
      const textContent = result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
      expect(textContent).toContain('2009'); // Date should be parsed correctly
    });

    it('should clean HTML from comment descriptions', async () => {
      const mockComments = [
        {
          Id: 207218,
          Description: '<div><strong>Bold</strong> and <em>italic</em> text</div>',
          User: { Id: 101734, FirstName: 'John', LastName: 'Doe' },
          CreateDate: '/Date(1234567890000)/',
          IsPrivate: false,
          ParentId: null
        }
      ];

      mockService.getComments.mockResolvedValue(mockComments);
      mockService.getEntity.mockResolvedValue({
        Id: 54356,
        Name: 'Test Task',
        EntityType: { Name: 'Task' },
        EntityState: { Name: 'In Progress' }
      });
      mockService.searchEntities.mockResolvedValue([]);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        includePrivate: true,
        filter: 'all' as const,
        groupBy: 'none' as const,
        sortOrder: 'newest' as const,
        limit: 50
      };

      const result = await operation.execute(mockContext, params);

      // Find the content that contains the comments
      const textContent = result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
      expect(textContent).toContain('Bold and italic text');
      expect(textContent).not.toContain('<div>');
      expect(textContent).not.toContain('<strong>');
    });

    it('should handle parameter validation errors', async () => {
      mockService.getComments.mockRejectedValue(new Error('Invalid entity ID'));

      const params = {
        entityType: 'Task',
        entityId: -1, // Invalid ID that will cause service error
        includePrivate: true,
        filter: 'all' as const,
        groupBy: 'none' as const,
        sortOrder: 'newest' as const,
        limit: 50
      };

      const result = await operation.execute(mockContext, params);

      // The semantic operation might handle errors differently
      const textContent = result.content.filter(c => c.type === 'text' || c.type === 'error').map(c => c.text).join('\n');
      expect(textContent).toContain('Comment Discovery Issue');
    });

    it('should handle service errors gracefully', async () => {
      mockService.getComments.mockRejectedValue(new Error('API Error'));

      const params = {
        entityType: 'Task',
        entityId: 54356,
        includePrivate: true,
        filter: 'all' as const,
        groupBy: 'none' as const,
        sortOrder: 'newest' as const,
        limit: 50
      };

      const result = await operation.execute(mockContext, params);

      // The semantic operation provides educational error responses
      expect(result.content.length).toBeGreaterThanOrEqual(1);
      const textContent = result.content.filter(c => c.type === 'text' || c.type === 'error').map(c => c.text).join('\n');
      expect(textContent).toContain('Comment Discovery Issue');
    });

    it('should sort root comments by creation date (newest first)', async () => {
      const mockComments = [
        {
          Id: 207218,
          Description: 'Older comment',
          User: { Id: 101734, FirstName: 'John', LastName: 'Doe' },
          CreateDate: '/Date(1234567890000)/',
          IsPrivate: false,
          ParentId: null
        },
        {
          Id: 207220,
          Description: 'Newer comment',
          User: { Id: 101735, FirstName: 'Jane', LastName: 'Smith' },
          CreateDate: '/Date(1234567892000)/',
          IsPrivate: false,
          ParentId: null
        }
      ];

      mockService.getComments.mockResolvedValue(mockComments);
      mockService.getEntity.mockResolvedValue({
        Id: 54356,
        Name: 'Test Task',
        EntityType: { Name: 'Task' },
        EntityState: { Name: 'In Progress' }
      });
      mockService.searchEntities.mockResolvedValue([]);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        includePrivate: true,
        filter: 'all' as const,
        groupBy: 'none' as const,
        sortOrder: 'newest' as const,
        limit: 50
      };

      const result = await operation.execute(mockContext, params);

      // Check that newer comment appears first
      const textContent = result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
      const newerIndex = textContent.indexOf('Newer comment');
      const olderIndex = textContent.indexOf('Older comment');
      expect(newerIndex).toBeLessThan(olderIndex);
    });

    it('should handle complex nested reply structure', async () => {
      const mockComments = [
        {
          Id: 207218,
          Description: 'Root comment',
          User: { Id: 101734, FirstName: 'John', LastName: 'Doe' },
          CreateDate: '/Date(1234567890000)/',
          IsPrivate: false,
          ParentId: null
        },
        {
          Id: 207219,
          Description: 'First reply',
          User: { Id: 101735, FirstName: 'Jane', LastName: 'Smith' },
          CreateDate: '/Date(1234567891000)/',
          IsPrivate: false,
          ParentId: 207218
        },
        {
          Id: 207220,
          Description: 'Reply to reply',
          User: { Id: 101736, FirstName: 'Bob', LastName: 'Johnson' },
          CreateDate: '/Date(1234567892000)/',
          IsPrivate: false,
          ParentId: 207219
        }
      ];

      mockService.getComments.mockResolvedValue(mockComments);
      mockService.getEntity.mockResolvedValue({
        Id: 54356,
        Name: 'Test Task',
        EntityType: { Name: 'Task' },
        EntityState: { Name: 'In Progress' }
      });
      mockService.searchEntities.mockResolvedValue([]);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        includePrivate: true,
        filter: 'all' as const,
        groupBy: 'none' as const,
        sortOrder: 'newest' as const,
        limit: 50
      };

      const result = await operation.execute(mockContext, params);

      const textContent = result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
      expect(textContent).toContain('Root comment');
      expect(textContent).toContain('First reply');
      expect(textContent).toContain('Reply to reply');
      expect(textContent).toContain('↳'); // Reply indicator
    });
  });
});