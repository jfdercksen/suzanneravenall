# Agent Teams — Master Reference Guide

> Use this guide to design effective agent teams for any project. Read it before spawning a team.

---

## What Are Agent Teams

Agent teams let you coordinate multiple Claude Code instances working together. One session is the **team lead** — it creates the team, assigns tasks, and synthesizes results. **Teammates** work independently in their own context windows and can communicate directly with each other.

**Requires:** Claude Code v2.1.32+ and `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `settings.json` (already set in this template).

---

## Agent Teams vs Subagents — Choose the Right Tool

| | Subagents | Agent Teams |
|---|---|---|
| **Context** | Own window; results return to caller | Own window; fully independent |
| **Communication** | Report back to main agent only | Teammates message each other directly |
| **Coordination** | Main agent manages all work | Shared task list, self-coordinating |
| **Best for** | Focused tasks where only the result matters | Complex work needing discussion + collaboration |
| **Token cost** | Lower | Higher — each teammate is a separate Claude instance |

**Use subagents when:** you need quick, focused workers that report back (code review, QA, research).

**Use agent teams when:** teammates need to share findings, challenge each other, or coordinate on their own (parallel feature development, competing hypotheses, cross-layer changes).

---

## Architecture

```
Team Lead (main session)
├── Shared Task List  ← all agents read/write this
├── Mailbox           ← messaging between agents
├── Teammate A        ← independent Claude session
├── Teammate B        ← independent Claude session
└── Teammate C        ← independent Claude session
```

| Component | Role |
|-----------|------|
| **Team lead** | Creates team, spawns teammates, assigns tasks, synthesizes results |
| **Teammates** | Separate Claude instances, each owns a slice of work |
| **Task list** | Shared work items with states: pending → in progress → completed |
| **Mailbox** | Direct messaging between any two agents |

**Stored locally:**
- Team config: `~/.claude/teams/{team-name}/config.json`
- Task list: `~/.claude/tasks/{team-name}/`

---

## Enabling Agent Teams

Already enabled in this template via `settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

---

## Display Modes

| Mode | How it works | When to use |
|------|-------------|-------------|
| `auto` (default) | Split panes if in tmux, in-process otherwise | Good default |
| `in-process` | All teammates in one terminal, Shift+Down to cycle | Any terminal, no extra setup |
| `tmux` | Each teammate in its own pane | When you want to see all output at once |

```bash
# Force in-process for a session
claude --teammate-mode in-process
```

**Navigation (in-process mode):**
- `Shift+Down` — cycle through teammates
- `Enter` — view a teammate's session
- `Escape` — interrupt current turn
- `Ctrl+T` — toggle task list

---

## When Agent Teams Add Real Value

**Best use cases:**
1. **Parallel research/review** — multiple teammates investigate different aspects simultaneously
2. **New modules or features** — each teammate owns a separate piece with no file conflicts
3. **Competing hypotheses** — teammates test different theories in parallel (great for debugging)
4. **Cross-layer changes** — frontend, backend, and tests each owned by a different teammate

**When NOT to use agent teams:**
- Sequential tasks where step B depends on step A
- Same-file edits (causes overwrites)
- Simple, focused tasks (subagents are cheaper and faster)
- Tasks with many interdependencies

---

## Designing an Effective Team

### Team Size
- **Start with 3–5 teammates** for most workflows
- **5–6 tasks per teammate** keeps everyone productive
- Token costs scale linearly — more teammates = more cost
- Three focused teammates often outperform five scattered ones

### Task Sizing
| Size | Problem | Fix |
|------|---------|-----|
| Too small | Coordination overhead exceeds benefit | Merge tasks |
| Too large | Teammate works too long without check-ins | Split into smaller units |
| Just right | Self-contained, clear deliverable (a function, a test file, a review) | Keep it |

### Context for Teammates
Teammates load `CLAUDE.md`, MCP servers, and skills automatically — **but do not inherit the lead's conversation history.**

Always include task-specific context in the spawn prompt:
```
Spawn a security reviewer teammate with the prompt:
"Review src/auth/ for security vulnerabilities.
Focus on token handling, session management, and input validation.
The app uses JWT tokens in httpOnly cookies.
Report issues with severity ratings."
```

---

## Spawn Prompt Patterns

### Parallel Research
```
Create an agent team to research [topic] from different angles:
- One teammate on [angle A]
- One teammate on [angle B]
- One teammate on [angle C]
Have them share findings with each other and synthesize a conclusion.
```

