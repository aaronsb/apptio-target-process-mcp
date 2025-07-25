/**
 * Agent usability test scenarios
 * These test real-world tasks that agents should be able to accomplish
 */

import { IAgentTestScenario } from '../../core/interfaces/agent-testing.interface.js';

export const agentTestScenarios: IAgentTestScenario[] = [
  // Basic scenarios - single tool usage
  {
    id: 'basic-search-stories',
    name: 'Search for User Stories',
    description: 'Agent should be able to find user stories with basic filtering',
    category: 'basic',
    goal: 'Find all user stories in the "Mobile App" project',
    expectedTools: ['search_entities'],
    successCriteria: [
      {
        type: 'tool-called',
        description: 'Uses search_entities with correct entity type',
        validation: {
          toolName: 'search_entities',
          parameters: {
            type: 'UserStory'
          }
        }
      },
      {
        type: 'data-found',
        description: 'Returns user stories from the correct project',
        validation: {
          resultContains: {
            entities: (expect: any) => expect.length > 0
          }
        }
      }
    ]
  },

  {
    id: 'basic-get-entity',
    name: 'Get Entity Details',
    description: 'Agent should retrieve detailed information about a specific entity',
    category: 'basic',
    goal: 'Get full details of bug #12345 including project and assigned user information',
    expectedTools: ['get_entity'],
    successCriteria: [
      {
        type: 'tool-called',
        description: 'Uses get_entity with includes',
        validation: {
          toolName: 'get_entity',
          parameters: {
            type: 'Bug',
            id: 12345,
            include: (expect: string[]) => expect.includes('Project') && expect.includes('AssignedUser')
          }
        }
      }
    ]
  },

  // Intermediate scenarios - multiple tools or complex queries
  {
    id: 'intermediate-find-assign-task',
    name: 'Find Unassigned Tasks and Assign',
    description: 'Agent should find unassigned tasks and assign them to a user',
    category: 'intermediate',
    goal: 'Find all unassigned tasks in project "Backend API" and assign them to Sarah Johnson',
    expectedTools: ['search_entities', 'search_entities', 'update_entity'],
    hints: [
      'First search for the project to get its ID',
      'Then search for unassigned tasks in that project',
      'Search for the user Sarah Johnson to get her ID',
      'Update each task with the assigned user'
    ],
    successCriteria: [
      {
        type: 'tool-called',
        description: 'Searches for project',
        validation: {
          toolName: 'search_entities',
          parameters: {
            type: 'Project',
            where: (expect: string) => expect.includes('Backend API')
          }
        }
      },
      {
        type: 'tool-called',
        description: 'Searches for user',
        validation: {
          toolName: 'search_entities',
          parameters: {
            type: 'GeneralUser',
            where: (expect: string) => expect.includes('Sarah Johnson')
          }
        }
      },
      {
        type: 'entity-updated',
        description: 'Updates task with assigned user',
        validation: {
          toolName: 'update_entity'
        }
      }
    ]
  },

  {
    id: 'intermediate-create-linked-entities',
    name: 'Create Feature with Stories',
    description: 'Agent should create a feature and related user stories',
    category: 'intermediate',
    goal: 'Create a new feature "User Authentication" in project 456 with two user stories: "Login Page" and "Password Reset"',
    expectedTools: ['create_entity', 'create_entity', 'create_entity'],
    successCriteria: [
      {
        type: 'entity-created',
        description: 'Creates feature',
        validation: {
          toolName: 'create_entity',
          parameters: {
            type: 'Feature',
            name: 'User Authentication'
          }
        }
      },
      {
        type: 'entity-created',
        description: 'Creates first user story',
        validation: {
          toolName: 'create_entity',
          parameters: {
            type: 'UserStory',
            name: 'Login Page'
          }
        }
      },
      {
        type: 'entity-created',
        description: 'Creates second user story',
        validation: {
          toolName: 'create_entity',
          parameters: {
            type: 'UserStory',
            name: 'Password Reset'
          }
        }
      }
    ]
  },

  // Advanced scenarios - complex workflows
  {
    id: 'advanced-sprint-planning',
    name: 'Sprint Planning Workflow',
    description: 'Agent should help plan a sprint by finding and organizing work items',
    category: 'advanced',
    goal: 'Find all high-priority unfinished user stories and bugs in the "Mobile App" project, check their estimates, and assign them to the current sprint (Sprint 23)',
    expectedTools: ['search_entities', 'search_entities', 'search_entities', 'update_entity'],
    successCriteria: [
      {
        type: 'tool-called',
        description: 'Searches for high-priority stories',
        validation: {
          toolName: 'search_entities',
          parameters: {
            type: 'UserStory',
            where: (expect: string) => 
              expect.includes('Priority') && 
              expect.includes('High') &&
              expect.includes('EntityState.Name') &&
              expect.includes('Done')
          }
        }
      },
      {
        type: 'tool-called',
        description: 'Searches for high-priority bugs',
        validation: {
          toolName: 'search_entities',
          parameters: {
            type: 'Bug',
            where: (expect: string) => 
              expect.includes('Priority') && 
              (expect.includes('High') || expect.includes('Critical'))
          }
        }
      }
    ]
  },

  // Error handling scenarios
  {
    id: 'error-handle-not-found',
    name: 'Handle Entity Not Found',
    description: 'Agent should gracefully handle when an entity does not exist',
    category: 'error-handling',
    goal: 'Get details for user story #99999999 (which does not exist) and report that it was not found',
    expectedTools: ['get_entity'],
    successCriteria: [
      {
        type: 'error-handled',
        description: 'Recognizes entity not found error',
        validation: {
          errorType: 'not-found'
        }
      }
    ]
  },

  {
    id: 'error-invalid-query',
    name: 'Recover from Invalid Query',
    description: 'Agent should recover when a query is malformed',
    category: 'error-handling',
    goal: 'Find bugs where the description contains special characters like quotes',
    hints: [
      'Special characters in queries need to be properly escaped',
      'The "contains" operator might be more appropriate than equals'
    ],
    successCriteria: [
      {
        type: 'tool-called',
        description: 'Eventually uses correct query syntax',
        validation: {
          toolName: 'search_entities',
          parameters: {
            where: (expect: string) => expect.includes('contains')
          }
        }
      }
    ]
  }
];

/**
 * Usability test questions to evaluate after scenarios
 */
export const usabilityQuestions = [
  {
    id: 'tool-discovery',
    question: 'Was the agent able to discover which tool to use based on the goal?',
    evaluates: 'tool-descriptions'
  },
  {
    id: 'parameter-clarity',
    question: 'Did the agent understand what parameters were required?',
    evaluates: 'parameter-schemas'
  },
  {
    id: 'error-recovery',
    question: 'When errors occurred, was the agent able to understand and recover?',
    evaluates: 'error-messages'
  },
  {
    id: 'workflow-efficiency',
    question: 'Did the agent take an efficient path to achieve the goal?',
    evaluates: 'tool-design'
  },
  {
    id: 'data-interpretation',
    question: 'Was the agent able to interpret the returned data correctly?',
    evaluates: 'response-format'
  }
];