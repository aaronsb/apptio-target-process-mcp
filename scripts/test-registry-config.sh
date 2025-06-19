#!/bin/bash
# Test script for MCP registry configuration

set -e

echo "Testing MCP Registry Configuration..."

# Test registries.yaml
echo "Validating registries.yaml..."
if [ ! -f "mcp-registries/registries.yaml" ]; then
    echo "ERROR: mcp-registries/registries.yaml not found"
    exit 1
fi

# Use python to parse YAML since yq versions differ
python3 -c "
import yaml
import sys
import os

try:
    with open('mcp-registries/registries.yaml', 'r') as f:
        data = yaml.safe_load(f)
    
    if 'registries' not in data:
        print('✗ registries.yaml missing registries key')
        sys.exit(1)
    
    print('✓ registries.yaml structure is valid')
    
    # Check each registry
    print('\\nChecking registry config files...')
    all_found = True
    
    for registry in data['registries']:
        required_keys = ['name', 'branch', 'config_file']
        for key in required_keys:
            if key not in registry:
                print(f'✗ Registry missing required key: {key}')
                sys.exit(1)
        
        # Check for config file in directory or at root
        if 'directory' in registry and registry['directory']:
            config_path = f\"mcp-registries/{registry['directory']}/{registry['config_file']}\"
        else:
            config_path = f\"mcp-registries/{registry['config_file']}\"
            
        if os.path.exists(config_path):
            print(f\"✓ Found: {config_path}\")
        else:
            print(f\"✗ Missing: {config_path}\")
            all_found = False
    
    if all_found:
        print('\\nAll registry config files found!')
    else:
        print('\\nSome registry config files are missing')
        sys.exit(1)
    
    # Print registry summary
    print('\\nRegistry configuration:')
    for registry in data['registries']:
        print(f\"- {registry['name']} (branch: {registry['branch']})\")
    
except Exception as e:
    print(f'✗ Error parsing YAML: {e}')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    echo "YAML validation failed"
    exit 1
fi

# Validate GitHub workflow
echo ""
echo "Validating GitHub workflow..."
if [ -f ".github/workflows/sync-mcp-registries.yml" ]; then
    echo "✓ GitHub workflow file exists"
    # Basic YAML validation using python
    python3 -c "
import yaml
try:
    with open('.github/workflows/sync-mcp-registries.yml', 'r') as f:
        yaml.safe_load(f)
    print('✓ GitHub workflow YAML is valid')
except Exception as e:
    print(f'✗ GitHub workflow YAML is invalid: {e}')
    exit(1)
"
else
    echo "✗ GitHub workflow file not found"
    exit 1
fi

echo ""
echo "All tests passed! ✓"