#!/bin/bash
set -e

# Run local development image with provided credentials
docker run --rm -i \
  -e TP_API_KEY=***REMOVED*** \
  apptio-target-process-mcp:local
