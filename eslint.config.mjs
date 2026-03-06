import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default [
  {
    ignores: ['**/node_modules', '**/dist', '**/build', 'pnpm-lock.yaml'],
  },
  ...tsEslint.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    plugins: {
      prettier,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsEslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['client/**/*.js', 'client/**/*.jsx', 'client/**/*.ts', 'client/**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['server/**/*.js', 'server/**/*.jsx', 'server/**/*.ts', 'server/**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
