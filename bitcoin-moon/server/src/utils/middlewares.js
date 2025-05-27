import logger from './logger.js';
import { validateRequest } from './validators.js';

/**
 * Middleware для валидации запроса
 * @param {Object} schema - Схема валидации Zod
 * @param {string} source - Откуда брать данные ('query', 'body', 'params')
 * @returns {Function} Middleware функция
 */
function validate(schema, source = 'query') {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validated = validateRequest(schema, data);
      req[source] = validated;
      next();
    } catch (error) {
      res.status(error.status || 400).json({
        message: error.message,
        errors: error.errors,
      });
    }
  };
}

/**
 * Middleware для логирования запросов
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;

    logger.http(req, res, duration);
  });

  next();
}

/**
 * Middleware для обработки ошибок
 */
function errorHandler(err, req, res, next) {
  // Если ответ уже отправлен, передаем ошибку дальше
  if (res.headersSent) {
    return next(err);
  }

  // Логируем ошибку
  logger.error('Необработанная ошибка', {
    error: err,
    url: req.originalUrl,
    method: req.method,
  });

  // Определяем статус и текст ошибки
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  // В production не отправляем стек ошибки
  const response = {
    message,
    status: statusCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  // Добавляем поле errors, если есть
  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
}

/**
 * Middleware для обработки несуществующих маршрутов
 */
function notFoundHandler(req, res) {
  logger.warn('Запрос к несуществующему маршруту', {
    url: req.originalUrl,
    method: req.method,
  });

  res.status(404).json({
    message: 'Маршрут не найден',
    status: 404,
  });
}

export {
  validate,
  requestLogger,
  errorHandler,
  notFoundHandler,
};
