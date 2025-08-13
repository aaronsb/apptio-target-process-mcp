# Docker Configuration Guide

This guide covers how to configure and run the Targetprocess MCP server using Docker, including authentication options, role-specific configurations, and troubleshooting.

## Quick Start

The fastest way to get started is using the provided scripts:

```bash
# Build the Docker image
./scripts/docker-build.sh

# Run with username/password auth
./scripts/docker-run.sh

# Run with API key auth
./scripts/docker-run.sh --api-key
```

## Docker Image

### Building the Image

The Docker image is built using a multi-stage process for optimal size and security:

```bash
# Standard build (logs saved to /tmp/apptio-target-process-mcp/)
./scripts/docker-build.sh

# Verbose build (see output in terminal)
./scripts/docker-build.sh --verbose

# Manual build
docker build -t apptio-target-process-mcp:local .
```

The build process includes:
1. **Dependencies stage**: Installs all dependencies and dev tools
2. **Build stage**: Compiles TypeScript and runs tests
3. **Runtime stage**: Minimal production image with only runtime dependencies

## Authentication Configuration

### Method 1: Username/Password Authentication

**Using Environment Variables:**
```bash
docker run --rm -i \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  apptio-target-process-mcp:local
```

**Using .env File:**
```bash
# Create .env file
cat > .env << EOF
TP_DOMAIN=company.tpondemand.com
TP_USERNAME=your-username
TP_PASSWORD=your-password
EOF

# Run using script
./scripts/docker-run.sh
```

### Method 2: API Key Authentication

**Using Environment Variables:**
```bash
docker run --rm -i \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  apptio-target-process-mcp:local
```

**Using .env File:**
```bash
# Create .env file
cat > .env << EOF
TP_DOMAIN=company.tpondemand.com
TP_API_KEY=your-api-key
EOF

# Run using script
./scripts/docker-run.sh --api-key
```

## Role-Based Configuration

The MCP server provides different tools based on the configured user role. **All tools provide semantic hints and intelligent workflow guidance**, but role configuration adds **additional specialized tools** specific to each role.

### Available Roles

| Role | Description | Additional Tools |
|------|-------------|------------------|
| `developer` | Software developers focused on task completion | `show-my-tasks`, `complete-task`, `start-working-on`, `show-my-bugs`, `log-time` |
| `project-manager` | Project managers handling planning and oversight | `sprint-planning`, `resource-allocation`, `progress-tracking` |
| `tester` | QA testers focused on bug tracking and testing | `test-planning`, `bug-reporting`, `test-execution` |
| `product-owner` | Product owners managing requirements and priorities | `backlog-management`, `priority-setting`, `stakeholder-feedback` |

### Developer Role Example

```bash
docker run --rm -i \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_USERNAME=your-username \
  -e TP_PASSWORD=your-password \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=12345 \
  -e TP_USER_EMAIL=developer@company.com \
  apptio-target-process-mcp:local
```

With `developer` role, you get additional tools like:
- `show-my-tasks` - View tasks assigned to you with intelligent priority filtering
- `complete-task` - Mark tasks complete with automatic time logging
- `start-working-on` - Begin work on tasks with state transitions
- `show-my-bugs` - View bugs assigned to you with severity insights
- `log-time` - Record time spent with intelligent context detection

### Project Manager Role Example

```bash
docker run --rm -i \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-api-key \
  -e TP_USER_ROLE=project-manager \
  -e TP_USER_ID=12345 \
  -e TP_USER_EMAIL=pm@company.com \
  apptio-target-process-mcp:local
```

## Environment Variables Reference

### Authentication (Required)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `TP_DOMAIN` | Targetprocess domain | `company.tpondemand.com` | Yes |
| `TP_USERNAME` | Username for basic auth | `john.doe` | Yes* |
| `TP_PASSWORD` | Password for basic auth | `your-password` | Yes* |
| `TP_API_KEY` | API key for token auth | `abc123...` | Yes** |

*Required for username/password auth
**Required for API key auth

### Role Configuration (Optional)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TP_USER_ROLE` | User role for specialized tools | `default` | `developer` |
| `TP_USER_ID` | Targetprocess user ID | `0` | `12345` |
| `TP_USER_EMAIL` | User email address | - | `user@company.com` |

### Advanced Configuration (Optional)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Node.js environment | `production` | `development` |
| `LOG_LEVEL` | Logging level | `info` | `debug` |

## Docker Run Examples

### Basic Usage

