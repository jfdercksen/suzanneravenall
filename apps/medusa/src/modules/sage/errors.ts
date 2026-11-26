import { IntegrationError } from "@suzanne/integrations"

/** A refusal a retry cannot fix: the SAGE_INVOICE handler holds the job and sends one staff alert. */
export class SageHold extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SageHold"
  }
}

/**
 * A setting is missing or wrong (tax type, cash customer, OAuth client, ...).
 * A retry cannot fix it, so the SAGE_INVOICE handler holds the job and sends
 * one staff alert instead of burning retries. Messages never carry secrets.
 */
export class SageConfigError extends SageHold {
  constructor(message: string) {
    super(message)
    this.name = "SageConfigError"
  }
}

/** Sage answered with an error status. 4xx is permanent for the queue, 5xx and 429 are retried. */
export class SageApiError extends IntegrationError {
  constructor(message: string, status: number) {
    super(message, { system: "sage", status, retriable: status >= 500 || status === 429 })
    this.name = "SageApiError"
  }
}
