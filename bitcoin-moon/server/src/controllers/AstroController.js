import astroService from '../services/AstroService.js';
import logger from '../utils/logger.js';

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
  getCurrentAstroData(req, res, next) {
    try {
      const astroData = astroService.getCurrentAstroData();
      res.json(astroData);
    } catch (error) {
      logger.error('Ошибка при получении астрологических данных', { error: error.message });
      next(error);
    }
  }

  /**
   * Получает список ретроградных планет
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  getRetrogradePlanets(req, res, next) {
    try {
      const { date } = req.query;
      const planetsData = astroService.getRetrogradePlanets(date);
      res.json(planetsData);
    } catch (error) {
      logger.error('Ошибка при получении данных о ретроградных планетах', {
        error: error.message,
        date: req.query.date,
      });
      next(error);
    }
  }

  /**
   * Получает планетарные аспекты
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  getPlanetaryAspects(req, res, next) {
    try {
      const { date } = req.query;
      const aspectsData = astroService.getPlanetaryAspects(date);
      res.json(aspectsData);
    } catch (error) {
      logger.error('Ошибка при получении данных о планетарных аспектах', {
        error: error.message,
        date: req.query.date,
      });
      next(error);
    }
  }

  /**
   * Получает анализ влияния астрологических факторов
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  getAstroInfluence(req, res, next) {
    try {
      const influenceData = astroService.analyzeAstroInfluence();
      res.json(influenceData);
    } catch (error) {
      logger.error('Ошибка при получении анализа астрологического влияния', { error: error.message });
      next(error);
    }
  }
}

const astroController = new AstroController();
export default astroController;
