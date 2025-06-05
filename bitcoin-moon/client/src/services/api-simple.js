/**
 * Простой модуль для работы с API
 */
import axios from 'axios';

// Определяем базовый URL для API
let baseURL = '/api';

const isDev = process.env.NODE_ENV !== 'production' || import.meta.env?.MODE !== 'production';

if (isDev) {
  baseURL = '/api';
  console.log('Режим разработки: используется локальный API');
} else if (typeof window !== 'undefined' && window.ENV && window.ENV.VITE_API_URL) {
  baseURL = window.ENV.VITE_API_URL;
} else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
  baseURL = import.meta.env.VITE_API_URL;
}

console.log('API baseURL:', baseURL);

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Простые перехватчики для логирования
api.interceptors.request.use(config => {
  console.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.params);
  return config;
});

api.interceptors.response.use(
  response => {
    console.debug(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`API Error: ${error.response.status} ${error.config?.url}`, error.response.data);
    } else if (error.request) {
      console.error('API Error: No response received', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 