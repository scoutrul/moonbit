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
   * @param {Object} params - Параметры запроса
   * @returns {Promise<any>} Результат запроса
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // Добавляем параметры запроса в URL
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
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
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
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

export default new ApiService(); 