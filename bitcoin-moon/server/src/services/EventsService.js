import logger from '../utils/logger.js';
import eventsRepository from '../repositories/EventsRepository.js';

/**
 * Сервис для работы с событиями, связанными с биткоином
 * Использует репозиторий для получения данных и предоставляет бизнес-логику
 */
class EventsService {
  /**
   * Обновляет данные о событиях
   * @returns {Promise<Object>} Обновленные данные о событиях
   */
  async updateEvents() {
    logger.debug('EventsService: запрос обновления данных о событиях');
    return await eventsRepository.fetchEvents();
  }

  /**
   * Получает последние события
   * @param {number} limit - Количество событий для получения
   * @returns {Array} Список последних событий
   */
  getRecentEvents(limit = 5) {
    const eventsCache = eventsRepository.getEventsCache();

    // Если кэш устарел (более 1 часа), запускаем обновление
    const cacheAge = eventsCache.last_updated
      ? (new Date() - new Date(eventsCache.last_updated)) / 1000 / 60
      : 9999;

    if (cacheAge > 60) {
      logger.debug(`Кэш событий устарел (${Math.round(cacheAge)} мин), запуск обновления`);
      this.updateEvents().catch((error) => {
        logger.error('Ошибка при фоновом обновлении событий', { error });
      });
    }

    // Возвращаем последние события
    const sortedEvents = [...eventsCache.events].sort((a, b) => {
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
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Некорректный формат дат');
    }

    const eventsCache = eventsRepository.getEventsCache();

    // Фильтруем события по дате
    return eventsCache.events.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= start && eventDate <= end;
    });
  }

  /**
   * Получает события по уровню важности
   * @param {number} importance - Уровень важности (1-3)
   * @param {number} limit - Количество событий для получения
   * @returns {Array} Список событий по уровню важности
   */
  getEventsByImportance(importance, limit = 10) {
    const eventsCache = eventsRepository.getEventsCache();

    // Фильтруем события по важности
    const filteredEvents = eventsCache.events.filter((event) => event.importance === importance);

    // Сортируем по дате
    const sortedEvents = filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    return sortedEvents.slice(0, limit);
  }

  /**
   * Анализирует влияние предстоящих событий на рынок биткоина
   * @returns {Object} Результат анализа
   */
  analyzeEventsInfluence() {
    const events = this.getRecentEvents(10);

    // Расчет потенциального влияния событий
    let volatilityScore = 0;
    let bullishScore = 0;
    let bearishScore = 0;

    events.forEach((event) => {
      const importance = event.importance || 1;

      // Определяем характер события (позитивный/негативный)
      let sentiment = 0;

      if (
        event.title.includes('Обновление') ||
        event.title.includes('Релиз') ||
        event.title.includes('Интеграция') ||
        event.title.includes('Листинг')
      ) {
        sentiment = 1; // Позитивный
      } else if (event.title.includes('Хардфорк')) {
        sentiment = 0.5; // Нейтральный с позитивным оттенком
      }

      // Рассчитываем влияние на тренд и волатильность
      volatilityScore += importance;

      if (sentiment > 0) {
        bullishScore += importance * sentiment;
      } else if (sentiment < 0) {
        bearishScore += importance * Math.abs(sentiment);
      }
    });

    // Нормализуем оценки
    const totalScore = Math.max(1, events.length);
    volatilityScore = volatilityScore / totalScore;

    const trendScore = (bullishScore - bearishScore) / totalScore;

    let trend, volatility;

    // Определяем тренд
    if (trendScore > 1.5) {
      trend = 'сильный бычий';
    } else if (trendScore > 0.5) {
      trend = 'умеренно бычий';
    } else if (trendScore > -0.5) {
      trend = 'нейтральный';
    } else if (trendScore > -1.5) {
      trend = 'умеренно медвежий';
    } else {
      trend = 'сильный медвежий';
    }

    // Определяем волатильность
    if (volatilityScore > 2.5) {
      volatility = 'очень высокая';
    } else if (volatilityScore > 1.5) {
      volatility = 'высокая';
    } else if (volatilityScore > 0.8) {
      volatility = 'умеренная';
    } else {
      volatility = 'низкая';
    }

    return {
      trend,
      volatility,
      significance: Math.round(Math.abs(trendScore) * 10) / 10,
      events: events.length,
      highImportanceEvents: events.filter((e) => e.importance >= 2).length,
    };
  }
}

const eventsService = new EventsService();
export default eventsService;
