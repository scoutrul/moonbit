import dotenv from 'dotenv';

dotenv.config();

// Проверка наличия обязательных переменных окружения
const requiredEnvVars = [
  'PORT',
  'CORS_ORIGIN',
  'LOG_LEVEL',
  'BYBIT_API_KEY',
  'BYBIT_API_SECRET',
  'CACHE_TTL_OHLC',
  'REDIS_URL',
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.warn(`Предупреждение: Переменная окружения ${varName} не установлена.`);
  }
}

export default {
  PORT: process.env.PORT || 3001,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  BYBIT: {
    API_KEY: process.env.BYBIT_API_KEY || 'your_api_key', // Fallback для локальной разработки без .env
    API_SECRET: process.env.BYBIT_API_SECRET || 'your_api_secret', // Fallback
  },
  CACHE_TTL: {
    OHLC: parseInt(process.env.CACHE_TTL_OHLC || '60', 10), // TTL в секундах
  },
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};

export const {
    PORT,
    CORS_ORIGIN,
    LOG_LEVEL,
    BYBIT,
    CACHE_TTL,
    REDIS_URL,
    CLIENT_URL
} = {
  PORT: process.env.PORT || 3001,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  BYBIT: {
    API_KEY: process.env.BYBIT_API_KEY || '',
    API_SECRET: process.env.BYBIT_API_SECRET || '',
  },
  CACHE_TTL: {
    OHLC: parseInt(process.env.CACHE_TTL_OHLC || '60', 10),
  },
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
}; 