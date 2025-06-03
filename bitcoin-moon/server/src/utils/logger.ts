import winston from 'winston';
import path from 'path';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger, IConfig } from '../types/interfaces';

/**
 * Класс логгера, реализующий интерфейс ILogger
 */
@injectable()
export class Logger implements ILogger {
  private logger: winston.Logger;

  constructor(@inject(TYPES.Config) private config: IConfig) {
    // Создаем форматтер для консоли
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} ${level}: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }`;
      })
    );

    // Создаем форматтер для файла
    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.json()
    );

    // Создаем транспорты
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: consoleFormat,
        level: config.logging.level,
      }),
    ];

    // Добавляем файловый транспорт, если не в тестовом режиме
    if (config.environment !== 'test') {
      transports.push(
        new winston.transports.File({
          filename: path.resolve(config.paths.logs, config.logging.file),
          format: fileFormat,
          level: config.logging.level,
          maxsize: config.logging.fileMaxSize,
          maxFiles: 5,
        })
      );
    }

    // Создаем логгер
    this.logger = winston.createLogger({
      level: config.logging.level,
      transports,
      exitOnError: false,
    });
  }

  /**
   * Логирование на уровне debug
   * @param message Сообщение для логирования
   * @param meta Дополнительные метаданные
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  /**
   * Логирование на уровне info
   * @param message Сообщение для логирования
   * @param meta Дополнительные метаданные
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  /**
   * Логирование на уровне warn
   * @param message Сообщение для логирования
   * @param meta Дополнительные метаданные
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  /**
   * Логирование на уровне error
   * @param message Сообщение для логирования
   * @param meta Дополнительные метаданные
   */
  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }
}

// Экспортируем экземпляр по умолчанию для обратной совместимости
const loggerInstance = new Logger({
  port: parseInt(process.env.PORT || '3002', 10),
  environment: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
  sync: {
    bitcoin: 5 * 60 * 1000,
    moon: 60 * 60 * 1000,
    astro: 12 * 60 * 60 * 1000,
    events: 30 * 60 * 1000,
  },
  paths: {
    logs: process.env.LOG_DIR || 'logs',
    cache: process.env.CACHE_DIR || 'src/data/cache',
  },
  api: {
    coingecko: 'https://api.coingecko.com/api/v3',
    farmsense: 'https://api.farmsense.net/v1/moonphases/',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileMaxSize: parseInt(process.env.LOG_FILE_MAX_SIZE || '5242880', 10),
    file: process.env.LOG_FILE || 'server.log',
  }
});

export default loggerInstance; 