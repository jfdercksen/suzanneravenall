/**
 * Minimal in-memory stand-in for the service-role Supabase client, covering
 * only the calls lib/leads/store.ts makes. Test-only.
 */

type PgError = { code?: string; message: string }

export type FakeLeadRow = Record<string, unknown> & { id: string }

export function makeFakeSupabase(opts: { insertError?: PgError; updateError?: PgError; rows?: FakeLeadRow[] } = {}) {
  const rows: FakeLeadRow[] = [...(opts.rows ?? [])]
  const inserts: Array<Record<string, unknown>> = []
  const updates: Array<{ id: string; values: Record<string, unknown> }> = []
  let n = 0

  const client = {
    from(table: string) {
      if (table !== 'leads') throw new Error(`unexpected table ${table}`)
      return {
        insert(values: Record<string, unknown>) {
          inserts.push(values)
          return {
            select: () => ({
              single: async () => {
                if (opts.insertError) return { data: null, error: opts.insertError }
                n += 1
                const row = { id: `lead-${n}`, sync_attempts: 0, created_at: new Date().toISOString(), ...values }
                rows.push(row)
                return { data: { id: row.id }, error: null }
              },
            }),
          }
        },
        update(values: Record<string, unknown>) {
          return {
            eq: async (_col: string, id: string) => {
              updates.push({ id, values })
              if (opts.updateError) return { error: opts.updateError }
              const row = rows.find((r) => r.id === id)
              if (row) Object.assign(row, values)
              return { error: null }
            },
          }
        },
        select(_cols: string) {
          let statuses: string[] = []
          let limit = Infinity
          const builder = {
            in(_col: string, values: string[]) {
              statuses = values
              return builder
            },
            order() {
              return builder
            },
            limit(l: number) {
              limit = l
              return builder
            },
            then(resolve: (v: { data: FakeLeadRow[]; error: null }) => void) {
              resolve({ data: rows.filter((r) => statuses.includes(String(r.vtiger_status))).slice(0, limit), error: null })
            },
          }
          return builder
        },
      }
    },
  }

  return { client, rows, inserts, updates }
}

export const MISSING_TABLE_ERROR = {
  code: 'PGRST205',
  message: "Could not find the table 'public.leads' in the schema cache",
}
