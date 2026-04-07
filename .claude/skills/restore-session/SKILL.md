---
name: restore-session
description: Recover full context from the previous Claude Code session. Use at the start of any new session to pick up exactly where you left off. Automatically reads BUILD_STATUS.md, DECISIONS.md, KNOWN_ISSUES.md and recent git history.
allowed-tools: Bash, Read, Glob
---

# Restore Session

Recover full context from previous Claude Code sessions and present 
a clear summary of the current project state.

## Process

### Step 1 — Read session continuity files
```bash
cat BUILD_STATUS.md 2>/dev/null
cat DECISIONS.md 2>/dev/null
cat KNOWN_ISSUES.md 2>/dev/null
```

### Step 2 — Read recent git activity
```bash
git log --oneline -10 2>/dev/null
git status 2>/dev/null
git branch --show-current 2>/dev/null
```

### Step 3 — Read recent session files
```bash
ls -lt ~/.claude/projects/ 2>/dev/null | head -5
```

### Step 4 — Check current working state
```bash
docker-compose ps 2>/dev/null | head -20
```

### Step 5 — Present summary

Report back in this exact format:

---
## Session Restored — [Project Name]

**Current Phase:** [from BUILD_STATUS.md]
**Current Task:** [from BUILD_STATUS.md]
**Current Branch:** [from git]
**Last Updated:** [from BUILD_STATUS.md]

**Open Issues:**
[list from KNOWN_ISSUES.md active issues]

**Recent Commits:**
[last 5 from git log]

**Infrastructure Status:**
[docker-compose ps summary]

**Recommended next action:**
[based on current phase and task]

**Confirm:** Is this correct? Any changes before we start?
---

Wait for developer confirmation before doing anything else.
