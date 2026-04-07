#!/usr/bin/env bash
# Load git context at session start.
# Called by SessionStart hook.

echo "=== SESSION CONTEXT ==="
echo ""

# Current branch
echo "Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo ""

# Git status (short)
echo "--- Git Status ---"
git status --short 2>/dev/null || echo "Not a git repository"
echo ""

# Recent commits (last 5)
echo "--- Recent Commits ---"
git log --oneline -5 2>/dev/null || echo "No git history"
echo ""

# Open TODOs in BUILD_STATUS.md
if [ -f "BUILD_STATUS.md" ]; then
  echo "--- Build Status ---"
  grep -E "^Current Phase:|^Current Task:" BUILD_STATUS.md 2>/dev/null
  echo ""
fi

# Known issues count
if [ -f "KNOWN_ISSUES.md" ]; then
  OPEN_COUNT=$(grep -c "| Open" KNOWN_ISSUES.md 2>/dev/null || echo "0")
  echo "Open known issues: $OPEN_COUNT"
fi

echo "===================="
exit 0
