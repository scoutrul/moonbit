import logger from '../utils/logger.js';
import AstroService from '../services/AstroService.js';

/**
 * Контроллер для работы с данными о Луне
 */
const moonController = {
  /**
   * Получает текущую фазу Луны
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  getCurrentPhase: async (req, res) => {
    try {
      const phaseInfo = AstroService.getCurrentMoonPhaseInfo();
      
      res.status(200).json({
        phase: phaseInfo.phase,
        phaseName: phaseInfo.phaseName,
        icon: phaseInfo.icon,
        nextPhaseTime: phaseInfo.nextPhaseTime,
        nextPhaseName: phaseInfo.nextPhaseName
      });
    } catch (error) {
      logger.error('Error in getCurrentPhase:', error);
      res.status(500).json({ error: 'Ошибка при получении текущей фазы Луны' });
    }
  },

  /**
   * Получает фазы Луны за указанный период
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  getPhasesForPeriod: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Необходимо указать startDate и endDate' });
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Некорректный формат даты' });
      }
      
      const events = AstroService.getLunarEventsInPeriod(start, end);
      
      res.status(200).json(events);
    } catch (error) {
      logger.error('Error in getPhasesForPeriod:', error);
      res.status(500).json({ error: 'Ошибка при получении фаз Луны за период' });
    }
  },

  /**
   * Получает следующие значимые фазы Луны
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  getNextSignificantPhases: async (req, res) => {
    try {
      const count = parseInt(req.query.count) || 4;
      const now = new Date();
      
      // Получаем ближайшее новолуние и полнолуние после текущей даты
      const nextNewMoon = AstroService.getNewMoonAfter(now);
      const nextFullMoon = AstroService.getFullMoonAfter(now);
      
      // Создаем массив для хранения следующих фаз
      const phases = [];
      
      // Сначала добавляем ближайшую фазу
      if (nextNewMoon < nextFullMoon) {
        phases.push({
          date: nextNewMoon.toISOString(),
          type: 'new_moon',
          phaseName: 'Новолуние',
          icon: '🌑'
        });
        
        // Добавляем полнолуние
        phases.push({
          date: nextFullMoon.toISOString(),
          type: 'full_moon',
          phaseName: 'Полнолуние',
          icon: '🌕'
        });
      } else {
        phases.push({
          date: nextFullMoon.toISOString(),
          type: 'full_moon',
          phaseName: 'Полнолуние',
          icon: '🌕'
        });
        
        // Добавляем новолуние
        phases.push({
          date: nextNewMoon.toISOString(),
          type: 'new_moon',
          phaseName: 'Новолуние',
          icon: '🌑'
        });
      }
      
      // Добавляем остальные фазы
      let lastNewMoon = nextNewMoon;
      let lastFullMoon = nextFullMoon;
      
      while (phases.length < count) {
        // Добавляем следующее новолуние
        const newMoon = AstroService.getNewMoonAfter(lastNewMoon);
        phases.push({
          date: newMoon.toISOString(),
          type: 'new_moon',
          phaseName: 'Новолуние',
          icon: '🌑'
        });
        lastNewMoon = newMoon;
        
        // Если достигли нужного количества, выходим
        if (phases.length >= count) break;
        
        // Добавляем следующее полнолуние
        const fullMoon = AstroService.getFullMoonAfter(lastFullMoon);
        phases.push({
          date: fullMoon.toISOString(),
          type: 'full_moon',
          phaseName: 'Полнолуние',
          icon: '🌕'
        });
        lastFullMoon = fullMoon;
      }
      
      // Сортируем фазы по дате и ограничиваем количество
      phases.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      res.status(200).json(phases.slice(0, count));
    } catch (error) {
      logger.error('Error in getNextSignificantPhases:', error);
      res.status(500).json({ error: 'Ошибка при получении следующих значимых фаз Луны' });
    }
  },

  /**
   * Получает предстоящие лунные события
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  getUpcomingLunarEvents: async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + days);
      
      const events = AstroService.getLunarEventsInPeriod(now, end);
      
      res.status(200).json(events);
    } catch (error) {
      logger.error('Error in getUpcomingLunarEvents:', error);
      res.status(500).json({ error: 'Ошибка при получении предстоящих лунных событий' });
    }
  },

  /**
   * Получает исторические лунные события
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  getHistoricalLunarEvents: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Необходимо указать startDate и endDate' });
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Некорректный формат даты' });
      }
      
      const events = AstroService.getLunarEventsInPeriod(start, end);
      
      res.status(200).json(events);
    } catch (error) {
      logger.error('Error in getHistoricalLunarEvents:', error);
      res.status(500).json({ error: 'Ошибка при получении исторических лунных событий' });
    }
  },

  /**
   * Анализирует влияние фаз Луны на рынок биткоина
   * @param {Object} req - HTTP запрос
   * @param {Object} res - HTTP ответ
   */
  getMoonInfluence: async (req, res) => {
    try {
      // Заглушка для анализа влияния лунных фаз
      // В будущем здесь может быть реальный анализ на основе исторических данных
      res.status(200).json({
        influence: 'neutral',
        description: 'Влияние лунных фаз на рынок биткоина является предметом исследования',
        disclaimer: 'Данный анализ представлен исключительно в информационных целях и не является инвестиционной рекомендацией'
      });
    } catch (error) {
      logger.error('Error in getMoonInfluence:', error);
      res.status(500).json({ error: 'Ошибка при анализе влияния фаз Луны' });
    }
  }
};

export default moonController;
