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
      return await api.get('/bitcoin/current', { currency });
    } catch (error) {
      console.error('Ошибка при получении текущей цены биткоина:', error);
      throw error;
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
      return await api.get('/bitcoin/history', { currency, days });
    } catch (error) {
      console.error('Ошибка при получении исторических данных биткоина:', error);
      throw error;
    }
  }
}

export default new BitcoinService(); 