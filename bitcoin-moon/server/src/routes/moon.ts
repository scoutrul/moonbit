import express from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types/types';

const router = express.Router();

// Кэш для лунных событий (ключ: startDate_endDate, значение: массив событий)
const lunarEventsCache = new Map<string, { events: any[], timestamp: number }>();
// Время жизни кэша: 24 часа (в миллисекундах)
const CACHE_TTL = 24 * 60 * 60 * 1000;
// Ведем счетчик запросов для мониторинга
let requestCounter = 0;
let cacheHits = 0;

// Пока заглушка для маршрутов луны
router.get('/phase', (req, res) => {
  res.json({
    date: new Date().toISOString(),
    phase: 0.5,
    phaseName: 'Полнолуние'
  });
});

router.get('/phases', (req, res) => {
  const startDate = req.query.startDate || new Date().toISOString();
  const endDate = req.query.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  res.json({
    startDate,
    endDate,
    phases: [
      {
        date: new Date().toISOString(),
        phase: 0.5,
        phaseName: 'Полнолуние'
      }
    ]
  });
});

router.get('/significant', (req, res) => {
  const count = parseInt(req.query.count as string) || 5;
  
  res.json({
    count,
    phases: [
      {
        date: new Date().toISOString(),
        type: 'full',
        phase: 0.5,
        phaseName: 'Полнолуние',
        title: 'Полнолуние',
        icon: 'full-moon'
      }
    ]
  });
});

router.get('/events', (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  
  res.json({
    days,
    events: [
      {
        date: new Date().toISOString(),
        type: 'full',
        phase: 0.5,
        phaseName: 'Полнолуние',
        title: 'Полнолуние',
        icon: 'full-moon'
      }
    ]
  });
});

/**
 * @route GET /api/moon/historical-events
 * @description Получение исторических лунных событий
 * @param {string} startDate - Начальная дата (ISO формат)
 * @param {string} endDate - Конечная дата (ISO формат)
 * @access Public
 */
router.get('/historical-events', (req, res) => {
  requestCounter++;
  const startDate = req.query.startDate as string || new Date().toISOString();
  const endDate = req.query.endDate as string || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // Проверяем валидность дат
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ 
      error: 'Неверный формат даты',
      details: 'Даты должны быть в формате ISO 8601'
    });
  }
  
  if (end < start) {
    return res.status(400).json({ 
      error: 'Неверный диапазон дат',
      details: 'Конечная дата должна быть позже начальной'
    });
  }
  
  // Ограничиваем диапазон дат для предотвращения слишком больших запросов
  const maxRange = 365 * 24 * 60 * 60 * 1000; // Максимум 1 год
  if (end.getTime() - start.getTime() > maxRange) {
    return res.status(400).json({ 
      error: 'Слишком большой диапазон дат',
      details: 'Максимальный диапазон - 1 год'
    });
  }
  
  console.log(`[${requestCounter}] Запрос исторических лунных событий: ${startDate} - ${endDate}`);
  
  // Создаем ключ для кэша
  const cacheKey = `${startDate}_${endDate}`;
  
  // Проверяем наличие данных в кэше
  if (lunarEventsCache.has(cacheKey)) {
    const cachedData = lunarEventsCache.get(cacheKey);
    // Проверяем, не устарел ли кэш
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      cacheHits++;
      console.log(`[${requestCounter}] Отдаем лунные события из кэша для ${startDate} - ${endDate} (хит кэша ${cacheHits})`);
      return res.json(cachedData.events);
    }
  }
  
  // Проверяем, есть ли близкие по диапазону запросы в кэше
  // Это поможет избежать генерации почти идентичных данных
  let foundEvents = null;
  
  for (const [key, value] of lunarEventsCache.entries()) {
    if (Date.now() - value.timestamp < CACHE_TTL) {
      const [cachedStart, cachedEnd] = key.split('_');
      const cachedStartDate = new Date(cachedStart);
      const cachedEndDate = new Date(cachedEnd);
      
      // Если запрашиваемый диапазон полностью входит в кэшированный
      if (start >= cachedStartDate && end <= cachedEndDate) {
        console.log(`[${requestCounter}] Найден подходящий кэш для ${startDate} - ${endDate}`);
        // Фильтруем события из кэша, чтобы отдать только те, что входят в запрашиваемый диапазон
        foundEvents = value.events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= start && eventDate <= end;
        });
        break;
      }
    }
  }
  
  if (foundEvents) {
    cacheHits++;
    console.log(`[${requestCounter}] Отдаем отфильтрованные лунные события из кэша (хит кэша ${cacheHits})`);
    
    // Сохраняем точный запрос в кэш для будущих запросов
    lunarEventsCache.set(cacheKey, { 
      events: foundEvents,
      timestamp: Date.now()
    });
    
    return res.json(foundEvents);
  }
  
  // Генерируем мок-данные лунных событий
  console.log(`[${requestCounter}] Генерация новых лунных событий для ${startDate} - ${endDate}`);
  const events = generateMockLunarEvents(start, end);
  
  // Сохраняем в кэш
  lunarEventsCache.set(cacheKey, { 
    events,
    timestamp: Date.now()
  });
  
  // Логируем статистику кэша
  console.log(`[${requestCounter}] Статистика кэша: ${cacheHits}/${requestCounter} (${Math.round(cacheHits/requestCounter*100)}% хитов)`);
  
  res.json(events);
});

