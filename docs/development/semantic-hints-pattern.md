# Semantic Hints Pattern

Based on analysis of the WordPress MCP implementation, this document explains the **semantic hints pattern** where tools provide contextual guidance for workflow continuation.

## Key Insight

Tools don't just return data - they return **semantic hints** about what to do next. This creates a natural workflow chain without hardcoding sequences.

## Pattern Structure

### 1. Tools Return Semantic Hints

Each tool includes `nextSteps` and/or `suggestions` in its response:

```javascript
// From WordPress MCP - submit-for-review.js
return {
  success: true,
  postId: updatedPost.id,
  title: updatedPost.title.rendered,
  status: updatedPost.status,
  message: `"${updatedPost.title.rendered}" submitted for editorial review`,
  
  // Workflow guidance - what happens next
  nextSteps: [
    'Editors will be notified of your submission',
    'You can check the status using view-editorial-feedback',
    'You may receive feedback or requests for changes',
  ],
};
```

### 2. Two Types of Hints

#### `nextSteps` - Workflow Guidance
- General guidance about the workflow
- Educational hints about what happens next
- Process-oriented suggestions

#### `suggestions` - Specific Operations
- Concrete operations the user can execute
- Include relevant IDs and context
- Action-oriented commands

### 3. Context-Aware Generation

Hints are generated based on:
- Current state of entities
- User's role/personality
- Previous operations
- Business rules

## Implementation in Targetprocess MCP

### Example: show-my-tasks Operation

```typescript
return {
  content: [...],
  
  // Workflow guidance based on state
  nextSteps: [
    'Focus on high-priority items first',
    'Consider completing some in-progress tasks before starting new ones',
    'Address blocked items or escalate impediments'
  ],
  
  // Specific executable suggestions
  suggestions: [
    'start-working-on 12345 # Authentication Feature',
    'update-progress 12346 # Been in progress for 5 days',
    'resolve-blocker 12347',
    'log-time 12345'
  ]
};
```

### Benefits of This Pattern

1. **Natural Workflow Discovery**
   - Users learn the system through use
   - AI agents can follow logical workflows
   - No need to document every possible sequence

2. **Dynamic Adaptation**
   - Hints change based on current state
   - Personalized to user's role
   - Responds to business context

3. **Decoupled Architecture**
   - Tools don't need to know about each other
   - Workflows emerge from individual tool hints
   - Easy to add new tools without breaking flows

4. **AI-Friendly**
   - LLMs can parse and suggest next actions
   - Creates conversational flow
   - Reduces need for complex prompting

## Implementation Guidelines

### 1. Every Tool Should Provide Hints

```typescript
class SemanticOperation {
  async execute(context, params) {
    // Perform operation...
    
    return {
      // Data results
      data: resultData,
      
      // Always include hints
      nextSteps: this.generateNextSteps(resultData, context),
      suggestions: this.generateSuggestions(resultData, context)
    };
  }
}
```

### 2. Make Hints Contextual

```typescript
private generateNextSteps(result, context) {
  const steps = [];
  
  if (result.status === 'blocked') {
    steps.push('Identify and communicate the blocker to your team lead');
    steps.push('Consider working on other tasks while blocked');
  }
  
  if (context.personality === 'developer') {
    steps.push('Update your progress in the daily standup');
  } else if (context.personality === 'scrum-master') {
    steps.push('Review team impediments in the impediment board');
  }
  
  return steps;
}
```

### 3. Include Actionable Suggestions

```typescript
private generateSuggestions(result, context) {
  const suggestions = [];
  
  // Include IDs and context
  suggestions.push(`complete-task ${result.taskId} # Ready for review`);
  
  // Add helpful context as comments
  suggestions.push(`start-working-on ${result.nextTaskId} # High priority`);
  
  // Chain related operations
  if (result.requiresTimeLog) {
    suggestions.push(`log-time ${result.taskId} # Don't forget to log your hours`);
  }
  
  return suggestions;
}
```

## Personality Integration

The personality system filters available tools, but tools provide hints about what's possible within that personality:

```typescript
// Contributor personality sees:
nextSteps: [
  'Submit your draft for review when ready',
  'You can save and continue editing later'
]

// Editor personality sees:
nextSteps: [
  'Review pending submissions',
  'Publish approved content',
  'Provide feedback to contributors'
]
```

## Example Workflow Chain

```
User: "Show my tasks"
├─→ Response includes suggestions:
│   - "start-working-on 123 # Payment Integration"
│
User: "start-working-on 123"
├─→ Response includes nextSteps:
│   - "Break down the task into subtasks if needed"
│   - "Set up your development environment"
│   - suggestions: ["create-subtask 123", "update-progress 123"]
│
User: "create-subtask 123"
├─→ Response includes nextSteps:
│   - "Assign subtasks to team members"
│   - suggestions: ["assign-task 456 # to John", "estimate-task 456"]
```

## Summary

The semantic hints pattern transforms static tool responses into dynamic workflow guidance. By having each tool suggest what comes next, we create:

1. **Self-documenting workflows** - Tools teach users the process
2. **Emergent patterns** - Workflows arise naturally from tool use
3. **Contextual intelligence** - Hints adapt to current state
4. **AI-friendly interfaces** - LLMs can follow and suggest next steps

This pattern is crucial for creating intuitive, workflow-aware AI tools that guide users through complex processes without rigid programming.