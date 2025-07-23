import { jest } from '@jest/globals';
import { ShowMyTasksOperation } from '../../operations/work/show-my-tasks.js';
import { TPService } from '../../api/client/tp.service.js';
import { ExecutionContext } from '../../core/interfaces/semantic-operation.interface.js';

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
  searchEntities: jest.fn(),
} as unknown as jest.Mocked<TPService>;

// Helper to create mock execution context
const createMockContext = (userId: number = 101734): ExecutionContext => ({
  user: {
    id: userId,
    name: 'Test Developer',
    email: 'dev@example.com',
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
});

// Mock data
const mockPriorities = [
  { Id: 1, Name: 'Must Have', Importance: 1 },
  { Id: 2, Name: 'Should Have', Importance: 2 },
  { Id: 3, Name: 'Nice to Have', Importance: 3 },
  { Id: 4, Name: 'Low', Importance: 4 },
  { Id: 5, Name: 'Very Low', Importance: 5 }
];

const mockEntityStates = [
  { Id: 1, Name: 'New', IsFinal: false, IsInitial: true, NumericPriority: 1 },
  { Id: 2, Name: 'In Progress', IsFinal: false, IsInitial: false, NumericPriority: 2 },
  { Id: 3, Name: 'Testing', IsFinal: false, IsInitial: false, NumericPriority: 3 },
  { Id: 4, Name: 'Done', IsFinal: true, IsInitial: false, NumericPriority: 4 },
  { Id: 5, Name: 'Blocked', IsFinal: false, IsInitial: false, NumericPriority: 2.5 }
];

const createMockTask = (overrides: any = {}) => ({
  Id: 123,
  Name: 'Implement feature X',
  Description: 'Feature description',
  EntityType: { Name: 'Task', Id: 5 },
  Priority: { Id: 1, Name: 'Must Have', Importance: 1 },
  EntityState: { Id: 2, Name: 'In Progress', IsFinal: false, NumericPriority: 2 },
  Project: { Id: 1, Name: 'Main Project' },
  Tags: { Items: [] },
  Impediments: { Items: [] },
  CreateDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  ModifyDate: new Date().toISOString(),
  EndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  StartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  Effort: 8,
  EffortCompleted: 3,
  EffortToDo: 5,
  Progress: 37.5,
  TimeSpent: 3,
  TimeRemain: 5,
  IsNow: true,
  IsNext: false,
  LastCommentDate: new Date().toISOString(),
  Release: { Id: 1, Name: 'Release 1.0' },
  Iteration: null,
  TeamIteration: { Id: 1, Name: 'Sprint 5' },
  ...overrides
});

describe('ShowMyTasksOperation', () => {
  let operation: ShowMyTasksOperation;

  beforeEach(() => {
    operation = new ShowMyTasksOperation(mockService);
    jest.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct metadata', () => {
      const metadata = operation.metadata;
      expect(metadata.id).toBe('show-my-tasks');
      expect(metadata.name).toBe('Show My Tasks');
      expect(metadata.category).toBe('work');
      expect(metadata.requiredPersonalities).toEqual(['developer']);
      expect(metadata.tags).toContain('developer');
    });

    it('should be developer-only operation', () => {
      expect(operation.metadata.requiredPersonalities).toHaveLength(1);
      expect(operation.metadata.requiredPersonalities[0]).toBe('developer');
    });
  });

  describe('schema validation', () => {
    it('should validate parameters correctly', () => {
      const schema = operation.getSchema();
      
      // Valid params
      expect(() => schema.parse({})).not.toThrow();
      expect(() => schema.parse({ priority: 'high' })).not.toThrow();
      expect(() => schema.parse({ state: 'active' })).not.toThrow();
      expect(() => schema.parse({ project: 123 })).not.toThrow();
      expect(() => schema.parse({ dueIn: 7 })).not.toThrow();
      expect(() => schema.parse({ limit: 50 })).not.toThrow();
      
      // Invalid params
      expect(() => schema.parse({ priority: 'urgent' })).toThrow();
      expect(() => schema.parse({ state: 'completed' })).toThrow();
      expect(() => schema.parse({ project: 'abc' })).toThrow();
    });

    it('should have correct defaults', () => {
      const schema = operation.getSchema();
      const parsed = schema.parse({});
      expect(parsed.state).toBe('active');
      expect(parsed.limit).toBe(25);
    });
  });

  describe('execute - basic functionality', () => {
    it('should fetch and display user tasks', async () => {
      // Mock discovery
      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates) // EntityState discovery
        .mockResolvedValueOnce(mockPriorities)   // Priority discovery
        .mockResolvedValueOnce([                  // Task search
          createMockTask(),
          createMockTask({ 
            Id: 124, 
            Name: 'Fix bug Y',
            Priority: { Id: 3, Name: 'Nice to Have', Importance: 3 },
            EntityType: { Name: 'Bug', Id: 8 }
          })
        ]);

      const result = await operation.execute(createMockContext(), {} as any);

      // Check API calls
      expect(mockService.searchEntities).toHaveBeenCalledTimes(3);
      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Assignable',
        expect.stringContaining('AssignedUser.Id eq 101734'),
        expect.any(Array),
        25
      );

      // Check result structure
      expect(result.content).toHaveLength(3);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Your Tasks');
      expect(result.content[0].text).toContain('2 active');
      
      // Check formatted tasks
      expect(result.content[1].text).toContain('🔴'); // High priority
      expect(result.content[1].text).toContain('Implement feature X');
      expect(result.content[1].text).toContain('Fix bug Y');
      
      // Check suggestions
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });

    it('should handle empty task list', async () => {
      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([]);

      const result = await operation.execute(createMockContext(), {} as any);

      expect(result.content[0].text).toContain('No tasks found');
      expect(result.suggestions).toContain('show-my-tasks state:all - Show all tasks including completed');
    });
  });

  describe('execute - filtering', () => {
    it('should filter by priority', async () => {
      const highPriorityTask = createMockTask();
      const lowPriorityTask = createMockTask({
        Id: 125,
        Priority: { Id: 5, Name: 'Very Low', Importance: 5 }
      });

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([highPriorityTask, lowPriorityTask]);

      const result = await operation.execute(createMockContext(), { priority: 'high' } as any);

      // Should filter out low priority task
      expect(result.content[1].text).toContain('Implement feature X');
      expect(result.content[1].text).not.toContain('Very Low');
    });

    it('should filter by state (active vs all)', async () => {
      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([createMockTask()]);

      await operation.execute(createMockContext(), { state: 'active' } as any);

      // Check that IsFinal filter was applied
      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Assignable',
        expect.stringContaining('EntityState.IsFinal eq false'),
        expect.any(Array),
        25
      );
    });

    it('should filter by project', async () => {
      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([createMockTask()]);

      await operation.execute(createMockContext(), { project: 123 } as any);

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Assignable',
        expect.stringContaining('Project.Id eq 123'),
        expect.any(Array),
        25
      );
    });

    it('should filter by due date', async () => {
      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([createMockTask()]);

      await operation.execute(createMockContext(), { dueIn: 7 } as any);

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Assignable',
        expect.stringMatching(/EndDate lte '\d{4}-\d{2}-\d{2}'/),
        expect.any(Array),
        25
      );
    });

    it('should respect limit parameter', async () => {
      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([]);

      await operation.execute(createMockContext(), { limit: 10 } as any);

      expect(mockService.searchEntities).toHaveBeenCalledWith(
        'Assignable',
        expect.any(String),
        expect.any(Array),
        10,
      );
    });
  });

  describe('execute - visual indicators', () => {
    it('should show correct priority indicators', async () => {
      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([
          createMockTask({ Priority: { Id: 1, Name: 'Must Have', Importance: 1 } }),
          createMockTask({ Id: 124, Priority: { Id: 3, Name: 'Nice to Have', Importance: 3 } }),
          createMockTask({ Id: 125, Priority: { Id: 5, Name: 'Very Low', Importance: 5 } })
        ]);

      const result = await operation.execute(createMockContext(), {} as any);

      const tasksText = result.content[1].text;
      expect(tasksText).toContain('🔴'); // High priority
      expect(tasksText).toContain('🟡'); // Medium priority
      expect(tasksText).toContain('🔵'); // Low priority
    });

    it('should show overdue status', async () => {
      const overdueTask = createMockTask({
        EndDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      });

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([overdueTask]);

      const result = await operation.execute(createMockContext(), {} as any);

      expect(result.content[1].text).toContain('⚠️ Overdue');
      expect(result.content[0].text).toContain('⚠️ 1 overdue');
    });

    it('should show blocked status', async () => {
      const blockedTask = createMockTask({
        Tags: { Items: [{ Name: 'blocked' }] }
      });

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([blockedTask]);

      const result = await operation.execute(createMockContext(), {} as any);

      expect(result.content[1].text).toContain('🚧 Blocked');
      expect(result.content[0].text).toContain('🚧 1 blocked');
    });

    it('should detect blocked by impediments', async () => {
      const impedimentTask = createMockTask({
        Impediments: { Items: [{ Id: 1, Name: 'Technical issue' }] }
      });

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([impedimentTask]);

      const result = await operation.execute(createMockContext(), {} as any);

      expect(result.content[1].text).toContain('🚧 Blocked');
    });

    it('should show task age correctly', async () => {
      const tasks = [
        createMockTask({ 
          Id: 1,
          CreateDate: new Date().toISOString() 
        }),
        createMockTask({ 
          Id: 2,
          CreateDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
        }),
        createMockTask({ 
          Id: 3,
          CreateDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() 
        }),
        createMockTask({ 
          Id: 4,
          CreateDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() 
        })
      ];

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce(tasks);

      const result = await operation.execute(createMockContext(), {} as any);

      const tasksText = result.content[1].text;
      expect(tasksText).toContain('Created today');
      expect(tasksText).toContain('Created yesterday');
      expect(tasksText).toContain('1 weeks old');
      expect(tasksText).toContain('⚡'); // Stale indicator
    });
  });

  describe('execute - effort tracking', () => {
    it('should display effort information', async () => {
      const taskWithEffort = createMockTask({
        Progress: 50,
        TimeSpent: 4,
        TimeRemain: 4
      });

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([taskWithEffort]);

      const result = await operation.execute(createMockContext(), {} as any);

      expect(result.content[1].text).toContain('50% complete');
      expect(result.content[1].text).toContain('4h spent');
      expect(result.content[1].text).toContain('4h remaining');
    });
  });

  describe('execute - dynamic discovery', () => {
    it('should cache discovery results', async () => {
      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([createMockTask()]);

      // First call - should perform discovery
      await operation.execute(createMockContext(), {} as any);
      expect(mockService.searchEntities).toHaveBeenCalledTimes(3);

      // Reset mock
      mockService.searchEntities.mockClear();
      mockService.searchEntities.mockResolvedValueOnce([createMockTask()]);

      // Second call - should use cache
      await operation.execute(createMockContext(), {} as any);
      expect(mockService.searchEntities).toHaveBeenCalledTimes(1); // Only task search
    });

    it('should handle discovery failures gracefully', async () => {
      // Clear any existing cache by creating new operation instance
      const freshOperation = new ShowMyTasksOperation(mockService);
      
      mockService.searchEntities
        .mockRejectedValueOnce(new Error('EntityState not found'))
        .mockRejectedValueOnce(new Error('Priority not found'))
        .mockResolvedValueOnce([createMockTask()]);

      const result = await freshOperation.execute(createMockContext(), {} as any);

      // Should still work with defaults
      expect(result.content[0].text).toContain('Your Tasks');
      expect(result.content[1].text).toContain('Implement feature X');
    });
  });

  describe('execute - intelligent suggestions', () => {
    it('should suggest working on highest priority unblocked task', async () => {
      const tasks = [
        createMockTask({ 
          Id: 1, 
          Priority: { Id: 3, Name: 'Nice to Have', Importance: 3 },
          Tags: { Items: [{ Name: 'blocked' }] },
          EntityState: { Id: 5, Name: 'Blocked', IsFinal: false, NumericPriority: 2.5 }
        }),
        createMockTask({ 
          Id: 2, 
          Priority: { Id: 1, Name: 'Must Have', Importance: 1 },
          EntityState: { Id: 2, Name: 'In Progress', IsFinal: false, NumericPriority: 2 }
        })
      ];

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce(tasks);

      const result = await operation.execute(createMockContext(), {} as any);

      expect(result.suggestions![0]).toContain('start-working-on');
      expect(result.suggestions![0]).toContain('entityId:2');
    });

    it('should suggest checking comments for blocked tasks', async () => {
      const blockedTask = createMockTask({
        Tags: { Items: [{ Name: 'blocked' }] }
      });

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([blockedTask]);

      const result = await operation.execute(createMockContext(), {} as any);

      expect(result.suggestions!.some(s => s.includes('show-comments'))).toBe(true);
    });

    it('should suggest updating overdue tasks', async () => {
      const overdueTask = createMockTask({
        EndDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      });

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([overdueTask]);

      const result = await operation.execute(createMockContext(), {} as any);

      expect(result.suggestions!.some(s => s.includes('update-entity'))).toBe(true);
    });
  });

  describe('execute - performance', () => {
    it('should complete within 1 second', async () => {
      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce(Array(25).fill(null).map((_, i) => createMockTask({ Id: i })));

      const startTime = Date.now();
      const result = await operation.execute(createMockContext(), {} as any);
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(1000);
      if (result.metadata) {
        expect(result.metadata.executionTime).toBeLessThan(1000);
      }
    });
  });

  describe('execute - error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockService.searchEntities
        .mockRejectedValueOnce(new Error('API connection failed')) // Fail EntityState discovery
        .mockRejectedValueOnce(new Error('API connection failed')) // Fail Priority discovery  
        .mockRejectedValueOnce(new Error('API connection failed')); // Fail task fetch

      const result = await operation.execute(createMockContext(), {} as any);

      expect(result.content[0].text).toContain('Failed to fetch tasks');
      expect(result.content[1].text).toContain('API connection failed');
      expect(result.suggestions).toBeDefined();
    });

    it('should handle missing user ID', async () => {
      const contextWithoutUser = createMockContext(0);

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([]);

      const result = await operation.execute(contextWithoutUser, {} as any);

      // Should still attempt with user ID 0
      const lastCall = mockService.searchEntities.mock.calls[mockService.searchEntities.mock.calls.length - 1];
      expect(lastCall[0]).toBe('Assignable');
      expect(lastCall[1]).toContain('AssignedUser.Id eq 0');
    });
  });

  describe('execute - mobile friendly format', () => {
    it('should format tasks in mobile-friendly way', async () => {
      // Clear cache to ensure fresh operation
      const freshOperation = new ShowMyTasksOperation(mockService);
      const task = createMockTask();

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce([task]);

      const result = await freshOperation.execute(createMockContext(), {} as any);

      const taskText = result.content[1].text;
      
      // Check compact format with key info on separate lines
      expect(taskText).toMatch(/🔴.*Implement feature X/);
      expect(taskText).toContain('Task #123');
      expect(taskText).toContain('Main Project');
      expect(taskText).not.toContain(task.Description); // Long descriptions excluded
    });
  });

  describe('execute - structured data', () => {
    it('should include structured data summary', async () => {
      // Clear cache for fresh operation
      const freshOperation = new ShowMyTasksOperation(mockService);
      
      const tasks = [
        createMockTask({ Priority: { Id: 1, Name: 'Must Have', Importance: 1 } }),
        createMockTask({ 
          Id: 124, 
          Priority: { Id: 5, Name: 'Very Low', Importance: 5 },
          Tags: { Items: [{ Name: 'blocked' }] }
        }),
        createMockTask({ 
          Id: 125,
          EndDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        })
      ];

      mockService.searchEntities
        .mockResolvedValueOnce(mockEntityStates)
        .mockResolvedValueOnce(mockPriorities)
        .mockResolvedValueOnce(tasks);

      const result = await freshOperation.execute(createMockContext(), {} as any);

      const structuredData = result.content[2].data;
      expect(structuredData.totalTasks).toBe(3);
      expect(structuredData.byPriority.high).toBe(2); // Two high priority (importance 1)
      expect(structuredData.byPriority.low).toBe(1);
      expect(structuredData.blockedTasks).toBe(1);
      expect(structuredData.overdueTasks).toBe(1);
      expect(structuredData.byState['In Progress']).toBe(3);
    });
  });
});