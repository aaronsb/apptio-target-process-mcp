# MCP Registry Configuration

This directory contains configuration files for various MCP (Model Context Protocol) registries.

## How it works

1. **registries.yaml** - Defines all MCP registries and their configuration
2. **Platform-specific files** - Contains the actual configuration required by each registry (e.g., smithery.yaml)

## GitHub Action Workflow

The `.github/workflows/sync-mcp-registries.yml` workflow automatically:

1. Reads the `registries.yaml` file
2. Creates/updates a branch for each registry
3. Merges latest changes from main into each registry branch
4. Copies the platform-specific configuration file to the root of that branch
5. Pushes the updated branch

## Adding a new registry

1. Add the registry configuration to `registries.yaml`:
   ```yaml
   - name: new-registry.com
     branch: new-registry
     config_file: new-registry.yaml
     description: "Description of the registry"
   ```

2. Create the configuration file (e.g., `mcp-registries/new-registry.yaml`)

3. Commit to main and the GitHub Action will automatically create and maintain the branch

## Important Notes

- Never commit directly to registry branches - they are automatically maintained
- All development should happen on the main branch
- Registry branches are force-pushed to ensure they stay in sync with main
- Each registry branch contains only the files from main plus its specific config file