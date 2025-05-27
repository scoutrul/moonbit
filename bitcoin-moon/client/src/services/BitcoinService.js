/**
 * Сервис для работы с данными о биткоине
 */
import api from './api';
import { generateCandlestickData, generateCurrentPrice, generateHistoricalData } from '../utils/mockDataGenerator';

// Флаг для демо-режима
const DEMO_MODE = true; // Всегда используем моковые данные

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
    // В демо-режиме сразу возвращаем моковые данные
    if (DEMO_MODE) {
      console.warn('DEMO MODE: возвращаем мок-данные для getCurrentPrice');
      return generateCurrentPrice(currency);
    }
    
    try {
      const response = await api.get('/bitcoin/current', { params: { currency } });
      return {
        price: Number(response.price),
        currency: response.currency,
        last_updated: response.last_updated,
        change_24h: Number(response.change_24h),
        change_percentage_24h: Number(response.change_percentage_24h),
      };
    } catch (error) {
      // Если ошибка, всё равно возвращаем мок-данные
      console.warn('DEMO MODE: возвращаем мок-данные для getCurrentPrice');
      return generateCurrentPrice(currency);
    }
  }

  /**
   * Получает исторические данные о цене биткоина
   * @param {string} currency - Валюта (usd, eur, rub)
   * @param {number} days - Количество дней
   * @returns {Promise<Object>} Объект с историческими данными
   */
  async getHistoricalData(currency = 'usd', days = 30) {
    // В демо-режиме сразу возвращаем моковые данные
    if (DEMO_MODE) {
      console.warn('DEMO MODE: возвращаем мок-данные для getHistoricalData');
      return generateHistoricalData(currency, days);
    }
    
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
      console.warn('DEMO MODE: возвращаем мок-данные для getHistoricalData');
      return generateHistoricalData(currency, days);
    }
  }

  /**
   * Получает данные для свечного графика
   * @param {string} timeframe - Временной интервал (1h, 1d, 1w)
   * @returns {Promise<Array>} Массив с данными для свечного графика
   */
  async getCandlestickData(timeframe = '1d') {
    // В демо-режиме сразу возвращаем моковые данные
    if (DEMO_MODE) {
      console.warn('DEMO MODE: возвращаем мок-данные для getCandlestickData');
      return generateCandlestickData(timeframe);
    }
    
    try {
      const response = await api.get('/bitcoin/candles', { params: { timeframe } });
      return response.map((candle) => ({
        time: new Date(candle.time).getTime() / 1000,
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),
        volume: Number(candle.volume || 0),
      }));
    } catch (error) {
      console.warn('DEMO MODE: возвращаем мок-данные для getCandlestickData');
      return generateCandlestickData(timeframe);
    }
  }
}

// Экспортируем синглтон
export default new BitcoinService();
