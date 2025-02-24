# Development Memory

## Development Resources

### Documentation Search (2024-02-24)
The repository includes a documentation scraper/searcher for Targetprocess developer documentation as a submodule (`resources/target-process-docs`). This tool provides a local search interface for quickly finding relevant documentation.

To use:
1. Ensure the submodule is initialized: `git submodule update --init`
2. Navigate to the docs directory: `cd resources/target-process-docs`
3. Install dependencies: `npm install`
4. Start the search server: `npm start`

This tool is particularly useful when:
- Implementing new API integrations
- Understanding TargetProcess entity relationships
- Looking up API endpoints and parameters
- Researching TargetProcess features and capabilities

## Modular Architecture Refactoring (2024-02-24)

### Context
The original implementation had all functionality in a single `index.ts` file, which would have become difficult to maintain as we add more features and complexity. We needed to ensure the codebase could grow in a maintainable way.

### Changes Made

1. **Entity Layer Implementation**
   - Created base entity types that mirror TargetProcess's entity hierarchy
   - Implemented proper inheritance chain (GeneralEntity → AssignableEntity → specific entities)
   - Added type-safe interfaces for entity data

2. **API Layer Restructuring**
   - Created dedicated service layer for API interactions
   - Implemented proper request/response types
   - Added error handling and type safety
   - Separated API concerns from business logic

3. **Tool Layer Modularization**
   - Split tools into separate modules (search, get, create, update)
   - Added input validation using Zod schemas
   - Improved error handling and type safety
   - Made tools more maintainable and testable

### Technical Decisions

1. **File Structure**
   - Organized by domain concepts rather than technical types
   - Each module has its own directory with related files
   - Clear separation between entities, API, and tools

2. **Type Safety**
   - Used TypeScript interfaces to model API data structures
   - Added Zod schemas for runtime validation
   - Proper error handling with specific error types

3. **Module Resolution**
   - Using Node16 module resolution
   - Explicit file extensions for imports
   - Proper path aliases and relative imports

### Future Considerations

1. **Testing**
   - Each module is now easily testable in isolation
   - Can add unit tests for entities, services, and tools
   - Can mock API responses for testing tools

2. **Extensibility**
   - Easy to add new entity types
   - Can extend API functionality without touching existing code
   - Tool implementations can be modified independently

3. **Documentation**
   - Architecture is documented in ARCHITECTURE.md
   - Each module has its own documentation
   - Clear patterns for adding new features

## Query System Improvements (2024-02-24)

### Context
The original query implementation had several limitations and didn't fully support TargetProcess's query capabilities. We needed to improve query handling to better match the API's requirements and support more complex use cases.

### Changes Made

1. **Query Validation and Formatting**
   - Added proper validation for where clauses
   - Implemented case-sensitive string handling
   - Added support for all TargetProcess operators (Contains, In list, etc.)
   - Improved handling of custom fields with cf_ prefix

2. **Error Handling**
   - Added retry logic with exponential backoff
   - Improved error message extraction from API responses
   - Added validation before API calls to catch issues early
   - Better handling of 400/401 errors

3. **Type Safety**
   - Changed any to unknown for better type safety
   - Added proper type checking for query parameters
   - Improved TypeScript definitions for query methods

### Technical Decisions

1. **Query Processing**
   - Split query handling into discrete steps (validate, format, execute)
   - Added proper escaping for special characters
   - Implemented proper date and boolean value formatting
   - Added support for complex conditions with and/or operators

2. **Error Handling**
   - Don't retry on 400 (bad request) or 401 (unauthorized)
   - Use exponential backoff for retries
   - Extract detailed error messages from API responses
   - Proper error propagation with McpError types

3. **Code Organization**
   - Removed separate helper file in favor of integrated functionality
   - Kept all query logic in TPService for better cohesion
   - Added clear documentation for query methods

### Commit Message

```
feat: improve query system and error handling

- Add support for all TargetProcess query operators
- Implement retry logic with exponential backoff
- Add proper validation and formatting for queries
- Improve error handling and type safety
- Remove query helper in favor of integrated functionality

This update improves the reliability and capabilities of
the query system while maintaining clean code organization
and type safety.
```

### Commit Message

```
refactor: implement modular architecture

- Split monolithic index.ts into modular components
- Create proper entity hierarchy matching TargetProcess API
- Add type-safe API layer with proper error handling
- Implement modular tool system with validation
- Add architecture and development documentation

This refactoring improves maintainability, testability, and
extensibility of the codebase by properly separating concerns
and implementing clear patterns for future development.
