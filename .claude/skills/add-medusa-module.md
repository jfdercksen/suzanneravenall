---
name: add-medusa-module
description: Create a new Medusa.js v2 custom module with service, data models and API routes. Use when adding any new commerce feature, custom business logic or extending Medusa's core functionality. Always use v2 module architecture — never v1 patterns.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Medusa Module

## Goal
Create a production-ready Medusa.js v2 custom module following the official module architecture — service class, data models, optional API routes and optional workflows.

## Inputs
- Module name (camelCase, e.g. practitionerLicensing)
- What business problem it solves
- Data it needs to store
- API endpoints it needs to expose
- Events it should emit or subscribe to

## Key References
- Medusa v2 modules: https://docs.medusajs.com/learn/fundamentals/modules
- Medusa v2 services: https://docs.medusajs.com/learn/fundamentals/modules/service-factory
- Medusa v2 data models: https://docs.medusajs.com/learn/fundamentals/modules/db-operations
- Medusa v2 workflows: https://docs.medusajs.com/learn/fundamentals/workflows
- Medusa v2 API routes: https://docs.medusajs.com/learn/fundamentals/api-routes
- Medusa v2 events: https://docs.medusajs.com/learn/fundamentals/events-and-subscribers
- Medusa v2 scheduled jobs: https://docs.medusajs.com/learn/fundamentals/scheduled-jobs

## Project Structure
apps/medusa/src/modules/{module-name}/├── index.ts              # Module definition and exports
├── service.ts            # Main service class
├── models/
│   └── {model}.ts        # Data models (MikroORM entities)
└── migrations/
└── Migration{timestamp}.ts
apps/medusa/src/api/
├── store/{module}/
│   └── route.ts          # Public store API routes
└── admin/{module}/
└── route.ts          # Admin API routes
apps/medusa/src/workflows/
└── {module}/
└── {workflow-name}.ts
apps/medusa/src/subscribers/
└── {module}/
└── {event-name}.ts

## Process

### Step 1 — Research
Spawn research agent with:
"Research Medusa v2 module architecture for {use case}. Read https://docs.medusajs.com/learn/fundamentals/modules and confirm the correct patterns for data models, service factory and module registration."

### Step 2 — Create data model
File: `apps/medusa/src/modules/{module-name}/models/{model-name}.ts`
```typescript
import { model } from "@medusajs/framework/utils"

export const {ModelName} = model.define("{table_name}", {
  id: model.id().primaryKey(),
  // define fields here using Medusa model helpers
  created_at: model.dateTime(),
  updated_at: model.dateTime(),
})
```

### Step 3 — Create service class
File: `apps/medusa/src/modules/{module-name}/service.ts`
```typescript
import { MedusaService } from "@medusajs/framework/utils"
import { {ModelName} } from "./models/{model-name}"

class {ModuleName}ModuleService extends MedusaService({
  {ModelName},
}) {
  // MedusaService auto-generates CRUD methods:
  // list{ModelName}, retrieve{ModelName},
  // create{ModelName}, update{ModelName}, delete{ModelName}

  // Add custom business logic methods here
  async customMethod(input: CustomInput): Promise<CustomOutput> {
    // implementation
  }
}

export default {ModuleName}ModuleService
```

### Step 4 — Create module index
File: `apps/medusa/src/modules/{module-name}/index.ts`
```typescript
import { Module } from "@medusajs/framework/utils"
import {ModuleName}ModuleService from "./service"

export const {MODULE_NAME}_MODULE = "{module-name}"

export default Module({MODULE_NAME}_MODULE, {
  service: {ModuleName}ModuleService,
})
```

### Step 5 — Register module in medusa-config.ts
```typescript
// apps/medusa/medusa-config.ts
import {ModuleName}Module from "./src/modules/{module-name}"

module.exports = defineConfig({
  modules: [
    {
      resolve: "./src/modules/{module-name}",
      definition: {ModuleName}Module,
    },
    // ... other modules
  ],
})
```

### Step 6 — Create API routes (if needed)
Store route: `apps/medusa/src/api/store/{module}/route.ts`
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { z } from "zod"
import { {MODULE_NAME}_MODULE } from "../../../modules/{module-name}"
import {ModuleName}ModuleService from "../../../modules/{module-name}/service"

const PostSchema = z.object({
  // define and validate all inputs
})

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const validated = PostSchema.parse(req.body)

  const moduleService: {ModuleName}ModuleService =
    req.scope.resolve({MODULE_NAME}_MODULE)

  const result = await moduleService.customMethod(validated)

  res.json({ data: result })
}
```

### Step 7 — Create workflow (if multi-step logic needed)
File: `apps/medusa/src/workflows/{module-name}/{workflow-name}.ts`
```typescript
import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

const stepOne = createStep(
  "step-one",
  async (input: StepInput, { container }) => {
    // step logic
    return new StepResponse(result, compensationData)
  },
  async (compensationData, { container }) => {
    // compensation logic — runs if workflow fails
  }
)

export const {workflowName}Workflow = createWorkflow(
  "{workflow-name}",
  (input: WorkflowInput) => {
    const stepOneResult = stepOne(input)
    return new WorkflowResponse(stepOneResult)
  }
)
```

### Step 8 — Run migration
```bash
cd apps/medusa && npx medusa db:migrate
```

### Step 9 — Spawn code-reviewer
Ask code-reviewer to review all new files.

### Step 10 — Spawn qa-unit
Ask qa-unit to generate and run tests for the service class.

### Step 11 — Build check
```bash
turbo run build --filter=@suzanne/medusa
```
Fix all TypeScript errors before finishing.

## Rules
- Always use Medusa v2 module architecture — never v1 services or repositories
- Always use MedusaService factory — never write raw CRUD methods
- Always use Medusa workflows for multi-step operations — never raw async chains
- All API routes must validate input with Zod schemas
- All API routes must wrap in try/catch
- Module must be registered in medusa-config.ts before it can be used
- Never bypass the module system with direct database queries
- Events must be documented — list what events the module emits
- Always write compensation logic in workflow steps for rollback capability

## Output Format
Always report:
- Module name and location
- Data models created
- API routes added and their methods
- Workflows created
- Events emitted or subscribed to
- Environment variables required
- Migration status
- Test results from qa-unit agent
