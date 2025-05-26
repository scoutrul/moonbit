const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/EventsController');
const { validate } = require('../utils/middlewares');
const { schemas } = require('../utils/validators');

/**
 * @route GET /api/events/recent
 * @desc Получает последние события, связанные с биткоином
 * @access Public
 * @query {number} limit - Количество событий для получения
 */
router.get('/recent', validate(schemas.eventsRequest), eventsController.getRecentEvents);

/**
 * @route GET /api/events/period
 * @desc Получает события за указанный период
 * @access Public
 * @query {string} startDate - Начальная дата в формате YYYY-MM-DD
 * @query {string} endDate - Конечная дата в формате YYYY-MM-DD
 */
router.get('/period', eventsController.getEventsByPeriod);

/**
 * @route GET /api/events/importance/:level
 * @desc Получает события по уровню важности
 * @access Public
 * @param {number} level - Уровень важности (1-3)
 * @query {number} limit - Количество событий для получения
 */
router.get('/importance/:level', eventsController.getEventsByImportance);

module.exports = router; 