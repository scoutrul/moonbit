/**
 * Сервис для работы с данными о событиях
 */
import api from './api';
import { generateMockEvents } from '../utils/mockDataGenerator';

// Кэш событий для использования в разных компонентах
let eventsCache = null;

// Кэш для запросов лунных событий
const lunarEventsCache = new Map();
// Время жизни кэша: 1 час (в миллисекундах)
const CACHE_TTL = 60 * 60 * 1000;

// Активные запросы к API для предотвращения дублирования
const activeRequests = new Map();

// Счетчик запросов для мониторинга
let requestCounter = 0;
let cacheHits = 0;

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
      
      // Задаем диапазон дат
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 365); // Получаем события на год вперед
      
      // Запрашиваем разные типы событий и объединяем их
      const [upcomingEvents, lunarEvents, astroEvents] = await Promise.all([
        this.getUpcomingEvents(10),
        this.getUpcomingLunarEvents(90),
        this.getAstroEvents(startDate, endDate)
      ]);
      
      // Объединяем все события
      const allEvents = [
        ...upcomingEvents,
        ...lunarEvents,
        ...astroEvents
      ];
      
      // Сортируем по дате
      const sortedEvents = allEvents.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
      
      // Обновляем кэш
      eventsCache = sortedEvents;
      
      return sortedEvents;
    } catch (error) {
      console.error('Ошибка при получении событий:', error);
      
      // В случае ошибки генерируем мок-данные
      console.warn('Используем мок-данные для отображения');
      const mockEvents = generateMockEvents();
      eventsCache = mockEvents;
      return mockEvents;
    }
  }

  /**
   * Получает список предстоящих событий
   * @param {number} limit - Количество событий
   * @returns {Promise<Array>} Массив событий
   */
  async getUpcomingEvents(limit = 5) {
    try {
      // Пробуем получить данные с API
      console.log(`Запрос предстоящих событий (лимит: ${limit})`);
      
      const response = await api.get('/events/upcoming', {
        params: { limit }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при получении предстоящих событий:', error);
      
      // В случае ошибки, возвращаем пустой массив
      return [];
    }
  }

  /**
   * Получает астрономические события
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Promise<Array>} Массив астрономических событий
   */
  async getAstroEvents(startDate, endDate) {
    try {
      const response = await api.get('/astro/events', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при получении астрономических событий:', error);
      return [];
    }
  }

  /**
   * Получает текущую фазу луны
   * @returns {Promise<Object>} Данные о текущей фазе луны
   */
  async getCurrentMoonPhase() {
    try {
      const response = await api.get('/moon/phase');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении текущей фазы луны:', error);
      return {
        date: new Date().toISOString(),
        phase: Math.random(), // Случайная фаза для демонстрации
        phaseName: 'Неизвестно'
      };
    }
  }

  /**
   * Получает события для отображения на графике
   * @param {string} timeframe - Таймфрейм графика
   * @param {Date} [startDate=null] - Начальная дата (если не указана, берется на основе таймфрейма)
   * @param {Date} [endDate=null] - Конечная дата (если не указана, берется на основе таймфрейма)
   * @returns {Promise<Array>} Массив событий для графика
   */
  async getEventsForChart(timeframe, startDate = null, endDate = null) {
    try {
      // Если даты не указаны, определяем их на основе таймфрейма
      if (!startDate || !endDate) {
        const now = new Date();
        
        startDate = new Date(now);
        endDate = new Date(now);
        
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
        const dateA = new Date(a.date || a.time * 1000).getTime();
        const dateB = new Date(b.date || b.time * 1000).getTime();
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
      eventsCache.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
      
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
      eventsCache.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
      
      return newEvent;
    }
  }

  /**
   * Получает предстоящие лунные события
   * @param {number} days - количество дней для поиска событий
   * @returns {Promise<Array>} - массив предстоящих лунных событий
   */
  async getUpcomingLunarEvents(days = 30) {
    try {
      console.log(`Запрос предстоящих лунных событий на ${days} дней`);
      
      // Используем локальный API
      const response = await api.get('/moon/upcoming-events', {
        params: { days }
      });
      
      console.log(`Получено предстоящих лунных событий: ${response.data.length}`);
      
      return response.data || [];
    } catch (error) {
      console.error('Ошибка при получении предстоящих лунных событий:', error);
      
      // В случае ошибки создаем диапазон дат и получаем все события
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      // Используем метод получения всех лунных событий
      return this.getLunarEvents(startDate, endDate);
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
   * Получает лунные события (новолуния и полнолуния) для указанного периода
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Promise<Array>} - массив лунных событий
   */
  async getLunarEvents(startDate, endDate) {
    requestCounter++;
    try {
      if (!startDate || !endDate) {
        throw new Error('Необходимо указать начальную и конечную даты');
      }

      // Формируем ключ для кэширования
      const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}`;
      
      // Проверяем, есть ли данные в кэше
      if (lunarEventsCache.has(cacheKey)) {
        const cachedData = lunarEventsCache.get(cacheKey);
        // Проверяем, не устарел ли кэш
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
          cacheHits++;
          console.log(`[${requestCounter}] Возвращаем лунные события из кэша для ${startDate.toISOString()} - ${endDate.toISOString()} (хит кэша ${cacheHits})`);
          return cachedData.events;
        }
      }

      // Проверяем, есть ли активный запрос с такими параметрами
      if (activeRequests.has(cacheKey)) {
        console.log(`[${requestCounter}] Ожидаем завершения существующего запроса для ${cacheKey}`);
        return activeRequests.get(cacheKey);
      }

      // Проверяем, есть ли частично перекрывающиеся данные в кэше
      // и можем ли мы использовать их вместо полного запроса
      let foundCachedEvents = [];
      
      for (const [key, value] of lunarEventsCache.entries()) {
        if (Date.now() - value.timestamp < CACHE_TTL) {
          const [cachedStartIso, cachedEndIso] = key.split('_');
          const cachedStart = new Date(cachedStartIso);
          const cachedEnd = new Date(cachedEndIso);
          
          // Если запрашиваемый диапазон полностью внутри кэшированного
          if (startDate >= cachedStart && endDate <= cachedEnd) {
            console.log(`[${requestCounter}] Найден подходящий кэш для диапазона ${startDate.toISOString()} - ${endDate.toISOString()}`);
            
            // Фильтруем кэшированные события для запрашиваемого диапазона
            foundCachedEvents = value.events.filter(event => {
              const eventDate = new Date(event.date);
              return eventDate >= startDate && eventDate <= endDate;
            });
            
            // Сохраняем отфильтрованные события в кэш для точного запроса
            lunarEventsCache.set(cacheKey, {
              events: foundCachedEvents,
              timestamp: Date.now()
            });
            
            cacheHits++;
            console.log(`[${requestCounter}] Использован существующий кэш с фильтрацией (хит кэша ${cacheHits})`);
            return foundCachedEvents;
          }
        }
      }

      // Форматируем даты для запроса
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      
      console.log(`[${requestCounter}] Запрос лунных событий в диапазоне: ${start} - ${end}`);
      
      // Создаем промис для запроса и сохраняем его в активных запросах
      const requestPromise = (async () => {
        try {
          // Используем локальный API вместо удаленного
          const response = await api.get('/moon/historical-events', {
            params: { startDate: start, endDate: end }
          });
          
          console.log(`[${requestCounter}] Получено лунных событий: ${response.data.length}`);
          
          // Сохраняем в кэш
          lunarEventsCache.set(cacheKey, {
            events: response.data,
            timestamp: Date.now()
          });
          
          return response.data || [];
        } catch (error) {
          console.error(`[${requestCounter}] Ошибка при получении лунных событий:`, error);
          
          // В случае ошибки используем мок-данные
          console.warn(`[${requestCounter}] Используем мок-данные для лунных событий`);
          const mockEvents = this._getMockLunarEvents(startDate, endDate);
          
          // Сохраняем в кэш
          lunarEventsCache.set(cacheKey, {
            events: mockEvents,
            timestamp: Date.now()
          });
          
          return mockEvents;
        } finally {
          // Удаляем запрос из активных
          setTimeout(() => {
            activeRequests.delete(cacheKey);
          }, 1000);
        }
      })();
      
      // Сохраняем промис в активных запросах
      activeRequests.set(cacheKey, requestPromise);
      
      return requestPromise;
    } catch (error) {
      console.error('Ошибка при обработке запроса лунных событий:', error);
      
      // В случае ошибки используем мок-данные
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
    
    // Проверяем, что endDate больше startDate
    if (endDate < startDate) {
      console.error('Ошибка: конечная дата раньше начальной даты');
      return [];
    }
    
    console.log(`_getMockLunarEvents: генерация событий с ${startDate.toISOString()} по ${endDate.toISOString()}`);
    
    // Вычисляем разницу в днях
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log(`_getMockLunarEvents: разница в днях: ${diffDays}`);
    
    // Генерируем новолуния и полнолуния
    let currentDate = new Date(startDate);
    
    // Лунный цикл примерно 29.53 дней
    const lunarCycle = 29.53 * 24 * 60 * 60 * 1000; // ~29.53 дней в миллисекундах
    const halfLunarCycle = lunarCycle / 2;
    
    // Находим ближайшее новолуние перед начальной датой
    // Для простоты предположим, что 1 января 2022 года было новолуние
    const referenceNewMoon = new Date('2022-01-01T00:00:00Z').getTime();
    const msFromReference = startDate.getTime() - referenceNewMoon;
    const cyclesSinceReference = msFromReference / lunarCycle;
    const cycleFraction = cyclesSinceReference - Math.floor(cyclesSinceReference);
    
    // Корректируем начальную дату для поиска ближайшего новолуния
    let nearestNewMoon;
    if (cycleFraction < 0.5) {
      // Ближайшее новолуние было недавно
      nearestNewMoon = new Date(startDate.getTime() - cycleFraction * lunarCycle);
    } else {
      // Ближайшее новолуние будет скоро
      nearestNewMoon = new Date(startDate.getTime() + (1 - cycleFraction) * lunarCycle);
    }
    
    // Устанавливаем текущую дату на ближайшее новолуние
    currentDate = new Date(nearestNewMoon);
    
    // Генерируем события для всего периода
    while (currentDate <= endDate) {
      if (currentDate >= startDate) {
        // Добавляем новолуние, если оно попадает в запрошенный период
        events.push({
          date: new Date(currentDate).toISOString(),
          type: 'new_moon',
          phase: 0,
          phaseName: 'Новолуние',
          title: 'Новолуние',
          icon: '🌑'
        });
      }
      
      // Переходим к следующему полнолунию
      const fullMoonDate = new Date(currentDate.getTime() + halfLunarCycle);
      if (fullMoonDate <= endDate && fullMoonDate >= startDate) {
        // Добавляем полнолуние, если оно попадает в запрошенный период
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
    
    // Сортируем события по дате и убеждаемся, что все они в запрошенном диапазоне
    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startDate && eventDate <= endDate;
    });
    
    const sortedEvents = filteredEvents.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
    console.log(`_getMockLunarEvents: сгенерировано ${sortedEvents.length} лунных событий`);
    
    return sortedEvents;
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
    const diffTimeMs = endDate.getTime() - startDate.getTime();
    
    events.push({
      date: new Date(startDate.getTime() + diffTimeMs * 0.2).toISOString(),
      type: 'solar_eclipse',
      title: 'Солнечное затмение',
      description: 'Солнечное затмение',
      icon: '☀️'
    });
    
    events.push({
      date: new Date(startDate.getTime() + diffTimeMs * 0.7).toISOString(),
      type: 'lunar_eclipse',
      title: 'Лунное затмение',
      description: 'Лунное затмение',
      icon: '🌙'
    });
    
    events.push({
      date: new Date(startDate.getTime() + diffTimeMs * 0.4).toISOString(),
      type: 'astro',
      title: 'Равноденствие',
      description: 'Весеннее/осеннее равноденствие',
      icon: '🌷'
    });
    
    // Генерируем несколько экономических событий
    events.push({
      date: new Date(startDate.getTime() + diffTimeMs * 0.3).toISOString(),
      type: 'economic',
      title: 'Заседание ФРС',
      description: 'Федеральная резервная система объявляет решение по процентной ставке',
      icon: '💵'
    });
    
    events.push({
      date: new Date(startDate.getTime() + diffTimeMs * 0.6).toISOString(),
      type: 'economic',
      title: 'Отчет по занятости',
      description: 'Публикация данных по рынку труда',
      icon: '📊'
    });
    
    events.push({
      date: new Date(startDate.getTime() + diffTimeMs * 0.9).toISOString(),
      type: 'economic',
      title: 'Индекс потребительских цен',
      description: 'Публикация данных по инфляции',
      icon: '🛒'
    });
    
    // Сортируем по дате
    return events.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
  }
}

// Создаем единственный экземпляр сервиса
const eventsService = new EventsService();

export default eventsService;
