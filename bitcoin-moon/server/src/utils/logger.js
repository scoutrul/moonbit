const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Создаем директорию для логов, если она не существует
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Кастомный транспорт для разделения логов по уровням
const createFileTransport = (level) => {
  return new winston.transports.File({
    filename: path.join(logDir, `${level}.log`),
    level,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.json()
    )
  });
};

// Расширенный формат для консоли с поддержкой цветов
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...rest }) => {
    const restString = Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${restString}`;
  })
);

// Формат для файлов логов
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Создаем логгер
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'moonbit-server' },
  transports: [
    // Логи по уровням
    createFileTransport('error'),
    createFileTransport('warn'),
    createFileTransport('info'),
    createFileTransport('debug'),
    
    // Все логи 
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat
    }),
    
    // В режиме разработки выводим в консоль
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: consoleFormat
      })
    ] : [])
  ],
  // Не вылетать при ошибках логирования
  exitOnError: false
});

// Создаем обертку для форматирования контекста
const formatLoggerMethod = (method) => {
  return (message, context = {}) => {
    // Если передана ошибка, извлекаем из нее дополнительную информацию
    if (context.error instanceof Error) {
      context.stack = context.error.stack;
      context.message = context.error.message;
    }
    
    // Извлекаем путь к файлу, из которого вызван логгер
    const stackTrace = new Error().stack;
    if (stackTrace) {
      const callerLine = stackTrace.split('\n')[2];
      if (callerLine) {
        const match = callerLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/);
        if (match) {
          context.caller = {
            method: match[1],
            file: match[2],
            line: match[3],
            column: match[4]
          };
        }
      }
    }
    
    return logger[method](message, context);
  };
};

// Экспортируем методы логгера с улучшенным форматированием
module.exports = {
  debug: formatLoggerMethod('debug'),
  info: formatLoggerMethod('info'),
  warn: formatLoggerMethod('warn'),
  error: formatLoggerMethod('error'),
  
  // Метод для профилирования времени выполнения
  profile: (id, message, context = {}) => {
    logger.profile(id, { 
      message, 
      ...context 
    });
  },
  
  // Логирование HTTP запросов
  http: (req, res, responseTime) => {
    const { method, originalUrl, ip } = req;
    logger.info(`HTTP ${method} ${originalUrl}`, {
      method,
      url: originalUrl,
      ip,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    });
  },
  
  // Получение оригинального логгера
  getWinstonLogger: () => logger
}; 