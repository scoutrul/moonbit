import logger from '../utils/logger.js';
import bitcoinRepository from '../repositories/BitcoinRepository.js';
import config from '../config/index.js';

/**
 * Сервис для работы с данными о биткоине
 * Использует репозиторий для получения данных и предоставляет бизнес-логику
 */
class BitcoinService {
  /**
   * Обновляет данные о текущей цене биткоина
   * @returns {Promise<Object>} Обновленные данные о цене
   */
  async updatePriceData() {
    logger.debug('BitcoinService: запрос обновления цены биткоина');
    return await bitcoinRepository.fetchCurrentPrice();
  }

  /**
   * Обновляет исторические данные о цене биткоина
   * @param {number} days - Количество дней для получения данных
   * @returns {Promise<Object>} Обновленные исторические данные
   */
  async updateHistoricalData(days = 365) {
    logger.debug(`BitcoinService: запрос обновления исторических данных за ${days} дней`);
    return await bitcoinRepository.fetchHistoricalData(days);
  }

  /**
   * Получает текущую цену биткоина
   * @param {string} currency - Валюта (usd, eur, rub)
   * @returns {Object} Данные о текущей цене биткоина
   */
  getCurrentPrice(currency = config.api.coingecko.params.defaultCurrency) {
    if (!config.api.coingecko.params.supportedCurrencies.includes(currency)) {
      currency = config.api.coingecko.params.defaultCurrency;
    }

    const priceCache = bitcoinRepository.getPriceCache();
    const cacheData = priceCache[currency];

    // Если данные устарели, запускаем обновление
    const cacheAge = cacheData.last_updated
      ? (new Date() - new Date(cacheData.last_updated)) / 1000 / 60
      : 9999;

    if (cacheAge > config.cache.bitcoin.priceTtl) {
      logger.debug(`Кэш цены биткоина устарел (${Math.round(cacheAge)} мин), запуск обновления`);
      this.updatePriceData().catch((error) => {
        logger.error('Ошибка при фоновом обновлении цены биткоина', { error });
      });
    }

    return {
      price: cacheData.price,
      currency,
      last_updated: cacheData.last_updated,
      change_24h: cacheData.change_24h,
      change_percentage_24h: cacheData.change_percentage_24h,
    };
  }

  /**
   * Получает исторические данные о цене биткоина
   * @param {string} currency - Валюта (usd, eur, rub)
   * @param {number} days - Количество дней для отображения
   * @returns {Array} Исторические данные о цене биткоина
   */
  getHistoricalData(currency = config.api.coingecko.params.defaultCurrency, days = 30) {
    if (!config.api.coingecko.params.supportedCurrencies.includes(currency)) {
      currency = config.api.coingecko.params.defaultCurrency;
    }

    const historicalCache = bitcoinRepository.getHistoricalCache();
    const cacheData = historicalCache[currency];

    // Если данные устарели (более 12 часов) или не хватает данных, запускаем обновление
    const cacheAge = cacheData.last_updated
      ? (new Date() - new Date(cacheData.last_updated)) / 1000 / 60 / 60
      : 9999;
    const hasEnoughData = cacheData.data.length >= days;

    if (cacheAge > config.cache.bitcoin.historyTtl || !hasEnoughData) {
      logger.debug(
        `Кэш исторических данных биткоина устарел (${Math.round(cacheAge)} ч) или недостаточен, запуск обновления`
      );
      this.updateHistoricalData(Math.max(365, days)).catch((error) => {
        logger.error('Ошибка при фоновом обновлении исторических данных биткоина', { error });
      });
    }

    // Фильтруем данные за нужный период
    let filteredData = [...cacheData.data];
    if (filteredData.length > days) {
      filteredData = filteredData.slice(-days);
    }

    return filteredData;
  }

  /**
   * Анализирует тренд цены биткоина
   * @param {string} currency - Валюта (usd, eur, rub)
   * @param {number} days - Количество дней для анализа
   * @returns {Object} Результат анализа тренда
   */
  analyzePriceTrend(currency = config.api.coingecko.params.defaultCurrency, days = 30) {
    const data = this.getHistoricalData(currency, days);

    if (data.length < 2) {
      return {
        trend: 'неизвестно',
        change: 0,
        changePercentage: 0,
      };
    }

    const oldestPrice = data[0].price;
    const latestPrice = data[data.length - 1].price;
    const change = latestPrice - oldestPrice;
    const changePercentage = (change / oldestPrice) * 100;

    let trend;
    if (changePercentage > 5) {
      trend = 'сильный рост';
    } else if (changePercentage > 1) {
      trend = 'умеренный рост';
    } else if (changePercentage > -1) {
      trend = 'стабильность';
    } else if (changePercentage > -5) {
      trend = 'умеренное падение';
    } else {
      trend = 'сильное падение';
    }

    return {
      trend,
      change: Math.round(change * 100) / 100,
      changePercentage: Math.round(changePercentage * 100) / 100,
    };
  }

