import economicEventsService from '../services/EconomicEventsService.js';
import logger from '../utils/logger.js';

/**
 * Контроллер для работы с экономическими событиями
 */
class EconomicController {
  /**
   * Получает предстоящие экономические события
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getUpcomingEconomicEvents(req, res, next) {
    try {
      const { days, limit } = req.query;
      const daysParam = parseInt(days, 10) || 30;
      const limitParam = parseInt(limit, 10) || 10;
      
      logger.debug(`Запрос экономических событий на ${daysParam} дней, лимит: ${limitParam}`);
      
      const events = await economicEventsService.getUpcomingEvents(daysParam);
      
      // Ограничиваем количество возвращаемых событий
      const limitedEvents = events.slice(0, limitParam);
      
      res.json(limitedEvents);
    } catch (error) {
      logger.error('Ошибка при получении предстоящих экономических событий', {
        error: error.message,
        days: req.query.days,
        limit: req.query.limit
      });
      next(error);
    }
  }

  /**
   * Получает экономические события по важности
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getEventsByImportance(req, res, next) {
    try {
      const { importance, limit } = req.query;
      const limitParam = parseInt(limit, 10) || 10;
      
      logger.debug(`Запрос экономических событий по важности: ${importance}, лимит: ${limitParam}`);
      
      const events = await economicEventsService.getEventsByImportance(importance);
      
      // Ограничиваем количество возвращаемых событий
      const limitedEvents = events.slice(0, limitParam);
      
      res.json(limitedEvents);
    } catch (error) {
      logger.error('Ошибка при получении экономических событий по важности', {
        error: error.message,
        importance: req.query.importance,
        limit: req.query.limit
      });
      next(error);
    }
  }

  /**
   * Получает экономические события для указанного периода
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getEventsForPeriod(req, res, next) {
    try {
      const { startDate, endDate, limit } = req.query;
      const limitParam = parseInt(limit, 10) || 10;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          message: 'Требуется указать startDate и endDate'
        });
      }
      
      logger.debug(`Запрос экономических событий для периода: ${startDate} - ${endDate}, лимит: ${limitParam}`);
      
      const events = await economicEventsService.getEventsForPeriod(startDate, endDate);
      
      // Ограничиваем количество возвращаемых событий
      const limitedEvents = events.slice(0, limitParam);
      
      res.json(limitedEvents);
    } catch (error) {
      logger.error('Ошибка при получении экономических событий для периода', {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: req.query.limit
      });
      next(error);
    }
  }
}

const economicController = new EconomicController();
export default economicController; 