const fetch = require('node-fetch');
const logger = require('../utils/logger');

/**
 * Сервис для работы с данными о Bitcoin
 */
class BitcoinService {
  constructor() {
    // Кэш для хранения данных
    this.priceCache = null;
    this.candleCache = {};
    
    // Время последнего обновления кэша
    this.lastUpdate = {
      price: null,
      candles: {}
    };
    
    // Время жизни кэша в миллисекундах
    this.cacheTTL = {
      price: 60 * 1000, // 1 минута для текущей цены
      candles: 15 * 60 * 1000 // 15 минут для свечей
    };
  }

  /**
   * Проверяет необходимость обновления кэша
   * @param {string} cacheType - Тип кэша ('price' или 'candles')
   * @param {string} [timeframe] - Временной интервал для свечей
   * @returns {boolean} - Нужно ли обновлять кэш
   */
  shouldUpdateCache(cacheType, timeframe) {
    if (cacheType === 'candles' && timeframe) {
      return !this.lastUpdate.candles[timeframe] || 
             (Date.now() - this.lastUpdate.candles[timeframe]) > this.cacheTTL.candles;
    }
    
    return !this.lastUpdate[cacheType] || 
           (Date.now() - this.lastUpdate[cacheType]) > this.cacheTTL[cacheType];
  }

  /**
   * Получает текущую цену Bitcoin
   * @returns {Promise<Object>} - Объект с текущей ценой и изменением за 24 часа
   */
  async getCurrentPrice() {
    try {
      // Проверяем необходимость обновления кэша
      if (this.shouldUpdateCache('price')) {
        logger.debug('Обновление данных о текущей цене Bitcoin');
        
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
        );
        const data = await response.json();
        
        this.priceCache = {
          price: data.bitcoin.usd,
          change24h: data.bitcoin.usd_24h_change
        };
        
        this.lastUpdate.price = Date.now();
        logger.debug(`Получены данные о цене: ${JSON.stringify(this.priceCache)}`);
      } else {
        logger.debug('Использование кэшированных данных о цене Bitcoin');
      }
      
      return this.priceCache;
    } catch (error) {
      logger.error(`Ошибка при получении цены Bitcoin: ${error.message}`);
      throw error;
    }
  }

  /**
   * Получает данные для построения свечного графика
   * @param {string} timeframe - Временной интервал ('1h', '4h', '1d', '1w')
   * @returns {Promise<Array>} - Массив данных для свечного графика
   */
  async getCandlestickData(timeframe = '1d') {
    try {
      // Проверяем валидность timeframe
      const validTimeframes = ['1h', '4h', '1d', '1w'];
      if (!validTimeframes.includes(timeframe)) {
        throw new Error(`Неверный временной интервал: ${timeframe}`);
      }
      
      // Проверяем необходимость обновления кэша
      if (this.shouldUpdateCache('candles', timeframe)) {
        logger.debug(`Обновление данных свечного графика для интервала ${timeframe}`);
        
        // Преобразуем timeframe в формат для API
        const daysToFetch = {
          '1h': 1,
          '4h': 7,
          '1d': 30,
          '1w': 180
        };
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${daysToFetch[timeframe]}`
        );
        const data = await response.json();
        
        // Преобразуем данные в формат для графика
        const candleData = data.map(candle => ({
          time: candle[0] / 1000, // Конвертируем из миллисекунд в секунды
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4]
        }));
        
        this.candleCache[timeframe] = candleData;
        this.lastUpdate.candles[timeframe] = Date.now();
        logger.debug(`Получены данные для свечного графика (${timeframe}): ${candleData.length} свечей`);
      } else {
        logger.debug(`Использование кэшированных данных для свечного графика (${timeframe})`);
      }
      
      return this.candleCache[timeframe];
    } catch (error) {
      logger.error(`Ошибка при получении данных свечного графика: ${error.message}`);
      throw error;
    }
  }
}

// Экспортируем синглтон
module.exports = new BitcoinService(); 