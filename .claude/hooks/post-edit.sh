#!/usr/bin/env bash
# Auto-format and type-check TypeScript/JavaScript files after edits.
# Called by PostToolUse hook on Write|Edit.
# Exit 0 always — formatting/type-check failures are advisory, not blocking.

FILE_PATH="$1"

# Only process TypeScript and JavaScript files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  exit 0
fi

# Auto-format with Prettier (if available)
if command -v npx &> /dev/null && [ -f "node_modules/.bin/prettier" ]; then
  npx prettier --write "$FILE_PATH" 2>/dev/null
fi

# Run TypeScript type-check on .ts/.tsx files only
if [[ "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  if command -v npx &> /dev/null && [ -f "tsconfig.json" ]; then
    npx tsc --noEmit --pretty 2>&1 | head -20
  fi
fi

exit 0
