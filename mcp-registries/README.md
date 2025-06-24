# MCP Registry Configuration

This directory contains configuration files for various MCP (Model Context Protocol) registries. The system automatically maintains separate branches for each registry platform, keeping their configuration files isolated from the main development branch.

## Directory Structure

```
mcp-registries/
├── README.md           # This file
├── registries.yaml     # Registry definitions and branch mappings
├── smithery/           # Smithery.ai registry directory
│   ├── smithery.yaml   # Configuration file
│   └── (future: logo, instructions, etc.)
├── cprime/             # Cprime registry directory
│   ├── cprime.yaml     # Configuration file
│   └── (future: logo, instructions, etc.)
└── [other-registry]/   # Other registry directories
```

## How It Works

### 1. Registry Definition (`registries.yaml`)
This file defines all MCP registries and their configurations:

```yaml
registries:
  - name: smithery.ai           # Registry platform name
    branch: smithery            # Git branch name for this registry
    directory: smithery         # Subdirectory containing registry files
    config_file: smithery.yaml  # Config filename within the directory
    description: "Smithery AI MCP Registry"
```

### 2. Registry Directories
Each registry has its own subdirectory containing:
- **Configuration file** (e.g., `smithery.yaml`) - Required platform-specific settings
- **Future additions** - Logos, custom instructions, additional metadata, etc.

### 3. Automated Branch Management
The GitHub Action workflow (`.github/workflows/sync-mcp-registries.yml`) runs on every push to main and:

1. **Reads** the `registries.yaml` file to get all registry definitions
2. **Creates or updates** a branch for each registry (e.g., `smithery` branch)
3. **Merges** the latest changes from main into each registry branch
4. **Copies** the platform-specific config file to the root of that branch
5. **Pushes** the updated branch to GitHub

### Branch Structure Example
```
main branch:
├── src/
├── docs/
├── mcp-registries/
│   ├── registries.yaml
│   ├── smithery/
│   │   └── smithery.yaml
│   └── cprime/
│       └── cprime.yaml
└── (no registry configs at root)

smithery branch (auto-generated):
├── src/
├── docs/
├── mcp-registries/
│   ├── registries.yaml
│   ├── smithery/
│   │   └── smithery.yaml
│   └── cprime/
│       └── cprime.yaml
└── smithery.yaml  ← Automatically copied to root
```

## Adding a New Registry

### Step 1: Create Registry Directory
```bash
mkdir mcp-registries/example-registry
```

### Step 2: Update `registries.yaml`
Add your new registry to the list:

```yaml
registries:
  - name: smithery.ai
    branch: smithery
    directory: smithery
    config_file: smithery.yaml
    description: "Smithery AI MCP Registry"
    
  # Add your new registry:
  - name: example-registry.com
    branch: example-registry
    directory: example-registry
    config_file: example-config.yaml
    description: "Example MCP Registry"
```

### Step 3: Create the Configuration File
Create `mcp-registries/example-registry/example-config.yaml` with the registry's required configuration.

### Step 4: Add Optional Files (if needed)
You can add additional files to the registry directory:
- `logo.png` - Registry logo
- `instructions.md` - Custom setup instructions
- Other metadata files

### Step 5: Commit and Push
```bash
git add mcp-registries/registries.yaml mcp-registries/example-registry/
git commit -m "Add example-registry.com configuration"
git push origin main
```

The GitHub Action will automatically:
- Create the `example-registry` branch
- Copy all files from main
- Place `example-config.yaml` at the root
- Push the branch to GitHub

## Testing Configuration

Run the test script to validate your configuration before committing:

```bash
./scripts/test-registry-config.sh
```

This will check:
- YAML syntax validity
- Required fields in registry definitions
- Existence of referenced configuration files

## Important Notes

### ⚠️ Branch Management Rules
- **Never commit directly to registry branches** - they are automatically maintained
- **All development happens on main** - registry branches are read-only
- **Force pushes** - Registry branches may be force-pushed to stay in sync
- **One-way sync** - Changes flow from main → registry branches only

### 🔄 Workflow Triggers
The sync workflow runs:
- On every push to the main branch
- Can be manually triggered via GitHub Actions UI
- Skips when only registry configs are changed (to prevent loops)

### 📦 What Gets Synced
Each registry branch contains:
- All files from the main branch
- The registry's config file copied to the root
- A `BRANCH_README.md` explaining the branch purpose

## Registry Branch URLs

When configuring registry systems to pull from specific branches, use these URL patterns:

### Clone/Pull URLs

**HTTPS (Public Access)**
```bash
# Clone a specific branch
git clone -b smithery https://github.com/aaronsb/apptio-target-process-mcp.git

# Direct branch URL for systems that need it
https://github.com/aaronsb/apptio-target-process-mcp.git#smithery
https://github.com/aaronsb/apptio-target-process-mcp.git#cprime
```

**SSH (Authenticated Access)**
```bash
# Clone a specific branch
git clone -b smithery git@github.com:aaronsb/apptio-target-process-mcp.git

# Direct branch URL
git@github.com:aaronsb/apptio-target-process-mcp.git#smithery
git@github.com:aaronsb/apptio-target-process-mcp.git#cprime
```

### Registry System URLs

Many MCP registry systems accept URLs in these formats:

1. **GitHub URL with branch reference**:
   ```
   https://github.com/aaronsb/apptio-target-process-mcp/tree/smithery
   https://github.com/aaronsb/apptio-target-process-mcp/tree/cprime
   ```

2. **Git URL with branch fragment**:
   ```
   https://github.com/aaronsb/apptio-target-process-mcp.git#smithery
   https://github.com/aaronsb/apptio-target-process-mcp.git#cprime
   ```

3. **Raw file access** (for specific files):
   ```
   https://raw.githubusercontent.com/aaronsb/apptio-target-process-mcp/smithery/smithery.yaml
   https://raw.githubusercontent.com/aaronsb/apptio-target-process-mcp/cprime/cprime.yaml
   ```

The exact format depends on what the registry system expects. Most modern systems support the `#branch` notation or allow you to specify the branch separately in their configuration.

## Troubleshooting

### Registry branch not updating
1. Check GitHub Actions tab for workflow runs
2. Ensure the registry is properly defined in `registries.yaml`
3. Verify the config file exists in `mcp-registries/`

### Merge conflicts
The workflow automatically resolves conflicts by preferring main branch changes. If you need different behavior, modify the workflow file.

### Manual sync
Trigger the workflow manually from GitHub Actions tab if needed.