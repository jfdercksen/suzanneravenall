export { fetchWithRetry, IntegrationError, DEFAULT_RETRY, type FetchLike, type RetryOptions } from './http'
export { isDryRun, maskEmail, maskEmails, fakeId, type Logger } from './dry-run'
export {
  VtigerClient,
  VtigerError,
  vtqlString,
  vtigerConfigFromEnv,
  type VtigerConfig,
  type VtigerClientOptions,
  type VtigerRecord,
} from './vtiger'
export {
  syncLeadToVtiger,
  normaliseLead,
  findContactQuery,
  newContactElement,
  existingContactElement,
  leadEventElement,
  LEAD_SOURCE,
  NEW_LEAD_STAGE,
  type LeadInput,
  type LeadSyncResult,
} from './leads'
export { automationMode, type AutomationMode } from './flags'
