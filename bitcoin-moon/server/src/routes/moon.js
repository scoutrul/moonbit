import express from 'express';
import moonController from '../controllers/MoonController.js';
import { validate } from '../utils/middlewares.js';
import { schemas } from '../utils/validators.js';

const router = express.Router();

/**
 * @route GET /api/moon/current
 * @desc Получает текущую фазу луны
 * @access Public
 */
router.get('/current', moonController.getCurrentPhase);

/**
 * @route GET /api/moon/period
 * @desc Получает фазы луны за указанный период
 * @access Public
 * @query {string} startDate - Начальная дата в формате YYYY-MM-DD
 * @query {string} endDate - Конечная дата в формате YYYY-MM-DD
 */
router.get('/period', validate(schemas.moonPeriodRequest), moonController.getPhasesForPeriod);

/**
 * @route GET /api/moon/next
 * @desc Получает следующие значимые фазы луны (новолуние и полнолуние)
 * @access Public
 * @query {number} count - Количество фаз для получения (по умолчанию 4)
 */
router.get('/next', validate(schemas.moonNextRequest), moonController.getNextSignificantPhases);

/**
 * @route GET /api/moon/influence
 * @desc Получает анализ влияния фаз луны на рынок биткоина
 * @access Public
 */
router.get('/influence', moonController.getMoonInfluence);

export default router;
