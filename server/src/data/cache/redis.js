const Redis = require('ioredis');
const config = require('../../config');
const logger = require('../../utils/logger');

// В режиме тестирования или разработки можно использовать моковый клиент
if (process.env.NODE_ENV === 'test' || process.env.USE_MOCK_REDIS === 'true') {
  logger.info('Используется мок Redis для тестов или разработки');
  
  // Простая реализация Redis для разработки без внешних зависимостей
  const mockRedisClient = {
    cache: {},
    get: async (key) => {
      logger.debug(`[MockRedis] GET ${key}`);
      return mockRedisClient.cache[key] || null;
    },
    set: async (key, value) => {
      logger.debug(`[MockRedis] SET ${key}`);
      mockRedisClient.cache[key] = value;
      return 'OK';
    },
    setex: async (key, seconds, value) => {
      logger.debug(`[MockRedis] SETEX ${key} ${seconds}`);
      mockRedisClient.cache[key] = value;
      // В реальной имплементации здесь был бы таймер для удаления по истечении TTL
      return 'OK';
    },
    del: async (key) => {
      logger.debug(`[MockRedis] DEL ${key}`);
      const existed = mockRedisClient.cache[key] !== undefined;
      delete mockRedisClient.cache[key];
      return existed ? 1 : 0;
    },
    flushall: async () => {
      logger.debug('[MockRedis] FLUSHALL');
      mockRedisClient.cache = {};
      return 'OK';
    }
  };
  
  module.exports = mockRedisClient;
} else {
  const redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });
  
  redisClient.on('connect', () => {
    logger.info('Успешное подключение к Redis');
  });
  
  redisClient.on('error', (err) => {
    logger.error('Ошибка подключения к Redis:', err);
  });
  
  redisClient.on('ready', () => {
    logger.info('Redis готов к использованию');
  });
  
  redisClient.on('close', () => {
    logger.info('Соединение с Redis закрыто');
  });
  
  redisClient.on('reconnecting', () => {
    logger.info('Переподключение к Redis...');
  });
  
  module.exports = redisClient;
} 