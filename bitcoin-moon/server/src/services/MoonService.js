import { moonphase, moonillum } from 'astronomia'; // Added moonillum
import moonRepository from '../repositories/MoonRepository.js';
import logger from '../utils/logger.js'; // Assuming logger is used, ensure it's imported

/**
 * Сервис для работы с данными о фазах луны
 * Предоставляет высокоуровневые методы для получения лунных данных
 */
class MoonService {
  /**
   * Обновляет данные о фазах луны
   * @returns {Promise<Object>} Обновленные данные о фазах луны
   */
  async updatePhaseData() {
    logger.debug('MoonService: запрос обновления данных о фазах луны');
    return await moonRepository.fetchMoonPhases();
  }

  /**
   * Получает текущую фазу луны
   * @returns {Promise<Object>} Данные о текущей фазе луны
   */
  async getCurrentPhase() {
    try {
      const phasesCache = moonRepository.getPhasesCache();
      const now = new Date();
      
      // Проверяем, нужно ли обновить кэш (если данные старше 6 часов)
      if (!phasesCache.last_updated || 
          (now - new Date(phasesCache.last_updated)) > 6 * 60 * 60 * 1000) {
        logger.debug('MoonService: кэш устарел, обновляем данные');
        await this.updatePhaseData();
        return moonRepository.getPhasesCache().current;
      }
      
      // Если кэш актуален, но нет текущих данных, вычисляем
      if (!phasesCache.current) {
        const phase = moonRepository.calculatePhase(now);
        return {
          phase,
          phaseName: moonRepository.getPhaseName(phase),
          date: now.toISOString()
        };
      }
      
      return phasesCache.current;
    } catch (error) {
      logger.error('MoonService: ошибка при получении текущей фазы:', error);
      throw error;
    }
  }

