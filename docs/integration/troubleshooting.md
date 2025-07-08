# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Targetprocess MCP server.

> **Looking for Semantic Operations issues?** See the dedicated [Semantic Operations Troubleshooting Guide](../semantic-operations/troubleshooting.md) for role-based operations, discovery failures, and context handling problems.

## Connection Issues

### Problem: Cannot Connect to Targetprocess API

**Symptoms:**
- "Cannot connect to Targetprocess API" error
- "Connection refused" or timeout errors
- API requests fail consistently

**Possible Causes:**
1. Incorrect Targetprocess domain
2. Network connectivity issues
3. Targetprocess service is down

**Solutions:**
1. Verify your Targetprocess domain:
   ```bash
   # Check if domain is accessible
   curl -I https://your-domain.tpondemand.com
   ```
2. Check your network connectivity
3. Verify Targetprocess service status with your administrator
4. Ensure you're using HTTPS for the domain

### Problem: Docker Container Fails to Start

**Symptoms:**
- Docker container exits immediately
- No logs from the MCP server
- "Error: Cannot connect to the Docker daemon" message

**Possible Causes:**
1. Docker is not running
2. Missing environment variables
3. Permission issues

**Solutions:**
1. Start Docker:
   ```bash
   # On Linux
   sudo systemctl start docker
   
   # On macOS/Windows
   # Start Docker Desktop application
   ```
2. Check if Docker is running:
   ```bash
   docker ps
   ```
3. Ensure environment variables are set:
   ```bash
   docker run -i --rm \
     -e TP_DOMAIN=your-domain.tpondemand.com \
     -e TP_USERNAME=your-username \
     -e TP_PASSWORD=your-password \
     ghcr.io/aaronsb/apptio-target-process-mcp
   ```

## Authentication Issues

### Problem: Authentication Failed

**Symptoms:**
- "Authentication failed" error
- "Invalid credentials" message
- 401 Unauthorized errors

**Possible Causes:**
1. Incorrect username or password
2. Account is locked or disabled
3. No API access permissions

**Solutions:**
1. Verify your credentials by logging into the Targetprocess web interface
2. Check if the account has API access permissions
3. Create a new API-specific account with appropriate permissions
4. Ensure there are no special characters in the password that might need escaping

### Problem: Permission Denied

**Symptoms:**
- "Permission denied" error
- "You don't have access to this entity" message
- 403 Forbidden errors

**Possible Causes:**
1. User doesn't have permission to access the requested entity
2. User doesn't have permission to perform the requested action
3. Entity doesn't exist or is in a different scope

**Solutions:**
1. Verify the user has appropriate permissions in Targetprocess
2. Check if the entity exists and is accessible to the user
3. Use a user account with higher privileges if possible

## Tool-Specific Issues

### Problem: search_entities Returns No Results

**Symptoms:**
- Empty array returned from search_entities
- "No matching entities found" message
- Search should return results but doesn't

**Possible Causes:**
1. Search criteria too restrictive
2. Entity type or property names are incorrect
3. Case sensitivity issues in search terms

**Solutions:**
1. Simplify the search criteria:
   ```json
   {
     "type": "UserStory",
     "where": "EntityState.Name eq 'Open'"
   }
   ```
2. Verify entity type and property names using the inspect_object tool:
   ```json
   {
     "action": "list_types"
   }
   ```
3. Check case sensitivity in string comparisons
4. Try removing filters one by one to identify the problematic condition

### Problem: get_entity Returns Not Found

**Symptoms:**
- "Entity with id X not found" error
- 404 Not Found error
- Entity should exist but can't be retrieved

**Possible Causes:**
1. Entity ID is incorrect
2. Entity doesn't exist
3. User doesn't have access to the entity
4. Entity type is incorrect

**Solutions:**
1. Verify the entity ID is correct
2. Check if the entity exists in the Targetprocess web interface
3. Ensure the user has access to the entity
4. Verify the entity type is correct:
   ```json
   {
     "type": "UserStory",  // Make sure this matches the actual entity type
     "id": 12345
   }
   ```

### Problem: create_entity Fails

**Symptoms:**
- "Create entity failed" error
- Validation errors
- Missing required fields

**Possible Causes:**
1. Missing required fields
2. Invalid field values
3. Reference to non-existent entities (project, team, etc.)
4. Permission issues

**Solutions:**
1. Include all required fields:
   ```json
   {
     "type": "UserStory",
     "name": "Story Name",  // Required
     "project": {          // Required
       "id": 123
     }
   }
   ```
2. Verify reference IDs (project, team, user) exist
3. Check field value formats and constraints
4. Ensure the user has permission to create entities

## Performance Issues

### Problem: Slow Response Times

