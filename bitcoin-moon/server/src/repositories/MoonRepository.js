import { moonphase } from 'astronomia';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import BaseRepository from './BaseRepository.js';

/**
 * Репозиторий для работы с данными о фазах луны
 * Использует библиотеку astronomia для точных астрономических вычислений
 */
class MoonRepository extends BaseRepository {
  constructor() {
    super('moon_phases.json');
    
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
   * Преобразует дату в юлианский день для библиотеки astronomia
   * @param {Date} date - Дата для преобразования
   * @returns {number} Юлианский день
   */
  _dateToJulianDay(date) {
    // Приводим к UTC, т.к. astronomia работает с UTC
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    
    const year = utcDate.getFullYear();
    const month = utcDate.getMonth() + 1; // JavaScript месяцы 0-11, astronomia 1-12
    const day = utcDate.getDate();
    const hour = utcDate.getHours();
    const minute = utcDate.getMinutes();
    const second = utcDate.getSeconds();
    
    // По формуле из astronomia
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    
    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const jd = jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;
    
    return jd;
  }

  /**
   * Преобразует юлианский день в дату
   * @param {number} jd - Юлианский день
   * @returns {Date} Дата
   */
  _julianDayToDate(jd) {
    // По формуле из astronomia
    const jdn = Math.floor(jd + 0.5);
    const f = jd + 0.5 - jdn;
    
    const a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor((146097 * b) / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor((1461 * d) / 4);
    const m = Math.floor((5 * e + 2) / 153);
    
    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = 100 * b + d - 4800 + Math.floor(m / 10);
    
    const hours = f * 24;
    const minutes = (hours - Math.floor(hours)) * 60;
    const seconds = (minutes - Math.floor(minutes)) * 60;
    
    return new Date(year, month - 1, day, Math.floor(hours), Math.floor(minutes), Math.floor(seconds));
  }

  /**
   * Вычисляет фазу луны для заданного времени используя astronomia
   * @param {Date} date - Дата для вычисления фазы
   * @returns {number} Фаза луны (от 0 до 1)
   */
  calculatePhase(date) {
    date = date || new Date();
    
    try {
      const jd = this._dateToJulianDay(date);
      
      // Находим ближайшее новолуние до указанной даты
      const newMoonJD = moonphase.newMoon(jd);
      
      // Вычисляем фазу как долю от синодического месяца
      const daysSinceNewMoon = jd - newMoonJD;
      const synodicMonth = 29.53058867; // средняя длина синодического месяца
      
      let phase = daysSinceNewMoon / synodicMonth;
      
      // Нормализуем к диапазону 0-1
      if (phase < 0) phase += 1;
      if (phase >= 1) phase -= 1;
      
      return phase;
    } catch (error) {
      logger.error('Ошибка при вычислении фазы луны:', error);
      // Fallback к простому алгоритму
      return this._calculatePhaseSimple(date);
    }
  }

  /**
   * Простой алгоритм вычисления фазы луны (fallback)
   * @param {Date} date - Дата для вычисления фазы
   * @returns {number} Фаза луны (от 0 до 1)
   */
  _calculatePhaseSimple(date) {
    const synodicMonth = 29.53058867;
    const knownNewMoon = new Date('2000-01-06T00:00:00Z');
    const diffMs = date.getTime() - knownNewMoon.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const phase = (diffDays % synodicMonth) / synodicMonth;
    return phase >= 0 ? phase : phase + 1;
  }

  /**
   * Определяет название фазы луны
   * @param {number} phase - Фаза луны (от 0 до 1)
   * @returns {string} Название фазы луны
   */
  getPhaseName(phase) {
    const phaseIndex = Math.round(phase * 8) % 8;
    return this.phaseNames[phaseIndex];
  }

  /**
   * Получает новолуния в заданном диапазоне
   * @param {number} startJD - Начальный юлианский день
   * @param {number} endJD - Конечный юлианский день
   * @returns {Array<Date>} Массив дат новолуний
   */
  _getNewMoons(startJD, endJD) {
    const newMoons = [];
    
    try {
      let currentJD = moonphase.newMoon(startJD);
      
      while (currentJD <= endJD) {
        if (currentJD >= startJD) {
          newMoons.push(this._julianDayToDate(currentJD));
        }
        currentJD = moonphase.newMoon(currentJD + 25); // +25 для надежности
      }
    } catch (error) {
      logger.error('Ошибка при получении новолуний:', error);
    }
    
    return newMoons;
  }

  /**
   * Получает полнолуния в заданном диапазоне
   * @param {number} startJD - Начальный юлианский день
   * @param {number} endJD - Конечный юлианский день
   * @returns {Array<Date>} Массив дат полнолуний
   */
  _getFullMoons(startJD, endJD) {
    const fullMoons = [];
    
    try {
      let currentJD = moonphase.full(startJD);
      
      while (currentJD <= endJD) {
        if (currentJD >= startJD) {
          fullMoons.push(this._julianDayToDate(currentJD));
        }
        currentJD = moonphase.full(currentJD + 25); // +25 для надежности
      }
    } catch (error) {
      logger.error('Ошибка при получении полнолуний:', error);
    }
    
    return fullMoons;
  }

  /**
   * Получает лунные события для заданного периода
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Array} Массив лунных событий
   */
  getLunarEvents(startDate, endDate) {
    try {
      const startJD = this._dateToJulianDay(startDate);
      const endJD = this._dateToJulianDay(endDate);
      
      const newMoons = this._getNewMoons(startJD, endJD);
      const fullMoons = this._getFullMoons(startJD, endJD);
      
      const events = [
        ...newMoons.map(date => ({ type: 'new_moon', date: date.toISOString() })),
        ...fullMoons.map(date => ({ type: 'full_moon', date: date.toISOString() }))
      ];
      
      // Сортируем по дате
      events.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return events;
    } catch (error) {
      logger.error('Ошибка при получении лунных событий:', error);
      return [];
    }
  }

  /**
   * Вычисляет предстоящие значимые фазы луны
   * @param {Date} startDate - Начальная дата
   * @param {number} count - Количество фаз
   * @returns {Array} Массив предстоящих значимых фаз
   */
  calculateUpcomingSignificantPhases(startDate, count = 4) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + count * 15); // примерно 15 дней между значимыми фазами
    
    const events = this.getLunarEvents(startDate, endDate);
    return events.slice(0, count).map(event => ({
      date: event.date,
      phase: event.type === 'new_moon' ? 0 : 0.5,
      phaseName: event.type === 'new_moon' ? 'Новолуние' : 'Полнолуние'
    }));
  }

