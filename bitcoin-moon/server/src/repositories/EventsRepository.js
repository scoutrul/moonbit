import axios from 'axios';
import logger from '../utils/logger.js';
import BaseRepository from './BaseRepository.js';

/**
 * Репозиторий для работы с данными о событиях
 * Отвечает за получение и кэширование данных о событиях
 */
class EventsRepository extends BaseRepository {
  constructor() {
    super('events_data.json');

    // Инициализируем кэш
    this.eventsCache = this.loadCache({
      events: [],
      last_updated: null,
    });

    // API источников новостей и событий
    this.sources = [
      { name: 'CoinMarketCal', url: 'https://api.coinmarketcal.com' },
      { name: 'CryptoCompare', url: 'https://min-api.cryptocompare.com' },
    ];
  }

  /**
   * Получает данные о событиях из внешних источников
   * @returns {Promise<Object>} Данные о событиях
   */
  async fetchEvents() {
    try {
      logger.debug('Обновление данных о событиях');

      // В реальном приложении здесь были бы запросы к API для получения событий
      // Для примера используем моковые данные
      const now = new Date();
      const events = this.generateMockEvents(now, 30);

      // Обновляем кэш
      this.eventsCache = {
        events,
        last_updated: now.toISOString(),
      };

      // Сохраняем обновленный кэш
      this.saveCache(this.eventsCache);

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
            importance: Math.floor(Math.random() * 3) + 1, // 1-3, где 3 - самое важное
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
   * Возвращает текущий кэш событий
   * @returns {Object} Кэш событий
   */
  getEventsCache() {
    return this.eventsCache;
  }
}

const eventsRepository = new EventsRepository();
export default eventsRepository;
