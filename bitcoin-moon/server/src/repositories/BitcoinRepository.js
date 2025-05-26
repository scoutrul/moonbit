const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');
const BaseRepository = require('./BaseRepository');

const USE_MOCK = process.env.USE_MOCK_DATA === 'true' || !config.api.coingecko.key;

/**
 * Репозиторий для работы с данными о биткоине
 * Отвечает за получение данных из внешних источников и кэширование
 */
class BitcoinRepository extends BaseRepository {
  constructor() {
    super(config.cache.bitcoin.dataFile);
    this.priceCacheFile = config.cache.bitcoin.priceFile;
    this.historicalCacheFile = config.cache.bitcoin.historicalFile;
    this.apiUrl = config.api.coingecko.baseUrl;
    this.apiKey = config.api.coingecko.key;

    this.priceCache = this.loadPriceCache();
    this.historicalCache = this.loadHistoricalCache();
  }

  /**
   * Загружает кэш цен биткоина
   * @returns {Object} Кэш цен биткоина
   */
  loadPriceCache() {
    const defaultCache = {};

    // Создаем объект с данными для каждой поддерживаемой валюты
    config.api.coingecko.params.supportedCurrencies.forEach((currency) => {
      defaultCache[currency] = {
        price: 0,
        last_updated: null,
        change_24h: 0,
        change_percentage_24h: 0,
      };
    });

    return this.loadCache(defaultCache);
  }

  /**
   * Загружает кэш исторических данных
   * @returns {Object} Кэш исторических данных
   */
  loadHistoricalCache() {
    const defaultCache = {};

    // Создаем объект с данными для каждой поддерживаемой валюты
    config.api.coingecko.params.supportedCurrencies.forEach((currency) => {
      defaultCache[currency] = {
        data: [],
        last_updated: null,
      };
    });

    return this.loadCache(defaultCache);
  }

  /**
   * Получает случайную цену для мок-данных
   * @param {number} base - Базовая цена
   * @param {number} spread - Разброс цены
   * @returns {number} Случайная цена
   */
  getRandomPrice(base = config.mock.bitcoin.basePrice, spread = config.mock.bitcoin.priceSpread) {
    return Math.round((base + (Math.random() - 0.5) * spread) * 100) / 100;
  }

  /**
   * Генерирует мок-данные исторических цен
   * @param {number} days - Количество дней
   * @returns {Array} Мок-данные исторических цен
   */
  getMockHistory(days = 30) {
    const now = new Date();
    const data = [];
    let price = config.mock.bitcoin.basePrice;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      price += (Math.random() - 0.5) * config.mock.bitcoin.dailyFluctuation;
      data.push({ date: date.toISOString().split('T')[0], price: Math.round(price * 100) / 100 });
    }
    return data;
  }

  /**
   * Получает текущую цену биткоина из внешнего API
   * @returns {Promise<Object>} Данные о текущей цене
   */
  async fetchCurrentPrice() {
    if (USE_MOCK) {
      logger.info('Возвращаю мок-данные для текущей цены биткоина');
      const now = new Date().toISOString();
      this.priceCache.usd = {
        price: this.getRandomPrice(),
        last_updated: now,
        change_24h: Math.round((Math.random() - 0.5) * 1000) / 100,
        change_percentage_24h: Math.round((Math.random() - 0.5) * 10 * 100) / 100,
      };
      this.saveCache(this.priceCache);
      return this.priceCache;
    }

    try {
      logger.debug('Запрос текущей цены биткоина из CoinGecko API');

      const params = {
        ids: 'bitcoin',
        vs_currencies: config.api.coingecko.params.supportedCurrencies.join(','),
        include_24hr_change: true,
        include_last_updated_at: true,
      };

      // Добавляем API ключ, если он есть
      if (this.apiKey) {
        params.x_cg_pro_api_key = this.apiKey;
      }

      const endpoint = config.api.coingecko.endpoints.price;
      const response = await axios.get(`${this.apiUrl}${endpoint}`, { params });

      if (response.data && response.data.bitcoin) {
        const btcData = response.data.bitcoin;

        // Обновляем данные по каждой валюте
        for (const currency of config.api.coingecko.params.supportedCurrencies) {
          if (btcData[currency]) {
            this.priceCache[currency] = {
              price: btcData[currency],
              last_updated: new Date().toISOString(),
              change_24h: btcData[`${currency}_24h_change`] || 0,
              change_percentage_24h: btcData[`${currency}_24h_change`] || 0,
            };
          }
        }

        // Сохраняем обновленный кэш
        this.saveCache(this.priceCache);

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
   * Получает исторические данные биткоина из внешнего API
   * @param {number} days - Количество дней
   * @returns {Promise<Object>} Исторические данные
   */
  async fetchHistoricalData(days = 365) {
    if (USE_MOCK) {
      logger.info('Возвращаю мок-данные для истории биткоина');
      this.historicalCache.usd = {
        data: this.getMockHistory(days),
        last_updated: new Date().toISOString(),
      };
      this.saveCache(this.historicalCache);
      return this.historicalCache;
    }

    try {
      logger.debug(`Запрос исторических данных биткоина за ${days} дней из CoinGecko API`);

      const params = {
        vs_currency: config.api.coingecko.params.defaultCurrency,
        days: days,
        interval: 'daily',
      };

      // Добавляем API ключ, если он есть
      if (this.apiKey) {
        params.x_cg_pro_api_key = this.apiKey;
      }

      const endpoint = config.api.coingecko.endpoints.marketChart;
      const response = await axios.get(`${this.apiUrl}${endpoint}`, { params });

      if (response.data && response.data.prices) {
        // Обработка и форматирование данных для USD
        const formattedData = response.data.prices.map(([timestamp, price]) => ({
          date: new Date(timestamp).toISOString().split('T')[0],
          price: price,
        }));

        this.historicalCache.usd = {
          data: formattedData,
          last_updated: new Date().toISOString(),
        };

        // Сохраняем обновленный кэш
        this.saveCache(this.historicalCache);

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
   * Получает текущий кэш цен биткоина
   * @returns {Object} Кэш цен биткоина
   */
  getPriceCache() {
    return this.priceCache;
  }

  /**
   * Получает текущий кэш исторических данных
   * @returns {Object} Кэш исторических данных
   */
  getHistoricalCache() {
    return this.historicalCache;
  }
}

module.exports = new BitcoinRepository();