  /**
   * Получает данные о фазах луны (обновленный метод)
   * @returns {Object} Данные о фазах луны
   */
  async fetchMoonPhases() {
    try {
      const now = new Date();
      const currentPhase = this.calculatePhase(now);
      const currentPhaseName = this.getPhaseName(currentPhase);
      
      // Получаем предстоящие значимые фазы
      const upcomingPhases = this.calculateUpcomingSignificantPhases(now, 4);
      
      const data = {
        current: {
          phase: currentPhase,
          phaseName: currentPhaseName,
          date: now.toISOString()
        },
        upcoming: upcomingPhases,
        last_updated: now.toISOString()
      };
      
      // Сохраняем в кэш
      this.phasesCache = data;
      this.saveCache(data);
      
      logger.info('Данные о фазах луны успешно обновлены с использованием astronomia');
      return data;
    } catch (error) {
      logger.error('Ошибка при получении данных о фазах луны:', error);
      throw error;
    }
  }

  /**
   * Получает кэш фаз луны
   * @returns {Object} Кэшированные данные
   */
  getPhasesCache() {
    return this.phasesCache;
  }

  /**
   * Генерирует мок-данные фаз луны (для тестирования)
   * @param {number} days - Количество дней
   * @returns {Array} Мок-данные фаз луны
   */
  getMockMoonPhases(days = 30) {
    const now = new Date();
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const phase = this.calculatePhase(date);
      data.push({ 
        date: date.toISOString().split('T')[0], 
        phase, 
        phaseName: this.getPhaseName(phase)
      });
    }
    return data;
  }
}

const moonRepository = new MoonRepository();
export default moonRepository;
