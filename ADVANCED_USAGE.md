# Advanced Usage Patterns for Targetprocess MCP

This document provides detailed examples and guidance for advanced usage patterns with the Targetprocess MCP. It focuses on complex queries, batch operations, performance optimization, and other advanced techniques for working with Targetprocess in enterprise environments.

## Complex Query Patterns

Targetprocess supports a rich query language that allows for complex filtering and data retrieval. Here are some advanced query patterns:

### Nested Conditions

```json
// Find high-priority stories that are either in progress or testing
{
  "type": "UserStory",
  "where": "Priority.Name eq 'High' and (EntityState.Name eq 'In Progress' or EntityState.Name eq 'Testing')",
  "include": ["Project", "Team", "AssignedUser"]
}
```

### Date-Based Queries

```json
// Find items created this month but not yet started
{
  "type": "UserStory",
  "where": "CreateDate gt @StartOfMonth and EntityState.Name eq 'Open'",
  "include": ["Project", "Team"]
}

// Find items that have been in progress for more than 2 weeks
{
  "type": "UserStory",
  "where": "EntityState.Name eq 'In Progress' and StartDate lt @Today-14",
  "include": ["Project", "Team", "AssignedUser"]
}
```

### Custom Field Filtering

```json
// Filter by custom field values
{
  "type": "UserStory",
  "where": "CustomField.RiskLevel eq 'High' and CustomField.BusinessValue gt 8",
  "include": ["Project", "Team"]
}
```

### Relationship-Based Queries

```json
// Find stories with specific related entities
{
  "type": "UserStory",
  "where": "Tasks.Count gt 0 and Bugs.Count eq 0",
  "include": ["Tasks", "Project"]
}

// Find stories related to a specific feature
{
  "type": "UserStory",
  "where": "Feature.Id eq 12345",
  "include": ["Feature", "Project", "Team"]
}
```

### Combining Multiple Conditions

```json
// Complex query combining multiple conditions
{
  "type": "UserStory",
  "where": "Project.Id eq 123 and Team.Id eq 456 and Priority.Name eq 'High' and EntityState.Name ne 'Done' and CreateDate gt '2024-01-01' and AssignedUser is not null",
  "include": ["Project", "Team", "AssignedUser", "Tasks", "Bugs"],
  "orderBy": ["Priority.Importance desc", "CreateDate asc"]
}
```

## Advanced Filtering Techniques

### Text Search

```json
// Search for specific text in name or description
{
  "type": "UserStory",
  "where": "Name contains 'API' or Description contains 'integration'",
  "include": ["Project", "Team"]
}
```

### Numerical Comparisons

```json
// Find stories with effort within a specific range
{
  "type": "UserStory",
  "where": "Effort gt 5 and Effort lt 13",
  "include": ["Project", "Team"]
}
```

### Collection Filtering

```json
// Find projects with more than 10 active stories
{
  "type": "Project",
  "where": "UserStories.Count(EntityState.Name eq 'In Progress') gt 10",
  "include": ["Teams"]
}
```

### Null Checking

```json
// Find stories missing required information
{
  "type": "UserStory",
  "where": "Description is null or Effort is null or AssignedUser is null",
  "include": ["Project", "Team"]
}
```

## Batch Operations

For large-scale operations, batch processing is essential. Here are some patterns for implementing batch operations:

### Batch Updates

```javascript
// Pseudocode for batch updates
async function batchUpdateEntities(entityType, query, updateData) {
  // Get entities to update
  const entities = await searchEntities({
    type: entityType,
    where: query,
    take: 1000
  });
  
  console.log(`Found ${entities.length} entities to update`);
  
  // Process in smaller batches
  const batchSize = 50;
  const batches = [];
  
  for (let i = 0; i < entities.length; i += batchSize) {
    batches.push(entities.slice(i, i + batchSize));
  }
  
  console.log(`Split into ${batches.length} batches of ${batchSize}`);
  
  // Process each batch
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < batches.length; i++) {
    console.log(`Processing batch ${i + 1} of ${batches.length}`);
    
    const batch = batches[i];
    const results = await Promise.allSettled(
      batch.map(entity => updateEntity({
        type: entityType,
        id: entity.Id,
        fields: updateData
      }))
    );
    
    // Count successes and failures
    successCount += results.filter(r => r.status === 'fulfilled').length;
    errorCount += results.filter(r => r.status === 'rejected').length;
    
    // Add delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    total: entities.length,
    success: successCount,
    error: errorCount
  };
}

// Example usage
const result = await batchUpdateEntities(
  'UserStory',
  "Project.Id eq 123 and EntityState.Name eq 'Open'",
  {
    status: {
      id: 456 // ID of "In Progress" state
    }
  }
);
```

