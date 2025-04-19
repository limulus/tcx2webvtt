import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    workspace: [
      {
        test: {
          name: 'node.js',
          include: ['src/**/*.spec.ts'],
          exclude: ['src/integration/**/*.spec.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'integration',
          include: ['src/integration/**/*.spec.ts'],
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium', headless: true }],
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['json', 'html', 'text', 'text-summary'],
      include: ['src/**/*.ts'],
      exclude: ['**/node_modules/**'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
})