### Parallel Code Review
```
Create an agent team to review [PR/file/module]:
- One reviewer focused on security
- One checking performance
- One validating test coverage
Have them each review and report findings to the lead.
```

### Competing Hypotheses (Debugging)
```
Spawn [N] teammates to investigate [bug]. Each takes a different hypothesis:
- Teammate 1: [hypothesis A]
- Teammate 2: [hypothesis B]
- Teammate 3: [hypothesis C]
Have them actively try to disprove each other's theories.
Update [findings doc] with whatever consensus emerges.
```

### Parallel Feature Development
```
Create a team with [N] teammates to build [feature] in parallel.
Each teammate owns a separate module with no file overlap:
- Teammate 1: [module A]
- Teammate 2: [module B]
- Teammate 3: [module C]
Use Sonnet for each teammate.
```

### Plan-Before-Implement (Risky Changes)
```
Spawn an [role] teammate to [task].
Require plan approval before they make any changes.
Only approve plans that [your criteria, e.g. "include test coverage"].
```

---

## Task Management

Tasks have three states: **pending → in progress → completed**

Tasks can depend on other tasks — a pending task with unresolved dependencies cannot be claimed until those are done. The system manages this automatically.

**Claiming:**
- Lead assigns explicitly, OR
- Teammates self-claim the next unblocked task after finishing

**If a task appears stuck:**
- Check if the work is actually done
- Tell the lead to nudge the teammate
- Update task status manually if needed

---

## Communication Between Agents

| Method | Use |
|--------|-----|
| `message` | Send to one specific teammate |
| `broadcast` | Send to all teammates — use sparingly (costs scale with team size) |
| Idle notification | Automatic — teammate notifies lead when finished |

---

## Hooks for Quality Gates

Use hooks to enforce standards automatically:

| Hook | Trigger | Use Case |
|------|---------|---------|
| `TeammateIdle` | Teammate about to go idle | Exit code 2 to send feedback and keep them working |
| `TaskCompleted` | Task being marked complete | Exit code 2 to reject completion and send feedback |

Example: reject task completion if tests aren't passing.

---

## Lifecycle — Start to Finish

```
1. Enable (settings.json already done)
2. Spawn team with natural language prompt
3. Lead creates task list and spawns teammates
4. Teammates claim tasks, work, communicate
5. Monitor and steer — don't let it run unattended too long
6. Ask lead to shut down finished teammates
7. Ask lead to clean up the team
```

**Shutdown:**
```
Ask the [name] teammate to shut down
```

**Cleanup (always use the lead, not a teammate):**
```
Clean up the team
```

---

## Permissions

- Teammates start with the **lead's permission settings**
- If lead uses `--dangerously-skip-permissions`, all teammates do too
- You can change individual teammate modes after spawning
- You cannot set per-teammate modes at spawn time

**Pre-approve common operations** in `settings.json` before spawning to reduce interruption prompts.

---

## Known Limitations

| Limitation | Workaround |
|-----------|------------|
| No session resumption with in-process teammates | After `/resume`, tell lead to spawn new teammates |
| Task status can lag | Manually update or tell lead to nudge teammate |
| Shutdown can be slow | Teammates finish current tool call before stopping |
| One team per session | Clean up current team before starting a new one |
| No nested teams | Teammates cannot spawn their own teams |
| Lead is fixed | Cannot promote a teammate to lead |
| Split panes don't work in VS Code terminal, Windows Terminal, Ghostty | Use in-process mode |

---

## Quick Prompts Cheat Sheet

```
# Start a team
"Create an agent team with [N] teammates to [task]."

# Specify models
"Use Sonnet for each teammate."

# Require plan approval
"Require plan approval before they make any changes."

# Talk to a specific teammate
[Shift+Down to cycle] → type message directly

# Assign a task
"Assign the [task] to the [name] teammate."

# Make lead wait
"Wait for your teammates to complete their tasks before proceeding."

# Shut down a teammate
"Ask the [name] teammate to shut down."

# Clean up
"Clean up the team."
```

---

## Red Flags — Patterns to Avoid

- **Teammates editing the same file** → leads to overwrites. Give each teammate a distinct set of files.
- **Broadcast overuse** → costs scale with team size. Use targeted `message` instead.
- **Unattended runs** → check in regularly, redirect approaches that aren't working.
- **Too many teammates** → start with 3–5, scale only when genuinely needed.
- **Teammate running cleanup** → always use the lead. Teammate cleanup can leave inconsistent state.
- **No context in spawn prompt** → teammates don't inherit conversation history. Always include task-specific details.
