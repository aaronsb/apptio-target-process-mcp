import { jest } from '@jest/globals';
import { TPService } from '../../api/client/tp.service.js';

export const createMockTPService = (): jest.Mocked<TPService> => {
  const mockService = {
    // Core methods
    searchEntities: jest.fn(),
    getEntity: jest.fn(),
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
    inspectObject: jest.fn(),
    
    // Entity type validation
    validateEntityType: jest.fn(),
    getValidEntityTypes: jest.fn(),
    
    // Configuration
    config: {
      domain: 'test.tpondemand.com',
      credentials: {
        username: 'test',
        password: 'test'
      }
    }
  } as unknown as jest.Mocked<TPService>;

  // Default implementations
  mockService.validateEntityType.mockResolvedValue(true);
  mockService.getValidEntityTypes.mockResolvedValue([
    'UserStory', 'Bug', 'Task', 'Feature', 'Epic', 
    'Project', 'Team', 'Iteration', 'Release'
  ]);

  return mockService;
};

// Test data factories
export const createMockEntity = (type: string, overrides: any = {}) => {
  const base = {
    Id: Math.floor(Math.random() * 10000),
    Name: `Test ${type} ${Date.now()}`,
    EntityType: { Name: type },
    CreateDate: new Date().toISOString(),
    ModifyDate: new Date().toISOString()
  };

  const typeSpecific: Record<string, any> = {
    UserStory: {
      EntityState: { Id: 1, Name: 'Open' },
      Priority: { Id: 1, Name: 'High' },
      Effort: 5,
      Project: { Id: 1, Name: 'Test Project' }
    },
    Bug: {
      EntityState: { Id: 1, Name: 'Open' },
      Priority: { Id: 1, Name: 'Critical' },
      Severity: { Id: 1, Name: 'High' },
      Project: { Id: 1, Name: 'Test Project' }
    },
    Task: {
      EntityState: { Id: 1, Name: 'Open' },
      Priority: { Id: 1, Name: 'Normal' },
      Effort: 2,
      UserStory: { Id: 1, Name: 'Parent Story' }
    },
    Project: {
      IsActive: true,
      Process: { Id: 1, Name: 'Scrum' },
      Program: { Id: 1, Name: 'Test Program' }
    }
  };

  return {
    ...base,
    ...(typeSpecific[type] || {}),
    ...overrides
  };
};

export const createMockSearchResponse = (items: any[], total?: number) => ({
  Items: items,
  Next: items.length === 25 ? 'next-url' : null,
  Total: total || items.length
});

export const createMockError = (status: number, message: string) => {
  const error = new Error(message) as any;
  error.response = {
    status,
    data: {
      Status: 'Error',
      Message: message,
      Details: {
        Items: [{ Message: message }]
      }
    }
  };
  return error;
};