import express from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types/types';
import { BitcoinController } from '../controllers/BitcoinController';

const router = express.Router();
const bitcoinController = container.get<BitcoinController>(TYPES.BitcoinController);

/**
 * @route GET /api/bitcoin
 * @description Информация о Bitcoin API endpoints
 * @access Public
 */
router.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    service: 'Bitcoin API',
    version: '1.0.0',
    description: 'API для получения данных о биткоине',
    endpoints: {
      '/price': 'Текущая цена биткоина',
      '/current': 'Текущая цена биткоина (алиас)',
      '/history': 'Исторические данные (параметры: days, currency)',
      '/analysis': 'Анализ цены биткоина',
      '/candles': 'Данные свечей с Bybit (параметры: timeframe, limit)'
    },
    examples: {
      current_price: '/api/bitcoin/price',
      history_30_days: '/api/bitcoin/history?days=30&currency=usd',
      price_analysis: '/api/bitcoin/analysis',
      daily_candles: '/api/bitcoin/candles?timeframe=1d&limit=100'
    }
  });
});

/**
 * @route GET /api/bitcoin/price
 * @description Получение текущей цены биткоина
 * @access Public
 */
router.get('/price', bitcoinController.getCurrentPrice.bind(bitcoinController));

/**
 * @route GET /api/bitcoin/current
 * @description Получение текущей цены биткоина (алиас для /price)
 * @access Public
 */
router.get('/current', bitcoinController.getCurrentPrice.bind(bitcoinController));

/**
 * @route GET /api/bitcoin/history
 * @description Получение исторических данных о цене биткоина
 * @param {string} days - Количество дней для исторических данных (опционально, по умолчанию 30)
 * @param {string} currency - Валюта для данных (опционально, по умолчанию usd)
 * @access Public
 */
router.get('/history', bitcoinController.getHistoricalData.bind(bitcoinController));

/**
 * @route GET /api/bitcoin/analysis
 * @description Получение анализа цены биткоина
 * @access Public
 */
router.get('/analysis', bitcoinController.getPriceAnalysis.bind(bitcoinController));

/**
 * @route GET /api/bitcoin/candles
 * @description Получение данных свечей с Bybit
 * @param {string} timeframe - Временной интервал (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w) (опционально, по умолчанию 1d)
 * @param {string} limit - Количество свечей (опционально, по умолчанию 200)
 * @access Public
 */
router.get('/candles', bitcoinController.getBybitCandles.bind(bitcoinController));

export default router; 