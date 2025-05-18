import { useState, useEffect } from 'react';

/**
 * Панель разработчика для отладки приложения
 * Отображается только в режиме разработки (import.meta.env.MODE !== 'production')
 */
function DevPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [appState, setAppState] = useState({
    apiRequests: [],
    performance: {},
    darkMode: false,
    apiEndpoints: [
      '/api/bitcoin/current',
      '/api/moon/current',
      '/api/astro/current',
      '/api/events/recent'
    ],
    serverStatus: 'unknown'
  });

  // Проверяем, что мы не в продакшене
  const isProduction = import.meta.env.MODE === 'production';

  useEffect(() => {
    if (isProduction) return;

    // Отслеживаем производительность
    const performanceData = {
      loadTime: performance.now(),
      memory: window.performance?.memory
        ? {
            usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)),
            totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024))
          }
        : null
    };

    // Проверяем статус сервера
    fetch('/api/bitcoin/current')
      .then(response => {
        setAppState(prev => ({
          ...prev,
          serverStatus: response.ok ? 'online' : 'error',
          performance: performanceData
        }));
      })
      .catch(() => {
        setAppState(prev => ({
          ...prev,
          serverStatus: 'offline',
          performance: performanceData
        }));
      });

    // Проверяем темную тему
    const isDarkMode = document.documentElement.classList.contains('dark');
    setAppState(prev => ({
      ...prev,
      darkMode: isDarkMode,
      performance: performanceData
    }));

    // Мониторим API запросы
    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
      const startTime = performance.now();
      const result = originalFetch.apply(this, arguments);
      
      if (url.includes('/api/')) {
        result.then(response => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          setAppState(prev => ({
            ...prev,
            apiRequests: [
              {
                url,
                method: options?.method || 'GET',
                status: response.status,
                duration: Math.round(duration),
                time: new Date().toISOString()
              },
              ...prev.apiRequests.slice(0, 9) // Храним 10 последних запросов
            ]
          }));
        }).catch(error => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          setAppState(prev => ({
            ...prev,
            apiRequests: [
              {
                url,
                method: options?.method || 'GET',
                status: 'error',
                error: error.message,
                duration: Math.round(duration),
                time: new Date().toISOString()
              },
              ...prev.apiRequests.slice(0, 9)
            ]
          }));
        });
      }
      
      return result;
    };

    // Очистка
    return () => {
      window.fetch = originalFetch;
    };
  }, [isProduction]);

  if (isProduction) return null;

  // Обработчик тестового запроса к API
  const testApi = (endpoint) => {
    fetch(endpoint)
      .then(response => {
        console.log(`Тестовый запрос к ${endpoint}:`, response.ok);
      })
      .catch(error => {
        console.error(`Ошибка запроса к ${endpoint}:`, error);
      });
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="dev-panel fixed bottom-0 right-0 z-50">
      <button
        onClick={toggleVisibility}
        className="bg-gray-800 text-white px-2 py-1 rounded-tl-md text-xs"
      >
        {isVisible ? 'Скрыть DevPanel' : 'DevPanel'}
      </button>

      {isVisible && (
        <div className="bg-gray-800 text-white p-4 max-w-lg max-h-96 overflow-auto text-xs">
          <h3 className="text-lg font-bold mb-2">Панель разработчика</h3>
          
          <div className="mb-4">
            <h4 className="font-bold">Состояние приложения</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>Сервер:</div>
              <div className={`font-mono ${
                appState.serverStatus === 'online' ? 'text-green-400' : 
                appState.serverStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {appState.serverStatus}
              </div>
              
              <div>Темная тема:</div>
              <div className="font-mono">{appState.darkMode ? 'Включена' : 'Выключена'}</div>
              
              {appState.performance.memory && (
                <>
                  <div>Память JS:</div>
                  <div className="font-mono">
                    {appState.performance.memory.usedJSHeapSize} / {appState.performance.memory.totalJSHeapSize} MB
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-bold">Тест API</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {appState.apiEndpoints.map(endpoint => (
                <button
                  key={endpoint}
                  onClick={() => testApi(endpoint)}
                  className="bg-blue-700 text-white px-2 py-1 rounded text-xs"
                >
                  {endpoint.split('/').pop()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold">Последние API запросы</h4>
            {appState.apiRequests.length === 0 ? (
              <p className="text-gray-400 italic">Нет запросов</p>
            ) : (
              <table className="w-full mt-1">
                <thead>
                  <tr className="text-left">
                    <th>URL</th>
                    <th>Статус</th>
                    <th>Время (мс)</th>
                  </tr>
                </thead>
                <tbody>
                  {appState.apiRequests.map((req, index) => (
                    <tr key={index} className={req.status !== 200 ? 'text-red-400' : ''}>
                      <td className="truncate max-w-[150px]">{req.url}</td>
                      <td>{req.status}</td>
                      <td>{req.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DevPanel; 