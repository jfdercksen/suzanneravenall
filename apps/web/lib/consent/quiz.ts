/**
 * Consent to process quiz answers (POPIA: the diagnostics ask about health,
 * stress and wellbeing). Required before the first question and stored with
 * the submission as consented_at + consent_form_version.
 *
 * INTERIM: Suzanne's Client Consent Form (RI-F-POPIA-09, Part B) is not with
 * us yet. When it arrives, replace QUIZ_CONSENT_TEXT with its wording and
 * bump CONSENT_FORM_VERSION; rows stored under this version are the interim
 * ones.
 */
export const CONSENT_FORM_VERSION = 'quiz-consent-interim-2026-11-18-pending-RI-F-POPIA-09-part-B'

/** The tick's label, before the Privacy Notice link. Plain wording, per Johan's brief of 18 Nov. */
export const QUIZ_CONSENT_TEXT =
  'I agree to my answers, which may include information about my health and wellbeing, being processed to produce my result.'

export const QUIZ_CONSENT_REQUIRED = 'Please tick the box to agree before you start.'