**Symptoms:**
- API requests take a long time to complete
- Timeouts during operations
- Performance degrades with larger results

**Possible Causes:**
1. Large result sets
2. Complex queries
3. Network latency
4. Targetprocess instance is under load

**Solutions:**
1. Limit result size with the take parameter:
   ```json
   {
     "type": "UserStory",
     "take": 100,  // Limit to 100 results
     "where": "EntityState.Name eq 'Open'"
   }
   ```
2. Use more specific queries to reduce result size
3. Only include necessary related data:
   ```json
   {
     "type": "UserStory",
     "include": ["Project", "Team"],  // Only include what you need
     "where": "EntityState.Name eq 'Open'"
   }
   ```
4. Implement pagination for large result sets

## Configuration Issues

### Problem: AI Assistant Can't Find the MCP Server

**Symptoms:**
- "Cannot find MCP server" error
- "MCP server not running" message
- AI assistant doesn't show Targetprocess tools

**Possible Causes:**
1. MCP server not running
2. MCP server configuration is incorrect
3. AI assistant configuration is wrong
4. Path to executable is wrong

**Solutions:**
1. Verify the MCP server is running
2. Check the AI assistant configuration:
   ```json
   {
     "mcpServers": {
       "targetprocess": {
         "command": "docker",
         "args": [
           "run",
           "-i",
           "--rm",
           "-e",
           "TP_DOMAIN",
           "-e",
           "TP_USERNAME",
           "-e",
           "TP_PASSWORD",
           "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
         ],
         "env": {
           "TP_DOMAIN": "your-domain.tpondemand.com",
           "TP_USERNAME": "your-username",
           "TP_PASSWORD": "your-password"
         }
       }
     }
   }
   ```
3. Ensure the Docker image is available
4. Use absolute paths for local installations

### Problem: MCP Server Crashes

**Symptoms:**
- MCP server exits unexpectedly
- Error messages in logs
- Docker container stops

**Possible Causes:**
1. Memory issues
2. Unhandled exceptions
3. Configuration problems
4. Network interruptions

**Solutions:**
1. Check Docker logs:
   ```bash
   docker logs $(docker ps -q -f "ancestor=ghcr.io/aaronsb/apptio-target-process-mcp")
   ```
2. Increase Docker memory limit
3. Update to the latest version of the MCP server
4. Check for network stability issues

## Advanced Debugging

### Checking Docker Logs

```bash
# Get the container ID
docker ps | grep apptio-target-process-mcp

# View logs
docker logs [container-id]

# Follow logs in real time
docker logs -f [container-id]
```

### Checking Local Logs

```bash
# For local installations
tail -f /tmp/apptio-target-process-mcp.log
```

### Testing Direct API Access

```bash
# Test basic authentication
curl -u username:password https://your-domain.tpondemand.com/api/v1/UserStories?take=1

# Test specific entity access
curl -u username:password https://your-domain.tpondemand.com/api/v1/UserStories/12345
```

### Running in Debug Mode

```bash
# For Docker
docker run -i --rm \
  -e TP_DOMAIN=your-domain.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  -e LOG_LEVEL=debug \
  ghcr.io/aaronsb/apptio-target-process-mcp

# For local installations
LOG_LEVEL=debug node build/index.js
```

## Common Error Messages

### "Invalid entity type"

**Possible Causes:**
- Entity type doesn't exist
- Entity type name is misspelled
- Case sensitivity issues

**Solutions:**
- Use the inspect_object tool to list valid entity types:
  ```json
  {
    "action": "list_types"
  }
  ```
- Check case sensitivity (e.g., "UserStory" not "userstory")

### "Invalid where clause"

**Possible Causes:**
- Syntax error in where clause
- Invalid field name
- Invalid operator
- Case sensitivity issues

**Solutions:**
- Verify field names using the inspect_object tool
- Check operator syntax (eq, ne, gt, lt, etc.)
- Ensure string values are enclosed in single quotes
- Simplify the where clause to isolate the issue

### "Request failed with status code 429"

**Possible Causes:**
- Rate limiting by the Targetprocess API
- Too many requests in a short time

**Solutions:**
- Implement delay between requests
- Reduce request frequency
- Implement exponential backoff for retries

## Getting Further Help

If you're still experiencing issues:

1. **Check GitHub Issues**: Look for similar issues in the [GitHub repository](https://github.com/aaronsb/apptio-target-process-mcp/issues)
2. **File a New Issue**: Create a new issue with detailed information:
   - Error message
   - Steps to reproduce
   - Configuration details (without sensitive information)
   - Logs or output
3. **Community Support**: Ask for help in the MCP community forums
4. **Targetprocess Support**: Contact Targetprocess support for API-specific issues