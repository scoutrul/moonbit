/**
 * Базовый сервис для работы с API
 * Содержит общие методы для выполнения запросов
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Класс для работы с API
 */
class ApiService {
  /**
   * Выполняет GET запрос к API
   * @param {string} endpoint - Конечная точка API
   * @param {Object} options - Опции запроса
   * @param {Object} options.params - Параметры запроса
   * @returns {Promise<any>} Результат запроса
   */
  async get(endpoint, options = {}) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    // Добавляем параметры запроса в URL
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(error.message || `HTTP error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Ошибка при запросе к ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Выполняет POST запрос к API
   * @param {string} endpoint - Конечная точка API
   * @param {Object} data - Данные для отправки
   * @returns {Promise<any>} Результат запроса
   */
  async post(endpoint, data = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Ошибка при запросе к ${endpoint}:`, error);
      throw error;
    }
  }
}

// Экспортируем синглтон
export default new ApiService();