```bash
# Minimal setup with username/password
docker run --rm -i \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_USERNAME=user \
  -e TP_PASSWORD=pass \
  apptio-target-process-mcp:local

# With API key authentication  
docker run --rm -i \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=abc123 \
  apptio-target-process-mcp:local
```

### Developer Workflow

```bash
# Complete developer setup
docker run --rm -i \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_USERNAME=developer \
  -e TP_PASSWORD=dev-password \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=101734 \
  -e TP_USER_EMAIL=dev@company.com \
  apptio-target-process-mcp:local
```

### With Config File Mount

```bash
# Mount config file instead of environment variables
docker run --rm -i \
  -v $(pwd)/config/targetprocess.json:/app/config/targetprocess.json:ro \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=12345 \
  apptio-target-process-mcp:local
```

### Development Mode

```bash
# Development with debugging
docker run --rm -i \
  -e TP_DOMAIN=company.tpondemand.com \
  -e TP_API_KEY=your-key \
  -e NODE_ENV=development \
  -e LOG_LEVEL=debug \
  -e TP_USER_ROLE=developer \
  apptio-target-process-mcp:local
```

## Docker Compose

For production deployments, use Docker Compose:

### docker-compose.yml

```yaml
version: '3.8'

services:
  targetprocess-mcp:
    image: apptio-target-process-mcp:local
    container_name: tp-mcp-server
    restart: unless-stopped
    environment:
      - TP_DOMAIN=${TP_DOMAIN}
      - TP_USERNAME=${TP_USERNAME}
      - TP_PASSWORD=${TP_PASSWORD}
      - TP_USER_ROLE=${TP_USER_ROLE:-developer}
      - TP_USER_ID=${TP_USER_ID}
      - TP_USER_EMAIL=${TP_USER_EMAIL}
      - NODE_ENV=production
    stdin_open: true
    tty: true
    volumes:
      - ./config:/app/config:ro
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
```

### .env for Docker Compose

```bash
# Authentication
TP_DOMAIN=company.tpondemand.com
TP_USERNAME=your-username
TP_PASSWORD=your-password

# Role Configuration
TP_USER_ROLE=developer
TP_USER_ID=12345
TP_USER_EMAIL=user@company.com
```

### Running with Docker Compose

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down

# Update and restart
docker-compose pull && docker-compose up -d
```

## Alternative Docker Compose (API Key)

```yaml
version: '3.8'

services:
  targetprocess-mcp:
    image: apptio-target-process-mcp:local
    container_name: tp-mcp-server
    restart: unless-stopped
    environment:
      - TP_DOMAIN=${TP_DOMAIN}
      - TP_API_KEY=${TP_API_KEY}
      - TP_USER_ROLE=${TP_USER_ROLE:-developer}
      - TP_USER_ID=${TP_USER_ID}
      - TP_USER_EMAIL=${TP_USER_EMAIL}
      - NODE_ENV=production
    stdin_open: true
    tty: true
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
```

## Troubleshooting

### Common Docker Issues

#### 1. Image Not Found
```
Error: Docker image 'apptio-target-process-mcp:local' not found
```

**Solution:**
```bash
# Build the image first
./scripts/docker-build.sh

# Or build manually
docker build -t apptio-target-process-mcp:local .
```

#### 2. Authentication Failed
```
Error: 401 Unauthorized
```

**Solutions:**
- Verify credentials in `.env` file
- Check domain format (should be `company.tpondemand.com`)
- Test credentials by logging into Targetprocess web interface
- For API keys, verify the key is active and has required permissions

#### 3. Connection Issues
```
Error: ECONNREFUSED or network timeout
```

**Solutions:**
```bash
# Test network connectivity
docker run --rm -i alpine ping company.tpondemand.com

# Check if running behind corporate firewall
docker run --rm -i \
  -e https_proxy=http://proxy:8080 \
  -e http_proxy=http://proxy:8080 \
  apptio-target-process-mcp:local
```

#### 4. Permission Errors
```
Error: Permission denied
```

**Solutions:**
```bash
# Fix script permissions
chmod +x scripts/docker-*.sh

# Run with proper user
docker run --rm -i --user $(id -u):$(id -g) \
  -e TP_DOMAIN=... \
  apptio-target-process-mcp:local
```

#### 5. Config File Issues
```
Error: Configuration not found
```

**Solutions:**
```bash
# Check mounted config file
docker run --rm -i \
  -v $(pwd)/config/targetprocess.json:/app/config/targetprocess.json:ro \
  alpine cat /app/config/targetprocess.json

