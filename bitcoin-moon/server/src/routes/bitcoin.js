const express = require('express');
const router = express.Router();
const bitcoinService = require('../services/BitcoinService');
const logger = require('../utils/logger');

/**
 * @route GET /api/bitcoin/price
 * @desc Получить текущую цену Bitcoin
 * @access Public
 */
router.get('/price', async (req, res) => {
  try {
    const priceData = await bitcoinService.getCurrentPrice();
    res.json(priceData);
  } catch (error) {
    logger.error(`Ошибка при получении цены Bitcoin: ${error.message}`);
    res.status(500).json({
      error: 'Server Error',
      message: 'Не удалось получить данные о цене Bitcoin'
    });
  }
});

/**
 * @route GET /api/bitcoin/candles
 * @desc Получить данные для свечного графика
 * @access Public
 */
router.get('/candles', async (req, res) => {
  try {
    const { timeframe } = req.query;
    
    // Проверяем валидность timeframe
    if (timeframe && !['1h', '4h', '1d', '1w'].includes(timeframe)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Неверный временной интервал: ${timeframe}. Допустимые значения: 1h, 4h, 1d, 1w`
      });
    }
    
    const candleData = await bitcoinService.getCandlestickData(timeframe || '1d');
    res.json(candleData);
  } catch (error) {
    logger.error(`Ошибка при получении данных для свечного графика: ${error.message}`);
    res.status(500).json({
      error: 'Server Error',
      message: 'Не удалось получить данные для свечного графика'
    });
  }
});

module.exports = router; 