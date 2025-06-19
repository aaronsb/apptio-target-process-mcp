# Contributing to Targetprocess MCP Server

First off, thank you for considering contributing to the Targetprocess MCP Server! It's people like you that make this project such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible using our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue using our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) and provide as much detail as possible.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code follows the existing style.
6. Issue that pull request using our [PR template](.github/pull_request_template.md)!

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Targetprocess instance for testing
- Git

### Local Development

1. Clone your fork:
   ```bash
   git clone https://github.com/your-username/apptio-target-process-mcp.git
   cd apptio-target-process-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Targetprocess credentials
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Run tests:
   ```bash
   npm test
   ```

6. Run the MCP inspector for testing:
   ```bash
   npm run inspector
   ```

### Code Style

- We use TypeScript for type safety
- Follow the existing code style (enforced by linting)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

Run linting:
```bash
npm run lint
```

### Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting PR
- Include both positive and negative test cases
- Mock external API calls in tests

### Documentation

- Update README.md if you change functionality
- Add/update tool documentation in `/docs/tools/`
- Include JSDoc comments for public APIs
- Update CLAUDE.md if adding new patterns

## Project Structure

```
├── src/
│   ├── api/          # API client and services
│   ├── entities/     # Entity definitions
│   ├── tools/        # MCP tools
│   ├── operations/   # Semantic operations
│   ├── utils/        # Utilities
│   └── server.ts     # Main server
├── docs/             # Documentation
├── config/           # Configuration files
└── scripts/          # Build and utility scripts
```

## Adding New Features

### Adding a New Tool

1. Create tool file in `src/tools/[category]/[tool-name].tool.ts`
2. Implement the tool interface
3. Add Zod schema for validation
4. Register in `src/server.ts`
5. Add documentation in `docs/tools/[tool-name].md`
6. Add tests

Example structure:
```typescript
export class MyNewTool {
  constructor(private service: TPService) {}
  
  async execute(args: unknown) {
    const input = myToolSchema.parse(args);
    // Implementation
  }
}
```

### Adding a New Entity Type

1. Create entity file in `src/entities/[entity-name].entity.ts`
2. Extend appropriate base class
3. Add to entity registry
4. Update type definitions

### Adding Semantic Operations

1. Create operation in `src/operations/[category]/[operation].ts`
2. Implement `SemanticOperation` interface
3. Register in appropriate feature module
4. Add to personality configuration

## Commit Messages

We follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add attachment download tool
fix: handle null values in entity search
docs: update installation guide
```

## Release Process

1. Ensure all tests pass
2. Update version in `package.json`
3. Update CHANGELOG.md
4. Create a pull request
5. After merge, tag the release

## Security

- Never commit credentials or secrets
- Validate all user input
- Be aware of injection attacks (see SECURITY.md)
- Report security issues privately

## Questions?

Feel free to open an issue with the question tag or start a discussion in GitHub Discussions.

Thank you for contributing! 🎉