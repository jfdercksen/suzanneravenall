import type { Payload } from 'payload'
import { INTAKE_FORM_SEEDS } from './intakeForms'

/**
 * Seeds the intake forms when the collection is EMPTY, so a fresh database
 * gets the client's forms and an edited one is never touched again. Note: a
 * collection emptied on purpose is seeded again on the next Payload start;
 * switch a form off (Active) instead of deleting it. Runs on every Payload
 * start (onInit); never throws. Before the intake_forms table exists (the
 * box SQL not applied yet) it only logs; restart payload after applying it.
 */
export async function seedIntakeForms(payload: Payload): Promise<void> {
  try {
    const { totalDocs } = await payload.count({ collection: 'intake-forms' })
    if (totalDocs > 0) return
    for (const form of INTAKE_FORM_SEEDS) {
      await payload.create({ collection: 'intake-forms', data: form })
    }
    payload.logger.info(`[intake-forms] seeded ${INTAKE_FORM_SEEDS.length} forms`)
  } catch (err) {
    payload.logger.error(`[intake-forms] seed skipped: ${err instanceof Error ? err.message : String(err)}`)
  }
}
