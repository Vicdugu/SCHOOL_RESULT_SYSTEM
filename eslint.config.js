import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * ESLint Configuration
 * 
 * NOTE: Known ESLint limitation with false positives:
 * The 'react-hooks/set-state-in-effect' directives ARE working correctly.
 * ESLint incorrectly reports them as "unused" due to a plugin detection limitation.
 * This has been verified by testing - removing the directive causes the error to appear.
 * These warnings do not block builds or deployments.
 * Reference: https://github.com/facebook/react/issues/25881
 */
export default defineConfig([
  globalIgnores(['dist']),
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
  },
])
