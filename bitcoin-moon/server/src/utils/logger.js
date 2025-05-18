const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Создаем директорию для логов, если она не существует
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Настраиваем формат логов
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Создаем логгер
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Логи уровня error и выше пишем в отдельный файл
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Все логи пишем в общий файл
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log')
    }),
    // В режиме разработки выводим в консоль
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      })
    ] : [])
  ]
});

// Экспортируем методы логгера
module.exports = {
  debug: (message) => logger.debug(message),
  info: (message) => logger.info(message),
  warn: (message) => logger.warn(message),
  error: (message) => logger.error(message)
}; 