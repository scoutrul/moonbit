const moonService = require('../services/MoonService');
const logger = require('../utils/logger');
const { validateResponse } = require('../utils/validators');
const { schemas } = require('../utils/validators');

/**
 * Контроллер для работы с данными о фазах луны
 */
class MoonController {
  /**
   * Получает текущую фазу луны
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getCurrentPhase(req, res, next) {
    try {
      const phase = moonService.getCurrentPhase();
      
      // Валидируем ответ
      const validatedPhase = validateResponse(schemas.moonPhaseResponse, phase);
      
      res.json(validatedPhase);
    } catch (error) {
      logger.error('Ошибка при получении текущей фазы луны', { error: error.message });
      next(error);
    }
  }

  /**
   * Получает фазы луны за период
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getPhasesForPeriod(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      const phases = moonService.getPhasesForPeriod(startDate, endDate);
      res.json(phases);
    } catch (error) {
      logger.error('Ошибка при получении фаз луны за период', { 
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate 
      });
      next(error);
    }
  }

  /**
   * Получает следующие значимые фазы луны
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getNextSignificantPhases(req, res, next) {
    try {
      const { count } = req.query;
      const phases = moonService.getNextSignificantPhases(count);
      
      // Валидируем каждую фазу в ответе
      const validatedPhases = phases.map(phase => 
        validateResponse(schemas.significantMoonPhaseResponse, phase)
      );
      
      res.json(validatedPhases);
    } catch (error) {
      logger.error('Ошибка при получении следующих значимых фаз луны', { 
        error: error.message,
        count: req.query.count 
      });
      next(error);
    }
  }
}

// Экспортируем синглтон
module.exports = new MoonController(); 