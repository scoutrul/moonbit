const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Загружаем переменные окружения
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
  'COINGECKO_API_KEY',
  'FARMSENSE_API_KEY',
];

// Предупреждения о отсутствующих переменных окружения
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.warn(`Предупреждение: Переменная окружения ${varName} не установлена.`);
  }
}

// Создаем пути к важным директориям
const rootDir = path.resolve(__dirname, '../../');
const logsDir = path.join(rootDir, 'logs');
const cacheDir = path.join(rootDir, 'src/data/cache');

// Создаем директории, если они не существуют
[logsDir, cacheDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Конфигурация сервера
 */
const config = {
  // Настройки сервера
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
  },

  // API URLs и настройки
  api: {
    coingecko: {
      key: process.env.COINGECKO_API_KEY,
      baseUrl: 'https://api.coingecko.com/api/v3',
      endpoints: {
        price: '/simple/price',
        marketChart: '/coins/bitcoin/market_chart',
      },
      params: {
        defaultCurrency: 'usd',
        supportedCurrencies: ['usd', 'eur', 'rub'],
      },
    },
    farmsense: {
      key: process.env.FARMSENSE_API_KEY,
      baseUrl: 'https://api.farmsense.net/v1/moonphases/',
    },
    bybit: {
      key: process.env.BYBIT_API_KEY || '',
      secret: process.env.BYBIT_API_SECRET || '',
    },
  },

  // Настройки кэширования
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600000', 10), // 1 час по умолчанию
    ohlc: parseInt(process.env.CACHE_TTL_OHLC || '60', 10), // секунды
    bitcoin: {
      priceTtl: 15, // минут
      historyTtl: 12, // часов
      priceFile: 'bitcoin_price.json',
      historicalFile: 'bitcoin_historical.json',
      dataFile: 'bitcoin_data.json',
    },
    moon: {
      phaseTtl: 60, // минут
      phaseFile: 'moon_phase.json',
    },
    astro: {
      dataTtl: 12 * 60, // минут (12 часов)
      dataFile: 'astro_data.json',
    },
    events: {
      dataTtl: 30, // минут
      dataFile: 'events_data.json',
    },
  },

  // Настройки логирования
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileMaxSize: parseInt(process.env.LOG_FILE_MAX_SIZE || '5242880', 10), // 5MB по умолчанию
  },

  // Настройки CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // Пути к директориям
  paths: {
    logs: logsDir,
    cache: cacheDir,
  },

  // Константы для мок-данных
  mock: {
    bitcoin: {
      basePrice: 60000,
      priceSpread: 5000,
      dailyFluctuation: 1000,
    },
  },

  // Интервалы синхронизации (мс)
  sync: {
    bitcoin: 5 * 60 * 1000, // 5 минут
    moon: 60 * 60 * 1000, // 1 час
    astro: 12 * 60 * 60 * 1000, // 12 часов
    events: 30 * 60 * 1000, // 30 минут
  },

  // Дополнительные настройки
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  client: {
    url: process.env.CLIENT_URL || 'http://localhost:3000',
  },
};

module.exports = config;
