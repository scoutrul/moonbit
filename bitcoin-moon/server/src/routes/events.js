const express = require('express');
const router = express.Router();
const eventsService = require('../services/EventsService');
const logger = require('../utils/logger');
const { validate } = require('../utils/middlewares');
const { schemas } = require('../utils/validators');

/**
 * @route GET /api/events/recent
 * @desc Получает последние события, связанные с биткоином
 * @access Public
 * @query {number} limit - Количество событий для получения
 */
router.get('/recent', validate(schemas.eventsRequest), async (req, res, next) => {
  try {
    const { limit } = req.query;
    
    const events = eventsService.getRecentEvents(limit);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/events/period
 * @desc Получает события за указанный период
 * @access Public
 * @query {string} startDate - Начальная дата в формате YYYY-MM-DD
 * @query {string} endDate - Конечная дата в формате YYYY-MM-DD
 */
router.get('/period', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const events = eventsService.getEventsByPeriod(startDate, endDate);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/events/importance/:level
 * @desc Получает события по уровню важности
 * @access Public
 * @param {number} level - Уровень важности (1-3)
 * @query {number} limit - Количество событий для получения
 */
router.get('/importance/:level', async (req, res, next) => {
  try {
    const level = parseInt(req.params.level, 10);
    const { limit } = req.query;
    
    if (isNaN(level) || level < 1 || level > 3) {
      return res.status(400).json({
        message: 'Уровень важности должен быть от 1 до 3'
      });
    }
    
    const events = eventsService.getEventsByImportance(level, limit);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 