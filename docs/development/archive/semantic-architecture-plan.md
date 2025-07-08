# Semantic Architecture Plan for Targetprocess MCP

Based on the WordPress MCP architecture analysis, this document outlines how to refactor the Targetprocess MCP to implement semantic operation mapping and role-based tool exposure.

## Core Concepts from WordPress MCP

### 1. Semantic Operations vs Direct API Mapping
Instead of exposing raw CRUD operations, we create semantic operations that map to user intent:
- **Current**: `createEntity(type: "UserStory", data: {...})`
- **Semantic**: `start-feature-development(feature: "User authentication")`

### 2. Personality Modes (Role-Based Tool Exposure)
WordPress MCP uses "personality modes" that dynamically filter available tools:
- **Contributor Mode**: Limited, safe operations
- **Author Mode**: Balanced capabilities
- **Administrator Mode**: Full access

### 3. Feature Registry Pattern
Self-contained modules that encapsulate:
- Metadata (name, description, permissions)
- Validation logic
- Execution logic
- Context handling

## Proposed Architecture for Targetprocess MCP

### 1. Personality Modes for Targetprocess

```json
{
  "personalities": {
    "viewer": {
      "name": "Viewer Mode",
      "description": "Read-only access to project data",
      "features": ["view-backlog", "search-entities", "generate-reports"]
    },
    "developer": {
      "name": "Developer Mode",
      "description": "Manage development tasks and track progress",
      "features": ["manage-tasks", "update-progress", "log-time", "view-backlog"]
    },
    "product-owner": {
      "name": "Product Owner Mode",
      "description": "Manage product backlog and priorities",
      "features": ["manage-backlog", "prioritize-features", "plan-iterations", "view-metrics"]
    },
    "scrum-master": {
      "name": "Scrum Master Mode",
      "description": "Facilitate agile processes and team productivity",
      "features": ["manage-sprints", "track-velocity", "manage-impediments", "generate-reports"]
    },
    "administrator": {
      "name": "Administrator Mode",
      "description": "Full system access with configuration capabilities",
      "features": ["*"]
    }
  }
}
```

### 2. Semantic Operations Mapping

#### Developer Operations
```typescript
// Instead of: searchEntities({type: "Task", where: "AssignedUser.Id = 123"})
// Semantic: "show-my-tasks"
{
  "operation": "show-my-tasks",
  "maps_to": {
    "search": {
      "type": "Task",
      "where": "AssignedUser.Id = currentUser() and EntityState.Name != 'Done'",
      "include": ["Project", "Priority", "Iteration"]
    }
  }
}

// Instead of: updateEntity({type: "Task", id: 456, fields: {EntityState: {Id: 159}}})
// Semantic: "start-working-on task#456"
{
  "operation": "start-working-on",
  "maps_to": {
    "update": {
      "entityState": "In Progress",
      "assignedUser": "currentUser()"
    }
  }
}
```

#### Product Owner Operations
```typescript
// Semantic: "plan-next-sprint"
{
  "operation": "plan-next-sprint",
  "workflow": [
    "get-current-sprint-status",
    "identify-incomplete-items",
    "get-prioritized-backlog",
    "calculate-team-velocity",
    "suggest-sprint-content"
  ]
}

// Semantic: "reprioritize-backlog based-on customer-feedback"
{
  "operation": "reprioritize-backlog",
  "context": "customer-feedback",
  "workflow": [
    "analyze-feedback-themes",
    "map-to-features",
    "adjust-priorities",
    "notify-stakeholders"
  ]
}
```

### 3. Feature Module Structure

```typescript
// src/features/sprint-management/index.ts
export const SprintManagementFeature: Feature = {
  metadata: {
    id: 'sprint-management',
    name: 'Sprint Management',
    description: 'Manage sprints and iterations',
    requiredRoles: ['scrum-master', 'product-owner', 'administrator'],
    category: 'agile-process'
  },
  
  operations: {
    'start-sprint': {
      description: 'Start a new sprint with selected items',
      parameters: {
        name: { type: 'string', required: true },
        duration: { type: 'number', default: 14 },
        items: { type: 'array', itemType: 'entityId' }
      },
      execute: async (context, params) => {
        // Implementation
      }
    },
    
    'close-sprint': {
      description: 'Close current sprint and handle incomplete items',
      parameters: {
        moveIncomplete: { type: 'boolean', default: true }
      },
      execute: async (context, params) => {
        // Implementation
      }
    }
  }
};
```

