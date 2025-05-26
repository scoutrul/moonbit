const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Создаем директорию для логов, если она не существует
const logDir = config.paths.logs;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Конфигурация форматирования логов
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Создаем логгер
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'moonbit-api' },
  transports: [
    // Логирование в файлы
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: config.logging.fileMaxSize,
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: config.logging.fileMaxSize,
      maxFiles: 10
    })
  ]
});

// Если не продакшн, то добавляем консольный транспорт с цветами
if (config.server.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        // Форматирование метаданных для читаемости в консоли
        let metaStr = '';
        if (Object.keys(meta).length > 0) {
          if (meta.error) {
            // Форматирование ошибок
            metaStr = meta.error.stack 
              ? `\n${meta.error.stack}` 
              : `\n${JSON.stringify(meta.error)}`;
          } else {
            // Форматирование остальных метаданных
            metaStr = `\n${JSON.stringify(meta, null, 2)}`;
          }
        }
        return `${timestamp} ${level}: ${message}${metaStr}`;
      })
    )
  }));
}

// Обработчик необработанных исключений
logger.exceptions.handle(
  new winston.transports.File({ 
    filename: path.join(logDir, 'exceptions.log'),
    maxsize: config.logging.fileMaxSize,
    maxFiles: 5 
  })
);

// Обработчик необработанных отклонений промисов
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Необработанное отклонение промиса', { reason, promise });
});

// Функция для логирования HTTP-запросов
logger.logRequest = (req, res, next) => {
  const start = Date.now();
  
  // Логируем запрос
  logger.debug(`${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: req.headers,
    query: req.query,
    body: req.body
  });
  
  // После обработки запроса
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'debug';
    
    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      responseHeaders: res.getHeaders()
    });
  });
  
  next();
};

module.exports = logger; 