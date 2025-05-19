const logger = require('../utils/logger');
const BaseRepository = require('./BaseRepository');

/**
 * Репозиторий для работы с астрологическими данными
 * Отвечает за получение и кэширование астрологических данных
 */
class AstroRepository extends BaseRepository {
  constructor() {
    super('astro_data.json');
    
    // Инициализируем кэш
    this.astroCache = this.loadCache({
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
   * Получает актуальные астрологические данные
   * @returns {Promise<Object>} Астрологические данные
   */
  async fetchAstroData() {
    try {
      logger.debug('Обновление астрологических данных');
      
      const now = new Date();
      
      // Расчет ретроградных планет
      const retrograde = this.calculateRetrogradePlanets(now);
      
      // Расчет значимых аспектов между планетами
      const aspects = this.calculatePlanetaryAspects(now);
      
      // Обновляем кэш
      this.astroCache = {
        retrograde,
        aspects,
        last_updated: now.toISOString()
      };
      
      // Сохраняем обновленный кэш
      this.saveCache(this.astroCache);
      
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
   * Возвращает текущий кэш астрологических данных
   * @returns {Object} Кэш астрологических данных
   */
  getAstroCache() {
    return this.astroCache;
  }
}

module.exports = new AstroRepository(); 