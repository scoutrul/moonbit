import moonService from '../services/MoonService.js';
import logger from '../utils/logger.js';
import { validateResponse, schemas } from '../utils/validators.js';

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
  getCurrentPhase(req, res, next) {
    try {
      const phaseData = moonService.getCurrentPhase();
      
      // Валидируем ответ
      const validatedData = validateResponse(schemas.moonPhaseResponse, phaseData);
      
      res.json(validatedData);
    } catch (error) {
      logger.error('Ошибка при получении текущей фазы луны', { error: error.message });
      next(error);
    }
  }

  /**
   * Получает фазы луны для указанного периода
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  getPhasesForPeriod(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const phasesData = moonService.getPhasesForPeriod(startDate, endDate);
      res.json(phasesData);
    } catch (error) {
      logger.error('Ошибка при получении фаз луны за период', {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
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
  getNextSignificantPhases(req, res, next) {
    try {
      const { count } = req.query;

      const phasesData = moonService.getNextSignificantPhases(count);
      res.json(phasesData);
    } catch (error) {
      logger.error('Ошибка при получении следующих значимых фаз луны', {
        error: error.message,
        count: req.query.count,
      });
      next(error);
    }
  }

  /**
   * Получает анализ влияния фаз луны на рынок биткоина
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  getMoonInfluence(req, res, next) {
    try {
      // Можно было бы запросить исторические данные биткоина
      // и передать их в метод анализа
      const influenceData = moonService.analyzeMoonInfluence();
      res.json(influenceData);
    } catch (error) {
      logger.error('Ошибка при получении анализа влияния фаз луны', { error: error.message });
      next(error);
    }
  }
}

const moonController = new MoonController();
export default moonController;
