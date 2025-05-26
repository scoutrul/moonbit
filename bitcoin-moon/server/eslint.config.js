import globals from 'globals';
import js from '@eslint/js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  // Базовая конфигурация
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
      }
    },
    files: ['**/*.js'],
    rules: {
      // Базовые правила
      'no-console': 'off',
      'no-debugger': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-duplicate-imports': 'error',

      // Правила для чистых функций
      'no-param-reassign': 'warn',
      'prefer-const': 'error',
    }
  },
  // Конфигурация для тестов
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    rules: {
      // Расслабленные правила для тестов
      'no-unused-vars': 'off'
    }
  }
]; 