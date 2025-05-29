import astroService from '../services/AstroService.js';
import logger from '../utils/logger.js';
import eclipseService from '../services/EclipseService.js';

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

  /**
   * Получает предстоящие солнечные затмения
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getSolarEclipses(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      logger.debug(`Запрос предстоящих солнечных затмений: startDate=${startDate || 'now'}, endDate=${endDate || 'auto'}`);
      
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : null;
      
      const eclipses = eclipseService.getUpcomingSolarEclipses(start, end);
      
      res.json(eclipses);
    } catch (error) {
      logger.error('Ошибка при получении предстоящих солнечных затмений', {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      });
      next(error);
    }
  }

  /**
   * Получает предстоящие лунные затмения
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getLunarEclipses(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      logger.debug(`Запрос предстоящих лунных затмений: startDate=${startDate || 'now'}, endDate=${endDate || 'auto'}`);
      
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : null;
      
      const eclipses = eclipseService.getUpcomingLunarEclipses(start, end);
      
      res.json(eclipses);
    } catch (error) {
      logger.error('Ошибка при получении предстоящих лунных затмений', {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      });
      next(error);
    }
  }

  /**
   * Получает все предстоящие затмения (солнечные и лунные)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getAllEclipses(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      logger.debug(`Запрос всех предстоящих затмений: startDate=${startDate || 'now'}, endDate=${endDate || 'auto'}`);
      
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : null;
      
      const eclipses = eclipseService.getAllEclipses(start, end);
      
      res.json(eclipses);
    } catch (error) {
      logger.error('Ошибка при получении всех предстоящих затмений', {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      });
      next(error);
    }
  }
}

const astroController = new AstroController();
export default astroController;
