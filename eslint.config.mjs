import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // The domain module holds the exam rules and must stay framework-free (ARCHITECTURE §2).
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'next',
                'next/*',
                'react',
                'react-dom',
                'payload',
                'payload/*',
                '@payloadcms/*',
                '@payload-config',
                'drizzle-orm',
                'drizzle-orm/*',
                'pg',
                'node:*',
                'fs',
                'path',
                '@/server/*',
                '@/payload/*',
                '@/app/*',
              ],
              message: 'src/domain must stay pure TypeScript (ARCHITECTURE §2).',
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    '.next/',
    'next-env.d.ts',
    'src/payload-types.ts',
    'src/payload-generated-schema.ts',
    'src/app/(payload)/admin/importMap.js',
    'src/migrations/',
    'playwright-report/',
    'test-results/',
  ]),
])
