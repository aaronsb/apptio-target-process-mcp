#!/bin/bash
set -e

# Run local development image with provided credentials
docker run --rm -i \
  -e TP_USERNAME=system \
  -e TP_PASSWORD=DUZA69teBEgxwKx \
  apptio-target-process-mcp:local
