import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // ── Ignore non-source directories ─────────────────────────────────────────
  globalIgnores([
    'dist/**',
    'node_modules/**',
    'coverage/**',
    '.atlas-bridge/**',
    '.claude/**',
    '.venv/**',
    'test-results/**',
    'data/**',
    'supabase/**',
    'public/**',
  ]),

  // ── Frontend: browser globals + React plugins ──────────────────────────────
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Pre-existing issues downgraded to warn — fixes tracked in LINT-SCOPE
      // backlog; do not add new violations.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // react-hooks pattern rules: performance hints, not correctness errors
      'react-hooks/static-components':          'warn',
      'react-hooks/set-state-in-effect':        'warn',
      'react-hooks/immutability':               'warn',
      'react-hooks/preserve-manual-memoization':'warn',
      // Force all localStorage access through src/lib/storage.js helpers.
      'no-restricted-globals': ['error', {
        name: 'localStorage',
        message: 'Use loadFromStorage / saveToStorage / removeFromStorage from src/lib/storage.js instead of accessing localStorage directly.',
      }],
      // Prevent raw console calls — route through src/lib/logger.js instead.
      'no-console': 'error',
    },
  },

  // ── Storage module: allow direct localStorage (it IS the abstraction) ────────
  {
    files: ['src/lib/storage.js'],
    rules: {
      'no-restricted-globals': 'off',
    },
  },

  // ── Logger module: must use console directly (it IS the abstraction) ─────────
  {
    files: ['src/lib/logger.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // ── Agents + scripts: Node globals, no React ──────────────────────────────
  {
    files: ['agents/**/*.js', 'scripts/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },

  // ── Tests + root config files: Node globals ────────────────────────────────
  {
    files: ['tests/**/*.js', '*.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      // Tests frequently define vars that are only referenced in assertions
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
])