### Batch Creation

```javascript
// Pseudocode for batch creation
async function batchCreateEntities(entityType, entities) {
  // Process in smaller batches
  const batchSize = 20;
  const batches = [];
  
  for (let i = 0; i < entities.length; i += batchSize) {
    batches.push(entities.slice(i, i + batchSize));
  }
  
  console.log(`Split ${entities.length} entities into ${batches.length} batches of ${batchSize}`);
  
  // Process each batch
  let successCount = 0;
  let errorCount = 0;
  const createdEntities = [];
  
  for (let i = 0; i < batches.length; i++) {
    console.log(`Processing batch ${i + 1} of ${batches.length}`);
    
    const batch = batches[i];
    const results = await Promise.allSettled(
      batch.map(entity => createEntity({
        type: entityType,
        ...entity
      }))
    );
    
    // Collect results
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        successCount++;
        createdEntities.push(result.value);
      } else {
        errorCount++;
        console.error(`Error creating entity: ${result.reason}`);
      }
    });
    
    // Add delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    total: entities.length,
    success: successCount,
    error: errorCount,
    created: createdEntities
  };
}

// Example usage
const result = await batchCreateEntities('Task', [
  {
    name: 'Task 1',
    description: 'Description for Task 1',
    project: { id: 123 },
    userStory: { id: 456 }
  },
  {
    name: 'Task 2',
    description: 'Description for Task 2',
    project: { id: 123 },
    userStory: { id: 456 }
  }
  // ... more tasks
]);
```

### Batch Deletion

```javascript
// Pseudocode for batch deletion
async function batchDeleteEntities(entityType, query) {
  // Get entities to delete
  const entities = await searchEntities({
    type: entityType,
    where: query,
    take: 1000
  });
  
  console.log(`Found ${entities.length} entities to delete`);
  
  // Process in smaller batches
  const batchSize = 20;
  const batches = [];
  
  for (let i = 0; i < entities.length; i += batchSize) {
    batches.push(entities.slice(i, i + batchSize));
  }
  
  console.log(`Split into ${batches.length} batches of ${batchSize}`);
  
  // Process each batch
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < batches.length; i++) {
    console.log(`Processing batch ${i + 1} of ${batches.length}`);
    
    const batch = batches[i];
    const results = await Promise.allSettled(
      batch.map(entity => deleteEntity({
        type: entityType,
        id: entity.Id
      }))
    );
    
    // Count successes and failures
    successCount += results.filter(r => r.status === 'fulfilled').length;
    errorCount += results.filter(r => r.status === 'rejected').length;
    
    // Add delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    total: entities.length,
    success: successCount,
    error: errorCount
  };
}

// Example usage
const result = await batchDeleteEntities(
  'Task',
  "UserStory.Id eq 456 and EntityState.Name eq 'Done'"
);
```

## Performance Optimization

When working with large Targetprocess instances, performance optimization is crucial. Here are some techniques:

### Query Optimization

```javascript
// Optimize queries by limiting fields and results
async function optimizedQuery(entityType, query, fields) {
  // Only include the fields you need
  const include = fields || [];
  
  // Limit the number of results
  const take = 100;
  
  // Use specific where clause
  const where = query || "CreateDate gt @Today-30";
  
  return await searchEntities({
    type: entityType,
    where,
    include,
    take
  });
}
```

### Caching

```javascript
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function cachedQuery(entityType, query, include) {
  const cacheKey = `${entityType}:${query}:${include.join(',')}`;
  
  // Check if we have a valid cache entry
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_TTL) {
      console.log(`Cache hit for ${cacheKey}, age: ${age}ms`);
      return data;
    }
    
    console.log(`Cache expired for ${cacheKey}, age: ${age}ms`);
  }
  
  // Fetch fresh data
  console.log(`Cache miss for ${cacheKey}, fetching fresh data`);
  const data = await searchEntities({
    type: entityType,
    where: query,
    include
  });
  
  // Update cache
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}
```

