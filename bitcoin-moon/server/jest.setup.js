// Load test environment variables
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: '.env.test' });
}

// Mock import.meta
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      url: 'file:///mock/test.js'
    }
  },
  writable: true,
  configurable: true
});

// Mock global import.meta
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      url: 'file:///mock/test.js'
    }
  },
  writable: true,
  configurable: true
});

// Mock __filename and __dirname
const mockProjectRoot = '/mock/project';
global.__filename = `${mockProjectRoot}/test.js`;
global.__dirname = `${mockProjectRoot}`;

// Mock url module
const mockUrl = {
  fileURLToPath: jest.fn((url) => {
    if (typeof url === 'string' && url.startsWith('file://')) {
      return url.replace('file://', '');
    }
    return '/mock/test.js';
  }),
  pathToFileURL: jest.fn((path) => `file://${path}`)
};

jest.doMock('url', () => mockUrl);

// Mock path.dirname to return consistent paths
const originalPath = require('path');
jest.doMock('path', () => ({
  ...originalPath,
  dirname: jest.fn((filePath) => {
    if (filePath === global.__filename) {
      return global.__dirname;
    }
    return originalPath.dirname(filePath);
  }),
  resolve: jest.fn((...paths) => {
    // Handle path.resolve(__dirname, '../../') case
    if (paths.length === 2 && paths[0] === global.__dirname && paths[1] === '../../') {
      return mockProjectRoot;
    }
    return originalPath.resolve(...paths);
  }),
  join: originalPath.join
}));

// Mock fs operations to prevent actual file system operations
const originalFs = require('fs');
jest.doMock('fs', () => ({
  ...originalFs,
  mkdirSync: jest.fn(() => true),
  existsSync: jest.fn(() => true),
  writeFileSync: jest.fn(() => true),
  readFileSync: originalFs.readFileSync
}));

// Настройка Jest для тестов

// Мокаем консольные методы
global.console = {
  ...console,
  // Подавляем логи в тестах, но оставляем ошибки
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error,
};

// Эмулируем объекты из модуля url
import { jest } from '@jest/globals';

jest.mock('url', () => ({
  fileURLToPath: jest.fn((url) => url.replace('file://', '')),
  pathToFileURL: jest.fn((path) => `file://${path}`),
}));

// Увеличиваем таймаут для тестов, чтобы избежать проблем с асинхронными операциями
jest.setTimeout(10000);

// Добавляем дополнительные матчеры для удобства тестирования
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Очищаем все моки после каждого теста
afterEach(() => {
  jest.clearAllMocks();
});