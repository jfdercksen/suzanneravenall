/**
 * Minimal in-memory stand-in for the service-role Supabase client, covering
 * only the calls lib/leads/store.ts makes. Test-only.
 */

type PgError = { code?: string; message: string }

export type FakeLeadRow = Record<string, unknown> & { id: string }

export function makeFakeSupabase(
  opts: { insertError?: PgError; updateError?: PgError; selectError?: PgError; rows?: FakeLeadRow[] } = {},
) {
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
          let statuses: string[] | null = null
          const equals: Array<[string, unknown]> = []
          const atLeast: Array<[string, string]> = []
          let limit = Infinity
          const builder = {
            in(_col: string, values: string[]) {
              statuses = values
              return builder
            },
            eq(col: string, value: unknown) {
              equals.push([col, value])
              return builder
            },
            gte(col: string, value: string) {
              atLeast.push([col, value])
              return builder
            },
            order() {
              return builder
            },
            limit(l: number) {
              limit = l
              return builder
            },
            then(resolve: (v: { data: FakeLeadRow[] | null; error: PgError | null }) => void) {
              if (opts.selectError) {
                resolve({ data: null, error: opts.selectError })
                return
              }
              const matched = rows
                .filter((r) => statuses === null || statuses.includes(String(r.vtiger_status)))
                .filter((r) => equals.every(([col, value]) => r[col] === value))
                .filter((r) => atLeast.every(([col, value]) => String(r[col]) >= value))
                .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
              resolve({ data: matched.slice(0, limit), error: null })
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
