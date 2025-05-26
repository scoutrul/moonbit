const express = require('express');
const router = express.Router();
const astroController = require('../controllers/AstroController');

/**
 * @route GET /api/astro/current
 * @desc Получает текущие астрологические данные
 * @access Public
 */
router.get('/current', astroController.getCurrentAstroData);

/**
 * @route GET /api/astro/retrograde
 * @desc Получает информацию о ретроградных планетах
 * @access Public
 * @query {string} date - Дата в формате YYYY-MM-DD
 */
router.get('/retrograde', astroController.getRetrogradePlanets);

/**
 * @route GET /api/astro/aspects
 * @desc Получает информацию о планетарных аспектах
 * @access Public
 * @query {string} date - Дата в формате YYYY-MM-DD
 */
router.get('/aspects', astroController.getPlanetaryAspects);

module.exports = router; 