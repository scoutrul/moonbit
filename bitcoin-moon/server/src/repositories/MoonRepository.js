const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../utils/config');
const BaseRepository = require('./BaseRepository');
const {
  calculateMoonPhase,
  getMoonPhaseName,
  getMoonPhasesForPeriod,
  findNextSignificantPhases,
} = require('../utils/moonCalculations');

const USE_MOCK = process.env.USE_MOCK_DATA === 'true' || !config.api.farmsense;

/**
 * Репозиторий для работы с данными о фазах луны
 * Отвечает за получение и кэширование данных о фазах луны
 */
class MoonRepository extends BaseRepository {
  constructor() {
    super('moon_phases.json');
    this.apiUrl = 'https://api.farmsense.net/v1/moonphases';

    // Инициализируем кэш
    this.phasesCache = this.loadCache({
      current: null,
      phases: [],
      last_updated: null,
    });

    // Именование фаз луны
    this.phaseNames = [
      'Новолуние',
      'Молодая луна (серп)',
      'Первая четверть',
      'Растущая луна (горб)',
      'Полнолуние',
      'Убывающая луна (горб)',
      'Последняя четверть',
      'Старая луна (серп)',
    ];
  }

  /**
   * Генерирует мок-данные фаз луны
   * @param {number} days - Количество дней
   * @returns {Array} Мок-данные фаз луны
   */
  getMockMoonPhases(days = 30) {
    const now = new Date();
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const phase = Math.abs(Math.sin((i / days) * Math.PI));
      data.push({ date: date.toISOString().split('T')[0], phase, phaseName: `Фаза ${i}` });
    }
    return data;
  }

  /**
   * Вычисляет фазу луны для заданного времени
   * @param {Date} date - Дата для вычисления фазы
   * @returns {number} Фаза луны (от 0 до 1)
   */
  calculatePhase(date) {
    date = date || new Date();

    // Алгоритм вычисления фазы луны
    // Синодический месяц (период между двумя одинаковыми фазами луны) в днях
    const synodicMonth = 29.53058867;

    // Исходная точка - известное новолуние
    const knownNewMoon = new Date('2000-01-06T00:00:00Z');
    const knownNewMoonTimestamp = knownNewMoon.getTime();

    // Разница в миллисекундах
    const diffMs = date.getTime() - knownNewMoonTimestamp;

    // Разница в днях
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Нормализуем к синодическому месяцу
    const phase = (diffDays % synodicMonth) / synodicMonth;

    // Возвращаем значение от 0 до 1
    return phase >= 0 ? phase : phase + 1;
  }

  /**
   * Определяет название фазы луны
   * @param {number} phase - Фаза луны (от 0 до 1)
   * @returns {string} Название фазы луны
   */
  getPhaseName(phase) {
    // 8 основных фаз луны
    const phaseIndex = Math.round(phase * 8) % 8;
    return this.phaseNames[phaseIndex];
  }

  /**
   * Получает данные о фазах луны из API или вычисляет их
   * @returns {Promise<Object>} Данные о фазах луны
   */
  async fetchMoonPhases() {
    if (USE_MOCK) {
      logger.info('Возвращаю мок-данные для фаз луны');
      const now = new Date();
      this.phasesCache = {
        current: {
          date: now.toISOString(),
          phase: 0.5,
          phaseName: 'Полнолуние',
        },
        phases: this.getMockMoonPhases(10),
        last_updated: now.toISOString(),
      };
      this.saveCache(this.phasesCache);
      return this.phasesCache;
    }

    try {
      logger.debug('Обновление данных о фазах луны');

      // Текущая дата и время
      const now = new Date();

      // Вычисляем текущую фазу луны
      const currentPhase = this.calculatePhase(now);

      // Рассчитываем следующие значимые фазы (новолуние и полнолуние)
      const upcoming = this.calculateUpcomingSignificantPhases(now, 10);

      // Обновляем кэш
      this.phasesCache = {
        current: {
          date: now.toISOString(),
          phase: currentPhase,
          phaseName: this.getPhaseName(currentPhase),
        },
        phases: upcoming,
        last_updated: now.toISOString(),
      };

      // Сохраняем обновленный кэш
      this.saveCache(this.phasesCache);

      logger.info('Данные о фазах луны успешно обновлены');
      return this.phasesCache;
    } catch (error) {
      logger.error('Ошибка при обновлении данных о фазах луны', { error });

      // Если произошла ошибка, возвращаем кэшированные данные
      return this.phasesCache;
    }
  }

  /**
   * Вычисляет ближайшие значимые фазы луны (новолуние и полнолуние)
   * @param {Date} startDate - Начальная дата
   * @param {number} count - Количество фаз для расчета
   * @returns {Array} Список значимых фаз
   */
  calculateUpcomingSignificantPhases(startDate, count = 4) {
    startDate = startDate || new Date();
    const result = [];

    // Длительность синодического месяца в миллисекундах
    const synodicMonthMs = 29.53058867 * 24 * 60 * 60 * 1000;

    // Текущая фаза
    const currentPhase = this.calculatePhase(startDate);

    // Расстояние до ближайшего новолуния (фаза 0)
    const toNewMoon = 1 - currentPhase;

    // Расстояние до ближайшего полнолуния (фаза 0.5)
    const toFullMoon = currentPhase < 0.5 ? 0.5 - currentPhase : 1.5 - currentPhase;

    // Добавляем ближайшие фазы
    const phases = [];

    if (toNewMoon < toFullMoon) {
      // Ближайшее новолуние, затем полнолуние
      phases.push({
        phase: 0,
        type: 'Новолуние',
        offset: toNewMoon,
      });
      phases.push({
        phase: 0.5,
        type: 'Полнолуние',
        offset: toFullMoon,
      });
    } else {
      // Ближайшее полнолуние, затем новолуние
      phases.push({
        phase: 0.5,
        type: 'Полнолуние',
        offset: toFullMoon,
      });
      phases.push({
        phase: 0,
        type: 'Новолуние',
        offset: toNewMoon,
      });
    }

    // Добавляем остальные фазы чередуя новолуние и полнолуние
    for (let i = 2; i < count; i++) {
      const prevPhase = phases[i - 1].phase;
      const nextPhase = prevPhase === 0 ? 0.5 : 0;
      const offset = phases[i - 1].offset + 0.5;

      phases.push({
        phase: nextPhase,
        type: nextPhase === 0 ? 'Новолуние' : 'Полнолуние',
        offset,
      });
    }

    // Преобразуем смещения в даты
    return phases.map((item) => {
      const date = new Date(startDate.getTime() + item.offset * synodicMonthMs);
      return {
        date: date.toISOString(),
        phase: item.phase,
        phaseName: item.type,
      };
    });
  }

  /**
   * Возвращает текущий кэш фаз луны
   * @returns {Object} Кэш фаз луны
   */
  getPhasesCache() {
    return this.phasesCache;
  }
}

module.exports = new MoonRepository();
