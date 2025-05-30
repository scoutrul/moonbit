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
    try {
      // Если есть кэш, возвращаем его
      if (eventsCache !== null) {
        return eventsCache;
      }

      // Получаем астрономические события с сервера
      console.log('Получаем астрономические события для отображения');
      
      // Задаем диапазон дат - 3 месяца назад и 6 месяцев вперед
      const now = new Date();
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 6);
      
      // Получаем лунные события с сервера
      const response = await api.get('/moon/historical-events', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      const moonEvents = response.data;
      console.log('Получено лунных событий:', moonEvents.length, moonEvents);
      
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
      // Вместо локального расчета делаем запрос к серверу
      const response = await api.get('/moon/upcoming-events', {
        params: {
          days: limit * 10 // Запрашиваем с запасом, чтобы точно получить limit событий
        }
      });
      
      const events = response.data;
      
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
   * Получает астрономические события на указанный период
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Promise<Array>} - массив астрономических событий
   */
  async getAstroEvents(startDate, endDate) {
    try {
      // Форматируем даты для запроса
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      
      const response = await api.get('/astro/events', {
        params: { startDate: start, endDate: end }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при получении астрономических событий:', error);
      return [];
    }
  }

  /**
   * Получает фазу луны на текущий момент
   * @returns {Promise<Object>} - информация о фазе луны
   */
  async getCurrentMoonPhase() {
    try {
      const response = await api.get('/moon/current');
      
      return response.data || null;
    } catch (error) {
      console.error('Ошибка при получении фазы луны:', error);
      return null;
    }
  }
  
  /**
   * Комплексный метод для получения событий всех типов для графика
   * @param {string} timeframe - таймфрейм графика
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Promise<Array>} - массив всех событий
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
            startDate.setMonth(startDate.getMonth() - 1);
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case '1d':
          case '1w':
          default:
            // Для дневных и недельных таймфреймов показываем события на 6 месяцев (3 назад + 3 вперед)
            startDate.setMonth(startDate.getMonth() - 3);
            endDate.setMonth(endDate.getMonth() + 3);
        }
      }
      
      console.log(`EventsService: Получение событий для графика в диапазоне ${startDate.toISOString()} - ${endDate.toISOString()}`);
      
      // Запрашиваем все типы событий параллельно для повышения производительности
      const [lunarEvents, economicEvents] = await Promise.all([
        this.getLunarEvents(startDate, endDate),
        this.getEconomicEvents(10) // Ограничиваем количество экономических событий
      ]);
      
      console.log(`EventsService: Получено лунных событий: ${lunarEvents.length}, экономических: ${economicEvents.length}`);
      
      // Объединяем все события
      const allEvents = [
        ...lunarEvents,
        ...economicEvents
      ];
      
      // Если не удалось получить реальные данные, возвращаем мок-данные
      if (allEvents.length === 0) {
        console.warn('EventsService: Не удалось получить события, используем мок-данные');
        return this._getMockEventsForChart(timeframe, startDate, endDate);
      }
      
      // Сортируем по дате
      return allEvents.sort((a, b) => {
        const dateA = new Date(a.date || a.time * 1000);
        const dateB = new Date(b.date || b.time * 1000);
        return dateA - dateB;
      });
    } catch (error) {
      console.error('Ошибка при получении событий для графика:', error);
      
      // В случае ошибки возвращаем мок-данные
      return this._getMockEventsForChart(timeframe, startDate, endDate);
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

  /**
   * Получает лунные события с сервера
   * @param {number} days - Количество дней
   * @returns {Promise<Array>} Массив лунных событий
   */
  async getUpcomingLunarEvents(days = 30) {
    try {
      const response = await api.get('/moon/upcoming-events', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении лунных событий:', error);
      return [];
    }
  }

  /**
   * Получает экономические события с сервера
   * @param {number} limit - Количество событий
   * @returns {Promise<Array>} Массив экономических событий
   */
  async getEconomicEvents(limit = 10) {
    try {
      const response = await api.get('/economic/upcoming', {
        params: { limit }
      });
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при получении экономических событий:', error);
      return [];
    }
  }

  /**
   * Получает данные о затмениях (солнечных и лунных)
   * @param {Date} startDate - Начальная дата (по умолчанию - текущая)
   * @param {Date} endDate - Конечная дата (по умолчанию - через 3 года)
   * @returns {Promise<Array>} Массив затмений
   */
  async getEclipses(startDate = new Date(), endDate = null) {
    try {
      // Если endDate не указан, установим его на 3 года вперед
      if (!endDate) {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 3);
      }
      
      const response = await api.get('/astro/eclipses', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      console.log('Получено затмений:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении затмений:', error);
      return [];
    }
  }

  /**
   * Получает лунные события для указанного периода
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Promise<Array>} - массив лунных событий
   */
  async getLunarEvents(startDate, endDate) {
    try {
      // Форматируем даты для запроса
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      
      const response = await api.get('/moon/historical-events', {
        params: { startDate: start, endDate: end }
      });
      
      // Если получены пустые данные, возвращаем мок-данные
      if (!response.data || response.data.length === 0) {
        console.warn('EventsService: получены пустые данные от API, используем мок-данные');
        return this._getMockLunarEvents(startDate, endDate);
      }
      
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении лунных событий:', error);
      // В случае ошибки генерируем мок-данные
      return this._getMockLunarEvents(startDate, endDate);
    }
  }
  
  /**
   * Генерирует мок-данные лунных событий для указанного периода
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Array} - массив лунных событий
   * @private
   */
  _getMockLunarEvents(startDate, endDate) {
    const events = [];
    
    // Генерируем новолуния и полнолуния
    let currentDate = new Date(startDate);
    const lunarCycle = 29.5 * 24 * 60 * 60 * 1000; // ~29.5 дней в миллисекундах
    const halfLunarCycle = lunarCycle / 2;
    
    // Начнем с новолуния
    while (currentDate <= endDate) {
      // Новолуние
      events.push({
        date: new Date(currentDate).toISOString(),
        type: 'new_moon',
        phase: 0,
        phaseName: 'Новолуние',
        title: 'Новолуние',
        icon: '🌑'
      });
      
      // Полнолуние (через ~14.75 дней после новолуния)
      const fullMoonDate = new Date(currentDate.getTime() + halfLunarCycle);
      if (fullMoonDate <= endDate) {
        events.push({
          date: fullMoonDate.toISOString(),
          type: 'full_moon',
          phase: 0.5,
          phaseName: 'Полнолуние',
          title: 'Полнолуние',
          icon: '🌕'
        });
      }
      
      // Переходим к следующему циклу
      currentDate = new Date(currentDate.getTime() + lunarCycle);
    }
    
    // Сортируем события по дате
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Генерирует мок-данные о событиях для графика
   * @param {string} timeframe - таймфрейм графика
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Array} - массив событий
   * @private
   */
  _getMockEventsForChart(timeframe, startDate, endDate) {
    // Мок-данные о лунных фазах
    const events = [];
    
    // Генерируем новолуния и полнолуния
    let currentDate = new Date(startDate);
    const lunarCycle = 29.5 * 24 * 60 * 60 * 1000; // ~29.5 дней в миллисекундах
    const halfLunarCycle = lunarCycle / 2;
    
    // Начнем с новолуния
    while (currentDate <= endDate) {
      // Новолуние
      events.push({
        date: new Date(currentDate).toISOString(),
        type: 'new_moon',
        phase: 0,
        phaseName: 'Новолуние',
        title: 'Новолуние',
        icon: '🌑'
      });
      
      // Полнолуние (через ~14.75 дней после новолуния)
      const fullMoonDate = new Date(currentDate.getTime() + halfLunarCycle);
      if (fullMoonDate <= endDate) {
        events.push({
          date: fullMoonDate.toISOString(),
          type: 'full_moon',
          phase: 0.5,
          phaseName: 'Полнолуние',
          title: 'Полнолуние',
          icon: '🌕'
        });
      }
      
      // Переходим к следующему циклу
      currentDate = new Date(currentDate.getTime() + lunarCycle);
    }
    
    // Генерируем несколько астрономических событий
    const astroEvents = [
      {
        date: new Date(startDate.getTime() + (endDate - startDate) * 0.2).toISOString(),
        type: 'solar_eclipse',
        title: 'Солнечное затмение',
        description: 'Солнечное затмение',
        icon: '☀️'
      },
      {
        date: new Date(startDate.getTime() + (endDate - startDate) * 0.7).toISOString(),
        type: 'lunar_eclipse',
        title: 'Лунное затмение',
        description: 'Лунное затмение',
        icon: '🌙'
      },
      {
        date: new Date(startDate.getTime() + (endDate - startDate) * 0.4).toISOString(),
        type: 'astro',
        title: 'Равноденствие',
        description: 'Весеннее/осеннее равноденствие',
        icon: '🌷'
      }
    ];
    
    // Генерируем несколько экономических событий
    const economicEvents = [
      {
        date: new Date(startDate.getTime() + (endDate - startDate) * 0.3).toISOString(),
        type: 'economic',
        title: 'Заседание ФРС',
        description: 'Решение по процентной ставке',
        icon: '🏦'
      },
      {
        date: new Date(startDate.getTime() + (endDate - startDate) * 0.6).toISOString(),
        type: 'economic',
        title: 'Отчет по инфляции',
        description: 'Данные по индексу потребительских цен',
        icon: '📊'
      },
      {
        date: new Date(startDate.getTime() + (endDate - startDate) * 0.9).toISOString(),
        type: 'economic',
        title: 'Отчет по занятости',
        description: 'Данные по рынку труда',
        icon: '👥'
      }
    ];
    
    // Объединяем все события
    events.push(...astroEvents, ...economicEvents);
    
    // Сортируем по дате
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
}

// Экспортируем синглтон
export default new EventsService();
