import express from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types/types';

const router = express.Router();

/**
 * @route GET /api/events/upcoming
 * @description Получить предстоящие события
 * @param {number} days Количество дней для выборки (по умолчанию 30)
 * @access Public
 */
router.get('/upcoming', (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  
  // Пока возвращаем мок-данные
  const events = generateMockEvents(days);
  
  res.json(events);
});

/**
 * @route GET /api/events/by-date-range
 * @description Получить события в диапазоне дат
 * @param {string} startDate Начальная дата
 * @param {string} endDate Конечная дата
 * @access Public
 */
router.get('/by-date-range', (req, res) => {
  const startDate = req.query.startDate as string || new Date().toISOString();
  const endDate = req.query.endDate as string || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // Пока возвращаем мок-данные
  const events = generateMockEvents(30);
  
  res.json(events);
});

/**
 * @route GET /api/events/economic/upcoming
 * @description Получить предстоящие экономические события
 * @param {number} limit Количество событий (по умолчанию 10)
 * @access Public
 */
router.get('/economic/upcoming', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  
  // Генерируем мок-данные экономических событий
  const events = generateMockEconomicEvents(limit);
  
  res.json(events);
});

/**
 * Генерирует мок-данные для тестирования
 * @param {number} days Количество дней
 * @returns {Array} Массив событий
 */
function generateMockEvents(days: number) {
  const events = [];
  const now = new Date();
  
  for (let i = 0; i < 10; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + Math.floor(Math.random() * days));
    
    events.push({
      id: `event-${i}`,
      date: date.toISOString(),
      title: `Событие ${i}`,
      description: `Описание события ${i}`,
      type: i % 2 === 0 ? 'moon' : 'astro'
    });
  }
  
  return events;
}

/**
 * Генерирует мок-данные экономических событий
 * @param {number} limit Количество событий
 * @returns {Array} Массив экономических событий
 */
function generateMockEconomicEvents(limit: number) {
  const events = [];
  const now = new Date();
  
  const economicEventTypes = [
    'Решение по процентной ставке ФРС',
    'Отчет по занятости',
    'Индекс потребительских цен',
    'ВВП',
    'Производственные заказы',
    'Индекс деловой активности',
    'Данные по розничным продажам',
    'Выступление главы ФРС',
    'Публикация протоколов заседания ФРС',
    'Отчет по торговому балансу'
  ];
  
  for (let i = 0; i < limit; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + Math.floor(Math.random() * 30)); // События в ближайшие 30 дней
    
    events.push({
      id: `economic-${i}`,
      date: date.toISOString(),
      title: economicEventTypes[i % economicEventTypes.length],
      description: `Важное экономическое событие #${i}`,
      type: 'economic',
      icon: '📊',
      impact: Math.floor(Math.random() * 3) + 1 // Влияние от 1 до 3
    });
  }
  
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default router; 