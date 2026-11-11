// The part of jsdom the WordPress migration uses (scripts/migrate-wordpress.ts).
// jsdom is installed with the test setup; its types are not, and one class does
// not justify a new dependency.
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: Record<string, unknown>)
    readonly window: Window & typeof globalThis
  }
}
