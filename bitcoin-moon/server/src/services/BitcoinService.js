const fetch = require('node-fetch');
const logger = require('../utils/logger');

/**
 * Сервис для работы с данными о Bitcoin
 */
class BitcoinService {
  constructor() {
    // Кэш для хранения данных
    this.priceCache = null;
    
    // Время последнего обновления кэша
    this.lastUpdate = {
      price: null
    };
    
    // Время жизни кэша в миллисекундах
    this.cacheTTL = {
      price: 60 * 1000 // 1 минута
    };
  }

  /**
   * Проверяет необходимость обновления кэша
   * @param {string} cacheType - Тип кэша ('price')
   * @returns {boolean} - Нужно ли обновлять кэш
   */
  shouldUpdateCache(cacheType) {
    return !this.lastUpdate[cacheType] || 
           (Date.now() - this.lastUpdate[cacheType]) > this.cacheTTL[cacheType];
  }

  /**
   * Получает текущую цену Bitcoin
   * @returns {Promise<Object>} - Объект с текущей ценой и изменением за 24 часа
   */
  async getCurrentPrice() {
    try {
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
    // Заглушка для теста
    return [
      { time: 1617235200, open: 58000, high: 59000, low: 57500, close: 58800 },
      { time: 1617321600, open: 58800, high: 60000, low: 58500, close: 59500 }
    ];
  }
}

// Экспортируем синглтон
module.exports = new BitcoinService(); 