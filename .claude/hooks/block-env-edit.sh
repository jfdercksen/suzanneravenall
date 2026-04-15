#!/bin/bash
# Stub — blocks edits to .env files
if [[ "$CLAUDE_TOOL_INPUT" == *".env"* ]]; then
  echo "Direct .env edits are blocked. Use .env.example instead."
  exit 2
fi
exit 0