### Parallel Processing

```javascript
// Process multiple queries in parallel
async function parallelQueries(queries) {
  const results = await Promise.all(
    queries.map(query => searchEntities({
      type: query.type,
      where: query.where,
      include: query.include,
      take: query.take || 100
    }))
  );
  
  return queries.reduce((acc, query, index) => {
    acc[query.name] = results[index];
    return acc;
  }, {});
}

// Example usage
const dashboardData = await parallelQueries([
  { name: 'openStories', type: 'UserStory', where: "EntityState.Name eq 'Open'", take: 50 },
  { name: 'inProgressStories', type: 'UserStory', where: "EntityState.Name eq 'In Progress'", take: 50 },
  { name: 'openBugs', type: 'Bug', where: "EntityState.Name eq 'Open'", take: 50 },
  { name: 'teamLoad', type: 'Team', include: ['AssignedUserStories', 'AssignedTasks'] }
]);
```

### Incremental Processing

```javascript
// Process large datasets incrementally
async function incrementalProcessing(entityType, query, processor, batchSize = 100) {
  let skip = 0;
  let hasMore = true;
  let totalProcessed = 0;
  
  while (hasMore) {
    console.log(`Processing batch starting at offset ${skip}`);
    
    const batch = await searchEntities({
      type: entityType,
      where: query,
      take: batchSize,
      skip
    });
    
    if (batch.length === 0) {
      hasMore = false;
      continue;
    }
    
    // Process this batch
    await processor(batch);
    
    totalProcessed += batch.length;
    console.log(`Processed ${totalProcessed} entities so far`);
    
    // Check if we need to continue
    if (batch.length < batchSize) {
      hasMore = false;
    } else {
      skip += batchSize;
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return totalProcessed;
}

// Example usage
const totalProcessed = await incrementalProcessing(
  'UserStory',
  "Project.Id eq 123",
  async (batch) => {
    // Process each batch (e.g., export to CSV, update database, etc.)
    console.log(`Processing ${batch.length} stories`);
    
    // Example: Export to CSV
    await appendToCSV('stories.csv', batch);
  }
);
```

## Advanced Entity Relationships

Understanding and working with entity relationships is crucial for advanced usage:

### Hierarchical Relationships

```javascript
// Get a complete hierarchy of entities
async function getEntityHierarchy(entityType, entityId, levels = 3) {
  const hierarchy = {
    entity: null,
    children: [],
    parents: []
  };
  
  // Get the entity itself with includes
  hierarchy.entity = await getEntity({
    type: entityType,
    id: entityId,
    include: ['Project', 'Team', 'Feature', 'Epic', 'Release']
  });
  
  // Get children based on entity type
  if (levels > 0) {
    switch (entityType) {
      case 'Epic':
        // Epics contain Features
        const features = await searchEntities({
          type: 'Feature',
          where: `Epic.Id eq ${entityId}`
        });
        
        // For each Feature, get its User Stories
        hierarchy.children = await Promise.all(
          features.map(feature => getEntityHierarchy('Feature', feature.Id, levels - 1))
        );
        break;
        
      case 'Feature':
        // Features contain User Stories
        const userStories = await searchEntities({
          type: 'UserStory',
          where: `Feature.Id eq ${entityId}`
        });
        
        // For each User Story, get its Tasks and Bugs
        hierarchy.children = await Promise.all(
          userStories.map(story => getEntityHierarchy('UserStory', story.Id, levels - 1))
        );
        break;
        
      case 'UserStory':
        // User Stories contain Tasks and Bugs
        const [tasks, bugs] = await Promise.all([
          searchEntities({
            type: 'Task',
            where: `UserStory.Id eq ${entityId}`
          }),
          searchEntities({
            type: 'Bug',
            where: `UserStory.Id eq ${entityId}`
          })
        ]);
        
        hierarchy.children = [
          ...tasks.map(task => ({ entity: task, children: [], parents: [] })),
          ...bugs.map(bug => ({ entity: bug, children: [], parents: [] }))
        ];
        break;
    }
  }
  
  return hierarchy;
}
```

### Cross-Entity Analysis

