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
        price: Number(response.price),
        currency: response.currency,
        last_updated: response.last_updated,
        change_24h: Number(response.change_24h),
        change_percentage_24h: Number(response.change_percentage_24h)
      };
    } catch (error) {
      // DEMO MOCK: возвращаем мок-данные, если нет доступа к API
      console.warn('DEMO MODE: возвращаем мок-данные для getCurrentPrice');
      const now = new Date();
      return {
        price: 68750.23,
        currency,
        last_updated: now.toISOString(),
        change_24h: 1200.45,
        change_percentage_24h: 1.78
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
        data: response.data.map(point => ({
          date: point.date,
          price: Number(point.price)
        }))
      };
    } catch (error) {
      console.error('Ошибка при получении исторических данных биткоина:', error);
      throw error;
    }
  }

  /**
   * Получает данные для свечного графика
   * @param {string} timeframe - Временной интервал (1h, 1d, 1w)
   * @returns {Promise<Array>} Массив с данными для свечного графика
   */
  async getCandlestickData(timeframe = '1d') {
    try {
      const response = await api.get('/bitcoin/candles', { params: { timeframe } });
      return response.map(candle => ({
        time: new Date(candle.time).getTime() / 1000,
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),
        volume: Number(candle.volume || 0)
      }));
    } catch (error) {
      console.error('Ошибка при получении данных для свечного графика:', error);
      throw error;
    }
  }
}

// Экспортируем синглтон
export default new BitcoinService(); 