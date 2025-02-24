# Target Process MCP Server - TODO

## Completed
- [x] Created basic TypeScript MCP server structure
- [x] Implemented core entity operations:
  - Search entities with filtering and includes
  - Get entity details
  - Create new entities
  - Update existing entities
- [x] Added input validation using Zod schemas
- [x] Implemented error handling for API responses

## To Do
- [ ] Configuration
  - Need Target Process URL
  - Need access token for authentication
  - Add to MCP settings file with environment variables
- [ ] Testing
  - Test each operation with real Target Process instance
  - Verify error handling
  - Test pagination and filtering
- [ ] Additional Features
  - Add support for custom fields
  - Add bulk operations
  - Add comment operations
  - Add time tracking operations
- [ ] Documentation
  - Add setup instructions
  - Document available operations
  - Add example queries
  - Document error handling

## Setup Instructions (Draft)
1. Generate Target Process access token:
   - Go to Settings > Access Tokens
   - Click "Add Access Token"
   - Name it (e.g., "MCP Integration")
   - Copy the generated token
2. Add server configuration to MCP settings:
   ```json
   {
     "mcpServers": {
       "target-process": {
         "command": "node",
         "args": ["/path/to/target-process-server/build/index.js"],
         "env": {
           "TARGET_PROCESS_URL": "https://company.tpondemand.com",
           "TARGET_PROCESS_TOKEN": "your-access-token"
         },
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

## Example Usage (Draft)
```typescript
// Search for user stories
{
  "type": "UserStory",
  "where": "Project.Id eq 123",
  "include": ["Project", "Team", "AssignedUser"],
  "take": 10,
  "orderBy": ["CreateDate desc"]
}

// Create a bug
{
  "type": "Bug",
  "name": "Critical issue with login",
  "description": "Users unable to log in after password reset",
  "project": { "id": 123 },
  "team": { "id": 456 }
}

// Update status
{
  "type": "UserStory",
  "id": 789,
  "fields": {
    "status": { "id": 321 },
    "assignedUser": { "id": 654 }
  }
}
