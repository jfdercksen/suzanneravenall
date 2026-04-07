#!/usr/bin/env bash
# Block git commit if the last vitest run failed.
# Called by PreToolUse hook on Bash(git commit*).
# Exit 0 = allow, exit 2 = block with message.

RESULT_FILE=".tmp/last-test-result.txt"

# If no test result file exists, allow the commit (tests may not have been run yet)
if [ ! -f "$RESULT_FILE" ]; then
  exit 0
fi

RESULT=$(cat "$RESULT_FILE")

if [ "$RESULT" != "pass" ]; then
  echo "BLOCKED: Tests are not passing. Run 'npx vitest run' and fix failures before committing."
  exit 2
fi

exit 0
