import globals from 'globals';
import js from '@eslint/js';

export default [
  // Ignore patterns - ВАЖНО: должно быть ПЕРВЫМ
  {
    ignores: [
      'node_modules/**',
      'dist/**', 
      'build/**',
      'coverage/**',
      '.vite/**',
      'test-results/**',
      '**/*.min.js'
    ]
  },
  
  // Базовая конфигурация
  js.configs.recommended,
  
  // Основные src файлы
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.jest,
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
      },
    },
    files: ['src/**/*.js', 'src/**/*.jsx'],
    rules: {
      // Базовые правила
      'no-console': 'off',
      'no-debugger': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-duplicate-imports': 'error',
      'no-param-reassign': 'warn',
      'prefer-const': 'error',
      'no-useless-catch': 'off', // Часто используется для логирования
    }
  },
  
  // Конфигурационные файлы (CommonJS)
  {
    files: ['*.config.js', 'tailwind.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
      sourceType: 'module'
    },
    rules: {
      'no-unused-vars': 'off'
    }
  },
  
  // Тестовые файлы
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)', 'tests/**/*'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
        global: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        require: 'readonly'
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off' // Тестовые файлы могут использовать разные globals
    }
  },
  
  // Public файлы (browser scripts)
  {
    files: ['public/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        window: 'readonly'
      }
    }
  }
]; 