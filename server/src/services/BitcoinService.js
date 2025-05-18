const fetch = require('node-fetch');
const logger = require('../utils/logger');

/**
 * Сервис для работы с данными о биткоине
 */
class BitcoinService {
  constructor() {
    // Кэш для данных
    this.priceCache = null;
    this.candlestickCache = {
      '1h': [],
      '1d': [],
      '1w': []
    };
    this.lastUpdate = {
      price: null,
      candlestick: {
        '1h': null,
        '1d': null,
        '1w': null
      }
    };
  }

  /**
   * Получение текущей цены биткоина
   */
  async getCurrentPrice() {
    if (this.shouldUpdateCache('price')) {
      await this.updateCurrentPrice();
    }
    return this.priceCache;
  }

  /**
   * Обновление данных о текущей цене
   */
  async updateCurrentPrice() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
      const data = await response.json();
      
      if (data.bitcoin) {
        this.priceCache = {
          price: data.bitcoin.usd,
          change24h: data.bitcoin.usd_24h_change
        };
        this.lastUpdate.price = Date.now();
        logger.debug('Обновлена текущая цена биткоина');
        return this.priceCache;
      } else {
        throw new Error('Некорректный ответ от API');
      }
    } catch (error) {
      logger.error('Ошибка при обновлении цены биткоина:', error);
      throw error;
    }
  }

  /**
   * Получение данных о свечах биткоина
   * @param {string} timeframe - Временной интервал ('1h', '1d', '1w')
   */
  async getCandlestickData(timeframe = '1d') {
    if (this.shouldUpdateCandlestick(timeframe)) {
      await this.updateCandlestickData(timeframe);
    }
    return this.candlestickCache[timeframe];
  }

  /**
   * Обновление данных о свечах
   * @param {string} timeframe - Временной интервал ('1h', '1d', '1w')
   */
  async updateCandlestickData(timeframe = '1d') {
    try {
      const days = timeframe === '1h' ? 1 : timeframe === '1d' ? 30 : 90;
      const interval = timeframe === '1h' ? 'hourly' : timeframe === '1d' ? 'daily' : 'weekly';
      
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${days}`);
      const data = await response.json();
      
      const formattedData = data.map(item => ({
        time: Math.floor(item[0] / 1000), // Преобразование миллисекунд в секунды для графика
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4]
      }));
      
      this.candlestickCache[timeframe] = formattedData;
      this.lastUpdate.candlestick[timeframe] = Date.now();
      
      logger.debug(`Обновлены данные о свечах биткоина (${timeframe})`);
      return formattedData;
    } catch (error) {
      logger.error(`Ошибка при обновлении данных о свечах биткоина (${timeframe}):`, error);
      throw error;
    }
  }

  /**
   * Проверяет, нужно ли обновить кэш цены
   */
  shouldUpdateCache(type) {
    if (!this.lastUpdate[type]) return true;
    
    // Обновляем данные о цене, если прошло больше минуты
    const minutesPassed = (Date.now() - this.lastUpdate[type]) / (1000 * 60);
    return minutesPassed >= 1;
  }

  /**
   * Проверяет, нужно ли обновить кэш свечей
   */
  shouldUpdateCandlestick(timeframe) {
    if (!this.lastUpdate.candlestick[timeframe]) return true;
    
    // Обновляем данные о свечах с разной частотой в зависимости от временного интервала
    const minutesPassed = (Date.now() - this.lastUpdate.candlestick[timeframe]) / (1000 * 60);
    
    if (timeframe === '1h') return minutesPassed >= 10; // Каждые 10 минут для часовых свечей
    if (timeframe === '1d') return minutesPassed >= 60; // Каждый час для дневных свечей
    if (timeframe === '1w') return minutesPassed >= 360; // Каждые 6 часов для недельных свечей
    
    return true;
  }
}

// Создаем синглтон
const bitcoinService = new BitcoinService();

module.exports = bitcoinService; 