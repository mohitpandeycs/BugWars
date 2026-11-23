import js from '@eslint/js'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'eqeqeq': 'error',
      'curly': 'error',
    },
  },
])