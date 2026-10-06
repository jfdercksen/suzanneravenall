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
export { orderBuyer, toOrderSnapshot, type OrderSnapshot, type OrderItemSnapshot, type OrderAddress } from './orders'
export {
  ThinkificClient,
  ThinkificError,
  THINKIFIC_API_BASE,
  type ThinkificClientOptions,
  type ThinkificUser,
  type ThinkificEnrolment,
} from './thinkific'
export {
  parseOrderForThinkific,
  orderHasCourses,
  enrolOrderInThinkific,
  emptyEnrolmentState,
  courseAccessSubject,
  THINKIFIC_COURSES_URL,
  THINKIFIC_ADMIN_URL,
  type CourseItem,
  type CourseState,
  type CourseStatus,
  type EnrolmentState,
  type EnrolmentOutcome,
  type ParsedThinkificOrder,
} from './thinkific-enrolment'
export {
  orderValidForVtiger,
  prepareOrderForVtiger,
  newOrderContactElement,
  existingOrderContactElement,
  orderEventElement,
  syncOrderToVtiger,
  SHOP_LEAD_SOURCE,
  CLOSED_WON_STAGE,
  type PreparedVtigerOrder,
  type OrderVtigerState,
  type OrderVtigerResult,
} from './order-vtiger'
export {
  sendBrevoEmail,
  createStaffAlerter,
  parseAddress,
  ALERT_SENDER,
  ALERT_THROTTLE_MS,
  type BrevoMail,
  type BrevoOptions,
  type MailAddress,
  type StaffAlert,
  type StaffAlerter,
  type StaffAlertOutcome,
} from './brevo'
