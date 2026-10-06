import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

/**
 * Unit tests for the Medusa app (mocks only, no database, no network).
 * vitest is not a dependency of this package on purpose: the Docker image
 * installs apps/medusa on its own and must not carry test tooling. Locally it
 * comes from the workspace root (`npm test -w @suzanne/medusa`, or
 * `npx vitest run` in apps/medusa).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
  resolve: {
    alias: {
      // Workspace package consumed from source, as in apps/web.
      '@suzanne/integrations': resolve(__dirname, '../../packages/integrations/src/index.ts'),
    },
  },
})
