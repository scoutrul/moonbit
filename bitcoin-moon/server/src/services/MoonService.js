import logger from '../utils/logger.js';
import moonRepository from '../repositories/MoonRepository.js';

/**
 * Сервис для работы с данными о фазах луны
 * Использует репозиторий для получения данных и предоставляет бизнес-логику
 */
class MoonService {
  /**
   * Обновляет данные о фазах луны
   * @returns {Promise<Object>} Обновленные данные о фазах
   */
  async updatePhaseData() {
    logger.debug('MoonService: запрос обновления данных о фазах луны');
    return await moonRepository.fetchMoonPhases();
  }

  /**
   * Получает текущую фазу луны
   * @returns {Object} Данные о текущей фазе луны
   */
  getCurrentPhase() {
    const phasesCache = moonRepository.getPhasesCache();

    // Если данные устарели (более 6 часов), запускаем обновление
    const cacheAge = phasesCache.last_updated
      ? (new Date() - new Date(phasesCache.last_updated)) / 1000 / 60 / 60
      : 9999;

    if (cacheAge > 6) {
      logger.debug(`Кэш фаз луны устарел (${Math.round(cacheAge)} ч), запуск обновления`);
      this.updatePhaseData().catch((error) => {
        logger.error('Ошибка при фоновом обновлении фаз луны', { error });
      });
    }

    // Если текущих данных нет, рассчитываем фазу на текущий момент
    if (!phasesCache.current) {
      const now = new Date();
      const phase = moonRepository.calculatePhase(now);
      return {
        date: now.toISOString(),
        phase,
        phaseName: moonRepository.getPhaseName(phase),
      };
    }

    return phasesCache.current;
  }

  /**
   * Получает фазы луны для указанного периода
   * @param {Date|string} startDate - Начальная дата периода
   * @param {Date|string} endDate - Конечная дата периода
   * @returns {Array} Список фаз луны для периода
   */
  getPhasesForPeriod(startDate, endDate) {
    if (typeof startDate === 'string') {
      startDate = new Date(startDate);
    }

    if (typeof endDate === 'string') {
      endDate = new Date(endDate);
    }

    // Проверяем валидность дат
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Некорректный формат дат');
    }

    // Ограничиваем период одним годом
    const maxEndDate = new Date(startDate);
    maxEndDate.setFullYear(maxEndDate.getFullYear() + 1);

    if (endDate > maxEndDate) {
      endDate = maxEndDate;
    }

    // Расчет количества дней в периоде
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const results = [];
    for (let i = 0; i <= diffDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const phase = moonRepository.calculatePhase(currentDate);

      results.push({
        date: currentDate.toISOString().split('T')[0],
        phase,
        phaseName: moonRepository.getPhaseName(phase),
      });
    }

    return results;
  }

  /**
   * Получает ближайшие значимые фазы луны (новолуние и полнолуние)
   * @param {number} count - Количество фаз для получения
   * @returns {Array} Список значимых фаз
   */
  getNextSignificantPhases(count = 4) {
    const phasesCache = moonRepository.getPhasesCache();

    // Если кэш устарел (более 12 часов), запускаем обновление
    const cacheAge = phasesCache.last_updated
      ? (new Date() - new Date(phasesCache.last_updated)) / 1000 / 60 / 60
      : 9999;

    if (cacheAge > 12 || !phasesCache.phases.length) {
      logger.debug(`Кэш фаз луны устарел (${Math.round(cacheAge)} ч), запуск обновления`);
      this.updatePhaseData().catch((error) => {
        logger.error('Ошибка при фоновом обновлении фаз луны', { error });
      });

      // Если нет данных в кэше, рассчитываем их на месте
      if (!phasesCache.phases.length) {
        return moonRepository.calculateUpcomingSignificantPhases(new Date(), count);
      }
    }

    // Возвращаем запрошенное количество фаз из кэша
    return phasesCache.phases.slice(0, count);
  }

  /**
   * Анализирует влияние фазы луны на рынок биткоина
   * @param {Object} bitcoinData - Исторические данные биткоина
   * @returns {Object} Результат анализа
   */
  analyzeMoonInfluence(bitcoinData) {
    // В этом методе можно было бы реализовать анализ корреляции между
    // фазами луны и движениями цены биткоина

    // Простой пример:
    const result = {
      newMoonImpact: {
        averageChange: 2.5,
        volatility: 'повышенная',
        trend: 'положительный',
      },
      fullMoonImpact: {
        averageChange: -1.2,
        volatility: 'высокая',
        trend: 'негативный',
      },
      correlation: 'слабая',
      significance: 'p > 0.05',
    };

    return result;
  }
}

const moonService = new MoonService();
export default moonService;