  /**
   * Анализирует волатильность цены биткоина
   * @param {string} currency - Валюта (usd, eur, rub)
   * @param {number} days - Количество дней для анализа
   * @returns {Object} Результат анализа волатильности
   */
  analyzeVolatility(currency = config.api.coingecko.params.defaultCurrency, days = 30) {
    const data = this.getHistoricalData(currency, days);

    if (data.length < 3) {
      return {
        volatility: 'неизвестно',
        volatilityValue: 0,
        maxFluctuation: 0,
      };
    }

    // Расчет дневных изменений
    const dailyChanges = [];
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1].price;
      const current = data[i].price;
      const change = ((current - prev) / prev) * 100;
      dailyChanges.push(change);
    }

    // Расчет стандартного отклонения (волатильность)
    const mean = dailyChanges.reduce((sum, val) => sum + val, 0) / dailyChanges.length;
    const squaredDiffs = dailyChanges.map((val) => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(variance);

    // Максимальное дневное колебание
    const maxFluctuation = Math.max(...dailyChanges.map((val) => Math.abs(val)));

    let volatility;
    if (stdDev < 1) {
      volatility = 'очень низкая';
    } else if (stdDev < 2) {
      volatility = 'низкая';
    } else if (stdDev < 4) {
      volatility = 'средняя';
    } else if (stdDev < 7) {
      volatility = 'высокая';
    } else {
      volatility = 'очень высокая';
    }

    return {
      volatility,
      volatilityValue: Math.round(stdDev * 100) / 100,
      maxFluctuation: Math.round(maxFluctuation * 100) / 100,
    };
  }

  /**
   * Получает данные для свечного графика
   * @param {string} timeframe - Временной интервал (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w)
   * @returns {Array} Массив данных для свечного графика
   */
  getCandlestickData(timeframe = '1d') {
    logger.debug(`BitcoinService: запрос данных свечного графика, таймфрейм: ${timeframe}`);
    
    // Временно реализуем мок-данные для свечного графика
    // В реальном приложении здесь должно быть обращение к репозиторию
    // для получения данных из БД или внешнего API
    
    const now = new Date();
    const data = [];
    const basePrice = 50000; // Базовая цена
    let price = basePrice;
    let intervalInMs;
    
    // Определяем интервал времени в миллисекундах
    switch(timeframe) {
      case '1m': intervalInMs = 60 * 1000; break;
      case '5m': intervalInMs = 5 * 60 * 1000; break;
      case '15m': intervalInMs = 15 * 60 * 1000; break;
      case '30m': intervalInMs = 30 * 60 * 1000; break;
      case '1h': intervalInMs = 60 * 60 * 1000; break;
      case '4h': intervalInMs = 4 * 60 * 60 * 1000; break;
      case '1d': intervalInMs = 24 * 60 * 60 * 1000; break;
      case '1w': intervalInMs = 7 * 24 * 60 * 60 * 1000; break;
      default: intervalInMs = 24 * 60 * 60 * 1000;
    }
    
    // Генерируем 100 свечей для выбранного таймфрейма
    for (let i = 100; i >= 0; i--) {
      const timestamp = now.getTime() - i * intervalInMs;
      const volatility = price * 0.02; // 2% волатильность
      
      // Моделируем некоторый тренд в данных
      const trend = Math.sin(i / 10) * volatility * 0.5;
      
      const open = price + (Math.random() - 0.5) * volatility + trend;
      const close = open + (Math.random() - 0.5) * volatility + trend;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const volume = Math.round(1000 + Math.random() * 9000);
      
      data.push({
        time: Math.floor(timestamp / 1000),
        open,
        high,
        low,
        close,
        volume
      });
      
      // Обновляем базовую цену для следующей свечи
      price = close;
    }
    
    return data;
  }
}

const bitcoinService = new BitcoinService();
export default bitcoinService;
