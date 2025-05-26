const astroService = require('../services/AstroService');
const logger = require('../utils/logger');

/**
 * Контроллер для работы с астрологическими данными
 */
class AstroController {
  /**
   * Получает текущие астрологические данные
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getCurrentAstroData(req, res, next) {
    try {
      const astroData = astroService.getCurrentAstroData();
      res.json(astroData);
    } catch (error) {
      logger.error('Ошибка при получении текущих астрологических данных', { error: error.message });
      next(error);
    }
  }

  /**
   * Получает информацию о ретроградных планетах
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getRetrogradePlanets(req, res, next) {
    try {
      const { date } = req.query;
      const retrogradeData = astroService.getRetrogradePlanets(date);
      res.json(retrogradeData);
    } catch (error) {
      logger.error('Ошибка при получении информации о ретроградных планетах', {
        error: error.message,
        date: req.query.date,
      });
      next(error);
    }
  }

  /**
   * Получает информацию о планетарных аспектах
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getPlanetaryAspects(req, res, next) {
    try {
      const { date } = req.query;
      const aspectsData = astroService.getPlanetaryAspects(date);
      res.json(aspectsData);
    } catch (error) {
      logger.error('Ошибка при получении информации о планетарных аспектах', {
        error: error.message,
        date: req.query.date,
      });
      next(error);
    }
  }
}

// Экспортируем синглтон
module.exports = new AstroController();
