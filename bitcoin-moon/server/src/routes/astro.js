import express from 'express';
import astroController from '../controllers/AstroController.js';

const router = express.Router();

/**
 * @route GET /api/astro/current
 * @desc Получает текущие астрологические данные
 * @access Public
 */
router.get('/current', astroController.getCurrentAstroData);

/**
 * @route GET /api/astro/retrograde
 * @desc Получает данные о ретроградных планетах
 * @access Public
 * @query {string} date - Дата (если не указана, используется текущая)
 */
router.get('/retrograde', astroController.getRetrogradePlanets);

/**
 * @route GET /api/astro/aspects
 * @desc Получает данные о планетарных аспектах
 * @access Public
 * @query {string} date - Дата (если не указана, используется текущая)
 */
router.get('/aspects', astroController.getPlanetaryAspects);

/**
 * @route GET /api/astro/influence
 * @desc Получает анализ влияния астрологических факторов на рынок биткоина
 * @access Public
 */
router.get('/influence', astroController.getAstroInfluence);

export default router;
