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

// Глобальная защита от дублирующихся запросов
const pendingRequests = new Map();
const requestCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 секунд для кэша
const MAX_RETRIES = 3;

// Статистика для мониторинга
let requestStats = {
  total: 0,
  cached: 0,
  pending: 0,
  retries: 0,
  errors: 0
};

// Функция для создания ключа запроса
const createRequestKey = (config) => {
  const { method, url, params } = config;
  return `${method}:${url}:${JSON.stringify(params || {})}`;
};

// Функция для логирования статистики
const logStats = () => {
  const { total, cached, pending, retries, errors } = requestStats;
  const successRate = total > 0 ? Math.round((total - errors) / total * 100) : 100;
  console.log(`API Stats: ${total} total, ${cached} cached, ${pending} pending, ${retries} retries, ${errors} errors (${successRate}% success)`);
};

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL,
  timeout: 15000, // 15 секунд таймаут
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Перехватчик запросов для предотвращения дублирования и кэширования
api.interceptors.request.use(async (config) => {
  requestStats.total++;
  
  const requestKey = createRequestKey(config);
  console.debug(`API Request [${requestStats.total}]: ${config.method.toUpperCase()} ${config.url}`, config.params);
  
  // Только GET запросы кэшируем и дедуплицируем
  if (config.method === 'get') {
    // Проверяем кэш
    const cached = requestCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      requestStats.cached++;
      console.debug(`API Cache Hit [${requestStats.total}]: ${requestKey}`);
      // Возвращаем закэшированный ответ
      const response = {
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
        fromCache: true
      };
      return Promise.reject({ 
        response,
        isFromCache: true 
      });
    }
    
    // Проверяем, нет ли уже выполняющегося запроса
    if (pendingRequests.has(requestKey)) {
      requestStats.pending++;
      console.debug(`API Pending Request [${requestStats.total}]: ${requestKey}`);
      try {
        const result = await pendingRequests.get(requestKey);
        return Promise.reject({ 
          response: result,
          isFromPending: true 
        });
      } catch (error) {
        throw error;
      }
    }
  }
  
  return config;
}, error => {
  console.error('API Request Error:', error);
  requestStats.errors++;
  return Promise.reject(error);
});

// Создаем функцию retry с экспоненциальной задержкой
const retryRequest = async (error, retryCount = 0) => {
  if (retryCount >= MAX_RETRIES) {
    throw error;
  }
  
  const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
  console.log(`API Retry [${retryCount + 1}/${MAX_RETRIES}] after ${delay}ms delay`);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  requestStats.retries++;
  
  try {
    return await api.request(error.config);
  } catch (retryError) {
    return retryRequest(retryError, retryCount + 1);
  }
};

// Перехватчик ответов для кэширования, обработки ошибок и retry логики
api.interceptors.response.use(response => {
  const requestKey = createRequestKey(response.config);
  
  // Кэшируем только GET запросы
  if (response.config.method === 'get') {
    requestCache.set(requestKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    // Очистка старого кэша
    if (requestCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of requestCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          requestCache.delete(key);
        }
      }
    }
  }
  
  console.debug(`API Response: ${response.status} ${response.config.url}`);
  
  // Логируем статистику каждые 10 запросов
  if (requestStats.total % 10 === 0) {
    logStats();
  }
  
  return response;
}, async error => {
  const requestKey = createRequestKey(error.config || {});
  
  // Удаляем из pending requests
  if (pendingRequests.has(requestKey)) {
    pendingRequests.delete(requestKey);
  }
  
  // Если это закэшированный ответ, возвращаем его
  if (error.isFromCache && error.response) {
    return error.response;
  }
  
  // Если это ответ от pending запроса, возвращаем его
  if (error.isFromPending && error.response) {
    return error.response;
  }
  
  if (error.response) {
    console.error(`API Error: ${error.response.status} ${error.config?.url}`, error.response.data);
    requestStats.errors++;
    
    // Retry для определенных типов ошибок
    if (error.response.status >= 500 || error.response.status === 408) {
      try {
        return await retryRequest(error);
      } catch (retryError) {
        console.error('API Retry failed:', retryError);
      }
    }
  } else if (error.request) {
    console.error('API Error: No response received', error.request);
    requestStats.errors++;
    
    // Retry для сетевых ошибок
    try {
      return await retryRequest(error);
    } catch (retryError) {
      console.error('API Retry failed:', retryError);
    }
  } else {
    console.error('API Error:', error.message);
    requestStats.errors++;
  }
  
  return Promise.reject(error);
});

// Добавляем метод для очистки кэша
api.clearCache = () => {
  requestCache.clear();
  pendingRequests.clear();
  requestStats = { total: 0, cached: 0, pending: 0, retries: 0, errors: 0 };
  console.log('API cache cleared');
};

// Добавляем метод для получения статистики
api.getStats = () => ({ ...requestStats });

export default api;
