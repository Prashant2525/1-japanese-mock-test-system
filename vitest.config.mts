import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          env: { LOG_LEVEL: 'silent' },
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'int',
          environment: 'node',
          env: { LOG_LEVEL: 'silent' },
          include: ['tests/int/**/*.int.spec.ts'],
          setupFiles: ['./tests/int/env.ts', './tests/int/teardown.ts'],
          globalSetup: ['./tests/int/global-setup.ts'],
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
})