/**
 * @route GET /api/moon/upcoming-events
 * @description Получение предстоящих лунных событий
 * @param {number} days - Количество дней для прогноза (по умолчанию 30)
 * @access Public
 */
router.get('/upcoming-events', (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  
  console.log(`Запрос предстоящих лунных событий на ${days} дней`);
  
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + days);
  
  // Создаем ключ для кэша
  const cacheKey = `upcoming_${days}_${now.toDateString()}`;
  
  // Проверяем наличие данных в кэше
  if (lunarEventsCache.has(cacheKey)) {
    const cachedData = lunarEventsCache.get(cacheKey);
    // Проверяем, не устарел ли кэш
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log(`Отдаем предстоящие лунные события из кэша (${days} дней)`);
      return res.json(cachedData.events);
    }
  }
  
  // Генерируем мок-данные лунных событий
  const events = generateMockLunarEvents(now, endDate);
  
  // Сохраняем в кэш
  lunarEventsCache.set(cacheKey, { 
    events,
    timestamp: Date.now()
  });
  
  res.json(events);
});

/**
 * Очищает устаревшие данные из кэша
 */
function cleanupCache() {
  const now = Date.now();
  let removedCount = 0;
  const initialSize = lunarEventsCache.size;
  
  for (const [key, data] of lunarEventsCache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      lunarEventsCache.delete(key);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`Очистка кэша: удалено ${removedCount} устаревших записей. Было: ${initialSize}, стало: ${lunarEventsCache.size}`);
  }
  
  // Также сбрасываем счетчики
  if (requestCounter > 1000) {
    console.log(`Сброс счетчиков запросов. Статистика: ${cacheHits}/${requestCounter} (${Math.round(cacheHits/requestCounter*100)}% хитов)`);
    requestCounter = 0;
    cacheHits = 0;
  }
}

// Запускаем очистку кэша каждый час
setInterval(cleanupCache, 60 * 60 * 1000);

/**
 * Генерирует мок-данные лунных событий для указанного периода
 * @param {Date} startDate - начальная дата
 * @param {Date} endDate - конечная дата
 * @returns {Array} массив лунных событий
 */
function generateMockLunarEvents(startDate: Date, endDate: Date) {
  const events = [];
  
  // Проверяем, что endDate больше startDate
  if (endDate < startDate) {
    console.error('Ошибка: конечная дата раньше начальной даты');
    return [];
  }
  
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
  let currentDate = new Date(nearestNewMoon);
  
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
  
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default router; 