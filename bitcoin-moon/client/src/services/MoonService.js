/**
 * Сервис для работы с данными о фазах луны
 */
import api from './api';

/**
 * Класс для работы с данными о фазах луны
 */
class MoonService {
  /**
   * Получает текущую фазу луны
   * @returns {Promise<Object>} Объект с информацией о текущей фазе луны
   */
  async getCurrentPhase() {
    try {
      return await api.get('/moon/current');
    } catch (error) {
      console.error('Ошибка при получении текущей фазы луны:', error);
      throw error;
    }
  }

  /**
   * Получает предстоящие фазы луны
   * @param {number} count - Количество фаз для получения
   * @returns {Promise<Array>} Массив с информацией о предстоящих фазах луны
   */
  async getUpcomingPhases(count = 4) {
    try {
      return await api.get('/moon/upcoming', { count });
    } catch (error) {
      console.error('Ошибка при получении предстоящих фаз луны:', error);
      throw error;
    }
  }

  /**
   * Получает исторические данные о фазах луны
   * @param {string} startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Promise<Array>} Массив с информацией о фазах луны за указанный период
   */
  async getHistoricalPhases(startDate, endDate) {
    try {
      return await api.get('/moon/history', { startDate, endDate });
    } catch (error) {
      console.error('Ошибка при получении исторических данных о фазах луны:', error);
      throw error;
    }
  }
}

export default new MoonService();
