const express = require('express');
const router = express.Router();
const astroService = require('../services/AstroService');
const logger = require('../utils/logger');

/**
 * @route GET /api/astro/current
 * @desc Получает текущие астрологические данные
 * @access Public
 */
router.get('/current', async (req, res, next) => {
  try {
    const astroData = astroService.getCurrentAstroData();
    res.json(astroData);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/astro/retrograde
 * @desc Получает информацию о ретроградных планетах
 * @access Public
 * @query {string} date - Дата в формате YYYY-MM-DD
 */
router.get('/retrograde', async (req, res, next) => {
  try {
    const { date } = req.query;
    const retrogradeData = astroService.getRetrogradePlanets(date);
    res.json(retrogradeData);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/astro/aspects
 * @desc Получает информацию о планетарных аспектах
 * @access Public
 * @query {string} date - Дата в формате YYYY-MM-DD
 */
router.get('/aspects', async (req, res, next) => {
  try {
    const { date } = req.query;
    const aspectsData = astroService.getPlanetaryAspects(date);
    res.json(aspectsData);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 