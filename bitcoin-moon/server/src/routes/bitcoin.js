const express = require('express');
const router = express.Router();
const bitcoinService = require('../services/BitcoinService');
const logger = require('../utils/logger');
const { validate } = require('../utils/middlewares');
const { validateResponse } = require('../utils/validators');
const { schemas } = require('../utils/validators');

/**
 * @route GET /api/bitcoin/current
 * @desc Получает текущую цену биткоина
 * @access Public
 * @query {string} currency - Валюта (usd, eur, rub)
 */
router.get('/current', validate(schemas.bitcoinPriceRequest), async (req, res, next) => {
  try {
    const { currency } = req.query;
    
    const priceData = bitcoinService.getCurrentPrice(currency);
    
    // Валидируем ответ
    const validatedData = validateResponse(schemas.bitcoinCurrentPriceResponse, priceData);
    
    res.json(validatedData);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/bitcoin/history
 * @desc Получает историю цен биткоина
 * @access Public
 * @query {string} currency - Валюта (usd, eur, rub)
 * @query {number} days - Количество дней
 */
router.get('/history', validate(schemas.bitcoinPriceRequest), async (req, res, next) => {
  try {
    const { currency, days } = req.query;
    
    const historicalData = bitcoinService.getHistoricalData(currency, days);
    
    res.json({
      currency,
      days,
      data: historicalData
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
