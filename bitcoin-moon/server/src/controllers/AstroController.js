import AstroService from '../services/AstroService.js';
import logger from '../utils/logger.js';
import eclipseService from '../services/EclipseService.js';

/**
 * Контроллер для работы с астрономическими данными
 */
class AstroController {
  /**
   * Получает астрономические события для указанного периода
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  async getAstroEvents(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Необходимо указать startDate и endDate',
        });
      }
      
      // Проверяем формат дат
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Некорректный формат даты',
        });
      }
      
      // Получаем затмения
      const eclipses = AstroService.getEclipsesForPeriod(start, end);
      
      // Получаем другие астрономические события
      const astroEvents = AstroService.getAstroEventsForPeriod(start, end);
      
      // Объединяем результаты
      const allEvents = [...eclipses, ...astroEvents];
      
      // Сортируем по дате
      allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return res.status(200).json({
        success: true,
        data: allEvents,
      });
    } catch (error) {
      logger.error('AstroController: ошибка при получении астрономических событий:', error);
      return res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера',
      });
    }
  }
  
  /**
   * Получает текущую фазу луны
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  async getCurrentMoonPhase(req, res) {
    try {
      const phase = AstroService.getMoonPhase();
      
      return res.status(200).json({
        success: true,
        data: phase,
      });
    } catch (error) {
      logger.error('AstroController: ошибка при получении текущей фазы луны:', error);
      return res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера',
      });
    }
  }

  /**
   * Получает текущие астрологические данные
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  getCurrentAstroData(req, res, next) {
    try {
      const astroData = AstroService.getCurrentAstroData();
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
      const planetsData = AstroService.getRetrogradePlanets(date);
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
      const aspectsData = AstroService.getPlanetaryAspects(date);
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
      const influenceData = AstroService.analyzeAstroInfluence();
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

export default new AstroController();
