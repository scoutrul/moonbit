import express from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types/types';

const router = express.Router();

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
  const startDate = req.query.startDate as string || new Date().toISOString();
  const endDate = req.query.endDate as string || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  console.log(`Запрос исторических лунных событий: ${startDate} - ${endDate}`);
  
  // Генерируем мок-данные лунных событий
  const events = generateMockLunarEvents(new Date(startDate), new Date(endDate));
  
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
  
  // Генерируем мок-данные лунных событий
  const events = generateMockLunarEvents(now, endDate);
  
  res.json(events);
});

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