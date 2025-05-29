import express from 'express';
import astroController from '../controllers/AstroController.js';

const router = express.Router();

/**
 * @route GET /api/astro/data
 * @desc Получение текущих астрологических данных
 * @access Public
 */
router.get('/data', astroController.getCurrentAstroData);

/**
 * @route GET /api/astro/retrograde
 * @desc Получение данных о ретроградных планетах
 * @access Public
 */
router.get('/retrograde', astroController.getRetrogradePlanets);

/**
 * @route GET /api/astro/aspects
 * @desc Получение данных о планетарных аспектах
 * @access Public
 */
router.get('/aspects', astroController.getPlanetaryAspects);

/**
 * @route GET /api/astro/influence
 * @desc Получение анализа астрологического влияния
 * @access Public
 */
router.get('/influence', astroController.getAstroInfluence);

/**
 * @route GET /api/astro/events
 * @desc Получение астрономических событий на период
 * @access Public
 */
router.get('/events', astroController.getAstroEvents);

/**
 * @route GET /api/astro/moon-phase
 * @desc Получение текущей фазы луны
 * @access Public
 */
router.get('/moon-phase', astroController.getCurrentMoonPhase);

/**
 * @route GET /api/astro/eclipses/solar
 * @desc Получает предстоящие солнечные затмения
 * @access Public
 * @query {string} startDate - Начальная дата (если не указана, используется текущая)
 * @query {string} endDate - Конечная дата (если не указана, используется +10 лет от startDate)
 */
router.get('/eclipses/solar', astroController.getSolarEclipses);

/**
 * @route GET /api/astro/eclipses/lunar
 * @desc Получает предстоящие лунные затмения
 * @access Public
 * @query {string} startDate - Начальная дата (если не указана, используется текущая)
 * @query {string} endDate - Конечная дата (если не указана, используется +10 лет от startDate)
 */
router.get('/eclipses/lunar', astroController.getLunarEclipses);

/**
 * @route GET /api/astro/eclipses
 * @desc Получает все предстоящие затмения (солнечные и лунные)
 * @access Public
 * @query {string} startDate - Начальная дата (если не указана, используется текущая)
 * @query {string} endDate - Конечная дата (если не указана, используется +10 лет от startDate)
 */
router.get('/eclipses', astroController.getAllEclipses);

export default router;
