const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../utils/config');

/**
 * Сервис для работы с данными о биткоине
 * Получает данные из CoinGecko API и кэширует их
 */
class BitcoinService {
  constructor() {
    this.cacheDir = config.paths.cache;
    this.priceCacheFile = path.join(this.cacheDir, 'bitcoin_price.json');
    this.historicalCacheFile = path.join(this.cacheDir, 'bitcoin_historical.json');
    this.apiUrl = 'https://api.coingecko.com/api/v3';
    this.apiKey = config.api.coingecko;
    
    // Проверяем/создаем директорию для кэша
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    
    // Инициализируем кэши
    this.priceCache = this.loadCache(this.priceCacheFile, {
      usd: { price: 0, last_updated: null, change_24h: 0, change_percentage_24h: 0 },
      eur: { price: 0, last_updated: null, change_24h: 0, change_percentage_24h: 0 },
      rub: { price: 0, last_updated: null, change_24h: 0, change_percentage_24h: 0 }
    });
    
    this.historicalCache = this.loadCache(this.historicalCacheFile, {
      usd: { data: [], last_updated: null },
      eur: { data: [], last_updated: null },
      rub: { data: [], last_updated: null }
    });
  }
  
  /**
   * Загружает кэш из файла или возвращает значение по умолчанию
   * @param {string} filePath - Путь к файлу с кэшем
   * @param {Object} defaultValue - Значение по умолчанию
   * @returns {Object} Загруженные данные или значение по умолчанию
   */
  loadCache(filePath, defaultValue) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error(`Ошибка при загрузке кэша из ${filePath}`, { error });
    }
    
    return defaultValue;
  }
  
  /**
   * Сохраняет данные в кэш
   * @param {string} filePath - Путь к файлу кэша
   * @param {Object} data - Данные для сохранения
   */
  saveCache(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      logger.error(`Ошибка при сохранении кэша в ${filePath}`, { error });
    }
  }
  
  /**
   * Обновляет данные о текущей цене биткоина
   * @returns {Promise<Object>} Обновленные данные о цене
   */
  async updatePriceData() {
    try {
      logger.debug('Запрос текущей цены биткоина из CoinGecko API');
      
      const params = {
        ids: 'bitcoin',
        vs_currencies: 'usd,eur,rub',
        include_24hr_change: true,
        include_last_updated_at: true
      };
      
      // Добавляем API ключ, если он есть
      if (this.apiKey) {
        params.x_cg_pro_api_key = this.apiKey;
      }
      
      const response = await axios.get(`${this.apiUrl}/simple/price`, { params });
      
      if (response.data && response.data.bitcoin) {
        const btcData = response.data.bitcoin;
        
        // Обновляем данные по каждой валюте
        for (const currency of ['usd', 'eur', 'rub']) {
          if (btcData[currency]) {
            this.priceCache[currency] = {
              price: btcData[currency],
              last_updated: new Date().toISOString(),
              change_24h: btcData[`${currency}_24h_change`] || 0,
              change_percentage_24h: btcData[`${currency}_24h_change`] || 0
            };
          }
        }
        
        // Сохраняем обновленный кэш
        this.saveCache(this.priceCacheFile, this.priceCache);
        
        logger.info('Цены биткоина успешно обновлены');
        return this.priceCache;
      } else {
        throw new Error('Некорректный ответ от CoinGecko API');
      }
    } catch (error) {
      logger.error('Ошибка при обновлении цены биткоина', { error });
      
      // Если произошла ошибка, возвращаем кэшированные данные
      return this.priceCache;
    }
  }
  
  /**
   * Обновляет исторические данные о цене биткоина
   * @param {number} days - Количество дней для получения данных
   * @returns {Promise<Object>} Обновленные исторические данные
   */
  async updateHistoricalData(days = 365) {
    try {
      logger.debug(`Запрос исторических данных биткоина за ${days} дней из CoinGecko API`);
      
      const params = {
        vs_currency: 'usd', // Основная валюта
        days: days,
        interval: 'daily'
      };
      
      // Добавляем API ключ, если он есть
      if (this.apiKey) {
        params.x_cg_pro_api_key = this.apiKey;
      }
      
      const response = await axios.get(`${this.apiUrl}/coins/bitcoin/market_chart`, { params });
      
      if (response.data && response.data.prices) {
        // Обработка и форматирование данных для USD
        const formattedData = response.data.prices.map(([timestamp, price]) => ({
          date: new Date(timestamp).toISOString().split('T')[0],
          price: price
        }));
        
        this.historicalCache.usd = {
          data: formattedData,
          last_updated: new Date().toISOString()
        };
        
        // Для EUR и RUB можно сделать отдельные запросы при необходимости
        // или пересчитать из USD по текущему курсу
        
        // Сохраняем обновленный кэш
        this.saveCache(this.historicalCacheFile, this.historicalCache);
        
        logger.info(`Исторические данные биткоина за ${days} дней успешно обновлены`);
        return this.historicalCache;
      } else {
        throw new Error('Некорректный ответ от CoinGecko API');
      }
    } catch (error) {
      logger.error('Ошибка при обновлении исторических данных биткоина', { error });
      
      // Если произошла ошибка, возвращаем кэшированные данные
      return this.historicalCache;
    }
  }
  
  /**
   * Получает текущую цену биткоина
   * @param {string} currency - Валюта (usd, eur, rub)
   * @returns {Object} Данные о текущей цене биткоина
   */
  getCurrentPrice(currency = 'usd') {
    if (!['usd', 'eur', 'rub'].includes(currency)) {
      currency = 'usd';
    }
    
    const cacheData = this.priceCache[currency];
    
    // Если данные устарели (более 15 минут), запускаем обновление
    const cacheAge = cacheData.last_updated
      ? (new Date() - new Date(cacheData.last_updated)) / 1000 / 60
      : 9999;
      
    if (cacheAge > 15) {
      logger.debug(`Кэш цены биткоина устарел (${Math.round(cacheAge)} мин), запуск обновления`);
      this.updatePriceData().catch(error => {
        logger.error('Ошибка при фоновом обновлении цены биткоина', { error });
      });
    }
    
    return {
      price: cacheData.price,
      currency: currency,
      last_updated: cacheData.last_updated,
      change_24h: cacheData.change_24h,
      change_percentage_24h: cacheData.change_percentage_24h
    };
  }
  
  /**
   * Получает исторические данные о цене биткоина
   * @param {string} currency - Валюта (usd, eur, rub)
   * @param {number} days - Количество дней для получения данных
   * @returns {Array} Исторические данные о цене
   */
  getHistoricalData(currency = 'usd', days = 30) {
    if (!['usd', 'eur', 'rub'].includes(currency)) {
      currency = 'usd';
    }
    
    if (days > 365) days = 365;
    if (days < 1) days = 1;
    
    const cacheData = this.historicalCache[currency];
    
    // Если данных нет или они устарели (более 6 часов), запускаем обновление
    const cacheAge = cacheData.last_updated
      ? (new Date() - new Date(cacheData.last_updated)) / 1000 / 60 / 60
      : 9999;
      
    if (!cacheData.data.length || cacheAge > 6) {
      logger.debug(`Кэш исторических данных биткоина устарел (${Math.round(cacheAge)} ч), запуск обновления`);
      this.updateHistoricalData(365).catch(error => {
        logger.error('Ошибка при фоновом обновлении исторических данных биткоина', { error });
      });
    }
    
    // Возвращаем данные за запрошенное количество дней
    return cacheData.data.slice(-days);
  }
}

// Синглтон экземпляр сервиса
module.exports = new BitcoinService(); 