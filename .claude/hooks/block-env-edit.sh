#!/usr/bin/env bash
# Block direct edits to .env files (except .env.example).
# Called by PreToolUse hook on Write|Edit.
# Exit 0 = allow, exit 2 = block with message.

FILE_PATH="$1"

# Allow .env.example edits
if [[ "$FILE_PATH" == *".env.example"* ]]; then
  exit 0
fi

# Block all other .env files
if [[ "$FILE_PATH" == *".env"* ]] && [[ "$(basename "$FILE_PATH")" == .env* ]]; then
  echo "BLOCKED: Do not edit .env files directly. Add variables to .env.example and instruct the user to update their .env.local manually."
  exit 2
fi

exit 0
