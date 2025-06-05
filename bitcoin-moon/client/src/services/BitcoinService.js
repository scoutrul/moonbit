/**
 * Сервис для работы с данными о биткоине
 */
import api from './api-simple';

// Кэш для текущей цены
let currentPriceCache = null;
let currentPriceCacheTimestamp = 0;
const CURRENT_PRICE_CACHE_TTL = 30 * 1000; // 30 секунд

// Активные запросы к API для предотвращения дублирования
const activeRequests = new Map();

// Счетчик запросов и ошибок для мониторинга
let requestCounter = 0;
let errorCounter = 0;
let successCounter = 0;

/**
 * Класс для работы с данными о биткоине
 */
class BitcoinService {
  /**
   * Получает текущую цену биткоина
   * @param {string} currency - Валюта (usd, eur, rub)
   * @returns {Promise<Object>} Объект с текущей ценой и изменениями
   */
  async getCurrentPrice(currency = 'usd') {
    requestCounter++;
    
    // Проверяем кэш
    const now = Date.now();
    if (currentPriceCache && (now - currentPriceCacheTimestamp) < CURRENT_PRICE_CACHE_TTL) {
      console.log(`[${requestCounter}] Возвращаем цену биткоина из кэша`);
      return currentPriceCache;
    }
    
    // Создаем ключ для кэша активных запросов
    const requestKey = `current-price-${currency}`;
    
    // Проверяем, нет ли уже активного запроса
    if (activeRequests.has(requestKey)) {
      console.log(`[${requestCounter}] Ожидаем завершения существующего запроса на текущую цену`);
      return activeRequests.get(requestKey);
    }
    
    // Создаем промис для запроса
    const requestPromise = (async () => {
      const maxRetries = 3;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[${requestCounter}] Запрос текущей цены биткоина (попытка ${attempt}/${maxRetries})`);
          
          const response = await api.get('/bitcoin/current', { 
            params: { currency },
            timeout: 10000 // 10 секунд таймаут
          });
          
          const priceData = {
            price: Number(response.data.price),
            currency: response.data.currency,
            last_updated: response.data.last_updated,
            change_24h: Number(response.data.change_24h),
            change_percentage_24h: Number(response.data.change_percentage_24h),
          };
          
          // Сохраняем в кэш
          currentPriceCache = priceData;
          currentPriceCacheTimestamp = now;
          
          successCounter++;
          console.log(`[${requestCounter}] Успешно получена цена биткоина (успехов ${successCounter}/${requestCounter})`);
          
          return priceData;
        } catch (error) {
          lastError = error;
          errorCounter++;
          console.error(`[${requestCounter}] Ошибка при получении цены биткоина (попытка ${attempt}/${maxRetries}):`, error.message);
          
          if (attempt < maxRetries) {
            // Ждем перед повторной попыткой
            const delay = attempt * 1000; // Увеличивающаяся задержка
            console.log(`[${requestCounter}] Ожидание ${delay}мс перед повторной попыткой...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // Если все попытки неудачны, возвращаем резервные данные
      console.error(`[${requestCounter}] Все попытки неудачны, используем резервные данные (ошибок ${errorCounter}/${requestCounter})`);
      
      const fallbackData = {
        price: 50000,
        currency: currency,
        last_updated: new Date().toISOString(),
        change_24h: 500,
        change_percentage_24h: 1.2,
      };
      
      // Кэшируем резервные данные на короткое время
      currentPriceCache = fallbackData;
      currentPriceCacheTimestamp = now;
      
      return fallbackData;
    })();
    
    // Добавляем запрос в активные
    activeRequests.set(requestKey, requestPromise);
    
    // Удаляем запрос из активных после завершения
    requestPromise.finally(() => {
      setTimeout(() => {
        activeRequests.delete(requestKey);
      }, 1000);
    });
    
    return requestPromise;
  }

  /**
   * Получает исторические данные о цене биткоина
   * @param {string} currency - Валюта (usd, eur, rub)
   * @param {number} days - Количество дней
   * @returns {Promise<Object>} Объект с историческими данными
   */
  async getHistoricalData(currency = 'usd', days = 30) {
    try {
      const response = await api.get('/bitcoin/history', { 
        params: { currency, days },
        timeout: 15000 // 15 секунд таймаут
      });
      return {
        currency,
        days,
        data: response.data.map((point) => ({
          date: point.date,
          price: Number(point.price),
        })),
      };
    } catch (error) {
      console.error('Error fetching historical bitcoin data:', error);
      
      // В случае ошибки генерируем базовые данные
      const data = [];
      const now = new Date();
      const basePrice = 50000;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Простая модель случайных изменений цены
        const randomChange = (Math.random() - 0.5) * 1000;
        const price = basePrice + randomChange * (i / days);
        
        data.push({
          date: date.toISOString().split('T')[0],
          price: price
        });
      }
      
      return { currency, days, data };
    }
  }

  /**
   * Получает данные для свечного графика
   * @param {string} timeframe - Временной интервал (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w)
   * @returns {Promise<Array>} Массив с данными для свечного графика
   */
  async getCandlestickData(timeframe = '1d') {
    try {
      // Используем данные свечей из Bybit API
      const response = await api.get('/bitcoin/candles', { 
        params: { timeframe },
        timeout: 15000 // 15 секунд таймаут
      });
      
      // Данные уже в правильном формате, просто возвращаем их
      return response.data;
    } catch (error) {
      console.error('Error fetching candlestick data:', error);
      
      // В случае ошибки генерируем базовые данные
      const data = [];
      const now = new Date();
      const basePrice = 50000;
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
        const volatility = basePrice * 0.02; // 2% волатильность
        
        const open = basePrice + (Math.random() - 0.5) * volatility;
        const close = open + (Math.random() - 0.5) * volatility;
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
      }
      
      return data;
    }
  }

  /**
   * Получает историю цен биткоина для всех таймфреймов
   * @returns {Promise<Object>} Промис с объектом, содержащим данные для всех таймфреймов
   */
  async getAllTimeframesData() {
    try {
      const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
      const result = {};
      
      for (const timeframe of timeframes) {
        result[timeframe] = await this.getCandlestickData(timeframe);
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching all timeframes data:', error);
      return {};
    }
  }
  
  /**
   * Очищает кэш (для отладки)
   */
  clearCache() {
    currentPriceCache = null;
    currentPriceCacheTimestamp = 0;
    activeRequests.clear();
    console.log('Кэш BitcoinService очищен');
  }
  
  /**
   * Получает статистику запросов (для отладки)
   */
  getStats() {
    return {
      totalRequests: requestCounter,
      successfulRequests: successCounter,
      failedRequests: errorCounter,
      successRate: requestCounter > 0 ? Math.round(successCounter / requestCounter * 100) : 0,
      activeRequests: activeRequests.size,
      cacheValid: currentPriceCache && (Date.now() - currentPriceCacheTimestamp) < CURRENT_PRICE_CACHE_TTL
    };
  }
}

// Экспортируем синглтон
export default new BitcoinService();