```javascript
// Analyze relationships across different entity types
async function analyzeEntityRelationships(projectId) {
  // Get all entities for the project
  const [epics, features, userStories, tasks, bugs] = await Promise.all([
    searchEntities({
      type: 'Epic',
      where: `Project.Id eq ${projectId}`,
      include: ['Project', 'Release']
    }),
    searchEntities({
      type: 'Feature',
      where: `Project.Id eq ${projectId}`,
      include: ['Project', 'Epic', 'Release']
    }),
    searchEntities({
      type: 'UserStory',
      where: `Project.Id eq ${projectId}`,
      include: ['Project', 'Feature', 'Team', 'Release']
    }),
    searchEntities({
      type: 'Task',
      where: `Project.Id eq ${projectId}`,
      include: ['UserStory', 'AssignedUser']
    }),
    searchEntities({
      type: 'Bug',
      where: `Project.Id eq ${projectId}`,
      include: ['UserStory', 'AssignedUser']
    })
  ]);
  
  // Build relationship maps
  const epicMap = new Map(epics.map(epic => [epic.Id, epic]));
  const featureMap = new Map(features.map(feature => [feature.Id, feature]));
  const storyMap = new Map(userStories.map(story => [story.Id, story]));
  
  // Analyze feature distribution across epics
  const featuresByEpic = features.reduce((acc, feature) => {
    const epicId = feature.Epic?.Id;
    if (epicId) {
      if (!acc[epicId]) {
        acc[epicId] = [];
      }
      acc[epicId].push(feature);
    }
    return acc;
  }, {});
  
  // Analyze story distribution across features
  const storiesByFeature = userStories.reduce((acc, story) => {
    const featureId = story.Feature?.Id;
    if (featureId) {
      if (!acc[featureId]) {
        acc[featureId] = [];
      }
      acc[featureId].push(story);
    }
    return acc;
  }, {});
  
  // Analyze task and bug distribution across stories
  const tasksByStory = tasks.reduce((acc, task) => {
    const storyId = task.UserStory?.Id;
    if (storyId) {
      if (!acc[storyId]) {
        acc[storyId] = [];
      }
      acc[storyId].push(task);
    }
    return acc;
  }, {});
  
  const bugsByStory = bugs.reduce((acc, bug) => {
    const storyId = bug.UserStory?.Id;
    if (storyId) {
      if (!acc[storyId]) {
        acc[storyId] = [];
      }
      acc[storyId].push(bug);
    }
    return acc;
  }, {});
  
  return {
    summary: {
      epicCount: epics.length,
      featureCount: features.length,
      storyCount: userStories.length,
      taskCount: tasks.length,
      bugCount: bugs.length
    },
    distribution: {
      featuresByEpic,
      storiesByFeature,
      tasksByStory,
      bugsByStory
    },
    orphans: {
      featuresWithoutEpic: features.filter(f => !f.Epic?.Id),
      storiesWithoutFeature: userStories.filter(s => !s.Feature?.Id),
      tasksWithoutStory: tasks.filter(t => !t.UserStory?.Id),
      bugsWithoutStory: bugs.filter(b => !b.UserStory?.Id)
    }
  };
}
```

## Custom Field Management

Working with custom fields requires special handling:

### Reading Custom Fields

```javascript
// Extract custom fields from an entity
function extractCustomFields(entity) {
  const customFields = {};
  
  if (entity.CustomFields) {
    Object.entries(entity.CustomFields).forEach(([key, value]) => {
      customFields[key] = value;
    });
  }
  
  return customFields;
}

// Example usage
const userStories = await searchEntities({
  type: 'UserStory',
  where: "Project.Id eq 123",
  include: ['CustomFields']
});

const customFieldsAnalysis = userStories.map(story => ({
  id: story.Id,
  name: story.Name,
  customFields: extractCustomFields(story)
}));
```

### Updating Custom Fields

```javascript
// Update custom fields for an entity
async function updateCustomFields(entityType, entityId, customFields) {
  // First get the current entity to ensure we have the correct format
  const entity = await getEntity({
    type: entityType,
    id: entityId,
    include: ['CustomFields']
  });
  
  // Prepare the update payload
  const updatePayload = {
    CustomFields: {
      ...entity.CustomFields,
      ...customFields
    }
  };
  
  // Update the entity
  return await updateEntity({
    type: entityType,
    id: entityId,
    fields: updatePayload
  });
}

// Example usage
await updateCustomFields('UserStory', 12345, {
  RiskLevel: 'High',
  BusinessValue: 8,
  ROI: 'Medium'
});
```

