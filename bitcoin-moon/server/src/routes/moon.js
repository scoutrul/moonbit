const express = require('express');
const router = express.Router();
const moonController = require('../controllers/MoonController');
const { validate } = require('../utils/middlewares');
const { schemas } = require('../utils/validators');

/**
 * @route GET /api/moon/current
 * @desc Получает текущую фазу луны
 * @access Public
 */
router.get('/current', moonController.getCurrentPhase);

/**
 * @route GET /api/moon/period
 * @desc Получает фазы луны за период
 * @access Public
 * @query {string} startDate - Начальная дата в формате ISO
 * @query {string} endDate - Конечная дата в формате ISO
 */
router.get('/period', validate(schemas.moonPeriodRequest), moonController.getPhasesForPeriod);

/**
 * @route GET /api/moon/next
 * @desc Получает следующие значимые фазы луны
 * @access Public
 * @query {number} count - Количество фаз для получения
 */
router.get('/next', validate(schemas.moonNextRequest), moonController.getNextSignificantPhases);

module.exports = router; 