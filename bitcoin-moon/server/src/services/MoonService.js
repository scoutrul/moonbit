const logger = require('../utils/logger');
const { 
  calculateMoonPhase, 
  getMoonPhaseName, 
  getMoonPhasesForPeriod, 
  findNextSignificantPhases 
} = require('../utils/moonCalculations');

/**
 * Сервис для работы с данными о фазах Луны
 */
class MoonService {
  constructor() {
    // Кэш для хранения данных
    this.phasesCache = {};
    
    // Время последнего обновления кэша
    this.lastUpdate = {};
    
    // Время жизни кэша в миллисекундах (1 день)
    this.cacheTTL = 24 * 60 * 60 * 1000;
  }
  
  /**
   * Получает текущую фазу Луны
   * @returns {Object} - Информация о текущей фазе луны
   */
  getCurrentPhase() {
    try {
      const now = new Date();
      const phase = calculateMoonPhase(now);
      const phaseName = getMoonPhaseName(phase);
      
      logger.debug('Получена текущая фаза луны', { phase, phaseName });
      
      return {
        date: now.toISOString(),
        phase,
        phaseName,
      };
    } catch (error) {
      logger.error('Ошибка при получении текущей фазы луны', { 
        error
      });
      throw error;
    }
  }
  
  /**
   * Получает фазы луны за указанный период
   * @param {Date|string} startDate - Начальная дата
   * @param {Date|string} endDate - Конечная дата
   * @returns {Array<Object>} - Массив дат и фаз луны
   */
  getPhasesForPeriod(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Создаем ключ для кэша
      const cacheKey = `${start.toISOString()}_${end.toISOString()}`;
      
      // Проверяем кэш
      if (
        this.phasesCache[cacheKey] && 
        this.lastUpdate[cacheKey] && 
        Date.now() - this.lastUpdate[cacheKey] < this.cacheTTL
      ) {
        logger.debug('Использование кэшированных данных о фазах луны');
        return this.phasesCache[cacheKey];
      }
      
      logger.debug('Вычисление фаз луны для периода', { 
        startDate: start.toISOString(), 
        endDate: end.toISOString() 
      });
      
      // Вычисляем фазы используя вынесенную функцию
      const phases = getMoonPhasesForPeriod(start, end);
      
      // Сохраняем в кэш
      this.phasesCache[cacheKey] = phases;
      this.lastUpdate[cacheKey] = Date.now();
      
      return phases;
    } catch (error) {
      logger.error('Ошибка при получении фаз луны за период', {
        error,
        startDate,
        endDate
      });
      throw error;
    }
  }
  
  /**
   * Получает следующие значимые фазы луны (новолуние, полнолуние)
   * @param {number} count - Количество фаз для поиска
   * @returns {Array<Object>} - Массив предстоящих значимых фаз
   */
  getNextSignificantPhases(count = 4) {
    try {
      const now = new Date();
      
      // Создаем ключ для кэша
      const cacheKey = `next_${count}_${now.toDateString()}`;
      
      // Проверяем кэш
      if (
        this.phasesCache[cacheKey] && 
        this.lastUpdate[cacheKey] && 
        Date.now() - this.lastUpdate[cacheKey] < this.cacheTTL
      ) {
        logger.debug('Использование кэшированных данных о значимых фазах луны');
        return this.phasesCache[cacheKey];
      }
      
      logger.debug('Вычисление следующих значимых фаз луны', { count });
      
      // Вычисляем фазы используя вынесенную функцию
      const phases = findNextSignificantPhases(now, count);
      
      // Сохраняем в кэш
      this.phasesCache[cacheKey] = phases;
      this.lastUpdate[cacheKey] = Date.now();
      
      return phases;
    } catch (error) {
      logger.error('Ошибка при получении следующих значимых фаз луны', {
        error,
        count
      });
      throw error;
    }
  }

  /**
   * Очищает кэш
   */
  clearCache() {
    this.phasesCache = {};
    this.lastUpdate = {};
    logger.debug('Кэш лунных фаз очищен');
  }
}

// Создаем синглтон
const moonService = new MoonService();

module.exports = moonService; 