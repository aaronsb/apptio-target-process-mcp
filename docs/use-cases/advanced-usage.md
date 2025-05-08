# Advanced Usage Patterns

This document provides detailed examples and guidance for advanced usage patterns with the Targetprocess MCP. It focuses on batch operations, performance optimization, and other advanced techniques for working with Targetprocess in enterprise environments.

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

### Mass Updates

When you need to make large-scale changes across many entities:

```javascript
// Find all unassigned high-priority items
const highPriorityUnassigned = await searchEntities({
  type: "UserStory",
  where: "AssignedUser is null and Priority.Name eq 'High'",
  take: 1000
});

// Reassign to a specific team member
const updateResult = await batchUpdateEntities(
  "UserStory", 
  "AssignedUser is null and Priority.Name eq 'High'",
  {
    assignedUser: {
      id: 123 // Team lead or manager
    }
  }
);

console.log(`Updated ${updateResult.success} out of ${updateResult.total} stories`);
```

## Custom Workflows

### Status Transitions

Implement custom workflow transitions:

```javascript
// Approve all ready for review items
async function approveReadyItems(reviewerId) {
  // Find items ready for review
  const readyItems = await searchEntities({
    type: "UserStory",
    where: "EntityState.Name eq 'Ready for Review'",
    include: ["Project", "Team"]
  });
  
  // Move to approved state and assign reviewer
  return await batchUpdateEntities(
    "UserStory", 
    "EntityState.Name eq 'Ready for Review'",
    {
      status: {
        id: 789 // "Approved" state ID
      },
      reviewedBy: {
        id: reviewerId
      },
      reviewDate: new Date().toISOString()
    }
  );
}
```

### Custom Field Workflows

Working with custom fields in bulk:

```javascript
// Flag high-risk items
async function flagHighRiskItems() {
  // Find potential high-risk items
  const potentialRiskItems = await searchEntities({
    type: "UserStory",
    where: "Effort gt 13 and EntityState.Name eq 'In Progress' and TimeInState.TotalDays gt 14",
    include: ["Project", "Team", "AssignedUser"]
  });
  
  // Update risk level in custom fields
  return await batchUpdateEntities(
    "UserStory", 
    "Effort gt 13 and EntityState.Name eq 'In Progress' and TimeInState.TotalDays gt 14",
    {
      CustomFields: {
        RiskLevel: "High",
        FlaggedDate: new Date().toISOString(),
        NeedsReview: true
      }
    }
  );
}
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

## Pagination

Working with large result sets requires pagination:

```javascript
// Paginated query with callback for each page
async function paginatedQuery(entityType, query, include, pageSize, callback) {
  let skip = 0;
  let hasMore = true;
  let totalProcessed = 0;
  
  while (hasMore) {
    const batch = await searchEntities({
      type: entityType,
      where: query,
      include,
      take: pageSize,
      skip
    });
    
    if (batch.length === 0) {
      hasMore = false;
      continue;
    }
    
    // Process this page
    await callback(batch, totalProcessed, skip);
    
    totalProcessed += batch.length;
    
    // Check if we need to continue
    if (batch.length < pageSize) {
      hasMore = false;
    } else {
      skip += pageSize;
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return totalProcessed;
}

// Example usage
const total = await paginatedQuery(
  'UserStory',
  "Project.Id eq 123",
  ["Project", "Team", "EntityState"],
  100,
  async (page, totalSoFar, offset) => {
    console.log(`Processing page ${Math.floor(offset / 100) + 1} with ${page.length} items`);
    // Process the page
    await processData(page);
  }
);

console.log(`Processed ${total} items in total`);
```

## Rate Limiting

Handling API rate limits:

```javascript
// Rate-limited batch processing
async function rateLimitedBatchProcessing(items, operation, batchSize = 10, requestsPerSecond = 2) {
  const batches = [];
  
  // Split into batches
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  const results = [];
  const minDelayBetweenRequests = 1000 / requestsPerSecond;
  
  for (let i = 0; i < batches.length; i++) {
    console.log(`Processing batch ${i + 1} of ${batches.length}`);
    
    const startTime = Date.now();
    const batchResult = await operation(batches[i]);
    results.push(batchResult);
    
    // Calculate and apply rate limiting delay
    const elapsedTime = Date.now() - startTime;
    const delayNeeded = Math.max(0, minDelayBetweenRequests - elapsedTime);
    
    if (delayNeeded > 0 && i < batches.length - 1) {
      console.log(`Rate limit delay: ${delayNeeded}ms`);
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
  }
  
  return results;
}

// Example usage
const results = await rateLimitedBatchProcessing(
  userStoriesToUpdate,
  async (batch) => {
    return await Promise.all(
      batch.map(story => updateEntity({
        type: 'UserStory',
        id: story.id,
        fields: story.updates
      }))
    );
  },
  10, // Batch size
  2   // Requests per second
);
```

## Custom Fields

Working with custom fields effectively:

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

## Data Export and Integration

Exporting data for integration with other systems:

```javascript
// Export to JSON file
async function exportToJson(entityType, query, include, filename) {
  let allData = [];
  
  await paginatedQuery(
    entityType,
    query,
    include,
    1000,
    async (page) => {
      allData = allData.concat(page);
    }
  );
  
  // Write to file
  fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
  
  return allData.length;
}

// Export to CSV
async function exportToCsv(entityType, query, include, fields, filename) {
  const csvRows = [];
  
  // Add header row
  csvRows.push(fields.join(','));
  
  await paginatedQuery(
    entityType,
    query,
    include,
    1000,
    async (page) => {
      // Process each entity in the page
      page.forEach(entity => {
        const row = fields.map(field => {
          // Handle nested fields (e.g., "Project.Name")
          const parts = field.split('.');
          let value = entity;
          
          for (const part of parts) {
            if (!value) return '';
            value = value[part];
          }
          
          // Format the value for CSV
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          if (value instanceof Date) return value.toISOString();
          return value;
        });
        
        csvRows.push(row.join(','));
      });
    }
  );
  
  // Write to file
  fs.writeFileSync(filename, csvRows.join('\n'));
  
  return csvRows.length - 1; // Exclude header row
}
```

## Advanced Tips and Best Practices

1. **API Discovery**: Use the `inspect_object` tool to understand the data model
2. **Incremental Extraction**: For large datasets, use incremental extraction based on modification dates
3. **Error Handling**: Implement robust error handling with retries and detailed logging
4. **Rate Limiting**: Be aware of API rate limits and implement throttling mechanisms
5. **Batching**: Process data in batches to optimize performance and reduce API load
6. **Caching**: Cache data that doesn't change frequently to reduce API calls
7. **Parallel Processing**: Use parallel processing for independent operations
8. **Custom Fields**: Be careful with custom fields as they can vary between Targetprocess instances
9. **Validation**: Validate data before sending it to the API to avoid errors
10. **Monitoring**: Implement monitoring and alerting for production integrations