const express = require('express');
const bitcoinService = require('../services/BitcoinService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/bitcoin/price
 * @desc Получение текущей цены биткоина
 */
router.get('/price', async (req, res) => {
  try {
    const priceData = await bitcoinService.getCurrentPrice();
    res.json(priceData);
  } catch (error) {
    logger.error('Ошибка при получении цены биткоина:', error);
    res.status(500).json({ 
      error: 'Не удалось получить данные о цене биткоина',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/bitcoin/candles
 * @desc Получение данных о свечах биткоина
 * @param {string} timeframe - Временной интервал ('1h', '1d', '1w')
 */
router.get('/candles', async (req, res) => {
  try {
    const { timeframe = '1d' } = req.query;
    
    // Проверка валидности параметра timeframe
    if (!['1h', '1d', '1w'].includes(timeframe)) {
      return res.status(400).json({ 
        error: 'Неверный параметр timeframe',
        message: 'Допустимые значения: 1h, 1d, 1w' 
      });
    }
    
    const candleData = await bitcoinService.getCandlestickData(timeframe);
    res.json(candleData);
  } catch (error) {
    logger.error('Ошибка при получении данных о свечах биткоина:', error);
    res.status(500).json({ 
      error: 'Не удалось получить данные о свечах биткоина',
      message: error.message 
    });
  }
});

module.exports = router; 