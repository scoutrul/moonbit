/**
 * Сервис для работы с данными о событиях
 */
import api from './api';
import { generateMockEvents } from '../utils/mockDataGenerator';

// Кэш событий для использования в разных компонентах
let eventsCache = null;

/**
 * Класс для работы с данными о событиях
 */
class EventsService {
  /**
   * Получает список предстоящих событий
   * @returns {Promise<Array>} Массив событий
   */
  async getEvents() {
    // Для демо-режима всегда используем моковые данные
    try {
      // Если есть кэш, возвращаем его
      if (eventsCache !== null) {
        return eventsCache;
      }

      // В демо-режиме сразу используем моковые данные
      console.warn('DEMO MODE: возвращаем мок-данные для событий');
      eventsCache = generateMockEvents();
      return eventsCache;

      // Закомментированный код для использования реального API
      /*
      // Пытаемся получить данные с сервера
      const [moonResponse, astroResponse, userEventsResponse] = await Promise.all([
        api.get('/moon/phases'),
        api.get('/astro/events'),
        api.get('/events'),
      ]);

      // Объединяем все события
      const allEvents = [
        ...moonResponse.data.map((e) => ({ ...e, type: 'moon' })),
        ...astroResponse.data.map((e) => ({ ...e, type: 'astro' })),
        ...userEventsResponse.data.map((e) => ({ ...e, type: 'user' })),
      ];

      // Сортируем по дате
      const sortedEvents = allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Сохраняем в кэш
      eventsCache = sortedEvents;
      
      return sortedEvents;
      */
    } catch (error) {
      console.warn('DEMO MODE: возвращаем мок-данные для событий');
      
      // Если события еще не были сгенерированы, генерируем их
      if (eventsCache === null) {
        eventsCache = generateMockEvents();
      }
      
      return eventsCache;
    }
  }

  /**
   * Получает ближайшие предстоящие события
   * @param {number} limit - Максимальное количество событий
   * @returns {Promise<Array>} Массив событий
   */
  async getUpcomingEvents(limit = 5) {
    const events = await this.getEvents();
    const now = new Date();
    
    // Фильтруем только будущие события
    const futureEvents = events.filter((e) => new Date(e.date) > now);
    
    // Возвращаем ограниченное количество
    return futureEvents.slice(0, limit);
  }

  /**
   * Получает события для отображения на графике
   * @param {string} timeframe - Временной интервал
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Promise<Array>} Массив событий
   */
  async getEventsForChart(timeframe, startDate, endDate) {
    const events = await this.getEvents();
    
    // Если даты не указаны, создаем диапазон в зависимости от таймфрейма
    if (!startDate || !endDate) {
      const now = new Date();
      
      endDate = new Date(now);
      startDate = new Date(now);
      
      switch (timeframe) {
        case '1m':
        case '3m':
        case '5m':
        case '15m':
        case '30m':
          // Для минутных таймфреймов показываем события на 2 недели (1 назад + 1 вперед)
          startDate.setDate(startDate.getDate() - 7);
          endDate.setDate(endDate.getDate() + 7);
          break;
        case '1h':
        case '4h':
        case '12h':
          // Для часовых таймфреймов показываем события на 2 месяца (1 назад + 1 вперед)
          startDate.setDate(startDate.getDate() - 30);
          endDate.setDate(endDate.getDate() + 30);
          break;
        case '1d':
          // Для дневного таймфрейма показываем события на 6 месяцев (3 назад + 3 вперед)
          startDate.setMonth(startDate.getMonth() - 3);
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case '1w':
          // Для недельного таймфрейма показываем события на 1 год (6 мес назад + 6 вперед)
          startDate.setMonth(startDate.getMonth() - 6);
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case '1M':
        case '1y':
        case 'all':
          // Для длительных таймфреймов показываем события на 2 года (1 назад + 1 вперед)
          startDate.setFullYear(startDate.getFullYear() - 1);
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 2);
          endDate.setMonth(endDate.getMonth() + 2);
      }
    }
    
    console.log(`Фильтруем события для таймфрейма ${timeframe}: с ${startDate.toISOString()} по ${endDate.toISOString()}`);
    
    // Фильтруем события в указанном диапазоне
    const filteredEvents = events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= startDate && eventDate <= endDate;
    });
    
    console.log(`Найдено ${filteredEvents.length} событий из ${events.length} для таймфрейма ${timeframe}`);
    
    return filteredEvents;
  }

  /**
   * Добавляет новое событие
   * @param {Object} event - Событие для добавления
   * @returns {Promise<Object>} Добавленное событие
   */
  async addEvent(event) {
    try {
      // В демо-режиме всегда симулируем добавление события
      console.warn('DEMO MODE: симулируем добавление события');
      
      // Генерируем ID
      const newEvent = {
        ...event,
        id: `user-${Date.now()}`,
        type: 'user',
      };
      
      // Добавляем в кэш
      if (eventsCache === null) {
        eventsCache = generateMockEvents();
      }
      
      eventsCache.push(newEvent);
      eventsCache.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return newEvent;
      
      /*
      // Закомментированный код для использования реального API
      const response = await api.post('/events', event);
      
      // Обновляем кэш
      if (eventsCache !== null) {
        eventsCache.push(response.data);
        eventsCache.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
      
      return response.data;
      */
    } catch (error) {
      console.warn('DEMO MODE: симулируем добавление события');
      
      // Генерируем ID
      const newEvent = {
        ...event,
        id: `user-${Date.now()}`,
        type: 'user',
      };
      
      // Добавляем в кэш
      if (eventsCache === null) {
        eventsCache = generateMockEvents();
      }
      
      eventsCache.push(newEvent);
      eventsCache.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return newEvent;
    }
  }
}

// Экспортируем синглтон
export default new EventsService();
