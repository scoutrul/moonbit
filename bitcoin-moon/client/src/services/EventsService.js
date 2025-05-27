/**
 * Сервис для работы с данными о событиях
 */
import api from './api';
import { fetchAstroEvents, fetchUpcomingEvents, fetchHistoricalEvents } from './astroEvents';
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
    try {
      // Если есть кэш, возвращаем его
      if (eventsCache !== null) {
        return eventsCache;
      }

      // Получаем астрономические события
      console.log('Получаем астрономические события для отображения');
      
      // Задаем диапазон дат - 3 месяца назад и 6 месяцев вперед
      const now = new Date();
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 6);
      
      // Получаем астрономические события
      const astroEventsData = await fetchAstroEvents(startDate, endDate);
      
      // Преобразуем данные о фазах луны в формат событий
      const moonEvents = astroEventsData.map((event, index) => {
        // Определяем иконку и полное название события
        const icon = event.type === 'new_moon' ? '🌑' : '🌕';
        const title = event.type === 'new_moon' ? 'Новолуние' : 'Полнолуние';
        
        return {
          id: `moon-${event.type}-${index}`,
          title: title,
          date: event.date.toISOString(),
          type: 'moon',
          icon: icon,
          description: `Фаза Луны: ${title}`
        };
      });
      
      // Получаем пользовательские события из мок-данных
      const mockEvents = generateMockEvents();
      const userEvents = mockEvents.filter(event => event.type === 'user');
      
      // Объединяем все события
      const allEvents = [
        ...moonEvents,
        ...userEvents
      ];
      
      // Сортируем по дате
      const sortedEvents = allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Сохраняем в кэш
      eventsCache = sortedEvents;
      
      return sortedEvents;
    } catch (error) {
      console.error('Ошибка при получении событий:', error);
      
      // В случае ошибки возвращаем мок-данные
      console.warn('Из-за ошибки возвращаем мок-данные для событий');
      
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
    try {
      // Вместо использования getEvents, напрямую получаем предстоящие лунные события
      const days = limit * 20; // Запрашиваем с запасом, чтобы точно получить limit событий
      const upcomingLunarEvents = await fetchUpcomingEvents(days);
      
      // Преобразуем в формат событий
      const events = upcomingLunarEvents.map((event, index) => {
        const icon = event.type === 'new_moon' ? '🌑' : '🌕';
        const title = event.type === 'new_moon' ? 'Новолуние' : 'Полнолуние';
        
        return {
          id: `moon-upcoming-${event.type}-${index}`,
          title: title,
          date: event.date.toISOString(),
          type: 'moon',
          icon: icon,
          description: `Фаза Луны: ${title}`
        };
      });
      
      // Сортируем по дате и ограничиваем количество
      return events.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, limit);
    } catch (error) {
      console.error('Ошибка при получении предстоящих событий:', error);
      
      // В случае ошибки используем общий метод получения событий
      const events = await this.getEvents();
      const now = new Date();
      
      // Фильтруем только будущие события
      const futureEvents = events.filter((e) => new Date(e.date) > now);
      
      // Возвращаем ограниченное количество
      return futureEvents.slice(0, limit);
    }
  }

  /**
   * Получает события для отображения на графике
   * @param {string} timeframe - Временной интервал
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Promise<Array>} Массив событий
   */
  async getEventsForChart(timeframe, startDate, endDate) {
    try {
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
      
      console.log(`Получаем лунные события для таймфрейма ${timeframe}: с ${startDate.toISOString()} по ${endDate.toISOString()}`);
      
      // Получаем лунные события напрямую для указанного диапазона
      const lunarEvents = await fetchAstroEvents(startDate, endDate);
      
      // Преобразуем в формат событий для графика
      const events = lunarEvents.map((event, index) => {
        const icon = event.type === 'new_moon' ? '🌑' : '🌕';
        const title = event.type === 'new_moon' ? 'Новолуние' : 'Полнолуние';
        
        return {
          id: `moon-chart-${event.type}-${index}`,
          title: title,
          date: event.date.toISOString(),
          type: 'moon',
          icon: icon
        };
      });
      
      console.log(`Найдено ${events.length} лунных событий для таймфрейма ${timeframe}`);
      
      return events;
    } catch (error) {
      console.error('Ошибка при получении событий для графика:', error);
      
      // В случае ошибки используем общий метод
      const events = await this.getEvents();
      
      // Фильтруем события в указанном диапазоне
      const filteredEvents = events.filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate >= startDate && eventDate <= endDate;
      });
      
      return filteredEvents;
    }
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
        eventsCache = await this.getEvents();
      }
      
      eventsCache.push(newEvent);
      eventsCache.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return newEvent;
    } catch (error) {
      console.error('Ошибка при добавлении события:', error);
      
      // Генерируем ID
      const newEvent = {
        ...event,
        id: `user-${Date.now()}`,
        type: 'user',
      };
      
      // Добавляем в кэш
      if (eventsCache === null) {
        eventsCache = await this.getEvents();
      }
      
      eventsCache.push(newEvent);
      eventsCache.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return newEvent;
    }
  }
}

// Экспортируем синглтон
export default new EventsService();
