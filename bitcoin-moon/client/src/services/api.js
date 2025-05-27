/**
 * Модуль для работы с API
 */
import axios from 'axios';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик для запросов
api.interceptors.request.use(
  (config) => {
    // Здесь можно добавить авторизационные заголовки и т.д.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик для ответов
api.interceptors.response.use(
  (response) => {
    // Обрабатываем успешный ответ
    return response;
  },
  (error) => {
    // Обрабатываем ошибки ответа
    if (error.response) {
      // Серверная ошибка с ответом
      console.error('API error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Ошибка запроса (нет ответа)
      console.error('API request error:', error.request);
    } else {
      // Ошибка при настройке запроса
      console.error('API setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
