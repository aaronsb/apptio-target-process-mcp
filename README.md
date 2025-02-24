# TargetProcess API Integration

A TypeScript implementation for interacting with TargetProcess API using the [NewOrbit TargetProcess REST API](https://github.com/NewOrbit/targetprocess-rest-api) library.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript files:
```bash
npm run build
```

3. Run the example implementation:
```bash
node build/test-targetprocess.js
```

## Docker Deployment

This project can be run as a Docker container supporting both ARM64 and AMD64 architectures.

### Local Docker Build

Build and run locally:
```bash
# Build for your local architecture
docker build -t target-process-mcp .

# Run the container
docker run -i --rm target-process-mcp
```

### Multi-Architecture Build

For building multiple architectures locally:
```bash
# Set up buildx builder
docker buildx create --use

# Build and push multi-arch images
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/aaronsb/target-process-mcp:latest \
  --push .
```

### GitHub Actions

The project includes GitHub Actions workflows that automatically:
- Build multi-architecture images (AMD64 and ARM64)
- Push to GitHub Container Registry
- Tag images based on git refs and versions
- Cache build layers for faster builds

Images are published to `ghcr.io/aaronsb/target-process-mcp` with tags for:
- Git branches
- Pull requests
- Semantic versions
- Git SHA

## Configuration

This project uses configuration files to manage TargetProcess credentials and settings. To protect sensitive data:

1. Copy the example configuration:
```bash
cp config/targetprocess.example.json config/targetprocess.json
```

2. Edit `config/targetprocess.json` with your credentials:
```json
{
  "domain": "your-subdomain.tpondemand.com",
  "credentials": {
    "username": "System",
    "password": "your-password"
  }
}
```

**Important Security Notes:**
- Never commit `config/targetprocess.json` to version control
- Keep your credentials secure and never share them
- Use environment variables in production environments

## API Usage

The implementation uses the NewOrbit TypeScript wrapper which provides a clean interface to the TargetProcess API:

```typescript
import { Targetprocess } from "targetprocess-rest-api";

// Initialize the API client
const api = new Targetprocess(domain, username, password);

// Get a user story
const story = await api.getStory(storyId);

// Get a task
const task = await api.getTask(taskId);

// Get a bug
const bug = await api.getBug(bugId);

// Add time entry
const time = await api.addTime(
  entityId,
  spent,    // hours spent
  remain,   // hours remaining
  date,     // Date object
  description
);
```

## API Features

The NewOrbit library provides access to core TargetProcess functionality:

1. Entity Retrieval
   - User Stories
   - Tasks
   - Bugs

2. Time Management
   - Add time entries to entities
   - Track spent/remaining time

3. Error Handling
   - Status code based errors
   - Descriptive error messages

## Notes

- The library handles authentication and request formatting
- Responses are automatically parsed from JSON
- Error handling includes HTTP status codes and messages
- Time entries may require specific permissions in TargetProcess
