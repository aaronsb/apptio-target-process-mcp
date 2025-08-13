# Local Development Configuration Guide

This guide walks you through setting up the Targetprocess MCP Server for local development, including configuration options, role-based tooling, and testing workflows.

## Prerequisites

Before you begin, ensure you have the following installed:

### Node.js and npm
- **Node.js 18+** (with ES modules support)
- **npm 9+** (bundled with Node.js)

Check your versions:
```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

### Git
- **Git 2.x+** for version control
```bash
git --version
```

### Targetprocess Access
- A Targetprocess instance (e.g., `your-company.tpondemand.com`)
- Valid credentials (username/password OR API key)
- Appropriate permissions to access entities you want to work with

## Repository Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aaronsb/apptio-target-process-mcp.git
cd apptio-target-process-mcp
```

### 2. Install Dependencies

```bash
npm install
```

This installs all production dependencies and development tools, including:
- TypeScript compiler and type definitions
- Jest for testing
- ESLint for code quality
- MCP SDK for Model Context Protocol support

### 3. Build the Project

```bash
npm run build
```

This command will:
- Run security checks for secrets in code
- Compile TypeScript to JavaScript
- Create the `build/` directory with executable files
- Make the main entry point executable

## Configuration

The server supports two configuration methods: **configuration files** (recommended for development) and **environment variables** (recommended for production/containers).

### Configuration Files (Recommended)

Configuration files provide better organization and are easier to manage during development.

#### Option 1: Username/Password Authentication

Create `config/targetprocess.json`:

```bash
cp config/targetprocess.example.json config/targetprocess.json
```

Edit the file with your credentials:
```json
{
  "domain": "your-company.tpondemand.com",
  "credentials": {
    "username": "your-username",
    "password": "your-password"
  }
}
```

#### Option 2: API Key Authentication (Recommended)

Create `config/targetprocess-api.json`:

```bash
cp config/targetprocess-api.example.json config/targetprocess-api.json
```

Edit the file with your API key:
```json
{
  "domain": "your-company.tpondemand.com",
  "apiKey": "your-api-key-here"
}
```

> **Tip:** API keys are more secure than username/password combinations and are the recommended authentication method.

### Environment Variables (Alternative)

If you prefer environment variables, create a `.env` file:

```bash
# Quick setup using the provided script
./scripts/setup-env.sh
```

Or manually create `.env`:
```bash
# Targetprocess connection
TP_DOMAIN=your-company.tpondemand.com
TP_USERNAME=your-username
TP_PASSWORD=your-password

# OR use API key instead
TP_API_KEY=your-api-key-here

# Optional: Role-based configuration
TP_USER_ROLE=developer
TP_USER_ID=12345
TP_USER_EMAIL=your-email@company.com
```

### Configuration Priority

The server loads configuration in this order (later sources override earlier ones):
1. Configuration files (`config/targetprocess.json` or `config/targetprocess-api.json`)
2. Environment variables (`.env` file or system environment)
3. Command-line arguments (when supported)

## Role-Based Tool Configuration

### Understanding Tool Categories

The MCP server provides **two categories of tools**:

1. **Core Tools** - Always available, provide semantic hints and intelligent responses:
   - `search_entities` - Search for any Targetprocess entity
   - `get_entity` - Get detailed information about a specific entity
   - `create_entity` - Create new entities with validation
   - `update_entity` - Update existing entities
   - `inspect_object` - Inspect entity types and properties
   - `comment` - Unified comment management (add, view, delete, analyze)

2. **Role-Specific Tools** - Additional specialized tools based on configured role:
   - Only available when `TP_USER_ROLE` is configured
   - Provide workflow-optimized operations for specific user types
   - Include intelligent context and suggestions

### Available Roles

#### Developer Role (`TP_USER_ROLE=developer`)

Adds developer-focused tools for task management:

**Additional Tools:**
- `show_my_tasks` - View your assigned tasks with priority filtering
- `start_working_on` - Begin work on a task with state management
- `complete_task` - Mark tasks complete with time logging
- `show_my_bugs` - Analyze your assigned bugs with severity insights
- `log_time` - Record time spent with intelligent discovery
- `add_comment` - Add contextual comments with workflow awareness
- `show_comments` - View comments with hierarchical organization
- `delete_comment` - Delete comments with ownership validation
- `analyze_attachment` - AI-powered attachment analysis

**Workflow Features:**
- Automatic task state transitions
- Time tracking integration
- Bug analysis and reporting
- Code review workflow support

#### Project Manager Role (`TP_USER_ROLE=project-manager`)

Adds project management tools:

**Additional Tools:**
- Sprint planning and management
- Team workload analysis
- Project health reporting
- Resource allocation tools

#### Product Owner Role (`TP_USER_ROLE=product-owner`)

Adds product management tools:

**Additional Tools:**
- Backlog prioritization
- User story management
- Release planning
- Stakeholder reporting

#### Tester Role (`TP_USER_ROLE=tester`)

Adds testing-focused tools:

**Additional Tools:**
- Test case management
- Bug reporting and tracking
- Test execution workflows
- Quality metrics

### Configuring Your Role

To enable role-specific tools, set these environment variables:

