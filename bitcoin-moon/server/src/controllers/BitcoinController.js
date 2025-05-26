const bitcoinService = require('../services/BitcoinService');
const logger = require('../utils/logger');
const { validateResponse, schemas } = require('../utils/validators');

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
  async getCurrentPrice(req, res, next) {
    try {
      const { currency } = req.query;
      
      const priceData = bitcoinService.getCurrentPrice(currency);
      
      // Валидируем ответ
      const validatedData = validateResponse(schemas.bitcoinCurrentPriceResponse, priceData);
      
      res.json(validatedData);
    } catch (error) {
      logger.error('Ошибка при получении текущей цены биткоина', { error: error.message });
      next(error);
    }
  }

  /**
   * Получает историю цен биткоина
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  async getHistoricalData(req, res, next) {
    try {
      const { currency, days } = req.query;
      
      const historicalData = bitcoinService.getHistoricalData(currency, days);
      
      res.json({
        currency,
        days,
        data: historicalData
      });
    } catch (error) {
      logger.error('Ошибка при получении исторических данных биткоина', { error: error.message });
      next(error);
    }
  }
}

// Экспортируем синглтон
module.exports = new BitcoinController(); 