# Use environment variables instead
docker run --rm -i \
  -e TP_DOMAIN=... \
  -e TP_USERNAME=... \
  -e TP_PASSWORD=... \
  apptio-target-process-mcp:local
```

### Role Configuration Issues

#### 1. Role Tools Not Available
```
Warning: role-specific tools not found
```

**Diagnosis:**
```bash
# Check environment variables
docker run --rm -i \
  -e TP_USER_ROLE=developer \
  apptio-target-process-mcp:local \
  env | grep TP_USER
```

**Solutions:**
- Ensure `TP_USER_ROLE` is set to valid role: `developer`, `project-manager`, `tester`, `product-owner`
- Set `TP_USER_ID` for user-specific operations
- Verify role configuration in logs

#### 2. User Identity Issues
```
Error: No user identity configured
```

**Solution:**
```bash
docker run --rm -i \
  -e TP_DOMAIN=... \
  -e TP_USERNAME=... \
  -e TP_PASSWORD=... \
  -e TP_USER_ROLE=developer \
  -e TP_USER_ID=12345 \
  -e TP_USER_EMAIL=user@company.com \
  apptio-target-process-mcp:local
```

### Debugging Commands

```bash
# Check container status
docker ps -a

# View container logs
docker logs <container-id>

# Interactive shell in container
docker run --rm -it --entrypoint /bin/sh apptio-target-process-mcp:local

# Test environment inside container
docker run --rm -i \
  -e TP_DOMAIN=... \
  apptio-target-process-mcp:local \
  env | grep TP_

# Check config file creation
docker run --rm -i \
  -e TP_DOMAIN=... \
  -e TP_USERNAME=... \
  -e TP_PASSWORD=... \
  --entrypoint /bin/sh \
  apptio-target-process-mcp:local \
  -c "ls -la /app/config/ && cat /app/config/targetprocess.json"
```

### Build Issues

#### 1. Build Failures
```bash
# Check build logs
cat /tmp/apptio-target-process-mcp/docker-build.log

# Build with verbose output
./scripts/docker-build.sh --verbose

# Clean build (remove cache)
docker build --no-cache -t apptio-target-process-mcp:local .
```

#### 2. Test Failures During Build
```bash
# Skip tests during build (not recommended for production)
docker build --build-arg SKIP_TESTS=true -t apptio-target-process-mcp:local .
```

### Performance Issues

#### 1. Slow Startup
```bash
# Check resource usage
docker stats

# Allocate more resources (Docker Desktop)
docker run --rm -i \
  --memory=2g \
  --cpus=2 \
  -e TP_DOMAIN=... \
  apptio-target-process-mcp:local
```

#### 2. Memory Issues
```bash
# Monitor memory usage
docker run --rm -i \
  --memory=1g \
  --memory-swap=2g \
  -e TP_DOMAIN=... \
  apptio-target-process-mcp:local
```

## Advanced Configuration

### Custom Entrypoint
```bash
# Use custom entrypoint script
docker run --rm -i \
  -v $(pwd)/custom-entrypoint.sh:/custom-entrypoint.sh:ro \
  --entrypoint /custom-entrypoint.sh \
  apptio-target-process-mcp:local
```

### Health Checks
```yaml
# In docker-compose.yml
services:
  targetprocess-mcp:
    # ... other config
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('healthy')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### Secrets Management
```bash
# Using Docker secrets (Swarm mode)
echo "your-password" | docker secret create tp_password -
docker service create \
  --secret tp_password \
  --env TP_PASSWORD_FILE=/run/secrets/tp_password \
  apptio-target-process-mcp:local
```

## Security Best Practices

1. **Never expose credentials in logs or commands**
2. **Use API keys instead of passwords when possible**
3. **Run containers with non-root user when possible**
4. **Use Docker secrets or mounted files for credentials**
5. **Regularly update the base image and dependencies**
6. **Scan images for vulnerabilities**

```bash
# Security scan (if available)
docker scan apptio-target-process-mcp:local

# Run as non-root user
docker run --rm -i --user 1000:1000 \
  -e TP_DOMAIN=... \
  apptio-target-process-mcp:local
```

## Next Steps

- [Integration Guide](../integration/README.md) - Connect with Claude Desktop, Claude Code, or other MCP clients
- [Semantic Operations](../semantic-operations/README.md) - Learn about role-specific tools and workflows
- [Use Cases](../use-cases/README.md) - Explore specific workflow examples
- [Security Guide](../security-and-authentication.md) - Advanced authentication and security configuration