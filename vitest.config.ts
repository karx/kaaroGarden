import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      obsidian: resolve(fileURLToPath(import.meta.url), '..', 'src/__mocks__/obsidian.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
