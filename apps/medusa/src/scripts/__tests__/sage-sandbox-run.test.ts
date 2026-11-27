import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it, expect } from "vitest"
import { loadEnvFile, redact } from "../sage-sandbox-run"

describe("loadEnvFile", () => {
  it("reads names and values, strips quotes, skips comments, and keeps existing env", () => {
    const dir = mkdtempSync(join(tmpdir(), "sage-env-"))
    const file = join(dir, ".env.sage.local")
    writeFileSync(file, "# practice company\nSAGE_EMAIL=\"a@b.test\"\r\nSAGE_COMPANY_ID=123\nSAGE_API_KEY='k'\nnot a line\n")
    const env: Record<string, string | undefined> = { SAGE_COMPANY_ID: "999" }
    const names = loadEnvFile(file, env)
    expect(names).toEqual(["SAGE_EMAIL", "SAGE_COMPANY_ID", "SAGE_API_KEY"])
    expect(env).toEqual({ SAGE_EMAIL: "a@b.test", SAGE_COMPANY_ID: "999", SAGE_API_KEY: "k" })
  })
  it("returns nothing when the file is absent", () => {
    expect(loadEnvFile(join(tmpdir(), "no-such-file-sage"), {})).toEqual([])
  })
})

describe("redact", () => {
  it("masks email addresses anywhere in the answer", () => {
    expect(redact({ Results: [{ Email: "carla.smith@example.co.za", Note: "mail jo@x.io" }] })).toEqual({ Results: [{ Email: "c***@example.co.za", Note: "mail j***@x.io" }] })
  })
  it("drops fields that could carry secrets", () => {
    expect(redact({ apikey: "x", Password: "y", access_token: "z", Authorization: "Basic q", ID: 5 })).toEqual({ ID: 5 })
  })
})
