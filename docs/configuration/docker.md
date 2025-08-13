# Docker Configuration Guide

This comprehensive guide explains how to integrate the Targetprocess MCP Server using Docker containers, providing a reliable and isolated environment for running the MCP server with consistent behavior across different systems.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start Examples](#quick-start-examples)
3. [Authentication Methods](#authentication-methods)
4. [Role Configuration](#role-configuration)
5. [Docker Run Examples](#docker-run-examples)
6. [Docker Compose Examples](#docker-compose-examples)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Building Custom Images](#building-custom-images)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Prerequisites

### Docker Installation
- **Docker Engine 20.10+** or **Docker Desktop**
- Verify installation:
  ```bash
  docker --version
  docker run hello-world
  ```

### Targetprocess Access
- A Targetprocess instance (e.g., `company.tpondemand.com`)
- Valid credentials (username/password OR API key)
- Network access to your Targetprocess domain

### Image Availability
The official Docker image is available from GitHub Container Registry:
```bash
# Pull the latest stable version
docker pull ghcr.io/aaronsb/apptio-target-process-mcp:latest

# Verify image is available
docker images | grep apptio-target-process-mcp
```

## Quick Start Examples

### Basic Setup with API Key (Recommended)
```bash
# Run with API key authentication
docker run -it --rm \
  -e TP_DOMAIN=your-company.tpondemand.com \
  -e TP_API_KEY=your-api-key-here \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

### Basic Setup with Username/Password
```bash
# Run with username/password authentication
docker run -it --rm \
  -e TP_DOMAIN=your-company.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

### Developer Role Configuration
```bash
# Run with developer-specific tools enabled
docker run -it --rm \
  -e TP_DOMAIN=your-company.tpondemand.com \
  -e TP_API_KEY=your-api-key-here \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=12345 \
  -e TP_USER_EMAIL=dev@company.com \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

## Authentication Methods

### API Key Authentication (Recommended)

API key authentication is more secure and reliable than username/password combinations.

**Creating an API Key:**
1. Log into your Targetprocess instance
2. Navigate to **Settings** → **Access Tokens**
3. Click **Create Token**
4. Provide a descriptive name (e.g., "Docker MCP Integration")
5. Select appropriate permissions (typically "Read/Write" for most operations)
6. Copy the generated token

**Docker Configuration:**
```bash
docker run -it --rm \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=abc123def456789... \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

### Username/Password Authentication

While supported, username/password authentication is less secure and may be subject to additional rate limiting.

**Docker Configuration:**
```bash
docker run -it --rm \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_USERNAME=john.doe \
  -e TP_PASSWORD=your-secure-password \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

### Environment File Support

For better security, use an environment file:

**Create `.env` file:**
```bash
# Authentication (choose one method)
TP_DOMAIN=company.tpondemand.com
TP_API_KEY=your-api-key-here

# OR
# TP_USERNAME=your-username
# TP_PASSWORD=your-password

# Optional role configuration
TP_USER_ROLE=developer
TP_USER_ID=12345
TP_USER_EMAIL=dev@company.com
```

**Run with environment file:**
```bash
docker run -it --rm --env-file .env \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

## Role Configuration

### Understanding Tool Categories

The MCP server provides **two categories of tools**:

1. **Core Tools** - Always available, provide semantic hints and intelligent workflows:
   - `search_entities` - Search for any Targetprocess entity
   - `get_entity` - Get detailed information about specific entities
   - `create_entity` - Create new entities with validation
   - `update_entity` - Update existing entities
   - `inspect_object` - Inspect entity types and properties
   - `comment` - Unified comment management (add, view, delete, analyze)

2. **Role-Specific Tools** - Additional specialized tools when `TP_USER_ROLE` is configured:
   - Only available when role is properly configured
   - Provide workflow-optimized operations for specific user types
   - Include intelligent context and next-action suggestions

**Important:** ALL tools provide semantic hints and intelligent workflow guidance. Role configuration adds ADDITIONAL specialized tools tailored to specific workflows.

### Available Roles

#### Developer Role (`TP_USER_ROLE=developer`)

Adds specialized tools for task management and development workflows:

**Additional Tools:**
- `show_my_tasks` - View assigned tasks with priority filtering and context
- `start_working_on` - Begin work on tasks with state transitions
- `complete_task` - Mark tasks complete with time logging
- `show_my_bugs` - Analyze assigned bugs with severity insights
- `log_time` - Record time spent with intelligent entity discovery
- `add_comment` - Add contextual comments with workflow awareness
- `show_comments` - View comments with hierarchical organization
- `delete_comment` - Delete comments with ownership validation
- `analyze_attachment` - AI-powered attachment analysis with security validation

**Docker Configuration:**
```bash
docker run -it --rm \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=12345 \
  -e TP_USER_EMAIL=developer@company.com \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

#### Project Manager Role (`TP_USER_ROLE=project-manager`)

Adds tools for project oversight and team management:

**Additional Tools:**
- `show_project_status` - Project health dashboard with metrics
- `show_team_workload` - Team capacity and assignment analysis
- `create_sprint_plan` - Sprint planning with velocity predictions
- `show_sprint_progress` - Current sprint burndown and progress tracking

**Docker Configuration:**
```bash
docker run -it --rm \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=project-manager \
  -e TP_USER_ID=67890 \
  -e TP_USER_EMAIL=pm@company.com \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

#### Tester Role (`TP_USER_ROLE=tester`)

Adds tools for quality assurance and testing workflows:

**Additional Tools:**
- `show_my_test_tasks` - Test tasks with execution status
- `create_bug_report` - Structured bug reporting with templates
- `show_test_coverage` - Coverage analysis across projects
- `validate_user_stories` - Story readiness for testing

**Docker Configuration:**
```bash
docker run -it --rm \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=tester \
  -e TP_USER_ID=11111 \
  -e TP_USER_EMAIL=tester@company.com \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

#### Product Owner Role (`TP_USER_ROLE=product-owner`)

Adds tools for product management and stakeholder communication:

**Additional Tools:**
- `show_product_backlog` - Prioritized backlog with insights
- `analyze_story_readiness` - Story completeness analysis
- `show_feature_progress` - Feature delivery tracking
- `stakeholder_summary` - Executive summary generation

**Docker Configuration:**
```bash
docker run -it --rm \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=product-owner \
  -e TP_USER_ID=22222 \
  -e TP_USER_EMAIL=po@company.com \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

## Docker Run Examples

### Basic Interactive Testing

For testing and exploration:
```bash
# Interactive mode with automatic cleanup
docker run -it --rm \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

### Named Container for Persistent Use

For longer-running scenarios:
```bash
# Run with a specific name for easier management
docker run -d --name targetprocess-mcp \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=12345 \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest

# Connect to the running container
docker attach targetprocess-mcp

# Stop and remove when done
docker stop targetprocess-mcp
docker rm targetprocess-mcp
```

### Volume Mounting for Configuration

Mount local configuration files:
```bash
# Mount config directory
docker run -it --rm \
  -v $(pwd)/config:/app/config:ro \
  -e CONFIG_PATH=/app/config/targetprocess-production.json \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

### Network Configuration

For specific network requirements:
```bash
# Run on specific network
docker run -it --rm \
  --network my-custom-network \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

### Resource Limits

For production deployments with resource constraints:
```bash
# Set memory and CPU limits
docker run -it --rm \
  --memory=512m \
  --cpus=1.0 \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

## Docker Compose Examples

### Basic Configuration

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  targetprocess-mcp:
    image: ghcr.io/aaronsb/apptio-target-process-mcp:latest
    environment:
      - TP_DOMAIN=company.tpondemand.com
      - TP_API_KEY=your-api-key-here
    stdin_open: true
    tty: true
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
docker-compose logs -f targetprocess-mcp
```

### Multi-Role Configuration

For teams with different roles:
```yaml
version: '3.8'

services:
  targetprocess-dev:
    image: ghcr.io/aaronsb/apptio-target-process-mcp:latest
    environment:
      - TP_DOMAIN=company.tpondemand.com
      - TP_API_KEY=${DEV_API_KEY}
      - TP_USER_ROLE=developer
      - TP_USER_ID=${DEV_USER_ID}
      - TP_USER_EMAIL=${DEV_USER_EMAIL}
    stdin_open: true
    tty: true
    container_name: tp-mcp-dev

  targetprocess-pm:
    image: ghcr.io/aaronsb/apptio-target-process-mcp:latest
    environment:
      - TP_DOMAIN=company.tpondemand.com
      - TP_API_KEY=${PM_API_KEY}
      - TP_USER_ROLE=project-manager
      - TP_USER_ID=${PM_USER_ID}
      - TP_USER_EMAIL=${PM_USER_EMAIL}
    stdin_open: true
    tty: true
    container_name: tp-mcp-pm
```

Create `.env` file:
```bash
# Developer configuration
DEV_API_KEY=dev-api-key-here
DEV_USER_ID=12345
DEV_USER_EMAIL=dev@company.com

# Project Manager configuration
PM_API_KEY=pm-api-key-here
PM_USER_ID=67890
PM_USER_EMAIL=pm@company.com
```

### Production Configuration with Health Checks

```yaml
version: '3.8'

services:
  targetprocess-mcp:
    image: ghcr.io/aaronsb/apptio-target-process-mcp:latest
    environment:
      - TP_DOMAIN=${TP_DOMAIN}
      - TP_API_KEY=${TP_API_KEY}
      - TP_USER_ROLE=${TP_USER_ROLE}
      - TP_USER_ID=${TP_USER_ID}
      - TP_USER_EMAIL=${TP_USER_EMAIL}
      - MCP_STRICT_MODE=true
    stdin_open: true
    tty: true
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
        reservations:
          memory: 256M
          cpus: '0.5'
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

## Environment Variables Reference

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `TP_DOMAIN` | ✅ | Targetprocess domain (without https://) | `company.tpondemand.com` | - |
| `TP_API_KEY` | ⚠️* | API token (recommended) | `abc123def456...` | - |
| `TP_USERNAME` | ⚠️* | Username for basic auth | `john.doe` | - |
| `TP_PASSWORD` | ⚠️* | Password for basic auth | `secretpassword` | - |
| `TP_USER_ROLE` | ❌ | Role for specialized tools | `developer`, `project-manager`, `tester`, `product-owner` | - |
| `TP_USER_ID` | ❌ | Your user ID in Targetprocess | `12345` | - |
| `TP_USER_EMAIL` | ❌ | Your email in Targetprocess | `user@company.com` | - |
| `MCP_STRICT_MODE` | ❌ | Enable strict validation | `true`, `false` | `false` |
| `CONFIG_PATH` | ❌ | Path to JSON config file | `/app/config/custom.json` | - |
| `DEBUG` | ❌ | Enable debug logging | `*`, `mcp:*`, `targetprocess:*` | - |

*Either `TP_API_KEY` OR (`TP_USERNAME` + `TP_PASSWORD`) is required.

### Role-Specific Environment Setup

**Developer Setup:**
```bash
TP_DOMAIN=company.tpondemand.com
TP_API_KEY=your-api-key
TP_USER_ROLE=developer
TP_USER_ID=12345
TP_USER_EMAIL=dev@company.com
```

**Project Manager Setup:**
```bash
TP_DOMAIN=company.tpondemand.com
TP_API_KEY=your-api-key
TP_USER_ROLE=project-manager
TP_USER_ID=67890
TP_USER_EMAIL=pm@company.com
```

## Building Custom Images

### Using the Provided Build Script

```bash
# Clone the repository
git clone https://github.com/aaronsb/apptio-target-process-mcp.git
cd apptio-target-process-mcp

# Build the Docker image (quiet mode)
./scripts/docker-build.sh

# Build with verbose output
./scripts/docker-build.sh --verbose
```

### Manual Docker Build

```bash
# Build from the repository root
docker build -t my-targetprocess-mcp:latest .

# Build with specific tag
docker build -t my-company/targetprocess-mcp:v1.0.0 .

# Build with build arguments
docker build \
  --build-arg NODE_VERSION=20 \
  -t my-targetprocess-mcp:node20 \
  .
```

### Multi-Stage Build Customization

You can customize the Dockerfile for specific needs:

```dockerfile
# Custom Dockerfile extending the base
FROM ghcr.io/aaronsb/apptio-target-process-mcp:latest

# Add custom configuration
COPY custom-config.json /app/config/
ENV CONFIG_PATH=/app/config/custom-config.json

# Add custom entrypoint
COPY custom-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/custom-entrypoint.sh
ENTRYPOINT ["custom-entrypoint.sh"]
```

## Troubleshooting

### Common Issues

#### Image Pull Failures

**Symptoms:**
```bash
Error response from daemon: pull access denied for ghcr.io/aaronsb/apptio-target-process-mcp, repository does not exist or may require 'docker login'
```

**Solutions:**
1. **Check image name and tag:**
   ```bash
   # Verify the correct image name
   docker pull ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```

2. **Try alternative registries:**
   ```bash
   # If GitHub Container Registry is unavailable, build locally
   git clone https://github.com/aaronsb/apptio-target-process-mcp.git
   cd apptio-target-process-mcp
   ./scripts/docker-build.sh
   ```

#### Container Startup Failures

**Symptoms:**
- Container exits immediately
- "Authentication failed" errors
- "Connection refused" errors

**Solutions:**

1. **Check container logs:**
   ```bash
   # For running containers
   docker logs targetprocess-mcp
   
   # For containers that exited
   docker logs --details $(docker ps -l -q)
   ```

2. **Test credentials outside Docker:**
   ```bash
   curl -H "Authorization: Basic $(echo -n 'token:your-api-key' | base64)" \
        https://company.tpondemand.com/api/v1/Context
   ```

3. **Verify environment variables:**
   ```bash
   # Run with debug output
   docker run -it --rm \
     -e TP_DOMAIN=company.tpondemand.com \
     -e TP_API_KEY=your-api-key \
     -e DEBUG=* \
     ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```

#### Permission Errors

**Symptoms:**
- "Access denied" when using tools
- Limited functionality despite authentication success

**Solutions:**

1. **Check user permissions in Targetprocess:**
   - Log into web interface
   - Verify access to projects and entities
   - Check role assignments

2. **Test API key scope:**
   ```bash
   # Test with curl to verify permissions
   curl -H "Authorization: Basic $(echo -n 'token:your-api-key' | base64)" \
        "https://company.tpondemand.com/api/v1/UserStories?take=1"
   ```

#### Performance Issues

**Symptoms:**
- Slow response times
- Container using excessive resources
- Timeouts on operations

**Solutions:**

1. **Set resource limits:**
   ```bash
   docker run -it --rm \
     --memory=512m \
     --cpus=1.0 \
     -e TP_DOMAIN=company.tpondemand.com \
     -e TP_API_KEY=your-api-key \
     ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```

2. **Check network connectivity:**
   ```bash
   # Test from within container
   docker run -it --rm ghcr.io/aaronsb/apptio-target-process-mcp:latest bash
   # Inside container:
   ping company.tpondemand.com
   ```

3. **Monitor container resources:**
   ```bash
   docker stats targetprocess-mcp
   ```

#### Role Configuration Issues

**Symptoms:**
- Expected role-specific tools not available
- "Invalid role" errors

**Solutions:**

1. **Verify role spelling:**
   ```bash
   # Correct values
   TP_USER_ROLE=developer          # ✅
   TP_USER_ROLE=project-manager    # ✅
   TP_USER_ROLE=tester            # ✅
   TP_USER_ROLE=product-owner     # ✅
   
   # Common mistakes
   TP_USER_ROLE=dev               # ❌
   TP_USER_ROLE=pm                # ❌
   TP_USER_ROLE=qa                # ❌
   ```

2. **Ensure user context is complete:**
   ```bash
   # All role-specific configurations need user context
   docker run -it --rm \
     -e TP_DOMAIN=company.tpondemand.com \
     -e TP_API_KEY=your-api-key \
     -e TP_USER_ROLE=developer \
     -e TP_USER_ID=12345 \
     -e TP_USER_EMAIL=dev@company.com \
     ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```

### Debug Mode

Enable comprehensive logging for troubleshooting:

```bash
# Enable all debug output
docker run -it --rm \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e DEBUG=* \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest

# Enable specific debug categories
docker run -it --rm \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e DEBUG=mcp:*,targetprocess:* \
  ghcr.io/aaronsb/apptio-target-process-mcp:latest
```

### Health Checks

Implement health checks for production deployments:

```bash
# Manual health check
docker exec targetprocess-mcp node -e "
  console.log('Container health check passed');
  process.exit(0);
"

# Test MCP functionality
docker exec targetprocess-mcp node -e "
  const { execSync } = require('child_process');
  try {
    execSync('echo \'{\"action\": \"list_types\"}\' | node build/index.js');
    console.log('MCP health check passed');
    process.exit(0);
  } catch (error) {
    console.error('MCP health check failed:', error.message);
    process.exit(1);
  }
"
```

## Best Practices

### Security

1. **Use API keys instead of passwords:**
   ```bash
   # Preferred
   -e TP_API_KEY=your-api-key
   
   # Avoid when possible
   -e TP_USERNAME=user -e TP_PASSWORD=pass
   ```

2. **Use environment files for sensitive data:**
   ```bash
   # Create .env file with credentials
   echo "TP_API_KEY=your-secret-key" > .env
   chmod 600 .env
   
   # Use with docker-compose
   docker-compose --env-file .env up
   ```

3. **Regular credential rotation:**
   - Rotate API keys quarterly
   - Monitor access logs in Targetprocess
   - Use separate keys for different environments

### Resource Management

1. **Set appropriate resource limits:**
   ```yaml
   # In docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '1.0'
       reservations:
         memory: 256M
         cpus: '0.5'
   ```

2. **Use restart policies:**
   ```yaml
   restart: unless-stopped
   ```

3. **Implement health checks:**
   ```yaml
   healthcheck:
     test: ["CMD", "node", "-e", "process.exit(0)"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

### Development Workflow

1. **Use named containers for development:**
   ```bash
   docker run -d --name tp-mcp-dev \
     -e TP_DOMAIN=dev.tpondemand.com \
     -e TP_API_KEY=dev-key \
     ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```

2. **Volume mount for configuration:**
   ```bash
   docker run -it --rm \
     -v $(pwd)/config:/app/config:ro \
     -e CONFIG_PATH=/app/config/development.json \
     ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```

3. **Use different tags for environments:**
   ```bash
   # Development
   ghcr.io/aaronsb/apptio-target-process-mcp:dev
   
   # Staging
   ghcr.io/aaronsb/apptio-target-process-mcp:staging
   
   # Production
   ghcr.io/aaronsb/apptio-target-process-mcp:latest
   ```

### Production Deployment

1. **Use specific image versions:**
   ```yaml
   # Instead of 'latest'
   image: ghcr.io/aaronsb/apptio-target-process-mcp:v0.10.0
   ```

2. **Implement logging:**
   ```yaml
   logging:
     driver: json-file
     options:
       max-size: "10m"
       max-file: "3"
   ```

3. **Use secrets management:**
   ```yaml
   # Docker Compose with secrets
   secrets:
     tp_api_key:
       external: true
   services:
     targetprocess-mcp:
       secrets:
         - tp_api_key
   ```

### Integration with AI Assistants

1. **Configure for Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "targetprocess": {
         "command": "docker",
         "args": [
           "run", "-i", "--rm",
           "-e", "TP_DOMAIN",
           "-e", "TP_API_KEY",
           "ghcr.io/aaronsb/apptio-target-process-mcp:latest"
         ],
         "env": {
           "TP_DOMAIN": "company.tpondemand.com",
           "TP_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

2. **Configure for Claude Code:**
   ```bash
   claude mcp add targetprocess docker \
     --image ghcr.io/aaronsb/apptio-target-process-mcp:latest \
     -e TP_DOMAIN=company.tpondemand.com \
     -e TP_API_KEY=your-api-key
   ```

## Next Steps

After successfully configuring Docker deployment:

1. **Test the Integration**: Verify all tools work as expected
2. **Explore Role-Specific Features**: If configured, test specialized tools
3. **Review Use Cases**: Check [use cases documentation](../use-cases/README.md) for workflow examples
4. **Set Up Monitoring**: Implement logging and health checks for production
5. **Join Community**: Report issues and get help via GitHub issues

## Comparison with Other Methods

| Feature | Docker | NPX | Local Build |
|---------|--------|-----|-------------|
| **Setup Complexity** | ⭐⭐ Low | ⭐ Very Low | ⭐⭐⭐ Medium |
| **Isolation** | ✅ Complete | ❌ None | ❌ Limited |
| **Consistency** | ✅ Guaranteed | ⚠️ Depends on Node | ⚠️ Variable |
| **Resource Usage** | ⭐⭐ Medium | ⭐⭐⭐ Low | ⭐⭐⭐ Low |
| **Update Process** | 🔄 Pull new image | 🔄 Auto-update | 🔄 Manual rebuild |
| **Debugging** | ⭐⭐ Good | ⭐⭐⭐ Excellent | ⭐⭐⭐ Excellent |
| **Production Ready** | ✅ Yes | ❌ Limited | ⚠️ Depends |

**Recommendation**: Docker provides the best balance of consistency, isolation, and production readiness, making it ideal for teams and production deployments.

---

**Note**: This guide covers Docker-based deployment of the Targetprocess MCP Server. For other deployment methods, see the [NPX configuration guide](npx.md) or [local development guide](local-development.md).