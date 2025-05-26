const eventsService = require('../services/EventsService');
const logger = require('../utils/logger');

/**
 * Контроллер для работы с событиями
 */
class EventsController {
  /**
   * Получает последние события, связанные с биткоином
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getRecentEvents(req, res, next) {
    try {
      const { limit } = req.query;

      const events = eventsService.getRecentEvents(limit);
      res.json(events);
    } catch (error) {
      logger.error('Ошибка при получении последних событий', {
        error: error.message,
        limit: req.query.limit,
      });
      next(error);
    }
  }

  /**
   * Получает события за указанный период
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getEventsByPeriod(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const events = eventsService.getEventsByPeriod(startDate, endDate);
      res.json(events);
    } catch (error) {
      logger.error('Ошибка при получении событий за период', {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });
      next(error);
    }
  }

  /**
   * Получает события по уровню важности
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getEventsByImportance(req, res, next) {
    try {
      const level = parseInt(req.params.level, 10);
      const { limit } = req.query;

      if (isNaN(level) || level < 1 || level > 3) {
        return res.status(400).json({
          message: 'Уровень важности должен быть от 1 до 3',
        });
      }

      const events = eventsService.getEventsByImportance(level, limit);
      res.json(events);
    } catch (error) {
      logger.error('Ошибка при получении событий по уровню важности', {
        error: error.message,
        level: req.params.level,
        limit: req.query.limit,
      });
      next(error);
    }
  }
}

// Экспортируем синглтон
module.exports = new EventsController();
