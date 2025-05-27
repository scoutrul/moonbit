import express from 'express';
import bitcoinController from '../controllers/BitcoinController.js';
import { validate } from '../utils/middlewares.js';
import { schemas } from '../utils/validators.js';

const router = express.Router();

/**
 * @route GET /api/bitcoin/current
 * @desc Получает текущую цену биткоина
 * @access Public
 * @query {string} currency - Валюта (usd, eur, rub)
 */
router.get('/current', validate(schemas.bitcoinPriceRequest), bitcoinController.getCurrentPrice);

/**
 * @route GET /api/bitcoin/historical
 * @desc Получает исторические данные о цене биткоина
 * @access Public
 * @query {string} currency - Валюта (usd, eur, rub)
 * @query {number} days - Количество дней для отображения (макс. 365)
 */
router.get('/historical', validate(schemas.bitcoinPriceRequest), bitcoinController.getHistoricalData);

/**
 * @route GET /api/bitcoin/trend
 * @desc Получает анализ тренда цены биткоина
 * @access Public
 * @query {string} currency - Валюта (usd, eur, rub)
 * @query {number} days - Количество дней для анализа
 */
router.get('/trend', validate(schemas.bitcoinPriceRequest), bitcoinController.getPriceTrend);

/**
 * @route GET /api/bitcoin/volatility
 * @desc Получает анализ волатильности цены биткоина
 * @access Public
 * @query {string} currency - Валюта (usd, eur, rub)
 * @query {number} days - Количество дней для анализа
 */
router.get('/volatility', validate(schemas.bitcoinPriceRequest), bitcoinController.getVolatility);

export default router;
