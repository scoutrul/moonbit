const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Сервис для работы с событиями, связанными с биткоином
 * Получает и агрегирует данные о событиях из разных источников
 */
class EventsService {
  constructor() {
    this.cacheDir = path.join(__dirname, '../data/cache');
    this.eventsCacheFile = path.join(this.cacheDir, 'events_data.json');
    
    // Проверяем/создаем директорию для кэша
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    
    // Инициализируем кэш
    this.eventsCache = this.loadCache(this.eventsCacheFile, {
      events: [],
      last_updated: null
    });
    
    // API источников новостей и событий
    this.sources = [
      { name: 'CoinMarketCal', url: 'https://api.coinmarketcal.com' },
      { name: 'CryptoCompare', url: 'https://min-api.cryptocompare.com' }
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
   * Обновляет данные о событиях
   * @returns {Promise<Object>} Обновленные данные о событиях
   */
  async updateEvents() {
    try {
      logger.debug('Обновление данных о событиях');
      
      // В реальном приложении здесь были бы запросы к API для получения событий
      // Для примера используем моковые данные
      const now = new Date();
      const events = this.generateMockEvents(now, 30);
      
      // Обновляем кэш
      this.eventsCache = {
        events,
        last_updated: now.toISOString()
      };
      
      // Сохраняем обновленный кэш
      this.saveCache(this.eventsCacheFile, this.eventsCache);
      
      logger.info('Данные о событиях успешно обновлены');
      return this.eventsCache;
    } catch (error) {
      logger.error('Ошибка при обновлении данных о событиях', { error });
      
      // Если произошла ошибка, возвращаем кэшированные данные
      return this.eventsCache;
    }
  }
  
  /**
   * Генерирует моковые события для тестирования
   * @param {Date} startDate - Начальная дата
   * @param {number} days - Количество дней для генерации
   * @returns {Array} Список событий
   */
  generateMockEvents(startDate, days) {
    const events = [];
    const eventTypes = ['Обновление', 'Хардфорк', 'Конференция', 'Релиз', 'Интеграция', 'Листинг'];
    const cryptoAssets = ['Bitcoin', 'Ethereum', 'Lightning Network', 'Taproot', 'Glassnode'];
    const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Bitstamp', 'FTX'];
    
    // Генерируем события на каждый день
    for (let i = 0; i < days; i++) {
      // Случайное количество событий на день (0-3)
      const eventsPerDay = Math.floor(Math.random() * 4);
      
      if (eventsPerDay > 0) {
        const eventDate = new Date(startDate);
        eventDate.setDate(startDate.getDate() + i);
        
        for (let j = 0; j < eventsPerDay; j++) {
          const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          const asset = cryptoAssets[Math.floor(Math.random() * cryptoAssets.length)];
          const exchange = exchanges[Math.floor(Math.random() * exchanges.length)];
          
          const title = `${eventType} ${asset}`;
          const description = this.generateEventDescription(eventType, asset, exchange);
          
          events.push({
            id: `event-${i}-${j}`,
            title,
            description,
            date: eventDate.toISOString(),
            source: this.sources[Math.floor(Math.random() * this.sources.length)].name,
            url: `https://example.com/event/${i}/${j}`,
            importance: Math.floor(Math.random() * 3) + 1 // 1-3, где 3 - самое важное
          });
        }
      }
    }
    
    // Сортируем события по дате
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  
  /**
   * Генерирует описание события в зависимости от типа
   * @param {string} type - Тип события
   * @param {string} asset - Актив
   * @param {string} exchange - Биржа
   * @returns {string} Описание события
   */
  generateEventDescription(type, asset, exchange) {
    switch (type) {
      case 'Обновление':
        return `Запланировано обновление протокола ${asset}, которое улучшит масштабируемость и безопасность.`;
      case 'Хардфорк':
        return `Предстоящий хардфорк ${asset} внесет изменения в алгоритм консенсуса.`;
      case 'Конференция':
        return `Конференция разработчиков ${asset} пройдет онлайн, будут обсуждаться новые функции.`;
      case 'Релиз':
        return `Новый релиз ${asset} включает интеграцию с ${exchange} и улучшения в пользовательском интерфейсе.`;
      case 'Интеграция':
        return `${asset} объявил о стратегическом партнерстве с ${exchange} для улучшения ликвидности.`;
      case 'Листинг':
        return `${asset} будет добавлен в листинг на бирже ${exchange}, что может повысить волатильность.`;
      default:
        return `Событие, связанное с ${asset}.`;
    }
  }
  
  /**
   * Получает последние события
   * @param {number} limit - Количество событий для получения
   * @returns {Array} Список последних событий
   */
  getRecentEvents(limit = 5) {
    // Если кэш устарел (более 1 часа), запускаем обновление
    const cacheAge = this.eventsCache.last_updated
      ? (new Date() - new Date(this.eventsCache.last_updated)) / 1000 / 60
      : 9999;
      
    if (cacheAge > 60) {
      logger.debug(`Кэш событий устарел (${Math.round(cacheAge)} мин), запуск обновления`);
      this.updateEvents().catch(error => {
        logger.error('Ошибка при фоновом обновлении событий', { error });
      });
    }
    
    // Возвращаем последние события
    const sortedEvents = [...this.eventsCache.events].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    return sortedEvents.slice(0, limit);
  }
  
  /**
   * Получает события за указанный период
   * @param {string} startDate - Начальная дата в формате YYYY-MM-DD
   * @param {string} endDate - Конечная дата в формате YYYY-MM-DD
   * @returns {Array} Список событий за период
   */
  getEventsByPeriod(startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start);
    end.setDate(end.getDate() + 30); // По умолчанию +30 дней
    
    // Проверяем валидность дат
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Неверный формат даты');
    }
    
    // Фильтруем события по дате
    return this.eventsCache.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= start && eventDate <= end;
    });
  }
  
  /**
   * Получает события по важности
   * @param {number} importance - Уровень важности (1-3)
   * @param {number} limit - Количество событий
   * @returns {Array} Список событий
   */
  getEventsByImportance(importance, limit = 10) {
    if (importance < 1 || importance > 3) {
      throw new Error('Уровень важности должен быть от 1 до 3');
    }
    
    // Фильтруем по важности и возвращаем указанное количество
    return this.eventsCache.events
      .filter(event => event.importance === importance)
      .slice(0, limit);
  }
}

// Синглтон экземпляр сервиса
module.exports = new EventsService(); 