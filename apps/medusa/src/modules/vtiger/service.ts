import crypto from 'crypto'
import type {
  VtigerContact,
  VtigerActivity,
  PipelineStage,
  VtigerChallengeResponse,
  VtigerLoginResponse,
} from './types'

// Vtiger REST API v1 integration
// Auth: MD5(challenge_token + access_key) — challenge-response flow
// Session names are cached in memory and re-authenticated on ACCESS_DENIED errors
// This class is safe to instantiate without env vars — validation is deferred
// to the first actual API call (lazy validation pattern).

export class VtigerService {
  static identifier = 'vtigerService'

  private readonly baseUrl: string | undefined
  private readonly username: string | undefined
  private readonly accessKey: string | undefined

  // Cached session name — re-authenticated on ACCESS_DENIED
  private sessionName: string | null = null

  // Medusa DI injects (_container, options) — both are unused here.
  // Config is read directly from environment variables to allow lazy validation.
  constructor(_container?: unknown, _options?: Record<string, unknown>) {
    this.baseUrl = process.env.VTIGER_URL?.replace(/\/$/, '')
    this.username = process.env.VTIGER_USERNAME
    this.accessKey = process.env.VTIGER_ACCESS_KEY
  }

  // Validate config — only called at first API use, not at construction
  private assertConfigured(): void {
    if (!this.baseUrl || !this.username || !this.accessKey) {
      throw new Error(
        'Vtiger configuration missing: VTIGER_URL, VTIGER_USERNAME, VTIGER_ACCESS_KEY are required'
      )
    }
  }

  // Step 1 — fetch challenge token for this username
  private async fetchChallenge(): Promise<string> {
    const url = `${this.baseUrl!}/webservice.php?operation=getchallenge&username=${encodeURIComponent(this.username!)}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Vtiger getchallenge failed: HTTP ${res.status}`)
    }
    const data = (await res.json()) as VtigerChallengeResponse
    if (!data.success) {
      throw new Error('Vtiger getchallenge returned success:false')
    }
    return data.result.token
  }

  // Step 2 — POST login with MD5(token + accessKey)
  private async login(token: string): Promise<string> {
    const accessKeyHash = crypto
      .createHash('md5')
      .update(token + this.accessKey!)
      .digest('hex')

    const body = new URLSearchParams({
      operation: 'login',
      username: this.username!,
      accessKey: accessKeyHash,
    })

    const res = await fetch(`${this.baseUrl!}/webservice.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) {
      throw new Error(`Vtiger login failed: HTTP ${res.status}`)
    }
    const data = (await res.json()) as VtigerLoginResponse
    if (!data.success) {
      throw new Error(
        `Vtiger login failed: ${data.error?.code ?? 'UNKNOWN'} — ${data.error?.message ?? ''}`
      )
    }
    return data.result.sessionName
  }

  // Full auth cycle — returns a fresh sessionName (never logs the value)
  private async authenticate(): Promise<string> {
    this.assertConfigured()
    const token = await this.fetchChallenge()
    const session = await this.login(token)
    this.sessionName = session
    return session
  }

  // Obtain a valid session — authenticate if none cached
  private async getSession(): Promise<string> {
    if (!this.sessionName) {
      return this.authenticate()
    }
    return this.sessionName
  }

  // Execute a GET query — re-auths once on ACCESS_DENIED
  private async apiGet<T>(
    params: Record<string, string>,
    retry = true
  ): Promise<T> {
    const sessionName = await this.getSession()
    const qs = new URLSearchParams({ ...params, sessionName })
    const res = await fetch(`${this.baseUrl!}/webservice.php?${qs.toString()}`)
    if (!res.ok) {
      throw new Error(`Vtiger GET failed: HTTP ${res.status}`)
    }
    const data = (await res.json()) as { success: boolean; result: T; error?: { code: string; message: string } }
    if (!data.success) {
      const code = data.error?.code ?? ''
      if (code === 'ACCESS_DENIED' && retry) {
        this.sessionName = null
        return this.apiGet<T>(params, false)
      }
      throw new Error(
        `Vtiger GET error: ${code} — ${data.error?.message ?? ''}`
      )
    }
    return data.result
  }

  // Execute a POST operation — re-auths once on ACCESS_DENIED
  private async apiPost<T>(
    params: Record<string, string>,
    retry = true
  ): Promise<T> {
    const sessionName = await this.getSession()
    const body = new URLSearchParams({ ...params, sessionName })
    const res = await fetch(`${this.baseUrl!}/webservice.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) {
      throw new Error(`Vtiger POST failed: HTTP ${res.status}`)
    }
    const data = (await res.json()) as { success: boolean; result: T; error?: { code: string; message: string } }
    if (!data.success) {
      const code = data.error?.code ?? ''
      if (code === 'ACCESS_DENIED' && retry) {
        this.sessionName = null
        return this.apiPost<T>(params, false)
      }
      throw new Error(
        `Vtiger POST error: ${code} — ${data.error?.message ?? ''}`
      )
    }
    return data.result
  }

  // Find a Contact by email using VQL
  // Returns null when the contact does not exist; throws on API errors
  async findContact(email: string): Promise<VtigerContact | null> {
    this.assertConfigured()
    // VQL requires single-quoted string literals; escape any single quotes in email
    const safeEmail = email.replace(/'/g, "\\'")
    const query = `SELECT * FROM Contacts WHERE email='${safeEmail}' LIMIT 1`
    const result = await this.apiGet<VtigerContact[]>({
      operation: 'query',
      query,
    })
    return result.length > 0 ? result[0]! : null
  }

  // Create a new Contact record
  async createContact(data: Omit<VtigerContact, 'id'>): Promise<VtigerContact> {
    this.assertConfigured()
    const element = JSON.stringify(data)
    return this.apiPost<VtigerContact>({
      operation: 'create',
      elementType: 'Contacts',
      element,
    })
  }

  // Update an existing Contact record
  async updateContact(
    id: string,
    data: Partial<VtigerContact>
  ): Promise<VtigerContact> {
    this.assertConfigured()
    const element = JSON.stringify({ id, ...data })
    return this.apiPost<VtigerContact>({
      operation: 'update',
      element,
    })
  }

  // Log an activity (call, meeting, etc.) linked to a Contact
  async createActivity(
    contactId: string,
    type: string,
    data: { subject: string; description?: string }
  ): Promise<VtigerActivity> {
    this.assertConfigured()
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toTimeString().slice(0, 8) // HH:MM:SS

    const activityData = {
      activitytype: type,
      subject: data.subject,
      description: data.description ?? '',
      contact_id: contactId,
      date_start: today,
      time_start: now,
    }
    const element = JSON.stringify(activityData)
    return this.apiPost<VtigerActivity>({
      operation: 'create',
      elementType: 'Activities',
      element,
    })
  }

  // Update the pipeline stage custom field on a Contact
  // The Vtiger admin must create a custom text field named cf_pipeline_stage
  async updatePipelineStage(
    contactId: string,
    stage: PipelineStage
  ): Promise<void> {
    this.assertConfigured()
    await this.updateContact(contactId, { cf_pipeline_stage: stage })
  }
}
