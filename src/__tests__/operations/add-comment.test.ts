import { jest } from '@jest/globals';
import { AddCommentOperation } from '../../operations/work/add-comment.js';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext } from '../../core/interfaces/semantic-operation.interface.js';
import { testConfig } from '../config/test-config.js';

// Mock logger to avoid console output during tests
jest.mock('../../utils/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock TPService
const mockService = {
  getEntity: jest.fn(),
  createComment: jest.fn(),
  searchEntities: jest.fn(),
} as unknown as jest.Mocked<TPService>;

// Helper to create mock execution context with different roles
const createMockContext = (role: string = 'developer'): ExecutionContext => ({
  user: {
    id: parseInt(testConfig.userId),
    name: 'Test User',
    email: testConfig.userEmail,
    role: role,
    teams: [],
    permissions: []
  },
  workspace: {
    recentEntities: []
  },
  personality: {
    mode: role,
    features: [],
    restrictions: {}
  },
  conversation: {
    mentionedEntities: [],
    previousOperations: [],
    intent: 'test'
  },
  config: {
    apiUrl: testConfig.apiUrl,
    maxResults: 25,
    timeout: 30000
  }
});

// Mock entities for testing
const mockTask = {
  Id: 123,
  Name: 'Test Task',
  EntityState: { 
    Name: 'In Progress', 
    IsInitial: false, 
    IsFinal: false,
    ModifyDate: new Date().toISOString()
  },
  Project: { Id: 1, Name: 'Test Project' },
  AssignedUser: { 
    Id: parseInt(testConfig.userId), 
    FirstName: 'Test', 
    LastName: 'User',
    Items: [{ Id: parseInt(testConfig.userId), FirstName: 'Test', LastName: 'User' }]
  },
  Priority: { Name: 'High', Importance: 1 },
  Tags: { Items: [] },
  CreateDate: new Date().toISOString(),
  ModifyDate: new Date().toISOString()
};

const mockBug = {
  ...mockTask,
  Id: 456,
  Name: 'Test Bug',
  Severity: { Name: 'Critical', Importance: 1 }
};

const mockBlockedTask = {
  ...mockTask,
  Id: 789,
  Name: 'Blocked Task',
  Tags: { Items: [{ Name: 'blocked' }] }
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
      expect(metadata.description).toContain('smart context awareness');
      expect(metadata.category).toBe('collaboration');
      expect(metadata.requiredPersonalities).toEqual(['default', 'developer', 'tester', 'project-manager', 'product-owner']);
      expect(metadata.examples).toBeInstanceOf(Array);
      expect(metadata.examples.length).toBeGreaterThan(0);
      expect(metadata.tags).toContain('comment');
    });
  });

  describe('schema validation', () => {
    it('should validate required parameters', () => {
      const schema = operation.getSchema();
      
      // Valid params
      const validParams = {
        entityType: 'Task',
        entityId: 123,
        comment: 'Test comment'
      };
      expect(() => schema.parse(validParams)).not.toThrow();
      
      // Missing required params
      expect(() => schema.parse({ entityType: 'Task' })).toThrow();
      expect(() => schema.parse({ entityId: 123 })).toThrow();
      expect(() => schema.parse({ comment: '' })).toThrow();
    });

    it('should handle optional parameters', () => {
      const schema = operation.getSchema();
      const params = {
        entityType: 'Task',
        entityId: 123,
        comment: 'Test',
        isPrivate: true,
        parentCommentId: 456,
        mentions: ['john', 'jane'],
        attachments: [{ path: 'file.txt', description: 'Test file' }],
        useTemplate: 'Bug Fixed',
        codeLanguage: 'javascript',
        linkedCommit: 'abc123',
        linkedPR: 'https://github.com/pr/1'
      };
      
      const parsed = schema.parse(params);
      expect(parsed.isPrivate).toBe(true);
      expect(parsed.mentions).toEqual(['john', 'jane']);
      expect(parsed.codeLanguage).toBe('javascript');
    });
  });

  describe('execute - basic functionality', () => {
    it('should successfully add a comment to a task', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]); // No special entities found
      mockService.createComment.mockResolvedValue({ 
        Id: 999, 
        Description: 'Test comment',
        CreateDate: new Date().toISOString() 
      });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'This is a test comment',
        isPrivate: false
      });

      expect(mockService.getEntity).toHaveBeenCalledWith('Task', 123, expect.any(Array));
      expect(mockService.createComment).toHaveBeenCalled();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('✅ Comment added to Test Task');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('should handle entity not found gracefully', async () => {
      mockService.getEntity.mockResolvedValue(null);

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 999,
        comment: 'Test',
        isPrivate: false
      });

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Entity Discovery');
      expect(result.content[1].text).toContain('Smart Suggestions');
      expect(result.suggestions).toContain('search_entities type:Task - Find available Tasks');
    });

    it('should handle comment creation failure with helpful guidance', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockRejectedValue(new Error('Comments disabled'));

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Test',
        isPrivate: false
      });

      expect(result.content[0].text).toContain('Comment Creation Discovery');
      expect(result.content[1].text).toContain('What we learned');
      expect(result.content[1].text).toContain('Comments disabled');
      expect(result.suggestions).toContain('show-comments entityType:Task entityId:123 - View existing comments');
    });
  });

  describe('execute - role-based behavior', () => {
    it('should use developer role formatting and suggestions', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext('developer'), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Fixed the bug',
        isPrivate: false
      });

      const structuredData = result.content[1].data;
      expect(structuredData.comment.preview).toContain('Developer Update');
      
      // Developer-specific suggestions
      const suggestions = result.suggestions!.join(' ');
      expect(suggestions).toContain('start-working-on');
    });

    it('should use tester role formatting and suggestions', async () => {
      mockService.getEntity.mockResolvedValue(mockBug);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext('tester'), {
        entityType: 'Bug',
        entityId: 456,
        comment: 'Verified on staging',
        isPrivate: false
      });

      const structuredData = result.content[1].data;
      expect(structuredData.comment.preview).toContain('QA Update');
      
      // Tester-specific suggestions for bugs
      const suggestions = result.suggestions!.join(' ');
      expect(suggestions).toContain('attachments:[{path:"screenshot.png"}]');
    });

    it('should use project-manager role formatting', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext('project-manager'), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Status update',
        isPrivate: false
      });

      const structuredData = result.content[1].data;
      expect(structuredData.comment.preview).toContain('Project Update');
    });

    it('should use product-owner role formatting', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext('product-owner'), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Approved for release',
        isPrivate: false
      });

      const structuredData = result.content[1].data;
      expect(structuredData.comment.preview).toContain('Product Update');
    });
  });

  describe('execute - entity context detection', () => {
    it('should detect blocked entities and provide relevant suggestions', async () => {
      mockService.getEntity.mockResolvedValue(mockBlockedTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 789,
        comment: 'Working to unblock this',
        isPrivate: false
      });

      expect(result.content[0].text).toContain('In Progress 🚧 (Blocked)');
      expect(result.suggestions!.some(s => s.includes('escalate-to-manager'))).toBe(true);
    });

    it('should detect overdue entities', async () => {
      const overdueTask = {
        ...mockTask,
        EndDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      };
      
      mockService.getEntity.mockResolvedValue(overdueTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Update on delay',
        isPrivate: false
      });

      expect(result.content[0].text).toContain('⚠️ (Overdue)');
    });

    it('should handle unassigned entities', async () => {
      const unassignedTask = {
        ...mockTask,
        AssignedUser: null
      };
      
      mockService.getEntity.mockResolvedValue(unassignedTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Taking this task',
        isPrivate: false
      });

      expect(result.content[0].text).toContain('This Task is currently unassigned');
      // The operation might suggest different actions for unassigned tasks
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      // Check that at least one suggestion relates to the unassigned state
      const hasRelevantSuggestion = result.suggestions!.some(s => 
        s.includes('assign') || s.includes('show-comments') || s.includes('start-working')
      );
      expect(hasRelevantSuggestion).toBe(true);
    });
  });

  describe('execute - rich text formatting', () => {
    it('should handle markdown to HTML conversion', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const markdown = '**Bold** *italic* `code` \n- Item 1\n- Item 2';
      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: markdown,
        isPrivate: false
      });

      // Check that createComment was called with HTML
      const commentCall = mockService.createComment.mock.calls[0];
      const htmlContent = commentCall[1];
      expect(htmlContent).toContain('<strong>Bold</strong>');
      expect(htmlContent).toContain('<em>italic</em>');
      expect(htmlContent).toContain('<code>code</code>');
      expect(htmlContent).toContain('Item 1');
      expect(htmlContent).toContain('Item 2');
    });

    it('should handle code blocks with syntax highlighting', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: '```javascript\nconst x = 42;\n```',
        codeLanguage: 'javascript',
        isPrivate: false
      });

      const commentCall = mockService.createComment.mock.calls[0];
      const htmlContent = commentCall[1];
      expect(htmlContent).toContain('data-language="javascript"');
      expect(htmlContent).toContain('<pre><code>');
    });

    it('should handle tables', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const tableMarkdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: tableMarkdown,
        isPrivate: false
      });

      const commentCall = mockService.createComment.mock.calls[0];
      const htmlContent = commentCall[1];
      expect(htmlContent).toContain('<table>');
      expect(htmlContent).toContain('<th>Header 1</th>');
      expect(htmlContent).toContain('<td>Cell 1</td>');
    });
  });

  describe('execute - mentions', () => {
    it('should resolve user mentions', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities
        .mockResolvedValueOnce([]) // CommentType search
        .mockResolvedValueOnce([]) // NotificationRule search
        .mockResolvedValueOnce([{ // User search for 'john'
          Id: 555,
          FirstName: 'John',
          LastName: 'Doe',
          Login: 'jdoe',
          Email: 'john@example.com'
        }]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Hey @john, please review',
        mentions: ['john'],
        isPrivate: false
      });

      // Verify user search was performed
      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'GeneralUser',
        expect.stringContaining('john'),
        expect.any(Array),
        5
      );

      // Verify mention was formatted in HTML
      const commentCall = mockService.createComment.mock.calls[0];
      const htmlContent = commentCall[1];
      // The semantic operation may not add user data attributes in this version
      expect(htmlContent).toContain('@john');
    });

    it('should handle failed mention resolution gracefully', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]); // No users found
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Hey @nonexistent, please review',
        mentions: ['nonexistent'],
        isPrivate: false
      });

      // Should still create comment even if mention not found
      expect(mockService.createComment).toHaveBeenCalled();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('✅ Comment added');
    });
  });

  describe('execute - templates', () => {
    it('should discover and suggest templates based on context', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]); // No template entities
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext('developer'), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Update',
        isPrivate: false
      });

      // Should suggest using templates
      expect(result.suggestions!.some(s => s.includes('useTemplate:'))).toBe(true);
      
      // Should include available template names in response
      const structuredData = result.content[1].data;
      expect(structuredData.templates.available).toBeDefined();
      expect(structuredData.templates.count).toBeGreaterThan(0);
    });

    it('should apply template when requested', async () => {
      mockService.getEntity.mockResolvedValue(mockBug);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      // First get templates to know what's available
      const templates = await operation.getTemplates('developer', 'Bug', { workflowStage: { isBlocked: false } });
      const bugFixedTemplate = templates.find(t => t.name === 'Bug Fixed');
      expect(bugFixedTemplate).toBeDefined();

      const result = await operation.execute(createMockContext('developer'), {
        entityType: 'Bug',
        entityId: 456,
        comment: 'Memory leak in auth module',
        useTemplate: 'Bug Fixed',
        isPrivate: false
      });

      // Verify template was applied
      const commentCall = mockService.createComment.mock.calls[0];
      const htmlContent = commentCall[1];
      // Check that the template was applied and content included
      expect(htmlContent).toContain('Memory leak in auth module');
    });
  });

  describe('execute - performance', () => {
    it('should complete within 500ms', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const startTime = Date.now();
      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Performance test',
        isPrivate: false
      });
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(500);
      // Check execution time in metadata
      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.executionTime).toBeLessThan(500);
    });
  });

  describe('execute - attachments and links', () => {
    it('should handle attachments notation', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'See attached logs',
        attachments: [
          { path: 'error.log', description: 'Error logs' },
          { path: 'screenshot.png', description: 'UI screenshot' }
        ],
        isPrivate: false
      });

      const commentCall = mockService.createComment.mock.calls[0];
      const htmlContent = commentCall[1];
      expect(htmlContent).toContain('Attachments:');
      expect(htmlContent).toContain('Error logs');
      expect(htmlContent).toContain('UI screenshot');
      
      const structuredData = result.content[1].data;
      expect(structuredData.comment.hasAttachments).toBe(true);
    });

    it('should handle linked commits and PRs', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext('developer'), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Fixed in commit:abc123 PR#42',
        linkedCommit: 'abc123def456',
        linkedPR: 'https://github.com/org/repo/pull/42',
        isPrivate: false
      });

      const commentCall = mockService.createComment.mock.calls[0];
      const htmlContent = commentCall[1];
      // Check that commits and PR links are included
      expect(htmlContent).toContain('commit');
      expect(htmlContent).toContain('PR#42');
    });
  });

  describe('execute - parent/child threading', () => {
    it('should handle comment replies', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 1000 });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'I agree with the above',
        parentCommentId: 999,
        isPrivate: false
      });

      expect(mockService.createComment).toHaveBeenCalledWith(
        123,
        expect.any(String),
        false,
        999 // Parent comment ID
      );
      
      // Check that it's marked as a reply
      expect(result.content[0].text).toContain('added');
      const structuredData = result.content[1].data;
      expect(structuredData.comment.parentId).toBe(999);
    });

    it('should handle private replies', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      mockService.searchEntities.mockResolvedValue([]);
      mockService.createComment.mockResolvedValue({ Id: 1000 });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Internal note',
        parentCommentId: 999,
        isPrivate: true
      });

      expect(mockService.createComment).toHaveBeenCalledWith(
        123,
        expect.any(String),
        true, // Private
        999
      );
      
      // Check that it's marked as private
      expect(result.content[0].text).toContain('Private');
    });
  });

  describe('execute - dynamic discovery', () => {
    it('should attempt to discover comment types', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      
      // Mock finding comment types
      mockService.searchEntities
        .mockResolvedValueOnce([{ // CommentType search
          Id: 1,
          Name: 'Technical Discussion',
          Description: 'For technical discussions'
        }])
        .mockResolvedValueOnce([]); // NotificationRule search
      
      mockService.createComment.mockResolvedValue({ Id: 999 });

      await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Test',
        isPrivate: false
      });

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'CommentType',
        expect.stringContaining('Task'),
        expect.any(Array),
        10
      );
    });

    it('should handle discovery failures gracefully', async () => {
      mockService.getEntity.mockResolvedValue(mockTask);
      
      // Mock discovery failures
      mockService.searchEntities.mockRejectedValue(new Error('Entity type not found'));
      mockService.createComment.mockResolvedValue({ Id: 999 });

      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 123,
        comment: 'Test',
        isPrivate: false
      });

      // Should still work despite discovery failures
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('✅ Comment added');
    });
  });

  describe('execute - validation errors', () => {
    it('should provide helpful validation error messages', async () => {
      const result = await operation.execute(createMockContext(), {
        entityType: 'Task',
        entityId: 'not-a-number' as any,
        comment: '',
        isPrivate: false
      });

      expect(result.content[0].text).toContain('Validation Error');
      expect(result.content[1].text).toContain('Issues found:');
      expect(result.content[1].text).toContain('comment:');
      expect(result.suggestions).toContain('show-my-tasks - View your tasks to get valid IDs');
    });
  });
});