```bash
# Required: Your role
TP_USER_ROLE=developer

# Recommended: Your user information for assignments and time tracking
TP_USER_ID=12345  # Your Targetprocess user ID
TP_USER_EMAIL=your-email@company.com
```

**Finding Your User ID:**
```bash
# After building the project, you can search for your user
npm run inspector
# Then use: search_entities({ type: 'User', where: 'Email = "your-email@company.com"' })
```

## Running Locally

### Development Scripts

The project includes several npm scripts for different development workflows:

```bash
# Build once (production build)
npm run build

# Development with auto-rebuild (recommended)
npm run watch

# Run tests
npm run test

# Run linting
npm run lint

# Run MCP inspector for testing tools
npm run inspector

# Start the built server directly
npm start
# or
npm run mcp
```

### Watch Mode for Development

For active development, use watch mode to automatically rebuild when you change files:

```bash
# Start TypeScript compiler in watch mode
npm run watch
```

Keep this running in one terminal. In another terminal, you can test changes immediately:

```bash
# Test your changes with the inspector
npm run inspector
```

### Manual Server Execution

You can also run the server directly:

```bash
# Run the built JavaScript
node build/index.js

# Run with specific config file
CONFIG_PATH=config/targetprocess-api.json node build/index.js

# Run with environment variables
TP_DOMAIN=your-company.tpondemand.com TP_API_KEY=your-key node build/index.js
```

## Testing Your Setup

### 1. Build and Basic Test

```bash
# Clean build
npm run build

# Verify the server starts without errors
node build/index.js --help 2>/dev/null || echo "Server executable created successfully"
```

### 2. MCP Inspector Testing

The MCP Inspector provides an interactive interface for testing your tools:

```bash
# Start the inspector
npm run inspector
```

This opens a web interface where you can:
- View all available tools (core + role-specific)
- Test tool calls with real data
- Inspect tool schemas and parameters
- Debug authentication and connection issues

**Basic Test Sequence:**
1. Start with `inspect_object` to verify connection:
   ```json
   {
     "action": "list_types"
   }
   ```

2. Search for entities to test data access:
   ```json
   {
     "type": "UserStory",
     "take": 5
   }
   ```

3. If you configured a role, test role-specific tools:
   ```json
   {
     "take": 10
   }
   ```

### 3. Integration Testing

Test the full integration with Claude Code:

```bash
# Quick setup (includes Claude Code integration)
./scripts/dev-setup.sh
```

This script will:
- Install dependencies
- Build the project
- Set up environment configuration
- Add the MCP server to Claude Code
- Provide next steps for testing

## Troubleshooting

### Common Issues

#### Build Failures

**Problem:** TypeScript compilation errors
```bash
npm run build
# ✗ TypeScript compilation failed
```

**Solutions:**
1. Check for syntax errors in your TypeScript files
2. Ensure all dependencies are installed: `npm install`
3. Check TypeScript version: `npx tsc --version`
4. View detailed errors: `cat /tmp/apptio-mcp-tsc.log`

#### Authentication Failures

**Problem:** "Unauthorized" or connection errors

**Solutions:**
1. Verify your domain format (should include `.tpondemand.com`)
2. Test credentials directly in Targetprocess web interface
3. For API keys, ensure they have sufficient permissions
4. Check network connectivity to your Targetprocess instance

#### Missing Role-Specific Tools

**Problem:** Expected tools like `show_my_tasks` are not available

**Solutions:**
1. Verify `TP_USER_ROLE` is set correctly
2. Check that user ID and email are configured
3. Restart the server after changing role configuration
4. Use MCP inspector to verify available tools

#### Permission Errors

**Problem:** "Access denied" when using tools

**Solutions:**
1. Verify your Targetprocess user has appropriate permissions
2. Check that you're accessing entities within your project scope
3. Some operations require specific roles in Targetprocess
4. API keys may have limited scopes

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Enable verbose logging
DEBUG=* node build/index.js

# Enable MCP-specific logging
DEBUG=mcp:* node build/index.js
```

### Getting Help

1. **Check the logs:** Most build and runtime logs are saved to `/tmp/apptio-mcp-*.log`
2. **Review documentation:** Additional guides in `docs/` directory
3. **Test with inspector:** Use `npm run inspector` to isolate issues
4. **Verify configuration:** Double-check your `config/` files and `.env`

## Next Steps

After successfully setting up local development:

1. **Explore the codebase:** Review `src/` directory structure
2. **Read architecture docs:** Check `docs/architecture/` for system design
3. **Review role-specific guides:** See `docs/semantic-operations/` for your role
4. **Try advanced features:** Explore use cases in `docs/use-cases/`
5. **Contribute:** See `CONTRIBUTING.md` for development guidelines

## Development Workflow Summary

Here's a typical development workflow:

```bash
# 1. Set up your environment (one time)
./scripts/dev-setup.sh

# 2. Start development mode
npm run watch

# 3. In another terminal, test your changes
npm run inspector

# 4. Run tests when ready
npm run test

# 5. Build for integration testing
npm run build

# 6. Test with Claude Code (if configured)
# Use Claude Code interface to test your MCP server
```

This setup gives you a complete development environment with hot reloading, comprehensive testing tools, and easy integration with AI assistants.