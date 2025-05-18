module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:node/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    node: {
      tryExtensions: ['.js', '.jsx', '.json'],
    },
  },
  rules: {
    // Базовые правила
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-duplicate-imports': 'error',
    
    // Правила для чистых функций
    'no-param-reassign': 'warn',
    'prefer-const': 'error',
    
    // React правила
    'react/prop-types': 'warn',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Node.js правила
    'node/no-unsupported-features/es-syntax': [
      'error',
      { ignores: ['modules'] }
    ],
    'node/no-missing-import': 'off',
    'node/no-unpublished-import': 'off',
    
    // Prettier правила
    'prettier/prettier': 'warn',
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      env: {
        jest: true,
      },
      rules: {
        'node/no-unpublished-require': 'off',
      },
    },
  ],
}; 