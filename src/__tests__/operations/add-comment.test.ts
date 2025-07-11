import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AddCommentOperation } from '../../operations/work/add-comment.js';
import { createMockTPService, createMockEntity } from '../mocks/tp-service.mock.js';
import { ExecutionContext } from '../../core/interfaces/semantic-operation.interface.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

describe('AddCommentOperation', () => {
  let operation: AddCommentOperation;
  let mockService: ReturnType<typeof createMockTPService>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = createMockTPService();
    operation = new AddCommentOperation(mockService);
    
    mockContext = {
      user: {
        id: 12345,
        name: 'Test User',
        email: 'test@example.com',
        role: 'developer',
        teams: [{ id: 1, name: 'Dev Team', role: 'member' }],
        permissions: ['read', 'write']
      },
      workspace: {
        currentProject: {
          id: 1,
          name: 'Test Project',
          process: 'Scrum'
        },
        recentEntities: []
      },
      personality: {
        mode: 'developer',
        features: ['add-comment'],
        restrictions: {}
      },
      conversation: {
        mentionedEntities: [],
        previousOperations: [],
        intent: 'add-comment'
      },
      config: {
        apiUrl: 'https://test.tpondemand.com',
        maxResults: 100,
        timeout: 30000
      }
    };
  });

  describe('metadata', () => {
    it('should have correct metadata', () => {
      expect(operation.metadata.id).toBe('add-comment');
      expect(operation.metadata.name).toBe('Add Comment');
      expect(operation.metadata.description).toContain('Add comments to tasks, bugs, and other work items');
      expect(operation.metadata.requiredPersonalities).toContain('developer');
      expect(operation.metadata.requiredPersonalities).toContain('tester');
      expect(operation.metadata.requiredPersonalities).toContain('project-manager');
    });
  });

  describe('getTemplates', () => {
    it('should return developer-specific templates', () => {
      const templates = operation.getTemplates('developer');
      expect(templates).toContain('Fixed: [Brief description of what was fixed]');
      expect(templates).toContain('Code review: [Feedback on implementation]');
      expect(templates).toContain('Technical note: [Implementation details or considerations]');
    });

    it('should return tester-specific templates', () => {
      const templates = operation.getTemplates('tester');
      expect(templates).toContain('Test results: [Pass/Fail with details]');
      expect(templates).toContain('Bug reproduction: [Steps to reproduce the issue]');
      expect(templates).toContain('Quality observation: [Quality concerns or improvements]');
    });

    it('should return project-manager-specific templates', () => {
      const templates = operation.getTemplates('project-manager');
      expect(templates).toContain('Status update: [Current status and next steps]');
      expect(templates).toContain('Risk identified: [Risk description and mitigation plan]');
      expect(templates).toContain('Team coordination: [Team communication or assignments]');
    });

    it('should return product-owner-specific templates', () => {
      const templates = operation.getTemplates('product-owner');
      expect(templates).toContain('Business justification: [Why this change is important]');
      expect(templates).toContain('Stakeholder feedback: [Input from stakeholders]');
      expect(templates).toContain('Requirements clarification: [Clarification on requirements]');
    });

    it('should return default templates for unknown roles', () => {
      const templates = operation.getTemplates('unknown-role');
      expect(templates).toContain('Update: [General status update]');
      expect(templates).toContain('Note: [General comment or observation]');
      expect(templates).toContain('Follow-up: [Next steps or follow-up actions]');
    });
  });

  describe('formatContent', () => {
    const testContent = 'This is a **test** comment with *italic* and `code`';
    
    it('should format content for developer role', () => {
      const formatted = operation.formatContent(testContent, 'developer');
      expect(formatted).toContain('💻 Developer Update');
      expect(formatted).toContain('<strong>test</strong>');
      expect(formatted).toContain('<em>italic</em>');
      expect(formatted).toContain('<code>code</code>');
    });

    it('should format content for tester role', () => {
      const formatted = operation.formatContent(testContent, 'tester');
      expect(formatted).toContain('🧪 QA Update');
      expect(formatted).toContain('<div>');
    });

    it('should format content for project-manager role', () => {
      const formatted = operation.formatContent(testContent, 'project-manager');
      expect(formatted).toContain('📋 Project Update');
    });

    it('should format content for product-owner role', () => {
      const formatted = operation.formatContent(testContent, 'product-owner');
      expect(formatted).toContain('🎯 Product Update');
    });

    it('should format content for unknown role', () => {
      const formatted = operation.formatContent(testContent, 'unknown');
      expect(formatted).toContain('📝 Update');
    });

    it('should include timestamp in formatted content', () => {
      const formatted = operation.formatContent(testContent, 'developer');
      const today = new Date().toISOString().split('T')[0];
      expect(formatted).toContain(today);
    });
  });

  describe('convertMarkdownToHtml', () => {
    it('should convert markdown formatting to HTML', () => {
      const markdown = '**bold** *italic* `code`';
      const html = (operation as any).convertMarkdownToHtml(markdown);
      
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<code>code</code>');
    });

    it('should handle line breaks', () => {
      const markdown = 'line1\n\nline2';
      const html = (operation as any).convertMarkdownToHtml(markdown);
      
      expect(html).toContain('</div><div><br/></div><div>');
    });
  });

  describe('execute', () => {
    const validParams = {
      entityType: 'UserStory',
      entityId: 54356,
      comment: 'Test comment',
      isPrivate: false
    };

    beforeEach(() => {
      const mockEntity = createMockEntity('UserStory', {
        Id: 54356,
        Name: 'Test UserStory',
        EntityState: { Name: 'Open', IsInitial: true, IsFinal: false },
        AssignedUser: { Id: 12345, FirstName: 'Test', LastName: 'User' },
        Project: { Name: 'Test Project' }
      });

      const mockComment = {
        Id: 207214,
        Description: 'Formatted comment',
        CreateDate: new Date().toISOString(),
        User: { Id: 12345, Name: 'Test User' }
      };

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createEntity.mockResolvedValue(mockComment);
    });

    it('should successfully create a comment', async () => {
      const result = await operation.execute(mockContext, validParams);

      expect(mockService.getEntity).toHaveBeenCalledWith(
        'UserStory',
        54356,
        ['Name', 'EntityState', 'AssignedUser', 'Project', 'Priority', 'Severity']
      );

      expect(mockService.createEntity).toHaveBeenCalledWith(
        'Comment',
        expect.objectContaining({
          Description: expect.stringContaining('💻 Developer Update'),
          General: { Id: 54356 }
        })
      );

      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('✅ Comment added');
      expect(result.content[1].type).toBe('structured-data');
    });

    it('should handle private comments', async () => {
      const privateParams = { ...validParams, isPrivate: true };
      
      await operation.execute(mockContext, privateParams);

      expect(mockService.createEntity).toHaveBeenCalledWith(
        'Comment',
        expect.objectContaining({
          IsPrivate: true
        })
      );
    });

    it('should format comment based on user role', async () => {
      const testerContext = { ...mockContext, user: { ...mockContext.user, role: 'tester' } };
      
      await operation.execute(testerContext, validParams);

      expect(mockService.createEntity).toHaveBeenCalledWith(
        'Comment',
        expect.objectContaining({
          Description: expect.stringContaining('🧪 QA Update')
        })
      );
    });

    it('should return error when entity not found', async () => {
      mockService.getEntity.mockResolvedValue(null);

      const result = await operation.execute(mockContext, validParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('error');
      expect(result.content[0].text).toContain('UserStory with ID 54356 not found');
    });

    it('should handle API errors gracefully', async () => {
      mockService.createEntity.mockRejectedValue(new McpError(400, 'API Error'));

      const result = await operation.execute(mockContext, validParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('error');
      expect(result.content[0].text).toContain('Failed to add comment');
    });

    it('should validate parameters with Zod', async () => {
      const invalidParams = {
        entityType: 'UserStory',
        entityId: 54356,
        comment: '',  // Should be non-empty
        isPrivate: false
      };

      const result = await operation.execute(mockContext, invalidParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('error');
    });

    it('should provide follow-up suggestions', async () => {
      const result = await operation.execute(mockContext, validParams);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.suggestions!.some(s => s.includes('get_entity'))).toBe(true);
    });

    it('should include affected entities in result', async () => {
      const result = await operation.execute(mockContext, validParams);

      expect(result.affectedEntities).toBeDefined();
      expect(result.affectedEntities!).toHaveLength(1);
      expect(result.affectedEntities![0]).toEqual({
        id: 54356,
        type: 'UserStory',
        action: 'updated'
      });
    });

    it('should handle default user role', async () => {
      const contextWithoutRole = { 
        ...mockContext, 
        user: { ...mockContext.user, role: 'unknown-role' } 
      };
      
      await operation.execute(contextWithoutRole, validParams);

      expect(mockService.createEntity).toHaveBeenCalledWith(
        'Comment',
        expect.objectContaining({
          Description: expect.stringContaining('📝 Update')
        })
      );
    });
  });

  describe('role-based behavior', () => {
    const params = {
      entityType: 'Task',
      entityId: 12345,
      comment: 'Test comment',
      isPrivate: false
    };

    beforeEach(() => {
      const mockEntity = createMockEntity('Task', {
        Id: 12345,
        Name: 'Test Task',
        EntityState: { Name: 'Open', IsInitial: true, IsFinal: false },
        AssignedUser: { Id: 12345 }
      });

      mockService.getEntity.mockResolvedValue(mockEntity);
      mockService.createEntity.mockResolvedValue({ Id: 1, Description: 'comment' });
    });

    it('should provide role-specific suggestions for developer', async () => {
      const result = await operation.execute(mockContext, params);
      
      expect(result.suggestions!.some(s => s.includes('start-working-on'))).toBe(true);
    });

    it('should provide different suggestions for different roles', async () => {
      const pmContext = { ...mockContext, user: { ...mockContext.user, role: 'project-manager' } };
      const result = await operation.execute(pmContext, params);
      
      // Should still provide general suggestions
      expect(result.suggestions!.some(s => s.includes('get_entity'))).toBe(true);
    });
  });
});