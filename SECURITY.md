# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.9.x   | :white_check_mark: |
| < 0.9   | :x:                |

## Reporting a Vulnerability

We take the security of the Targetprocess MCP Server seriously. If you have discovered a security vulnerability, please follow these steps:

### 1. Do NOT Create a Public Issue

Security vulnerabilities should be reported privately to prevent exploitation.

### 2. Email the Maintainers

Send details to: aaron@aaronsb.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Time

- Acknowledgment: Within 48 hours
- Initial assessment: Within 1 week
- Fix timeline: Depends on severity

## Security Best Practices

When using this MCP server:

### Authentication
- Use strong passwords or API keys
- Never commit credentials to version control
- Use environment variables for sensitive data
- Rotate credentials regularly

### Input Validation
- The server validates all inputs, but always verify data from external sources
- Be aware of potential injection attacks
- Sanitize data before displaying in UI

### File Operations
- Be cautious with attachment downloads
- Validate file types and sizes
- Never execute downloaded files

### Known Security Considerations

1. **Attachment Processing**
   - Files are downloaded as base64
   - Large files can consume memory
   - Always validate MIME types

2. **API Access**
   - Rate limiting is handled by Targetprocess
   - Be aware of API quota limits
   - Log access for audit purposes

3. **Data Exposure**
   - Entity data may contain sensitive information
   - Implement proper access controls in your application
   - Don't log sensitive data

## Security Features

### Built-in Protections
- Input validation using Zod schemas
- Type-safe operations with TypeScript
- Secure credential handling
- Error messages don't expose internals

### Logging
- Respects MCP_STRICT_MODE for clean stdio
- Sensitive data is never logged
- Configurable log levels

## Vulnerability Disclosure

After a security issue is resolved:
1. We will publish a security advisory
2. Credit will be given to reporters (unless anonymity is requested)
3. Details will be shared to help others protect their installations

## Contact

Security Team Email: aaron@aaronsb.com

For general bugs and features, please use GitHub issues.