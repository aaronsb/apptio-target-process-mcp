# TargetProcess API Integration

A TypeScript implementation for interacting with TargetProcess API using the [NewOrbit TargetProcess REST API](https://github.com/NewOrbit/targetprocess-rest-api) library.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your TargetProcess credentials:
```typescript
const domain = 'your-subdomain'; // e.g., 'cprimedgonzalesdemo'
const username = 'System';
const password = 'your-password';
```

## Usage

The implementation uses the NewOrbit TypeScript wrapper which provides a clean interface to the TargetProcess API:

```typescript
import { Targetprocess } from "targetprocess-rest-api";

// Initialize the API client
const api = new Targetprocess(domain, username, password);

// Get a user story
const story = await api.getStory(storyId);

// Get a task
const task = await api.getTask(taskId);

// Get a bug
const bug = await api.getBug(bugId);

// Add time entry
const time = await api.addTime(
  entityId,
  spent,    // hours spent
  remain,   // hours remaining
  date,     // Date object
  description
);
```

## Example Implementation

See `src/test-targetprocess.ts` for a working example that demonstrates:
- Listing user stories
- Retrieving specific story details
- Adding time entries
- Error handling
- Response formatting

## API Features

The NewOrbit library provides access to core TargetProcess functionality:

1. Entity Retrieval
   - User Stories
   - Tasks
   - Bugs

2. Time Management
   - Add time entries to entities
   - Track spent/remaining time

3. Error Handling
   - Status code based errors
   - Descriptive error messages

## Development

Build the TypeScript files:
```bash
npm run build
```

Run the example implementation:
```bash
node build/test-targetprocess.js
```

## Notes

- The library handles authentication and request formatting
- Responses are automatically parsed from JSON
- Error handling includes HTTP status codes and messages
- Time entries may require specific permissions in TargetProcess
