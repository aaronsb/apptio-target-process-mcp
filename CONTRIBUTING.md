# Contributing to Targetprocess MCP Server

Welcome to the Targetprocess MCP Server project! 🎯

This project goes beyond simple API wrappers - we're building intelligent, context-aware workflows that understand how people actually work. Your contributions should enhance this intelligence, not just add features.

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Contribution Guidelines](#contribution-guidelines)
- [Code Style and Standards](#code-style-and-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Examples](#examples)

## Getting Started

### Development Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/aaronsb/apptio-target-process-mcp.git
   cd apptio-target-process-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your environment**
   ```bash
   # Copy the example config
   cp .env.example .env
   
   # Edit with your Targetprocess credentials
   # IMPORTANT: Set TP_USER_ROLE to test different personas
   ```

4. **Build and test**
   ```bash
   npm run build
   npm run test
   npm run lint
   ```

5. **Run the MCP inspector** (for interactive testing)
   ```bash
   npm run inspector
   ```

6. **Initialize documentation search** (optional but recommended)
   ```bash
   pushd resources/target-process-docs && npm install && ./refresh-docs.sh && popd
   ```

## Architecture Overview

Before contributing, please read our [Architecture Documentation](docs/ARCHITECTURE.md) to understand:
- The three-layer architecture (Entities, API, Tools)
- **Semantic Operations Philosophy** - Our core approach to building intelligent workflows
- Role-based operation filtering
- Dynamic discovery patterns

### Understanding Semantic Operations is Critical

This project's core innovation is **semantic operations** - intelligent, context-aware workflows that understand how people actually work. Before writing any code:

1. **Read the [Semantic Operations Documentation](docs/semantic-operations/README.md)** to understand the philosophy and patterns
2. **Review role-specific examples** in the semantic operations directory
3. **Understand the difference** between raw tools (simple API wrappers) and semantic operations (intelligent workflows)

**Key principle**: We build tools that understand context and adapt to how users work, not just expose API endpoints. Semantic operations are how we achieve this.

## Contribution Guidelines

### 1. Understand Semantic Operations First

Before writing any code, ask yourself:
- **Is this a workflow that benefits from intelligence?** → Create a semantic operation
- **Is this a low-level utility?** → Create a raw tool
- **Does this vary by user role?** → Make it role-aware

### 2. When to Create Semantic Operations vs Raw Tools

**Create a Semantic Operation when:**
- The task involves multiple steps or decisions
- Different roles would approach it differently
- Context from previous actions matters
- You need to discover capabilities dynamically
- The operation benefits from intelligent error recovery

**Create a Raw Tool when:**
- It's a simple, atomic operation
- The behavior is identical for all users
- It's a utility function (like `inspect_object`)
- It provides foundational capabilities for semantic operations

### 3. Role-Based Filtering is Essential

Our users have different needs:
- **Developers**: Focus on tasks, bugs, and time tracking
- **Project Managers**: Focus on planning, reporting, and team coordination
- **Testers**: Focus on test cases, bug verification, and quality metrics

Your contribution should respect these differences:
```typescript
// Good: Role-aware operation
if (this.context.userRole === 'developer') {
  return this.getDeveloperFocusedView();
}

// Bad: One-size-fits-all
return this.getAllData(); // Overwhelming and not helpful
```

### 4. Dynamic Discovery Over Hard-Coded Assumptions

Never assume:
- Entity state names (discover them!)
- Field availability (check first!)
- Workflow transitions (query the API!)

```typescript
// Good: Dynamic discovery
const states = await this.discoverEntityStates('Task');
const inProgressState = states.find(s => 
  s.name.toLowerCase().includes('progress')
);

// Bad: Hard-coded assumption
const inProgressStateId = 45; // Will break in other environments!
```

### 5. Context is King

Every operation should consider:
- What the user is trying to achieve (intent)
- What they've done before (history)
- What they'll likely do next (workflow)
- How to help when things go wrong (recovery)

## Code Style and Standards

### Semantic Operation Patterns

Follow the established pattern for semantic operations:

```typescript
export class MyWorkflowOperation extends SemanticOperation<MyParams> {
  async execute(params: MyParams): Promise<MyResult> {
    try {
      // 1. Validate and understand intent
      const context = await this.buildContext(params);
      
      // 2. Discover capabilities dynamically
      const capabilities = await this.discoverCapabilities();
      
      // 3. Execute with intelligence
      const result = await this.performOperation(context, capabilities);
      
      // 4. Provide helpful context in response
      return this.formatResultWithContext(result);
      
    } catch (error) {
      // 5. Intelligent error handling
      return this.handleErrorWithGuidance(error);
    }
  }
}
```

### Error Handling with Context

Errors should guide users, not just report failures:

```typescript
// Good: Contextual error handling
catch (error) {
  if (error.code === 'STATE_TRANSITION_INVALID') {
    const validTransitions = await this.getValidTransitions();
    throw new McpError(
      'INVALID_REQUEST',
      `Cannot transition to that state. Valid transitions: ${validTransitions.join(', ')}. ` +
      `Try 'In Progress' first.`
    );
  }
}

// Bad: Generic error
catch (error) {
  throw new Error('Operation failed');
}
```

### Type Safety and Validation

- Use TypeScript's type system fully
- Validate with Zod schemas at boundaries
- Prefer `unknown` over `any`
- Model domain concepts as types

## Pull Request Process

### Before Submitting

1. **Run all checks locally**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

2. **Test with different roles**
   ```bash
   TP_USER_ROLE=developer npm run inspector
   TP_USER_ROLE=project-manager npm run inspector
   ```

3. **Update documentation** if you've added new operations or changed behavior

### PR Checklist

Your PR description should address:

- [ ] **Have you read the [Semantic Operations Documentation](docs/semantic-operations/README.md)?**
  - This is required reading before any contribution
  - Understand the philosophy before writing code

- [ ] **Have you considered if this should be a semantic operation?**
  - If it's a workflow, it probably should be
  - If it adapts to context, it definitely should be
  - Refer to the semantic operations docs for guidance

- [ ] **Is this operation role-aware if appropriate?**
  - Does it filter/adapt based on user role?
  - Have you tested with different roles?

- [ ] **Does this follow dynamic discovery patterns?**
  - No hard-coded IDs or state names
  - Discovers capabilities at runtime
  - Handles discovery failures gracefully

- [ ] **Does error handling provide actionable guidance?**
  - Users know what went wrong
  - Users know how to fix it
  - Fallback options are provided

- [ ] **Have you added appropriate tests?**
  - Unit tests for logic
  - Integration tests for workflows
  - Role-based behavior tests

- [ ] **Is the code self-documenting?**
  - Clear intent in naming
  - Comments explain "why" not "what"
  - Complex logic is extracted and named

### PR Title Format

Use conventional commits:
- `feat(semantic): add smart task prioritization`
- `fix(discovery): handle missing entity states`
- `docs: update semantic operation examples`
- `refactor(roles): extract role detection logic`

## Testing Requirements

### Testing Semantic Operations

1. **Test the happy path** - Normal workflow execution
2. **Test role variations** - Different behavior per role
3. **Test discovery failures** - When API doesn't provide expected data
4. **Test error scenarios** - With helpful recovery paths

Example test structure:
```typescript
describe('StartWorkingOn', () => {
  it('should discover and use correct in-progress state', async () => {
    // Mock dynamic discovery
    mockDiscoverStates.mockResolvedValue([
      { id: 1, name: 'Open' },
      { id: 2, name: 'In Progress' }
    ]);
    
    const result = await operation.execute({ taskId: 123 });
    
    expect(mockUpdateEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        entityState: { id: 2 } // Discovered, not hard-coded!
      })
    );
  });
  
  it('should handle missing in-progress state gracefully', async () => {
    mockDiscoverStates.mockResolvedValue([
      { id: 1, name: 'Open' },
      { id: 3, name: 'Done' }
    ]);
    
    const result = await operation.execute({ taskId: 123 });
    
    expect(result.message).toContain('manual state update may be needed');
  });
});
```

### Testing with Different Roles

```typescript
describe.each(['developer', 'project-manager', 'tester'])('as %s', (role) => {
  beforeEach(() => {
    context.userRole = role;
  });
  
  it('should provide role-appropriate operations', async () => {
    const operations = await getAvailableOperations(context);
    
    if (role === 'developer') {
      expect(operations).toContain('start_working_on');
      expect(operations).not.toContain('approve_release');
    }
    // ... role-specific assertions
  });
});
```

## Examples

### Good Contribution: Smart Comment System

```typescript
// Semantic operation that understands context
export class AddCommentOperation extends SemanticOperation<AddCommentParams> {
  async execute(params: AddCommentParams): Promise<Result> {
    // Discovers entity type and current state
    const entity = await this.getEntity(params.entityId);
    
    // Adds contextual information
    const enrichedComment = this.enrichComment(params.comment, {
      mentionSuggestions: await this.suggestMentions(entity),
      statusContext: this.getStatusContext(entity),
      relatedItems: await this.findRelatedItems(entity)
    });
    
    // Handles based on entity type and state
    const result = await this.postComment(enrichedComment);
    
    // Suggests next actions
    return {
      ...result,
      suggestions: this.getNextActionSuggestions(entity, result)
    };
  }
}
```

### Problematic Contribution: Hard-Coded State Updater

```typescript
// Raw API wrapper with hard-coded assumptions
export function updateTaskStatus(taskId: number, status: string) {
  // Hard-coded state IDs - will break!
  const stateMap = {
    'open': 123,
    'in-progress': 456,
    'done': 789
  };
  
  // No role awareness
  // No error guidance
  // No context understanding
  
  return api.update(`/Task/${taskId}`, {
    EntityState: { Id: stateMap[status] }
  });
}
```

### Good Test Example

```typescript
it('should adapt search behavior to user role', async () => {
  const developer = new SearchContext({ role: 'developer' });
  const manager = new SearchContext({ role: 'project-manager' });
  
  const devResults = await search.execute({ query: 'urgent' }, developer);
  const mgrResults = await search.execute({ query: 'urgent' }, manager);
  
  // Developer sees their assigned urgent tasks
  expect(devResults.every(r => r.assignedTo === developer.userId)).toBe(true);
  
  // Manager sees team-wide urgent items
  expect(mgrResults.some(r => r.assignedTo !== manager.userId)).toBe(true);
});
```

## Questions or Need Help?

- Check existing issues and PRs for similar work
- Read the architecture documentation thoroughly
- Ask questions in PR discussions - we're here to help!
- When in doubt, prototype as a semantic operation

Remember: We're building tools that understand how people work, not just what APIs can do. Your contribution should make someone's workday a little bit easier and a lot more intelligent.

Thank you for contributing to making project management more intelligent! 🚀