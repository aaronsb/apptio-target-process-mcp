# Semantic Operations Troubleshooting Guide

This guide helps diagnose and resolve common issues with semantic operations in the Targetprocess MCP server.

## Common Issues and Solutions

### 1. Operations Not Appearing for Your Role

**Symptoms:**
- Expected operations like `show_my_tasks` or `start_working_on` are not available
- Only basic CRUD operations appear
- Role-specific features missing

**Diagnosis:**
```bash
# Check your role configuration
echo $TP_USER_ROLE

# Verify the role is valid
# Valid roles: developer, project-manager, tester, product-owner
```

**Solutions:**
1. **Set the correct role:**
   ```bash
   export TP_USER_ROLE=developer  # or project-manager, tester, product-owner
   ```

2. **Check personality configuration exists:**
   ```bash
   ls config/personalities/
   # Should show: developer.json, project-manager.json, etc.
   ```

3. **Verify in your MCP configuration:**
   ```json
   {
     "mcpServers": {
       "targetprocess": {
         "env": {
           "TP_USER_ROLE": "developer",
           "TP_USER_ID": "12345"
         }
       }
     }
   }
   ```

### 2. Dynamic Discovery Failures

**Symptoms:**
- Operations fail with "Could not discover entity states"
- "Unable to find In Progress state" errors
- Fallback to manual state selection

**Diagnosis:**
```typescript
// Check if discovery is working by using inspect_object
{
  "action": "get_properties",
  "entityType": "EntityState"
}
```

**Solutions:**
1. **Verify API permissions:**
   - Ensure your user has read access to EntityState
   - Check if custom fields are accessible

2. **Handle non-standard state names:**
   ```typescript
   // The system tries multiple patterns:
   // "In Progress", "InProgress", "Active", "WIP"
   // If your system uses different names, operations will fall back
   ```

3. **Check for API throttling:**
   - Discovery makes multiple API calls
   - If rate limited, implement delays between operations

### 3. Context Building Errors

**Symptoms:**
- "Failed to build operation context" errors
- Missing user information in operations
- Incorrect filtering of results

**Diagnosis:**
```bash
# Verify user configuration
echo $TP_USER_ID
echo $TP_USER_EMAIL

# Test with get_entity
{
  "type": "User",
  "id": YOUR_USER_ID
}
```

**Solutions:**
1. **Set user identity correctly:**
   ```bash
   export TP_USER_ID=12345
   export TP_USER_EMAIL=user@company.com
   ```

2. **Verify user exists in Targetprocess:**
   - Check that the USER_ID corresponds to a valid user
   - Ensure the email matches the Targetprocess account

3. **Handle missing user context:**
   - Operations will work without user context but with limited personalization
   - Some features like "my tasks" require user identity

### 4. Performance Issues with Semantic Operations

**Symptoms:**
- Slow operation execution
- Timeouts during discovery
- High API usage

**Diagnosis:**
```typescript
// Monitor API calls during operations
// Each semantic operation may make 2-5 API calls:
// 1. Discovery calls (states, priorities, etc.)
// 2. Main operation call
// 3. Context enrichment calls
```

**Solutions:**
1. **Enable caching (if implemented):**
   ```bash
   export TP_ENABLE_DISCOVERY_CACHE=true
   export TP_CACHE_TTL=3600  # 1 hour
   ```

2. **Optimize discovery patterns:**
   - Discovery results are often reusable across operations
   - Consider implementing a discovery warm-up on startup

3. **Reduce included fields:**
   ```typescript
   // Limit context building to essential fields
   {
     "includeAdvancedContext": false
   }
   ```

### 5. Fallback Behavior Not Working

**Symptoms:**
- Operations fail completely instead of falling back
- No graceful degradation
- Missing fallback warnings

**Diagnosis:**
```typescript
// Check operation response for fallback indicators
{
  "success": true,
  "warning": "Could not discover states, using defaults",
  "fallbackMode": true
}
```

**Solutions:**
1. **Ensure proper error handling:**
   - Operations should catch discovery failures
   - Fallback should provide basic functionality

2. **Check fallback configuration:**
   - Some operations may have fallback disabled for safety
   - Review operation implementation for fallback logic

3. **Monitor fallback patterns:**
   - Frequent fallbacks indicate configuration issues
   - Log fallback occurrences for analysis

## Debugging Techniques

### 1. Enable Verbose Logging

```bash
export TP_LOG_LEVEL=debug
export TP_LOG_DISCOVERY=true
```

### 2. Test Discovery Independently

```typescript
// Use inspect_object to test discovery
{
  "action": "discover_api_structure"
}

// Check specific entity metadata
{
  "action": "get_properties",
  "entityType": "Task"
}
```

### 3. Trace Operation Execution

```typescript
// Many operations support trace mode
{
  "enableTrace": true,
  "taskId": 12345
}
```

### 4. Verify Role-Based Filtering

```typescript
// Check what operations are available
// The list should match your role's personality configuration
```

## Common Error Messages

### "Discovery failed: Entity type not found"
- **Cause**: The entity type doesn't exist in your Targetprocess instance
- **Fix**: Verify entity type names match your configuration

### "No suitable state found for transition"
- **Cause**: State discovery couldn't find expected states
- **Fix**: Check EntityState configuration in Targetprocess

### "User context not available"
- **Cause**: TP_USER_ID not set or invalid
- **Fix**: Set valid user credentials in environment

### "Role 'unknown' not recognized"
- **Cause**: TP_USER_ROLE not set or invalid
- **Fix**: Set to valid role: developer, project-manager, tester, product-owner

### "Operation not available for current role"
- **Cause**: Trying to use operation not configured for your role
- **Fix**: Check personality configuration or switch roles

## Performance Optimization

### 1. Reduce Discovery Frequency
- Cache discovery results when possible
- Reuse discovery data across operations
- Implement TTL-based cache invalidation

### 2. Optimize API Calls
- Use specific queries instead of broad searches
- Limit included fields to necessary data
- Batch operations when possible

### 3. Monitor API Usage
- Track number of calls per operation
- Identify operations with excessive API usage
- Optimize high-frequency operations first

## Getting Help

If you continue to experience issues:

1. **Check the logs** for detailed error messages
2. **Review the operation source code** in `/src/operations/`
3. **Test with basic tools first** to isolate semantic layer issues
4. **Open an issue** with:
   - Your role configuration
   - The operation you're trying to use
   - Complete error messages
   - Your Targetprocess version

## Related Documentation

- [Semantic Operations Overview](README.md)
- [General Troubleshooting](../integration/troubleshooting.md)
- [Development Guide](../development/README.md)
- [Role Configuration](developer.md)