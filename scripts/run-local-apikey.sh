#!/bin/bash
set -e

# Run local development image with provided credentials
docker run --rm -i \
  -e TP_API_KEY=DUZA69teBEgxwKx \
  apptio-target-process-mcp:local
