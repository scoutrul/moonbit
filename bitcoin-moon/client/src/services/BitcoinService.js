/**
 * Сервис для работы с данными о биткоине
 */
import api from './api';

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
    try {
      const response = await api.get('/bitcoin/current', { params: { currency } });
      return {
        price: Number(response.data.price),
        currency: response.data.currency,
        last_updated: response.data.last_updated,
        change_24h: Number(response.data.change_24h),
        change_percentage_24h: Number(response.data.change_percentage_24h),
      };
    } catch (error) {
      console.error('Error fetching current bitcoin price:', error);
      
      // В случае ошибки возвращаем резервные данные
      return {
        price: 50000,
        currency: currency,
        last_updated: new Date().toISOString(),
        change_24h: 500,
        change_percentage_24h: 1.2,
      };
    }
  }

  /**
   * Получает исторические данные о цене биткоина
   * @param {string} currency - Валюта (usd, eur, rub)
   * @param {number} days - Количество дней
   * @returns {Promise<Object>} Объект с историческими данными
   */
  async getHistoricalData(currency = 'usd', days = 30) {
    try {
      const response = await api.get('/bitcoin/history', { params: { currency, days } });
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
      const response = await api.get('/bitcoin/candles', { params: { timeframe } });
      
      return response.data.map((candle) => ({
        time: new Date(candle.time).getTime() / 1000,
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),
        volume: Number(candle.volume || 0),
      }));
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
}

// Экспортируем синглтон
export default new BitcoinService();
