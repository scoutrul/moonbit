const express = require('express');
const router = express.Router();
const bitcoinController = require('../controllers/BitcoinController');
const { validate } = require('../utils/middlewares');
const { schemas } = require('../utils/validators');

/**
 * @route GET /api/bitcoin/current
 * @desc Получает текущую цену биткоина
 * @access Public
 * @query {string} currency - Валюта (usd, eur, rub)
 */
router.get('/current', validate(schemas.bitcoinPriceRequest), bitcoinController.getCurrentPrice);

/**
 * @route GET /api/bitcoin/history
 * @desc Получает историю цен биткоина
 * @access Public
 * @query {string} currency - Валюта (usd, eur, rub)
 * @query {number} days - Количество дней
 */
router.get('/history', validate(schemas.bitcoinPriceRequest), bitcoinController.getHistoricalData);

module.exports = router;