### Custom Field Analysis

```javascript
// Analyze custom field usage across entities
async function analyzeCustomFieldUsage(entityType, projectId) {
  // Get all entities with custom fields
  const entities = await searchEntities({
    type: entityType,
    where: `Project.Id eq ${projectId}`,
    include: ['CustomFields'],
    take: 1000
  });
  
  // Track custom field usage
  const fieldUsage = {};
  const fieldValues = {};
  
  entities.forEach(entity => {
    if (entity.CustomFields) {
      Object.entries(entity.CustomFields).forEach(([key, value]) => {
        // Count usage
        if (!fieldUsage[key]) {
          fieldUsage[key] = 0;
          fieldValues[key] = new Set();
        }
        
        fieldUsage[key]++;
        
        // Track unique values
        if (value !== null && value !== undefined) {
          fieldValues[key].add(String(value));
        }
      });
    }
  });
  
  // Convert sets to arrays for easier consumption
  Object.keys(fieldValues).forEach(key => {
    fieldValues[key] = Array.from(fieldValues[key]);
  });
  
  return {
    entityCount: entities.length,
    customFields: Object.keys(fieldUsage).map(key => ({
      name: key,
      usageCount: fieldUsage[key],
      usagePercentage: (fieldUsage[key] / entities.length) * 100,
      uniqueValues: fieldValues[key],
      valueCount: fieldValues[key].length
    }))
  };
}
```

## Error Handling and Resilience

Robust error handling is essential for production applications:

### Retry Logic

```javascript
// Retry a function with exponential backoff
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    retryOnStatusCodes = [429, 500, 502, 503, 504]
  } = options;
  
  let attempt = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      // Check if we should retry
      const statusCode = error.statusCode || (error.response && error.response.status);
      const shouldRetry = 
        attempt <= maxRetries && 
        (retryOnStatusCodes.includes(statusCode) || !statusCode);
      
      if (!shouldRetry) {
        throw error;
      }
      
      // Calculate delay with jitter
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
      delay = Math.min(delay * factor * jitter, maxDelay);
      
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Example usage
const result = await withRetry(
  () => searchEntities({
    type: 'UserStory',
    where: "Project.Id eq 123",
    take: 1000
  }),
  {
    maxRetries: 5,
    initialDelay: 2000
  }
);
```

### Error Aggregation

```javascript
// Aggregate errors from batch operations
async function batchOperationWithErrorAggregation(items, operation) {
  const results = {
    success: [],
    errors: [],
    total: items.length
  };
  
  for (const item of items) {
    try {
      const result = await operation(item);
      results.success.push({
        item,
        result
      });
    } catch (error) {
      results.errors.push({
        item,
        error: {
          message: error.message,
          statusCode: error.statusCode || (error.response && error.response.status),
          details: error.details || error.response?.data
        }
      });
    }
  }
  
  return results;
}

// Example usage
const updateResults = await batchOperationWithErrorAggregation(
  userStoriesToUpdate,
  async (story) => {
    return await updateEntity({
      type: 'UserStory',
      id: story.id,
      fields: story.updates
    });
  }
);

console.log(`Updated ${updateResults.success.length} stories successfully`);
console.log(`Failed to update ${updateResults.errors.length} stories`);

// Group errors by type for analysis
const errorsByType = updateResults.errors.reduce((acc, error) => {
  const type = error.error.statusCode || 'unknown';
  if (!acc[type]) {
    acc[type] = [];
  }
  acc[type].push(error);
  return acc;
}, {});

console.log('Errors by type:', Object.keys(errorsByType).map(type => `${type}: ${errorsByType[type].length}`));
```

## Conclusion

These advanced usage patterns demonstrate the power and flexibility of the Targetprocess MCP for enterprise scenarios. By leveraging complex queries, batch operations, performance optimization techniques, and robust error handling, you can build sophisticated integrations and analytics solutions that work effectively with large-scale Targetprocess implementations.

Remember to consider the specific requirements and constraints of your Targetprocess instance, and always test your code thoroughly before deploying to production environments.
