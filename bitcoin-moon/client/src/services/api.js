/**
 * Модуль для работы с API
 */
// @ts-nocheck
import axios from 'axios';

// Определяем базовый URL для API - принудительно используем локальный путь для разработки
let baseURL = '/api'; // Относительный путь для локальной разработки

// Проверяем, что мы в режиме разработки
const isDev = process.env.NODE_ENV !== 'production' || import.meta.env?.MODE !== 'production';

// В режиме разработки всегда используем локальный путь
if (isDev) {
  baseURL = '/api';
  console.log('Режим разработки: используется локальный API');
} 
// В производственном режиме используем переменные окружения
else if (typeof window !== 'undefined' && window.ENV && window.ENV.VITE_API_URL) {
  baseURL = window.ENV.VITE_API_URL;
} else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
  baseURL = import.meta.env.VITE_API_URL;
}

console.log('API baseURL:', baseURL);

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL,
  timeout: 10000, // 10 секунд таймаут
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Перехватчик запросов для логирования и трансформации данных
api.interceptors.request.use(config => {
  console.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.params);
  return config;
}, error => {
  console.error('API Request Error:', error);
  return Promise.reject(error);
});

// Перехватчик ответов для логирования и обработки ошибок
api.interceptors.response.use(response => {
  console.debug(`API Response: ${response.status} ${response.config.url}`);
  return response;
}, error => {
  if (error.response) {
    console.error('API Error:', error.response.status, error.response.data);
  } else if (error.request) {
    console.error('API Error: No response received', error.request);
  } else {
    console.error('API Error:', error.message);
  }
  
  // Можно добавить глобальную обработку ошибок
  // Например, показывать уведомление пользователю
  
  return Promise.reject(error);
});

export default api;
