import type { SageOptions } from "./types"

/**
 * Module shell kept so medusa-config.js keeps registering "sageModule".
 * The Sage link itself is plain code, not module methods: client.ts (HTTP),
 * auth.ts, invoice.ts, resolvers.ts, driven by the SAGE_INVOICE automation in
 * src/automations/sage.ts. The old createInvoice here guessed a 15% VAT type (gone).
 * Medusa amounts are cents here; the one conversion to rand is centsToRand in invoice.ts.
 */
export class SageService {
  static identifier = "sageService"

  constructor(
    _container: unknown,
    readonly options: SageOptions,
  ) {}
}