  /**
   * Получает фазы луны за указанный период
   * @param {string} startDate - Начальная дата (ISO строка)
   * @param {string} endDate - Конечная дата (ISO строка)
   * @returns {Promise<Array>} Массив фаз луны за период
   */
  async getPhasesForPeriod(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const phases = [];
      
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const jd = this._dateToJulianDay(currentDate);
        const illuminatedFraction = moonillum.fraction(jd); // Using astronomia
        // To distinguish between waxing and waning, we might need phase angle or compare with previous/next day's illumination.
        // For simplicity, this example might not fully distinguish waxing/waning for crescent/gibbous without more complex logic or different astronomia functions.
        // moonillum.phaseAngle might be useful here if available and provides enough info.
        // Let's assume for now we get a simple phase name based on illumination.
        const phaseName = this._getPhaseNameFromIllumination(illuminatedFraction, currentDate, jd); 

        phases.push({
          date: currentDate.toISOString().split('T')[0],
          phase: illuminatedFraction, // Store the raw illumination fraction
          phaseName,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return phases;
    } catch (error) {
      logger.error('MoonService: ошибка при получении фаз за период:', error);
      throw error;
    }
  }

  /**
   * Получает следующие значимые фазы луны
   * @param {number} count - Количество фаз для получения
   * @returns {Promise<Array>} Массив следующих значимых фаз
   */
  async getNextSignificantPhases(count = 4) {
    try {
      const phasesCache = moonRepository.getPhasesCache();
      
      if (phasesCache.upcoming && phasesCache.upcoming.length >= count) {
        return phasesCache.upcoming.slice(0, count);
      }
      
      return moonRepository.calculateUpcomingSignificantPhases(new Date(), count);
    } catch (error) {
      logger.error('MoonService: ошибка при получении следующих фаз:', error);
      throw error;
    }
  }

  /**
   * Получает предстоящие лунные события
   * @param {number} days - Количество дней вперед
   * @returns {Promise<Array>} Массив предстоящих лунных событий
   */
  async getUpcomingLunarEvents(days = 30) {
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + days);
      
      return this.getLunarEventsForPeriod(now, endDate); // Changed from moonRepository.getLunarEventsForPeriod
    } catch (error) {
      logger.error('MoonService: ошибка при получении предстоящих лунных событий:', error);
      throw error;
    }
  }

  /**
   * Получает исторические лунные события
   * @param {string} startDate - Начальная дата (ISO строка)
   * @param {string} endDate - Конечная дата (ISO строка)
   * @returns {Promise<Array>} Массив исторических лунных событий
   */
  async getHistoricalLunarEvents(startDate, endDate) {
    try {
      if (!startDate || !endDate) {
        throw new Error('Необходимо указать startDate и endDate');
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        throw new Error('startDate должна быть меньше endDate');
      }
      
      return this.getLunarEventsForPeriod(start, end); // Changed from moonRepository.getLunarEventsForPeriod
    } catch (error) {
      logger.error('MoonService: ошибка при получении исторических лунных событий:', error);
      throw error;
    }
  }

  /**
   * Получает лунные события для указанного периода
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Array} Список лунных событий
   */
  getLunarEventsForPeriod(startDate, endDate) {
    logger.debug(`MoonService: getLunarEventsForPeriod called with startDate: ${startDate}, endDate: ${endDate}`);
    const events = [];

    // Преобразуем даты в юлианские дни для библиотеки astronomia
    const startJD = this._dateToJulianDay(new Date(startDate));
    const endJD = this._dateToJulianDay(new Date(endDate));

    // Получаем все новолуния в диапазоне
    const newMoons = this._getNewMoons(startJD, endJD);

    // Получаем все полнолуния в диапазоне
    const fullMoons = this._getFullMoons(startJD, endJD);

    // Объединяем результаты и сортируем по дате
    const allPhases = [
      ...newMoons.map(date => ({
        date: date.toISOString(),
        type: 'new_moon',
        phase: 0,
        phaseName: 'Новолуние',
        title: 'Новолуние',
        icon: '🌑'
      })),
      ...fullMoons.map(date => ({
        date: date.toISOString(),
        type: 'full_moon',
        phase: 0.5,
        phaseName: 'Полнолуние',
        title: 'Полнолуние',
        icon: '🌕'
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Фильтруем события, чтобы они точно попадали в запрошенный диапазон дат
    // так как _getNewMoons и _getFullMoons могут вернуть ближайшие события вне диапазона
    return allPhases.filter(phase => {
      const phaseDate = new Date(phase.date);
      return phaseDate >= new Date(startDate) && phaseDate <= new Date(endDate);
    });
  }

  /**
   * Определяет имя фазы луны на основе освещенной доли и, возможно, направления изменения
   * @param {number} illuminatedFraction - Освещенная доля диска луны (0.0 до 1.0)
   * @param {Date} currentDate - Текущая дата (для определения растущей/убывающей фазы)
   * @param {number} currentJD - Текущий юлианский день
   * @returns {string} Название фазы луны
   * @private
   */
  _getPhaseNameFromIllumination(illuminatedFraction, currentDate, currentJD) {
    // Для точного определения растущей/убывающей фазы (серп, горбатая)
    // нужно знать не только процент освещенности, но и направление изменения.
    // Это можно сделать, сравнив освещенность с предыдущим или следующим днем,
    // или используя угол фазы, если astronomia его предоставляет.

    // Примерная логика определения фазы:
    // Для более точного определения растущей/убывающей фазы, особенно для серпа и горбатой луны,
    // нам нужно знать, увеличивается или уменьшается освещенность.
    // Мы можем сравнить освещенность текущего дня с освещенностью предыдущего дня.
    const yesterdayJD = currentJD - 1;
    const yesterdayIllumination = moonillum.fraction(yesterdayJD);
    const isWaxing = illuminatedFraction > yesterdayIllumination;

    if (illuminatedFraction < 0.03) return 'Новолуние'; // New Moon
    if (illuminatedFraction < 0.48 && isWaxing) return 'Растущий серп'; // Waxing Crescent
    if (illuminatedFraction >= 0.48 && illuminatedFraction < 0.52 && isWaxing) return 'Первая четверть'; // First Quarter
    if (illuminatedFraction >= 0.52 && illuminatedFraction < 0.97 && isWaxing) return 'Растущая луна'; // Waxing Gibbous
    if (illuminatedFraction >= 0.97) return 'Полнолуние'; // Full Moon
    if (illuminatedFraction >= 0.52 && illuminatedFraction < 0.97 && !isWaxing) return 'Убывающая луна'; // Waning Gibbous
    if (illuminatedFraction >= 0.48 && illuminatedFraction < 0.52 && !isWaxing) return 'Последняя четверть'; // Last Quarter
    if (illuminatedFraction < 0.48 && !isWaxing) return 'Убывающий серп'; // Waning Crescent
    
    return 'Неизвестная фаза'; // Default/fallback
  }

  // Helper methods (copied and adapted from client-side AstroService.js)
  /**
   * Преобразует дату в юлианский день для библиотеки astronomia
   * @param {Date} date - дата для преобразования
   * @returns {number} юлианский день
   * @private
   */
  _dateToJulianDay(date) {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();
    const second = d.getUTCSeconds();

    let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4);
    jd += Math.floor(275 * month / 9) + day + 1721013.5;
    jd += (hour + minute / 60 + second / 3600) / 24;
    return jd;
  }

  /**
   * Преобразует юлианский день в JavaScript Date
   * @param {number} jd - юлианский день
   * @returns {Date} дата
   * @private
   */
  _julianDayToDate(jd) {
    const z = Math.floor(jd + 0.5);
    const f = (jd + 0.5) - z;
    let a = z;
    if (z >= 2299161) {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);
    const dayOfMonth = b - d - Math.floor(30.6001 * e) + f;
    let month = e - 1;
    if (month > 12) month -= 12;
    let year = c - 4715;
    if (month > 2) year -= 1;
    const dayFraction = dayOfMonth - Math.floor(dayOfMonth);
    const hours = Math.floor(dayFraction * 24);
    const minutes = Math.floor((dayFraction * 24 - hours) * 60);
    const seconds = Math.floor(((dayFraction * 24 - hours) * 60 - minutes) * 60);
    return new Date(Date.UTC(year, month - 1, Math.floor(dayOfMonth), hours, minutes, seconds));
  }

  /**
   * Получает новолуния в заданном диапазоне юлианских дней
   * @param {number} startJD - начальный юлианский день
   * @param {number} endJD - конечный юлианский день
   * @returns {Array<Date>} массив дат новолуний
   * @private
   */
  _getNewMoons(startJD, endJD) {
    const results = [];
    let currentJD = moonphase.newMoon(startJD - 1); // Начинаем чуть раньше для захвата граничного случая
    if (currentJD < startJD) {
        currentJD = moonphase.newMoon(currentJD + 25); // Переходим к следующему, если первое до startJD
    }

    while (currentJD <= endJD) {
      results.push(this._julianDayToDate(currentJD));
      currentJD = moonphase.newMoon(currentJD + 25); // +25 для надежности поиска следующего
    }
    return results;
  }

  /**
   * Получает полнолуния в заданном диапазоне юлианских дней
   * @param {number} startJD - начальный юлианский день
   * @param {number} endJD - конечный юлианский день
   * @returns {Array<Date>} массив дат полнолуний
   * @private
   */
  _getFullMoons(startJD, endJD) {
    const results = [];
    let currentJD = moonphase.full(startJD - 1); // Начинаем чуть раньше
    if (currentJD < startJD) {
        currentJD = moonphase.full(currentJD + 25);
    }

    while (currentJD <= endJD) {
      results.push(this._julianDayToDate(currentJD));
      currentJD = moonphase.full(currentJD + 25);
    }
    return results;
  }
  /**
   * Анализирует влияние луны на данные Bitcoin (заглушка)
   * @param {Array} bitcoinData - Данные Bitcoin для анализа
   * @returns {Object} Результат анализа влияния луны
   */
  analyzeMoonInfluence(bitcoinData) {
    // Заглушка для анализа влияния луны на Bitcoin
    // В будущем здесь будет реальная логика анализа
    logger.debug('MoonService: анализ влияния луны на Bitcoin (заглушка)');
    
    return {
      correlation: 0.15,
      significance: 'low',
      newMoonImpact: {
        priceChange: '+2.3%',
        volatility: 'increased'
      },
      fullMoonImpact: {
        priceChange: '-1.8%',
        volatility: 'decreased'
      },
      recommendation: 'Влияние луны на Bitcoin минимально. Рекомендуется учитывать другие факторы.'
    };
  }
}

const moonService = new MoonService();
export default moonService;
