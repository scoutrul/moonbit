import bitcoinService from '../services/BitcoinService.js';
import logger from '../utils/logger.js';
import { validateResponse, schemas } from '../utils/validators.js';

/**
 * Контроллер для работы с данными о биткоине
 */
class BitcoinController {
  /**
   * Получает текущую цену биткоина
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  getCurrentPrice(req, res, next) {
    try {
      const { currency = 'usd' } = req.query;

      const priceData = bitcoinService.getCurrentPrice(currency);
      
      // Валидируем ответ
      const validatedData = validateResponse(schemas.bitcoinCurrentPriceResponse, priceData);
      
      res.json(validatedData);
    } catch (error) {
      logger.error('Ошибка при получении текущей цены биткоина', {
        error: error.message,
        currency: req.query.currency,
      });
      next(error);
    }
  }

  /**
   * Получает исторические данные о цене биткоина
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  getHistoricalData(req, res, next) {
    try {
      const { currency = 'usd', days = 30 } = req.query;

      const historicalData = bitcoinService.getHistoricalData(currency, parseInt(days));
      res.json(historicalData);
    } catch (error) {
      logger.error('Ошибка при получении исторических данных биткоина', {
        error: error.message,
        currency: req.query.currency,
        days: req.query.days,
      });
      next(error);
    }
  }

  /**
   * Получает анализ тренда цены биткоина
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  getPriceTrend(req, res, next) {
    try {
      const { currency = 'usd', days = 30 } = req.query;

      const trendData = bitcoinService.analyzePriceTrend(currency, parseInt(days));
      res.json(trendData);
    } catch (error) {
      logger.error('Ошибка при получении анализа тренда биткоина', {
        error: error.message,
        currency: req.query.currency,
        days: req.query.days,
      });
      next(error);
    }
  }

  /**
   * Получает анализ волатильности цены биткоина
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  getVolatility(req, res, next) {
    try {
      const { currency = 'usd', days = 30 } = req.query;

      const volatilityData = bitcoinService.analyzeVolatility(currency, parseInt(days));
      res.json(volatilityData);
    } catch (error) {
      logger.error('Ошибка при получении анализа волатильности биткоина', {
        error: error.message,
        currency: req.query.currency,
        days: req.query.days,
      });
      next(error);
    }
  }
}

const bitcoinController = new BitcoinController();
export default bitcoinController;
