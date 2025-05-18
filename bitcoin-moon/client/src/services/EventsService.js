/**
 * Сервис для работы с данными о событиях
 */
import api from './api';

/**
 * Класс для работы с данными о событиях
 */
class EventsService {
  /**
   * Получает предстоящие события
   * @param {number} count - Количество событий для получения
   * @returns {Promise<Array>} Массив с информацией о предстоящих событиях
   */
  async getUpcomingEvents(count = 5) {
    try {
      return await api.get('/events/upcoming', { count });
    } catch (error) {
      console.error('Ошибка при получении предстоящих событий:', error);
      throw error;
    }
  }

  /**
   * Получает события по категории
   * @param {string} category - Категория событий
   * @param {number} count - Количество событий для получения
   * @returns {Promise<Array>} Массив с информацией о событиях указанной категории
   */
  async getEventsByCategory(category, count = 10) {
    try {
      return await api.get('/events/category', { category, count });
    } catch (error) {
      console.error(`Ошибка при получении событий категории ${category}:`, error);
      throw error;
    }
  }

  /**
   * Получает события по диапазону дат
   * @param {string} startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Promise<Array>} Массив с информацией о событиях за указанный период
   */
  async getEventsByDateRange(startDate, endDate) {
    try {
      return await api.get('/events/range', { startDate, endDate });
    } catch (error) {
      console.error('Ошибка при получении событий по диапазону дат:', error);
      throw error;
    }
  }
}

export default new EventsService(); 