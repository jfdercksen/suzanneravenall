/**
 * Wiring: one queue per process on Medusa's Postgres, one dry-run queue in
 * memory, the clients, the staff alerter and the course-access mail sender.
 */

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createStaffAlerter,
  fetchWithRetry,
  IntegrationError,
  ThinkificClient,
  VtigerClient,
  type Logger,
  type StaffAlerter,
} from "@suzanne/integrations"
import { AutomationQueue } from "../modules/automations/queue"
import { PgJobStore, type RawSql } from "../modules/automations/pg-store"
import { MemoryJobStore } from "../modules/automations/memory-store"
import { dryRun, modeFor } from "./config"
import {
  courseAccessEmailHandler,
  thinkificEnrolmentHandler,
  vtigerOrderHandler,
  type AutomationDeps,
  type CourseAccessMail,
} from "./handlers"

type Resolver = { resolve<T = unknown>(key: string): T }

const logger: Logger = console

let alerter: StaffAlerter | null = null
export function staffAlerter(): StaffAlerter {
  if (!alerter) alerter = createStaffAlerter({ logger })
  return alerter
}

/**
 * POST /api/email/course-access on the web app (React Email template, Brevo
 * sender). Same secret header as the membership-welcome call.
 */
export async function sendCourseAccessEmailViaWeb(
  mail: CourseAccessMail,
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<void> {
  const base = (env.WEB_BASE_URL || "http://web:3000").replace(/\/$/, "")
  const secret = env.INTERNAL_WEBHOOK_SECRET || env.N8N_WEBHOOK_SECRET || ""
  const res = await fetchWithRetry(
    `${base}/api/email/course-access`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(secret ? { "x-webhook-secret": secret } : {}) },
      body: JSON.stringify(mail),
    },
    { system: "web-email", retries: 1, timeoutMs: 15_000, fetchImpl }
  )
  if (!res.ok) {
    throw new IntegrationError(`course-access mail route answered HTTP ${res.status}`, {
      system: "web-email",
      status: res.status,
      // 401/422 need a config or code fix; 5xx (Brevo down) is worth retrying.
      retriable: res.status >= 500,
    })
  }
}

function realDeps(): AutomationDeps {
  let thinkific: ThinkificClient | null = null
  let vtiger: VtigerClient | null = null
  return {
    thinkific: () => (thinkific ??= ThinkificClient.fromEnv(process.env, { dryRun: false })),
    vtiger: () => (vtiger ??= VtigerClient.fromEnv(process.env, { dryRun: false })),
    sendCourseAccessEmail: (mail) => sendCourseAccessEmailViaWeb(mail),
    logger,
  }
}

function dryDeps(): AutomationDeps {
  return {
    thinkific: () => ThinkificClient.fromEnv(process.env, { dryRun: true, logger }),
    vtiger: () => VtigerClient.fromEnv(process.env, { dryRun: true, logger }),
    sendCourseAccessEmail: async (mail) => {
      logger.info(
        `[course-access:dry-run] would POST /api/email/course-access for order ${mail.orderId}: ${mail.courses.length} course(s)`
      )
    },
    logger,
  }
}

export function buildHandlers(deps: AutomationDeps) {
  return [thinkificEnrolmentHandler(deps), courseAccessEmailHandler(deps), vtigerOrderHandler(deps)]
}

let queue: AutomationQueue | null = null

/** The durable queue (Medusa Postgres). Jobs whose flag is "off" are held. */
export function getAutomationQueue(container: Resolver): AutomationQueue {
  if (!queue) {
    const db = container.resolve<RawSql>(ContainerRegistrationKeys.PG_CONNECTION)
    queue = new AutomationQueue({
      store: new PgJobStore(db),
      handlers: buildHandlers(realDeps()),
      alert: (a) => staffAlerter().send(a),
      logger,
      isRunnable: (automation) => !dryRun() && modeFor(automation) !== "off",
    })
  }
  return queue
}

/**
 * A throwaway in-memory queue with dry-run clients: no network, nothing
 * persisted, alerts logged only. Used for AUTOMATION_DRY_RUN=true.
 */
export function createDryRunQueue(): AutomationQueue {
  const dryAlerter = createStaffAlerter({ logger, env: { AUTOMATION_DRY_RUN: "true" } })
  return new AutomationQueue({
    store: new MemoryJobStore(),
    handlers: buildHandlers(dryDeps()),
    alert: (a) => dryAlerter.send(a),
    logger,
    // Follow-up jobs (the course-access mail) run inline so the whole dry run is in one log block.
    defer: (fn) => {
      void fn().catch((err: unknown) => logger.error(`[automation:dry-run] ${err instanceof Error ? err.message : String(err)}`))
    },
  })
}

/** Tests only. */
export function resetAutomationRuntime(): void {
  queue = null
  alerter = null
}
