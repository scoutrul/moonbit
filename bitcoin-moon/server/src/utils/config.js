/**
 * Модуль конфигурации сервера
 * Загружает переменные окружения и предоставляет доступ к ним
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Конфигурация сервера
 */
const config = {
  // Настройки сервера
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },
  
  // Ключи API
  api: {
    coingecko: process.env.COINGECKO_API_KEY,
    farmsense: process.env.FARMSENSE_API_KEY
  },
  
  // Настройки кэширования
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || 3600000) // 1 час по умолчанию
  },
  
  // Настройки логирования
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileMaxSize: parseInt(process.env.LOG_FILE_MAX_SIZE || 5242880) // 5MB по умолчанию
  },
  
  // Настройки CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  // Пути к директориям
  paths: {
    logs: path.join(__dirname, '../../logs'),
    cache: path.join(__dirname, '../data/cache')
  }
};

/**
 * Проверяет наличие необходимых переменных окружения
 * @returns {boolean} Результат проверки
 */
function validateConfig() {
  const warnings = [];
  
  // Проверка ключей API
  if (!config.api.coingecko) {
    warnings.push('COINGECKO_API_KEY не указан. API может работать в ограниченном режиме.');
  }
  
  if (!config.api.farmsense) {
    warnings.push('FARMSENSE_API_KEY не указан. API может работать в ограниченном режиме.');
  }
  
  // Вывод предупреждений
  if (warnings.length > 0) {
    console.warn('Предупреждения конфигурации:');
    warnings.forEach(warning => console.warn(`- ${warning}`));
  }
  
  return warnings.length === 0;
}

// Вызываем проверку конфигурации при запуске
validateConfig();

module.exports = config; 