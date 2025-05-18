const express = require('express');
const router = express.Router();
const BitcoinService = require('../services/BitcoinService');

router.get('/price', async (req, res) => {
  try {
    const priceData = await BitcoinService.getCurrentPrice();
    res.json(priceData);
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Ошибка при получении цены биткоина' 
    });
  }
});

router.get('/candles', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '1d';
    const validTimeframes = ['1h', '4h', '1d', '1w'];
    
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ 
        error: true, 
        message: 'Неверный временной интервал' 
      });
    }
    
    const candleData = await BitcoinService.getCandlestickData(timeframe);
    res.json(candleData);
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: 'Ошибка при получении данных свечного графика' 
    });
  }
});

module.exports = router;
