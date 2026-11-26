/**
 * AES-256-GCM for the Sage tokens at rest. The key is SAGE_TOKEN_ENCRYPTION_KEY,
 * 32 bytes, base64. Stored form: "v1:<iv>:<tag>:<ciphertext>", each part base64.
 * Without a valid key nothing is encrypted and nothing is stored.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { SageConfigError } from "./errors"

export function encryptionKey(env: Record<string, string | undefined> = process.env): Buffer {
  const raw = (env.SAGE_TOKEN_ENCRYPTION_KEY ?? "").trim()
  if (!raw) throw new SageConfigError("SAGE_TOKEN_ENCRYPTION_KEY is not set; Sage tokens are not stored without it")
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) throw new SageConfigError("SAGE_TOKEN_ENCRYPTION_KEY must be 32 bytes, base64 encoded")
  return key
}

export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), ct.toString("base64")].join(":")
}

export function decryptSecret(stored: string, key: Buffer): string {
  const [version, iv, tag, ct] = stored.split(":")
  if (version !== "v1" || !iv || !tag || ct === undefined) throw new Error("Stored Sage secret has an unknown format")
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"))
  decipher.setAuthTag(Buffer.from(tag, "base64"))
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64")), decipher.final()]).toString("utf8")
}
