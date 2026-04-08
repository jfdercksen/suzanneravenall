import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      '**/*.{test,spec}.?(c|m)[jt]s?(x)',
      '../../packages/ui/src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
