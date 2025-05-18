const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { 
  calculateMoonPhase, 
  getMoonPhaseName, 
  getMoonPhasesForPeriod, 
  findNextSignificantPhases 
} = require('../utils/moonCalculations');

const config = require('../utils/config');
const USE_MOCK = process.env.USE_MOCK_DATA === 'true' || !config.api.farmsense;

function getMockMoonPhases(days = 30) {
  const now = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const phase = Math.abs(Math.sin(i / days * Math.PI));
    data.push({ date: date.toISOString().split('T')[0], phase, phaseName: `Фаза ${i}` });
  }
  return data;
}

/**
 * Сервис для работы с данными о фазах луны
 * Получает данные из FarmSense API и кэширует их
 */
class MoonService {
  constructor() {
    this.cacheDir = path.join(__dirname, '../data/cache');
    this.moonPhasesCacheFile = path.join(this.cacheDir, 'moon_phases.json');
    this.apiUrl = 'https://api.farmsense.net/v1/moonphases';
    
    // Проверяем/создаем директорию для кэша
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    
    // Инициализируем кэш
    this.phasesCache = this.loadCache(this.moonPhasesCacheFile, {
      current: null,
      phases: [],
      last_updated: null
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
      'Старая луна (серп)'
    ];
  }
  
  /**
   * Загружает кэш из файла или возвращает значение по умолчанию
   * @param {string} filePath - Путь к файлу с кэшем
   * @param {Object} defaultValue - Значение по умолчанию
   * @returns {Object} Загруженные данные или значение по умолчанию
   */
  loadCache(filePath, defaultValue) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error(`Ошибка при загрузке кэша из ${filePath}`, { error });
    }
    
    return defaultValue;
  }
  
  /**
   * Сохраняет данные в кэш
   * @param {string} filePath - Путь к файлу кэша
   * @param {Object} data - Данные для сохранения
   */
  saveCache(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      logger.error(`Ошибка при сохранении кэша в ${filePath}`, { error });
    }
  }
  
  /**
   * Вычисляет фазу луны для заданного времени
   * @param {Date} date - Дата для вычисления фазы
   * @returns {number} Фаза луны (от 0 до 1)
   */
  calculateMoonPhase(date) {
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
   * Обновляет данные о фазах луны
   * @returns {Promise<Object>} Обновленные данные о фазах
   */
  async updateMoonPhases() {
    if (USE_MOCK) {
      logger.info('Возвращаю мок-данные для фаз луны');
      const now = new Date();
      this.phasesCache = {
        current: {
          date: now.toISOString(),
          phase: 0.5,
          phaseName: 'Полнолуние'
        },
        phases: getMockMoonPhases(10),
        last_updated: now.toISOString()
      };
      return this.phasesCache;
    }
    try {
      logger.debug('Обновление данных о фазах луны');
      
      // Текущая дата и время
      const now = new Date();
      
      // Вычисляем текущую фазу луны
      const currentPhase = this.calculateMoonPhase(now);
      
      // Рассчитываем следующие значимые фазы (новолуние и полнолуние)
      const upcoming = this.calculateUpcomingSignificantPhases(now, 10);
      
      // Обновляем кэш
      this.phasesCache = {
        current: {
          date: now.toISOString(),
          phase: currentPhase,
          phaseName: this.getPhaseName(currentPhase)
        },
        phases: upcoming,
        last_updated: now.toISOString()
      };
      
      // Сохраняем обновленный кэш
      this.saveCache(this.moonPhasesCacheFile, this.phasesCache);
      
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
    const currentPhase = this.calculateMoonPhase(startDate);
    
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
        offset: toNewMoon
      });
      phases.push({
        phase: 0.5,
        type: 'Полнолуние',
        offset: toFullMoon
      });
    } else {
      // Ближайшее полнолуние, затем новолуние
      phases.push({
        phase: 0.5,
        type: 'Полнолуние',
        offset: toFullMoon
      });
      phases.push({
        phase: 0,
        type: 'Новолуние',
        offset: toNewMoon
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
        offset
      });
    }
    
    // Преобразуем смещения в даты
    for (const phase of phases) {
      const offsetMs = phase.offset * synodicMonthMs;
      const date = new Date(startDate.getTime() + offsetMs);
      
      result.push({
        date: date.toISOString(),
        type: phase.type,
        phase: phase.phase
      });
    }
    
    return result;
  }
  
  /**
   * Получает текущую фазу луны
   * @returns {Object} Информация о текущей фазе луны
   */
  getCurrentPhase() {
    // Если кэш устарел (более 1 часа), запускаем обновление
    const cacheAge = this.phasesCache.last_updated
      ? (new Date() - new Date(this.phasesCache.last_updated)) / 1000 / 60
      : 9999;
      
    if (!this.phasesCache.current || cacheAge > 60) {
      logger.debug(`Кэш фаз луны устарел (${Math.round(cacheAge)} мин), запуск обновления`);
      this.updateMoonPhases().catch(error => {
        logger.error('Ошибка при фоновом обновлении фаз луны', { error });
      });
    }
    
    // Если в кэше нет данных, вычисляем текущую фазу
    if (!this.phasesCache.current) {
      const now = new Date();
      const phase = this.calculateMoonPhase(now);
      
      return {
        date: now.toISOString(),
        phase,
        phaseName: this.getPhaseName(phase)
      };
    }
    
    return this.phasesCache.current;
  }
  
  /**
   * Получает фазы луны за указанный период
   * @param {string} startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Array} Фазы луны за период
   */
  getPhasesForPeriod(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Неверный формат даты');
    }
    
    const result = [];
    const currentDate = new Date(start);
    
    // Получаем фазу для каждого дня в периоде
    while (currentDate <= end) {
      const phase = this.calculateMoonPhase(currentDate);
      
      result.push({
        date: currentDate.toISOString().split('T')[0],
        phase,
        phaseName: this.getPhaseName(phase)
      });
      
      // Увеличиваем на 1 день
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  }
  
  /**
   * Получает следующие значимые фазы луны (новолуние и полнолуние)
   * @param {number} count - Количество фаз для получения
   * @returns {Array} Список следующих значимых фаз
   */
  getNextSignificantPhases(count = 4) {
    // Если кэш устарел (более 1 часа), запускаем обновление
    const cacheAge = this.phasesCache.last_updated
      ? (new Date() - new Date(this.phasesCache.last_updated)) / 1000 / 60
      : 9999;
      
    if (!this.phasesCache.phases.length || cacheAge > 60) {
      logger.debug(`Кэш фаз луны устарел (${Math.round(cacheAge)} мин), запуск обновления`);
      this.updateMoonPhases().catch(error => {
        logger.error('Ошибка при фоновом обновлении фаз луны', { error });
      });
    }
    
    // Если в кэше нет данных или недостаточно, вычисляем фазы
    if (!this.phasesCache.phases.length || this.phasesCache.phases.length < count) {
      return this.calculateUpcomingSignificantPhases(new Date(), count);
    }
    
    // Возвращаем запрошенное количество фаз из кэша
    return this.phasesCache.phases.slice(0, count);
  }
}

// Синглтон экземпляр сервиса
module.exports = new MoonService(); 