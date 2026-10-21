import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dist = build artifact; src/components/ui = generated shadcn; shared-db = synced copy of the shared-db repo (don't lint vendored code)
  globalIgnores(['dist', 'src/components/ui/**', 'shared-db/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // HMR-only dev rule; not a production-correctness issue.
      'react-refresh/only-export-components': 'off',
      // Targeted `as any` escape hatches from legacy field typing — keep visible as warnings.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Opinionated newer rule; our effect setState patterns are intentional.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
