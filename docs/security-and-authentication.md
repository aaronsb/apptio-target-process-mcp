# Security and Authentication Guide

This guide covers authentication methods, credential management, and security best practices for the Targetprocess MCP server.

## Table of Contents
- [Authentication Methods](#authentication-methods)
- [Environment Variables Reference](#environment-variables-reference)
- [Security Best Practices](#security-best-practices)
- [Credential Storage](#credential-storage)
- [Common Authentication Errors](#common-authentication-errors)
- [Production Security Checklist](#production-security-checklist)

## Authentication Methods

### 1. Basic Authentication (Username/Password)

**When to use:** Development environments, testing, or when API keys are not available.

**Configuration:**
```bash
export TP_DOMAIN=your-company.tpondemand.com
export TP_USERNAME=your-username
export TP_PASSWORD=your-password
```

**In MCP configuration:**
```json
{
  "mcpServers": {
    "targetprocess": {
      "env": {
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_USERNAME": "your-username",
        "TP_PASSWORD": "your-password"
      }
    }
  }
}
```

### 2. API Key Authentication

**When to use:** Production environments, automated systems, or enhanced security scenarios.

**Obtaining an API Key:**
1. Log into Targetprocess
2. Go to your profile settings
3. Navigate to "Access Tokens" or "API Keys"
4. Generate a new API key with appropriate permissions

**Configuration:**
```bash
export TP_DOMAIN=your-company.tpondemand.com
export TP_API_KEY=your-api-key
```

**In MCP configuration:**
```json
{
  "mcpServers": {
    "targetprocess": {
      "env": {
        "TP_DOMAIN": "your-company.tpondemand.com",
        "TP_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 3. Configuration File Authentication

**When to use:** Local development with version control (use .gitignore!).

**Setup:**
```bash
cp config/targetprocess.example.json config/targetprocess.json
```

**Edit `config/targetprocess.json`:**
```json
{
  "domain": "your-company.tpondemand.com",
  "credentials": {
    "username": "your-username",
    "password": "your-password"
  }
}
```

**⚠️ IMPORTANT:** Always add `config/targetprocess.json` to `.gitignore`!

## Environment Variables Reference

### Core Authentication Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `TP_DOMAIN` | Your Targetprocess domain | Yes | `company.tpondemand.com` |
| `TP_USERNAME` | Username for basic auth | With basic auth | `john.doe@company.com` |
| `TP_PASSWORD` | Password for basic auth | With basic auth | `secure-password` |
| `TP_API_KEY` | API key for token auth | With API auth | `ABC123...` |

### Semantic Operations Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `TP_USER_ROLE` | User role for semantic operations | No | `developer`, `project-manager` |
| `TP_USER_ID` | Targetprocess user ID | No | `12345` |
| `TP_USER_EMAIL` | User email for context | No | `user@company.com` |

### Advanced Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TP_LOG_LEVEL` | Logging verbosity | `info` | `debug`, `warn`, `error` |
| `TP_TIMEOUT` | API request timeout | `30000` | `60000` (ms) |
| `TP_RETRY_ATTEMPTS` | Max retry attempts | `3` | `5` |

## Security Best Practices

### 1. Use API Keys in Production

API keys are more secure than username/password because:
- They can be revoked without changing passwords
- They can have limited permissions
- They're designed for programmatic access

### 2. Never Commit Credentials

**Bad:**
```json
// config/targetprocess.json - DON'T DO THIS
{
  "domain": "company.tpondemand.com",
  "credentials": {
    "password": "actual-password-here"  // NEVER!
  }
}
```

**Good:**
```bash
# Use environment variables
export TP_PASSWORD=$(cat ~/.targetprocess/password)

# Or use a secrets manager
export TP_API_KEY=$(aws secretsmanager get-secret-value --secret-id tp-api-key --query SecretString --output text)
```

### 3. Principle of Least Privilege

Create API keys or user accounts with minimal required permissions:
- Read-only access for reporting tools
- Limited entity access for specific workflows
- Full access only when absolutely necessary

### 4. Rotate Credentials Regularly

- Set up a rotation schedule (e.g., every 90 days)
- Use API keys that can be rotated without service disruption
- Monitor for unauthorized access

### 5. Secure Storage

**Development:**
```bash
# Use a .env file (git-ignored)
echo "TP_API_KEY=your-key" > .env
echo ".env" >> .gitignore
```

**Production:**
- Use environment-specific secret management
- Consider tools like HashiCorp Vault, AWS Secrets Manager
- Never store credentials in Docker images

## Credential Storage

### Claude Code

Claude Code stores MCP server configurations securely:

```bash
# Configurations are stored in:
# macOS: ~/Library/Application Support/Claude/
# Windows: %APPDATA%\Claude\
# Linux: ~/.config/claude/

# These files are not synced or shared
```

### Docker Secrets

For Docker deployments, use secrets:

```bash
# Create secret
echo "your-api-key" | docker secret create tp_api_key -

# Use in docker-compose.yml
services:
  targetprocess-mcp:
    image: targetprocess-mcp
    secrets:
      - tp_api_key
    environment:
      TP_API_KEY_FILE: /run/secrets/tp_api_key
```

### Environment File (.env)

For local development:

```bash
# .env file
TP_DOMAIN=company.tpondemand.com
TP_API_KEY=your-api-key
TP_USER_ROLE=developer
TP_USER_ID=12345

# Load in shell
source .env

# Or use with Docker
docker run --env-file .env targetprocess-mcp
```

## Common Authentication Errors

### "401 Unauthorized"

**Causes:**
- Invalid credentials
- Expired API key
- Account locked or disabled

**Solutions:**
1. Verify credentials are correct
2. Check if API key is still valid
3. Ensure account has API access enabled
4. Try logging into web interface

### "403 Forbidden"

**Causes:**
- Insufficient permissions
- API access disabled for user
- IP restrictions in place

**Solutions:**
1. Check user permissions in Targetprocess
2. Verify API access is enabled for the account
3. Check with administrator for IP allowlists

### "Missing credentials"

**Error:** `Error: No authentication credentials provided`

**Solutions:**
1. Ensure environment variables are set:
   ```bash
   echo $TP_DOMAIN
   echo $TP_USERNAME  # or $TP_API_KEY
   ```
2. Check MCP configuration includes env variables
3. Verify Docker is passing environment variables

### "Invalid domain"

**Error:** `Error: Cannot connect to Targetprocess API`

**Solutions:**
1. Verify domain format (no https://):
   ```bash
   # Correct
   export TP_DOMAIN=company.tpondemand.com
   
   # Wrong
   export TP_DOMAIN=https://company.tpondemand.com
   ```
2. Check network connectivity
3. Verify domain is correct

## Production Security Checklist

### Pre-deployment

- [ ] Use API keys instead of passwords
- [ ] Set up credential rotation schedule
- [ ] Configure minimum required permissions
- [ ] Test with read-only credentials first
- [ ] Document credential management process

### Deployment

- [ ] Use secure credential storage (not in code)
- [ ] Enable HTTPS for all communications
- [ ] Set up monitoring for authentication failures
- [ ] Configure rate limiting if available
- [ ] Use separate credentials per environment

### Post-deployment

- [ ] Regularly audit access logs
- [ ] Monitor for suspicious activity
- [ ] Keep credentials out of logs
- [ ] Regular security reviews
- [ ] Update documentation as needed

## Integration-Specific Security

### Claude Desktop

- Credentials stored in local application data
- Not synced across devices
- Protected by OS user permissions

### Docker

- Use `--env-file` for local development
- Use secrets for production
- Never bake credentials into images

### CI/CD

- Use platform-specific secret management
- GitHub: Use GitHub Secrets
- GitLab: Use CI/CD Variables
- Jenkins: Use Credentials Plugin

## Additional Resources

- [Targetprocess API Documentation](https://dev.targetprocess.com/docs/authentication)
- [Docker Secrets Documentation](https://docs.docker.com/engine/swarm/secrets/)
- [Environment Variables Best Practices](https://12factor.net/config)

## Getting Help

For security-related issues:
1. Check authentication configuration
2. Verify network connectivity
3. Review error messages carefully
4. Contact your Targetprocess administrator
5. Open an issue (without including credentials!)

---

**Remember:** Security is everyone's responsibility. When in doubt, ask for help rather than compromising security.