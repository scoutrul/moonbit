const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// Создаем директорию для логов, если она не существует
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Форматирование для консоли
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = Object.keys(meta).length 
      ? `\n${JSON.stringify(meta, null, 2)}` 
      : '';
      
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Форматирование для файла
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.json()
);

// HTTP логирование
const httpLogger = format((info, opts) => {
  if (info.req && info.res) {
    const { req, res, duration } = info;
    info.message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    info.http = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      userAgent: req.get('user-agent') || '-',
      ip: req.ip || req.connection.remoteAddress
    };
    delete info.req;
    delete info.res;
  }
  return info;
});

// Создаем логгер
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.errors({ stack: true }),
    format.splat()
  ),
  defaultMeta: { service: 'moonbit-api' },
  transports: [
    // Логирование в файлы
    new transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      format: fileFormat
    }),
    new transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat
    }),
    // Отдельное логирование HTTP запросов
    new transports.File({ 
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      format: format.combine(
        httpLogger(),
        fileFormat
      )
    })
  ]
});

// Если не production, то также логируем в консоль
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: consoleFormat
  }));
}

// Добавляем метод для логирования HTTP запросов
logger.http = (req, res, duration) => {
  logger.log('http', { req, res, duration });
};

module.exports = logger; 