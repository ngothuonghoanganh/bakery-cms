module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.base.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  plugins: ['@typescript-eslint', 'functional'],
  env: {
    node: true,
    es2020: true,
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',

    // Functional programming rules
    'functional/no-let': 'error',
    'functional/immutable-data': 'error',
    'functional/no-class': 'error',
    'functional/no-this-expression': 'error',
    'functional/no-throw-statement': 'off', // Allow throws for unexpected errors
    'functional/prefer-readonly-type': 'warn',

    // Code quality rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'object-shorthand': 'error',
    'no-param-reassign': 'error',
    'no-return-assign': 'error',
    'no-useless-return': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
  },
  overrides: [
    {
      // Relax rules for test files
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'functional/immutable-data': 'off',
      },
    },
    {
      // Relax rules for Sequelize models (need classes)
      files: ['**/models/**/*.ts', '**/database/**/*.model.ts'],
      rules: {
        'functional/no-class': 'off',
        'functional/no-this-expression': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/', '*.config.js'],
};