### 4. Context-Aware Execution

```typescript
interface ExecutionContext {
  user: {
    id: number;
    role: string;
    teams: Team[];
    projects: Project[];
  };
  workspace: {
    currentProject?: Project;
    currentIteration?: Iteration;
    recentEntities: Entity[];
  };
  personality: PersonalityMode;
  conversation: {
    mentionedEntities: Entity[];
    intent: string;
  };
}
```

## Implementation Roadmap

### Phase 1: Foundation
1. Create personality configuration system
2. Implement feature registry
3. Build context management
4. Create role-based tool filtering

### Phase 2: Core Semantic Operations
1. Implement developer operations
   - show-my-tasks
   - start-working-on
   - complete-task
   - log-progress
2. Implement product owner operations
   - manage-backlog
   - prioritize-features
   - plan-iteration

### Phase 3: Advanced Workflows
1. Sprint management workflows
2. Reporting and analytics
3. Team collaboration features
4. Bulk operations

### Phase 4: Intelligence Layer
1. Context inference
2. Smart suggestions
3. Workflow optimization
4. Natural language understanding

## Architectural Pattern: Composable Workflows with Semantic Hints

The architecture combines two powerful patterns from the WordPress MCP:

### 1. Externalized Personality Configuration
- `personalities.json` defines which tools are available to each role
- Acts as a **composition layer** for assembling role-specific toolkits
- Easily remixable - change the configuration to create new workflows

### 2. Self-Describing Tools with Semantic Hints
- Each tool returns `nextSteps` (workflow guidance) and `suggestions` (specific operations)
- Tools **teach their own usage** through contextual hints
- Workflows **emerge naturally** from tool combinations rather than being hardcoded

### The Composable System

This creates a system where:
- **Patterns are discoverable** - Tools guide users through workflows via hints
- **Workflows are emergent** - Not hardcoded but arise from tool combinations  
- **Remixing is natural** - Change personalities.json to create new workflow combinations
- **Context drives behavior** - Same tools behave differently based on role/state

It's like having **LEGO blocks that come with assembly suggestions** - each piece knows what it connects to, but you can still build whatever you want.

Example flow:
```json
// personalities.json defines the toolkit
"product-owner": {
  "features": ["manage-backlog", "prioritize-features", "plan-iterations"]
}

// Each tool provides its own workflow hints
"manage-backlog" returns:
  nextSteps: ["Review customer feedback", "Prioritize based on business value"]
  suggestions: ["prioritize-features", "plan-next-sprint"]

// The AI/user follows the natural flow
```

The same tool can participate in different workflows depending on who's using it and what state they're in. It's a **pattern language that teaches itself through use**.

## Benefits of This Approach

1. **Reduced Cognitive Load**: AI agents don't need to understand Targetprocess's data model
2. **Better Security**: Role-based access control at the semantic level
3. **Improved UX**: Operations match how users think about their work
4. **Easier Maintenance**: Modular features can be updated independently
5. **Extensibility**: New personalities and features can be added without breaking existing ones
6. **Self-Documenting Workflows**: Tools teach users the process through semantic hints
7. **Emergent Intelligence**: Complex workflows arise from simple tool combinations

## Example: Complete Workflow

```typescript
// User: "I need to start working on the authentication feature"
// AI understands intent and executes:

const workflow = await executeWorkflow('start-feature-development', {
  context: executionContext,
  params: {
    featureName: 'authentication',
    inferFromContext: true
  }
});

// This semantic operation:
// 1. Searches for features matching "authentication"
// 2. Checks if user has permission
// 3. Updates feature state to "In Development"
// 4. Assigns to current user
// 5. Creates development tasks if needed
// 6. Notifies team members
// 7. Returns comprehensive status
```

## Next Steps

1. Review and refine personality modes based on actual Targetprocess usage patterns
2. Define comprehensive semantic operation catalog
3. Design feature module template
4. Create migration plan from current architecture
5. Build proof-of-concept for one personality mode

This architecture will transform the Targetprocess MCP from a technical API wrapper into an intelligent assistant that understands project management workflows and team dynamics.