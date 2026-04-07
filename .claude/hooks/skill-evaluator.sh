#!/usr/bin/env bash
# Suggest relevant skills based on prompt content.
# Called by UserPromptSubmit hook.
# Exit 0 always — suggestions are advisory only.

PROMPT="$1"
PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

suggest() {
  echo "TIP: Consider using /$1 — $2"
}

# Component creation
if echo "$PROMPT_LOWER" | grep -qE '(create|add|build|new).*(component|button|card|modal|form|header|footer|nav)'; then
  suggest "add-component" "scaffolds a new React component with proper conventions"
fi

# Page/route creation
if echo "$PROMPT_LOWER" | grep -qE '(create|add|build|new).*(page|route|section)'; then
  suggest "add-route" "scaffolds a new Next.js App Router page"
fi

# API route creation
if echo "$PROMPT_LOWER" | grep -qE '(create|add|build|new).*(api|endpoint|handler)'; then
  suggest "add-api-route" "scaffolds a new API route handler with validation"
fi

# Database table
if echo "$PROMPT_LOWER" | grep -qE '(create|add|new).*(table|schema|database|migration)'; then
  suggest "add-supabase-table" "creates table with migration, types, and RLS policies"
fi

# RLS policy
if echo "$PROMPT_LOWER" | grep -qE '(rls|row.level|access.control|policy|permission)'; then
  suggest "add-rls-policy" "adds or updates Supabase RLS policies"
fi

# Webhook
if echo "$PROMPT_LOWER" | grep -qE '(webhook|inbound.hook|receive.event)'; then
  suggest "add-webhook" "scaffolds a webhook handler with signature verification"
fi

# Email template
if echo "$PROMPT_LOWER" | grep -qE '(email|template|notification|welcome.email|confirmation)'; then
  suggest "add-email-template" "creates a React Email template for Resend"
fi

# Docker service
if echo "$PROMPT_LOWER" | grep -qE '(docker|container|service|compose).*add'; then
  suggest "add-docker-service" "adds a new service to Docker Compose"
fi

# Design from reference
if echo "$PROMPT_LOWER" | grep -qE '(design|reference|screenshot|mockup|figma|build.from)'; then
  suggest "design-from-reference" "builds a page from a screenshot or written brief"
fi

# Audit
if echo "$PROMPT_LOWER" | grep -qE '(audit|health.check|review.codebase|code.quality)'; then
  suggest "audit" "runs a 9-category parallel codebase health check"
fi

# Security check
if echo "$PROMPT_LOWER" | grep -qE '(security|vulnerab|pentest|owasp|rls.audit)'; then
  suggest "security-check" "runs a vulnerability scan across the codebase"
fi

# Session restore
if echo "$PROMPT_LOWER" | grep -qE '(restore|resume|continue|pick.up|where.was.i|last.session)'; then
  suggest "restore-session" "recovers full context from previous sessions"
fi

exit 0
