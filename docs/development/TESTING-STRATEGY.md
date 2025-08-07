# Testing Strategy

This document outlines the functional test coverage approach developed for the TargetProcess MCP Server.

## Philosophy: Functional Over Percentage-Based Coverage

**Focus**: Test key MCP tool functionality rather than chasing artificial percentage metrics.

### Rationale

Traditional percentage-based test coverage can be misleading because:
- High percentages don't guarantee functional correctness
- Developers may write trivial tests just to hit coverage targets
- Critical user paths might remain untested despite good percentages

**Our approach**: Ensure all **MCP tools and semantic operations** work correctly for real user workflows.

## Test Coverage Status (August 2025)

### ✅ Fully Tested MCP Tools

| Tool | Test File | Status | Notes |
|------|-----------|--------|-------|
| `GetEntityTool` | `get.tool.test.ts` | ✅ 8/8 tests passing | Fixed in PR #198 |
| `SearchTool` | `search.tool.test.ts` | ⚠️ Parameter fixes needed | Similar to GetEntityTool issues |

### ❌ Missing Test Coverage

**High Priority**:
- `CreateEntityTool` - Entity creation validation
- `UpdateEntityTool` - Entity modification workflows  
- `CommentTool` - Unified comment operations
- `InspectTool` - API introspection functionality

**Medium Priority**:
- Pagination tools (`ShowAllTool`, `ShowMoreTool`)
- Most semantic operations (complete-task, log-time, show-my-bugs, etc.)

**Low Priority**:
- Internal utilities and helpers
- Configuration loaders

### ✅ Well-Tested Components

- **TPService** (`tp.service.test.ts`) - API client functionality
- **Comment Operations** - Add, show, delete semantic operations
- **Core Server** (`targetprocess.test.ts`) - MCP server initialization

## Testing Approach: GetEntityTool Example

### Before (PR #198)

```typescript
// WRONG: Using incorrect parameter names
const result = await getTool.execute({
  entityType: 'UserStory',  // Should be 'type'
  id: 123,
  include: 'Project,User'   // Should be array
});

// WRONG: Testing wrong format
expect(result.Project).toBeDefined();  // Tool returns MCP format
```

**Result**: 3/8 tests failing, no confidence in tool functionality

### After (PR #198) 

```typescript
// CORRECT: Using actual tool parameters
const result = await getTool.execute({
  type: 'UserStory',           // Correct parameter name
  id: 123,
  include: ['Project', 'User'] // Correct array format  
});

// CORRECT: Testing actual tool output
expect(result.content[0].text).toContain('Test Story');
```

**Result**: 8/8 tests passing, validates real MCP tool behavior

## Implementation Guidelines

### 1. Test Real Tool Behavior

```typescript
// ✅ Good: Test actual MCP tool interface
const result = await tool.execute(validMCPParameters);
expect(result.content[0].text).toContain(expectedData);

// ❌ Bad: Test internal implementation details  
expect(tool.internalMethod()).toBeDefined();
```

### 2. Use Realistic Test Data

```typescript
// ✅ Good: Test parameters users would actually send
{
  type: 'UserStory',
  id: 12345,
  include: ['Project', 'AssignedUser']
}

// ❌ Bad: Test edge cases that don't reflect real usage
{
  type: undefined,
  id: -1,
  include: 'invalid_string_format'
}
```

### 3. Validate Error Handling

```typescript
// ✅ Good: Test realistic error scenarios
await expect(tool.execute({
  type: 'UserStory', 
  id: 999999  // Entity not found
})).rejects.toThrow('Entity not found');
```

### 4. Mock External Dependencies Appropriately

```typescript
// ✅ Good: Mock the TP API service
mockService.getEntity.mockResolvedValue(mockEntity);

// ❌ Bad: Mock everything (doesn't test real logic)
jest.mock('../../entire-module');
```

## Next Steps for Test Coverage

### Phase 1: Fix Existing Tests
- [ ] Fix SearchTool parameter issues (similar to GetEntityTool)
- [ ] Update API service test expectations
- [ ] Ensure all existing tests pass reliably

### Phase 2: Add Missing Tool Tests  
- [ ] CreateEntityTool tests
- [ ] UpdateEntityTool tests
- [ ] CommentTool tests (unified tool)
- [ ] InspectTool tests

### Phase 3: Semantic Operations Coverage
- [ ] Complete-task operation tests
- [ ] Log-time operation tests  
- [ ] Show-my-bugs operation tests
- [ ] Start-working-on operation tests

### Phase 4: Integration Testing
- [ ] End-to-end MCP tool workflows
- [ ] Multi-tool operation sequences
- [ ] Error recovery testing

## Measuring Success

**Good indicators**:
- All MCP tools have functional tests
- Tests use realistic parameters and data
- Error scenarios are covered
- Tests would catch real user-impacting bugs

**Not the goal**:
- Achieving specific percentage targets
- Testing internal implementation details
- 100% line coverage for its own sake

## Continuous Improvement

This strategy will evolve as we:
1. Add more MCP tools and semantic operations
2. Identify gaps through real usage
3. Learn from user-reported issues
4. Discover additional critical workflows

**Last Updated**: August 2025 (PR #198 - GetEntityTool test coverage restoration)