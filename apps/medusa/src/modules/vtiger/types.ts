// Vtiger CRM — Type definitions
// Used by: VtigerService (REST API v1, challenge-response auth)
// Scope: sales pipeline only — leads, discovery calls, pipeline stages

export interface VtigerContact {
  id: string
  email: string
  firstname: string
  lastname: string
  phone?: string
  leadsource?: string
  // Custom fields (cf_ prefix set in Vtiger admin panel)
  cf_membership_tier?: string
  cf_total_spend_zar?: string
  cf_last_purchase_date?: string
  cf_discovery_call_date?: string
  cf_pipeline_stage?: string
  description?: string
}

export interface VtigerActivity {
  id: string
  activitytype: string
  subject: string
  description?: string
  contact_id: string
  date_start: string
  time_start: string
}

export type PipelineStage =
  | 'New Lead'
  | 'Discovery Call Booked'
  | 'Discovery Call Completed'
  | 'Proposal Sent'
  | 'Closed Won'
  | 'Closed Lost'

// Internal API response shapes

export interface VtigerChallengeResponse {
  success: boolean
  result: {
    token: string
    serverTime: number
    expireTime: number
  }
}

export interface VtigerLoginResponse {
  success: boolean
  result: {
    sessionName: string
    userId: string
    vtigerVersion: string
    apiVersion: string
  }
  error?: VtigerError
}

// Generic API response wrapper — used internally by service methods
export interface VtigerApiResponse<T> {
  success: boolean
  result: T
  error?: VtigerError
}

export interface VtigerError {
  code: string
  message: string
}
