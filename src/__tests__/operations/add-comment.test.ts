import { jest } from '@jest/globals';
import { AddCommentOperation, addCommentSchema } from '../../operations/work/add-comment.js';
import { TPService } from '../../api/client/tp.service.js';

// Mock TPService
const mockService = {
  getEntity: jest.fn(),
  createComment: jest.fn(),
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

describe('AddCommentOperation', () => {
  let operation: AddCommentOperation;

  beforeEach(() => {
    operation = new AddCommentOperation(mockService);
    jest.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct metadata', () => {
      const metadata = operation.metadata;
      expect(metadata.id).toBe('add-comment');
      expect(metadata.name).toBe('Add Comment');
      expect(metadata.description).toContain('Add comments to tasks');
      expect(metadata.category).toBe('collaboration');
      expect(metadata.requiredPersonalities).toContain('developer');
      expect(metadata.examples).toBeInstanceOf(Array);
      expect(metadata.tags).toContain('comment');
    });
  });

  describe('getSchema', () => {
    it('should return the correct schema', () => {
      const schema = operation.getSchema();
      expect(schema).toBe(addCommentSchema);
    });
  });

  describe('getTemplates', () => {
    it('should return developer-specific templates', () => {
      const templates = operation.getTemplates('developer');
      expect(templates).toContain('Fixed: [Brief description of what was fixed]');
      expect(templates).toContain('Code review: [Feedback on implementation]');
    });

    it('should return tester-specific templates', () => {
      const templates = operation.getTemplates('tester');
      expect(templates).toContain('Test results: [Pass/Fail with details]');
      expect(templates).toContain('Bug reproduction: [Steps to reproduce the issue]');
    });

    it('should return project-manager-specific templates', () => {
      const templates = operation.getTemplates('project-manager');
      expect(templates).toContain('Status update: [Current status and next steps]');
      expect(templates).toContain('Team coordination: [Team communication or assignments]');
    });

    it('should return product-owner-specific templates', () => {
      const templates = operation.getTemplates('product-owner');
      expect(templates).toContain('Business justification: [Why this change is important]');
      expect(templates).toContain('Stakeholder feedback: [Input from stakeholders]');
    });

    it('should return default templates for unknown roles', () => {
      const templates = operation.getTemplates('unknown');
      expect(templates).toContain('Update: [General update or note]');
      expect(templates).toContain('Question: [Question or clarification needed]');
    });
  });

  describe('formatContent', () => {
    it('should format content for developer role', () => {
      const formatted = operation.formatContent('Test comment', 'developer');
      expect(formatted).toContain('💻 Developer Update');
      expect(formatted).toContain('Test comment');
    });

    it('should format content for tester role', () => {
      const formatted = operation.formatContent('Test comment', 'tester');
      expect(formatted).toContain('🧪 QA Update');
      expect(formatted).toContain('Test comment');
    });

    it('should format content for project-manager role', () => {
      const formatted = operation.formatContent('Test comment', 'project-manager');
      expect(formatted).toContain('📋 Project Update');
      expect(formatted).toContain('Test comment');
    });

    it('should format content for product-owner role', () => {
      const formatted = operation.formatContent('Test comment', 'product-owner');
      expect(formatted).toContain('🎯 Product Update');
      expect(formatted).toContain('Test comment');
    });

    it('should format content for unknown role', () => {
      const formatted = operation.formatContent('Test comment', 'unknown');
      expect(formatted).toContain('📝 Update');
      expect(formatted).toContain('Test comment');
    });

    it('should include timestamp in formatted content', () => {
      const formatted = operation.formatContent('Test comment', 'developer');
      const today = new Date().toISOString().split('T')[0];
      expect(formatted).toContain(today);
    });
  });

  describe('convertMarkdownToHtml', () => {
    it('should convert markdown formatting to HTML', () => {
      const formatted = operation.formatContent('**bold** and *italic* and `code`', 'developer');
      expect(formatted).toContain('<strong>bold</strong>');
      expect(formatted).toContain('<em>italic</em>');
      expect(formatted).toContain('<code>code</code>');
    });

    it('should handle line breaks', () => {
      const formatted = operation.formatContent('Line 1\n\nLine 2', 'developer');
      expect(formatted).toContain('<br/>');
    });
  });

  describe('execute', () => {
    it('should successfully create a comment', async () => {
      const mockEntity = {
        Id: 54356,
        Name: 'Test Task',
        EntityState: { Name: 'In Progress' },
        AssignedUser: { FirstName: 'John', LastName: 'Doe' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207218,
        Description: 'Test comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        comment: 'Test comment',
        isPrivate: false
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Comment added');
      expect(result.content[1].type).toBe('structured-data');
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('should handle private comments', async () => {
      const mockEntity = {
        Id: 54356,
        Name: 'Test Task',
        EntityState: { Name: 'In Progress' },
        AssignedUser: { FirstName: 'John', LastName: 'Doe' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207218,
        Description: 'Private comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        comment: 'Private comment',
        isPrivate: true
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[0].text).toContain('(private)');
      expect(mockService.createComment).toHaveBeenCalledWith(
        54356,
        expect.any(String),
        true,
        undefined
      );
    });

    it('should format comment based on user role', async () => {
      const mockEntity = {
        Id: 54356,
        Name: 'Test Task',
        EntityState: { Name: 'In Progress' },
        AssignedUser: { FirstName: 'John', LastName: 'Doe' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207218,
        Description: 'Test comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        comment: 'Test comment',
        isPrivate: false
      };

      await operation.execute(mockContext, params);

      expect(mockService.createComment).toHaveBeenCalledWith(
        54356,
        expect.stringContaining('💻 Developer Update'),
        false,
        undefined
      );
    });

    it('should return error when entity not found', async () => {
      mockService.getEntity.mockResolvedValue(null);

      const params = {
        entityType: 'Task',
        entityId: 99999,
        comment: 'Test comment',
        isPrivate: false
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('error');
      expect(result.content[0].text).toContain('not found');
    });

    it('should handle API errors gracefully', async () => {
      mockService.getEntity.mockRejectedValue(new Error('API Error'));

      const params = {
        entityType: 'Task',
        entityId: 54356,
        comment: 'Test comment',
        isPrivate: false
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('error');
      expect(result.content[0].text).toContain('Failed to add comment');
    });

    it('should provide follow-up suggestions', async () => {
      const mockEntity = {
        Id: 54356,
        Name: 'Test Task',
        EntityState: { Name: 'In Progress' },
        AssignedUser: { Id: 101734, FirstName: 'John', LastName: 'Doe' },
        Project: { Name: 'Test Project', Id: 123 }
      };

      const mockComment = {
        Id: 207218,
        Description: 'Test comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Task',
        entityId: 54356,
        comment: 'Test comment',
        isPrivate: false
      };

      const result = await operation.execute(mockContext, params);

      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('should handle default user role', async () => {
      const mockEntity = {
        Id: 54356,
        Name: 'Test Task',
        EntityState: { Name: 'In Progress' },
        AssignedUser: { FirstName: 'John', LastName: 'Doe' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207218,
        Description: 'Test comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const contextWithoutRole = {
        ...mockContext,
        user: { ...mockContext.user, role: 'default' }
      };

      const params = {
        entityType: 'Task',
        entityId: 54356,
        comment: 'Test comment',
        isPrivate: false
      };

      const result = await operation.execute(contextWithoutRole, params);

      expect(result.content[0].type).toBe('text');
      expect(mockService.createComment).toHaveBeenCalledWith(
        54356,
        expect.stringContaining('📝 Update'),
        false,
        undefined
      );
    });
  });

  describe('reply functionality', () => {
    it('should create a reply comment with parentCommentId', async () => {
      const mockEntity = {
        Id: 67890,
        Name: 'Test Bug',
        EntityState: { Name: 'Open' },
        AssignedUser: { FirstName: 'Jane', LastName: 'Smith' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207219,
        Description: 'Reply comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Bug',
        entityId: 67890,
        comment: 'Reply comment',
        isPrivate: false,
        parentCommentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[0].text).toContain('reply');
      expect(result.content[0].text).toContain('replying to comment #207218');
      expect(mockService.createComment).toHaveBeenCalledWith(
        67890,
        expect.any(String),
        false,
        207218
      );
    });

    it('should create a private reply comment', async () => {
      const mockEntity = {
        Id: 67890,
        Name: 'Test Bug',
        EntityState: { Name: 'Open' },
        AssignedUser: { FirstName: 'Jane', LastName: 'Smith' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207219,
        Description: 'Private reply',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Bug',
        entityId: 67890,
        comment: 'Private reply',
        isPrivate: true,
        parentCommentId: 207218
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[0].text).toContain('(private)');
      expect(result.content[0].text).toContain('reply');
      expect(mockService.createComment).toHaveBeenCalledWith(
        67890,
        expect.any(String),
        true,
        207218
      );
    });

    it('should handle string parentCommentId parameter', async () => {
      const mockEntity = {
        Id: 67890,
        Name: 'Test Bug',
        EntityState: { Name: 'Open' },
        AssignedUser: { FirstName: 'Jane', LastName: 'Smith' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207219,
        Description: 'Reply with string ID',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Bug',
        entityId: 67890,
        comment: 'Reply with string ID',
        isPrivate: false,
        parentCommentId: '207218'
      };

      await operation.execute(mockContext, params as any);

      expect(mockService.createComment).toHaveBeenCalledWith(
        67890,
        expect.any(String),
        false,
        207218 // Should be coerced to number by Zod
      );
    });

    it('should create root comment when parentCommentId is not provided', async () => {
      const mockEntity = {
        Id: 67890,
        Name: 'Test Bug',
        EntityState: { Name: 'Open' },
        AssignedUser: { FirstName: 'Jane', LastName: 'Smith' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207219,
        Description: 'Root comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Bug',
        entityId: 67890,
        comment: 'Root comment',
        isPrivate: false
      };

      const result = await operation.execute(mockContext, params);

      expect(result.content[0].text).not.toContain('reply');
      expect(mockService.createComment).toHaveBeenCalledWith(
        67890,
        expect.any(String),
        false,
        undefined
      );
    });

    it('should apply role-specific formatting to replies', async () => {
      const mockEntity = {
        Id: 67890,
        Name: 'Test Bug',
        EntityState: { Name: 'Open' },
        AssignedUser: { FirstName: 'Jane', LastName: 'Smith' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207219,
        Description: 'Formatted reply',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Bug',
        entityId: 67890,
        comment: 'Formatted reply',
        isPrivate: false,
        parentCommentId: 207218
      };

      await operation.execute(mockContext, params);

      expect(mockService.createComment).toHaveBeenCalledWith(
        67890,
        expect.stringContaining('💻 Developer Update'),
        false,
        207218
      );
    });

    it('should handle parentCommentId validation errors', async () => {
      const mockEntity = {
        Id: 67890,
        Name: 'Test Bug',
        EntityState: { Name: 'Open' },
        AssignedUser: { FirstName: 'Jane', LastName: 'Smith' },
        Project: { Name: 'Test Project' }
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockRejectedValue(new Error('Invalid parent comment ID'));

      const params = {
        entityType: 'Bug',
        entityId: 67890,
        comment: 'Reply comment',
        isPrivate: false,
        parentCommentId: 999999
      };

      const result = await operation.execute(mockContext, params as any);

      expect(result.content[0].type).toBe('error');
      expect(result.content[0].text).toContain('Failed to add comment');
    });
  });

  describe('parameter coercion', () => {
    it('should coerce string entityId to number', async () => {
      const mockEntity = {
        Id: 54356,
        Name: 'Test Story',
        EntityState: { Name: 'New' },
        AssignedUser: { FirstName: 'John', LastName: 'Doe' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207220,
        Description: 'Coerced ID comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'UserStory',
        entityId: '54356',
        comment: 'Coerced ID comment',
        isPrivate: false
      };

      await operation.execute(mockContext, params as any);

      expect(mockService.getEntity).toHaveBeenCalledWith('UserStory', 54356);
      expect(mockService.createComment).toHaveBeenCalledWith(
        54356, // Should be coerced to number by Zod
        expect.any(String),
        false,
        undefined
      );
    });

    it('should coerce string isPrivate to boolean', async () => {
      const mockEntity = {
        Id: 12345,
        Name: 'Test Item',
        EntityState: { Name: 'Active' },
        AssignedUser: { FirstName: 'John', LastName: 'Doe' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207221,
        Description: 'Private comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Task',
        entityId: 12345,
        comment: 'Private comment',
        isPrivate: 'true'
      };

      await operation.execute(mockContext, params as any);

      expect(mockService.createComment).toHaveBeenCalledWith(
        12345,
        expect.any(String),
        true, // Should be coerced to boolean by Zod
        undefined
      );
    });

    it('should handle falsy isPrivate values', async () => {
      const mockEntity = {
        Id: 67890,
        Name: 'Test Bug',
        EntityState: { Name: 'Open' },
        AssignedUser: { FirstName: 'Jane', LastName: 'Smith' },
        Project: { Name: 'Test Project' }
      };

      const mockComment = {
        Id: 207222,
        Description: 'Public comment',
        User: { Id: 101734, FirstName: 'Test', LastName: 'User' },
        CreateDate: '/Date(1234567890000)/'
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createComment.mockResolvedValue(mockComment);

      const params = {
        entityType: 'Bug',
        entityId: 67890,
        comment: 'Public comment',
        isPrivate: 'false'
      };

      await operation.execute(mockContext, params as any);

      expect(mockService.createComment).toHaveBeenCalledWith(
        67890,
        expect.any(String),
        false, // Should be coerced to boolean by Zod
        undefined
      );
    });
  });
});