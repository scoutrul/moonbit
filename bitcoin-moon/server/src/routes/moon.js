const express = require('express');
const router = express.Router();
const moonService = require('../services/MoonService');
const logger = require('../utils/logger');
const { validate } = require('../utils/middlewares');
const { validateResponse } = require('../utils/validators');
const { schemas } = require('../utils/validators');

/**
 * @route GET /api/moon/current
 * @desc Получает текущую фазу луны
 * @access Public
 */
router.get('/current', async (req, res, next) => {
  try {
    const phase = moonService.getCurrentPhase();
    
    // Валидируем ответ
    const validatedPhase = validateResponse(schemas.moonPhaseResponse, phase);
    
    res.json(validatedPhase);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/moon/period
 * @desc Получает фазы луны за период
 * @access Public
 * @query {string} startDate - Начальная дата в формате ISO
 * @query {string} endDate - Конечная дата в формате ISO
 */
router.get('/period', validate(schemas.moonPeriodRequest), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const phases = moonService.getPhasesForPeriod(startDate, endDate);
    res.json(phases);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/moon/next
 * @desc Получает следующие значимые фазы луны
 * @access Public
 * @query {number} count - Количество фаз для получения
 */
router.get('/next', validate(schemas.moonNextRequest), async (req, res, next) => {
  try {
    const { count } = req.query;
    const phases = moonService.getNextSignificantPhases(count);
    
    // Валидируем каждую фазу в ответе
    const validatedPhases = phases.map(phase => 
      validateResponse(schemas.significantMoonPhaseResponse, phase)
    );
    
    res.json(validatedPhases);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 