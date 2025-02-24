#!/bin/bash
set -e

# Run local development image with provided credentials
docker run --rm -i \
  -e TP_USERNAME=system \
  -e TP_PASSWORD=***REMOVED*** \
  apptio-target-process-mcp:local
