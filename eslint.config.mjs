// Configuration ESLint partagée du monorepo (flat config, ESLint 10).
// Un seul point de vérité pour les trois applications (api, web, extension) :
// linting réel du code TypeScript/React, sans type-checking (rapide, exécuté en CI).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/build/**',
      '**/*.config.{js,ts,mjs,cjs}',
      '**/vite-env.d.ts',
      '**/prisma/migrations/**',
      '**/coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, chrome: 'readonly' },
    },
    rules: {
      // TypeScript vérifie déjà les variables non définies : on désactive la règle de base.
      'no-undef': 'off',
      // Qualité utile mais non bloquante : signalée en avertissement, ne casse pas la CI.
      'prefer-const': 'warn',
      'no-empty': 'warn',
      'no-constant-condition': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-assignment': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  // Fichiers de tests : globals Vitest.
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  // Composants React (web + extension) : règles des Hooks.
  {
    files: ['apps/web/src/**/*.{ts,tsx}', 'apps/extension/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
