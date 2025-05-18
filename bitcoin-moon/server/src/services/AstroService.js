const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Сервис для работы с астрологическими данными
 * Предоставляет информацию о планетарных аспектах и ретроградных планетах
 */
class AstroService {
  constructor() {
    this.cacheDir = path.join(__dirname, '../data/cache');
    this.astroCacheFile = path.join(this.cacheDir, 'astro_data.json');
    
    // Проверяем/создаем директорию для кэша
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    
    // Инициализируем кэш
    this.astroCache = this.loadCache(this.astroCacheFile, {
      retrograde: [],
      aspects: [],
      last_updated: null
    });
    
    // Планеты и их характеристики
    this.planets = [
      { name: 'Меркурий', retroPeriod: [80, 120], influence: 'коммуникация, технологии' },
      { name: 'Венера', retroPeriod: [40, 43], influence: 'финансы, отношения' },
      { name: 'Марс', retroPeriod: [58, 80], influence: 'энергия, активность' },
      { name: 'Юпитер', retroPeriod: [120, 121], influence: 'рост, экспансия' },
      { name: 'Сатурн', retroPeriod: [140, 141], influence: 'ограничения, структура' },
      { name: 'Уран', retroPeriod: [148, 152], influence: 'инновации, неожиданности' },
      { name: 'Нептун', retroPeriod: [158, 165], influence: 'иллюзии, неопределенность' },
      { name: 'Плутон', retroPeriod: [180, 187], influence: 'трансформация, власть' }
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
   * Обновляет астрологические данные
   * @returns {Promise<Object>} Обновленные астрологические данные
   */
  async updateAstroData() {
    try {
      logger.debug('Обновление астрологических данных');
      
      const now = new Date();
      
      // Симуляция расчета ретроградных планет
      const retrograde = this.calculateRetrogradePlanets(now);
      
      // Симуляция расчета значимых аспектов между планетами
      const aspects = this.calculatePlanetaryAspects(now);
      
      // Обновляем кэш
      this.astroCache = {
        retrograde,
        aspects,
        last_updated: now.toISOString()
      };
      
      // Сохраняем обновленный кэш
      this.saveCache(this.astroCacheFile, this.astroCache);
      
      logger.info('Астрологические данные успешно обновлены');
      return this.astroCache;
    } catch (error) {
      logger.error('Ошибка при обновлении астрологических данных', { error });
      
      // Если произошла ошибка, возвращаем кэшированные данные
      return this.astroCache;
    }
  }
  
  /**
   * Рассчитывает ретроградные планеты на заданную дату
   * @param {Date} date - Дата для расчета
   * @returns {Array} Список ретроградных планет
   */
  calculateRetrogradePlanets(date) {
    // Примечание: это упрощенная симуляция
    // В реальном приложении использовались бы астрономические алгоритмы
    const result = [];
    
    // Используем день года как основу для расчета
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const diff = date - startOfYear;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Для каждой планеты проверяем, ретроградна ли она
    this.planets.forEach(planet => {
      // Планета ретроградна, если день года попадает в один из периодов ретроградности
      // Упрощенная модель - используем остаток от деления на 365
      const normalizedDay = dayOfYear % 365;
      const isRetrograde = 
        (normalizedDay > planet.retroPeriod[0] && normalizedDay < planet.retroPeriod[1]);
      
      if (isRetrograde) {
        result.push({
          planet: planet.name,
          isRetrograde: true,
          influence: planet.influence,
          startDate: new Date(date.getFullYear(), 0, planet.retroPeriod[0]).toISOString(),
          endDate: new Date(date.getFullYear(), 0, planet.retroPeriod[1]).toISOString()
        });
      }
    });
    
    return result;
  }
  
  /**
   * Рассчитывает значимые аспекты между планетами на заданную дату
   * @param {Date} date - Дата для расчета
   * @returns {Array} Список значимых аспектов
   */
  calculatePlanetaryAspects(date) {
    // Примечание: это упрощенная симуляция
    // В реальном приложении использовались бы астрономические алгоритмы
    const result = [];
    const aspectTypes = ['соединение', 'оппозиция', 'квадрат', 'трин', 'секстиль'];
    const influences = [
      'повышенная волатильность',
      'резкие изменения тренда',
      'стабильный рост',
      'неожиданные новости',
      'консолидация'
    ];
    
    // Используем день года для симуляции
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const diff = date - startOfYear;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Генерируем 1-3 "значимых" аспекта на каждый день
    const numAspects = 1 + (dayOfYear % 3);
    
    for (let i = 0; i < numAspects; i++) {
      // Выбираем случайные планеты для аспекта
      const planet1Index = (dayOfYear + i * 3) % this.planets.length;
      const planet2Index = (dayOfYear + i * 5) % this.planets.length;
      
      // Убедимся, что планеты разные
      if (planet1Index !== planet2Index) {
        const planet1 = this.planets[planet1Index];
        const planet2 = this.planets[planet2Index];
        
        // Выбираем тип аспекта и влияние
        const aspectType = aspectTypes[(dayOfYear + i * 7) % aspectTypes.length];
        const influence = influences[(dayOfYear + i * 11) % influences.length];
        
        // Рассчитываем "градус" аспекта
        const degree = ((dayOfYear + i * 13) % 180).toFixed(1);
        
        result.push({
          planet1: planet1.name,
          planet2: planet2.name,
          aspect: aspectType,
          degree,
          influence,
          date: date.toISOString()
        });
      }
    }
    
    return result;
  }
  
  /**
   * Получает текущие астрологические данные
   * @returns {Object} Информация о ретроградных планетах и аспектах
   */
  getCurrentAstroData() {
    // Если кэш устарел (более 6 часов), запускаем обновление
    const cacheAge = this.astroCache.last_updated
      ? (new Date() - new Date(this.astroCache.last_updated)) / 1000 / 60 / 60
      : 9999;
      
    if (cacheAge > 6) {
      logger.debug(`Кэш астрологических данных устарел (${Math.round(cacheAge)} ч), запуск обновления`);
      this.updateAstroData().catch(error => {
        logger.error('Ошибка при фоновом обновлении астрологических данных', { error });
      });
    }
    
    return {
      retrograde: this.astroCache.retrograde,
      aspects: this.astroCache.aspects,
      last_updated: this.astroCache.last_updated
    };
  }
  
  /**
   * Получает ретроградные планеты на указанную дату
   * @param {string} date - Дата в формате YYYY-MM-DD
   * @returns {Array} Список ретроградных планет
   */
  getRetrogradePlanets(date) {
    // Если дата не предоставлена, используем текущую
    const targetDate = date ? new Date(date) : new Date();
    
    // Проверяем валидность даты
    if (isNaN(targetDate.getTime())) {
      throw new Error('Неверный формат даты');
    }
    
    // Используем кэш для текущей даты или вычисляем заново
    const today = new Date();
    if (!date || (
        targetDate.getDate() === today.getDate() && 
        targetDate.getMonth() === today.getMonth() && 
        targetDate.getFullYear() === today.getFullYear()
      )) {
      return this.getCurrentAstroData().retrograde;
    }
    
    // Для других дат вычисляем ретроградные планеты
    return this.calculateRetrogradePlanets(targetDate);
  }
  
  /**
   * Получает планетарные аспекты на указанную дату
   * @param {string} date - Дата в формате YYYY-MM-DD
   * @returns {Array} Список планетарных аспектов
   */
  getPlanetaryAspects(date) {
    // Если дата не предоставлена, используем текущую
    const targetDate = date ? new Date(date) : new Date();
    
    // Проверяем валидность даты
    if (isNaN(targetDate.getTime())) {
      throw new Error('Неверный формат даты');
    }
    
    // Используем кэш для текущей даты или вычисляем заново
    const today = new Date();
    if (!date || (
        targetDate.getDate() === today.getDate() && 
        targetDate.getMonth() === today.getMonth() && 
        targetDate.getFullYear() === today.getFullYear()
      )) {
      return this.getCurrentAstroData().aspects;
    }
    
    // Для других дат вычисляем аспекты
    return this.calculatePlanetaryAspects(targetDate);
  }
}

// Синглтон экземпляр сервиса
module.exports = new AstroService(); 