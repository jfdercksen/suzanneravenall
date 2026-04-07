---
name: restore-session
description: Recover full context from previous sessions. Use at the start of any session to pick up where you left off. Reads BUILD_STATUS.md, KNOWN_ISSUES.md, DECISIONS.md, and recent git history to rebuild working context.
allowed-tools: Read, Glob, Grep, Bash
---

# Restore Session

Rebuild full working context from persistent session files and git history.

## Process

### Step 1 — Read session files
Read these files in order:
1. `BUILD_STATUS.md` — current phase, current task, what is done, what is pending
2. `KNOWN_ISSUES.md` — open issues that may affect current work
3. `DECISIONS.md` — architectural decisions that constrain implementation

### Step 2 — Read recent git history
```bash
git log --oneline -15
git branch --show-current
git status --short
git diff --stat HEAD~3..HEAD
```

### Step 3 — Check for in-progress work
```bash
git stash list
git branch --list "feature/*" --list "fix/*" --list "integration/*"
```

### Step 4 — Read CLAUDE.md route map
Check which routes exist and which are pending.

### Step 5 — Summarise context
Present a clear summary:

```
## Session Restored

**Current phase:** {phase}
**Current task:** {task}
**Branch:** {branch}
**Last commit:** {hash} — {message}

### What was done last session
- {list of recent changes from git log}

### What needs to happen next
- {next task from BUILD_STATUS.md}

### Open issues affecting current work
- {relevant KI entries}

### Key decisions to remember
- {relevant decisions from DECISIONS.md}

Ready to continue. What would you like to work on?
```

## Rules
- Read files, do not modify them
- Present the summary clearly — this is the first thing the developer sees
- Flag any conflicts between BUILD_STATUS.md and actual git state
- If BUILD_STATUS.md is stale (last updated date is old), note it
