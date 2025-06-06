/**
 * WebSocket Service for real-time Bitcoin price updates
 * Handles connection to Binance WebSocket API with HTTP fallback
 */
class WebSocketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.isConnecting = false;
    this.shouldReconnect = true;
    this.lastPrice = null;
    this.fallbackInterval = null;
    this.connectionMode = 'websocket'; // 'websocket' or 'fallback'
    
    // 🔧 ИСПРАВЛЕНИЕ: Определение среды выполнения для выбора стратегии подключения
    this.environment = this.detectEnvironment();
    console.log('🔍 Обнаружена среда выполнения:', this.environment);
    
    // 🔧 ИСПРАВЛЕНИЕ: Выбор стратегии подключения на основе среды
    // В dev режиме используем WebSocket к внешнему API, в Docker - HTTP fallback к нашему API
    this.shouldUseWebSocket = this.environment === 'development';
    console.log('📡 Стратегия подключения:', this.shouldUseWebSocket ? 'WebSocket' : 'HTTP Fallback');
  }

  // 🔧 НОВЫЙ МЕТОД: Определение среды выполнения
  detectEnvironment() {
    try {
      const hostname = window.location.hostname;
      
      // В dev режиме всегда localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
      
      // Проверяем переменные окружения Vite для Docker определения
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // Если API URL содержит 'server:' значит мы в Docker контейнере
      if (apiUrl.includes('server:')) {
        return 'docker';
      }
      
      // Проверяем hostname для контейнерной среды
      if (hostname === '0.0.0.0' || hostname.includes('container')) {
        return 'docker';
      }
      
      return 'production';
    } catch (error) {
      console.warn('⚠️ Ошибка при определении среды:', error);
      return 'unknown';
    }
  }

  subscribe(callback) {
    console.log('🔗 Новая подписка на price updates');
    this.subscribers.add(callback);
    
    // Если это первая подписка, инициируем подключение
    if (this.subscribers.size === 1) {
      this.connect();
    }
    
    // Если у нас уже есть последняя цена, отправляем ее новому подписчику
    if (this.lastPrice) {
      callback(this.lastPrice);
    }
    
    // Возвращаем функцию отписки
    return () => {
      this.subscribers.delete(callback);
      console.log('🔚 Отписка от price updates, осталось подписчиков:', this.subscribers.size);
      
      // Если больше нет подписчиков, отключаемся
      if (this.subscribers.size === 0) {
        this.disconnect();
      }
    };
  }

  connect() {
    if (this.isConnecting) {
      console.log('⚡ Подключение уже в процессе...');
      return;
    }

    this.isConnecting = true;
    console.log('🚀 Инициируем подключение для real-time updates...');
    
    // 🔧 ИСПРАВЛЕНИЕ: Выбор стратегии на основе среды
    if (this.shouldUseWebSocket) {
      this.connectWebSocket();
    } else {
      console.log('🔄 Docker среда обнаружена, используем HTTP fallback');
      this.startHttpFallback();
    }
  }

  connectWebSocket() {
    try {
      console.log('🌐 Попытка подключения к Binance WebSocket...');
      
      // Binance WebSocket API для BTC/USDT ticker
      const wsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@ticker';
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket подключен к Binance API');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.connectionMode = 'websocket';
        this.stopHttpFallback(); // Останавливаем fallback если он был активен
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Binance ticker data format
          if (data.s === 'BTCUSDT' && data.c) {
            const priceData = {
              price: parseFloat(data.c),
              change_24h: parseFloat(data.P),
              change_percentage_24h: parseFloat(data.P),
              last_updated: new Date().toISOString(),
              source: 'binance_websocket'
            };
            
            this.lastPrice = priceData;
            this.notifySubscribers(priceData);
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга WebSocket данных:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket ошибка:', error);
        this.handleConnectionError();
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket соединение закрыто:', event.code, event.reason);
        this.isConnecting = false;
        
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('🔄 Максимум попыток WebSocket исчерпан, переключаемся на HTTP fallback');
          this.startHttpFallback();
        }
      };
      
    } catch (error) {
      console.error('❌ Ошибка создания WebSocket соединения:', error);
      this.handleConnectionError();
    }
  }

  handleConnectionError() {
    this.isConnecting = false;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.handleReconnect();
    } else {
      console.log('🔄 WebSocket недоступен, переключаемся на HTTP fallback');
      this.startHttpFallback();
    }
  }

  handleReconnect() {
    if (!this.shouldReconnect) return;
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 Переподключение через ${delay}ms (попытка ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connectWebSocket();
      }
    }, delay);
  }

  // 🔧 УЛУЧШЕННЫЙ HTTP Fallback через наш API сервер
  async startHttpFallback() {
    if (this.fallbackInterval) {
      console.log('🔄 HTTP fallback уже активен');
      return;
    }
    
    console.log('🌐 Запуск HTTP fallback для price updates...');
    this.connectionMode = 'fallback';
    this.isConnecting = false;
    
    // Получаем данные сразу
    await this.fetchPriceData();
    
    // Затем каждые 3 секунды
    this.fallbackInterval = setInterval(async () => {
      await this.fetchPriceData();
    }, 3000);
  }

  // 🔧 УЛУЧШЕННЫЙ метод получения данных через API
  async fetchPriceData() {
    try {
      // 🔧 ИСПРАВЛЕНИЕ: Определяем правильный API URL в зависимости от среды
      const viteApiUrl = import.meta.env.VITE_API_URL;
      const isDevMode = window.location.hostname === 'localhost';
      
      let apiUrl;
      if (isDevMode) {
        // В dev режиме используем относительный URL для работы через Vite прокси
        apiUrl = '/api';
        console.log('🔧 Dev режим обнаружен, используем прокси');
      } else if (viteApiUrl && !viteApiUrl.includes('server:')) {
        // В production используем VITE_API_URL если она не содержит server:
        apiUrl = viteApiUrl;
      } else {
        // Fallback для других случаев
        apiUrl = '/api';
      }
      
      console.log('🔍 WebSocket fetchPriceData DEBUG:', {
        viteApiUrl,
        isDevMode,
        hostname: window.location.hostname,
        finalApiUrl: apiUrl,
        environment: this.environment
      });
      
      const fullUrl = `${apiUrl}/bitcoin/current`;
      console.log('📡 Делаем запрос к:', fullUrl);
      
      const response = await fetch(fullUrl);  // Изменено с /price на /current
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📡 HTTP fallback data получена:', data);
      
      if (data && typeof data.price === 'number') {
        const priceData = {
          price: data.price,
          change_24h: data.change_24h || 0,
          change_percentage_24h: data.change_percentage_24h || 0,
          last_updated: data.last_updated || new Date().toISOString(),
          source: 'http_fallback'
        };
        
        this.lastPrice = priceData;
        this.notifySubscribers(priceData);
      } else {
        throw new Error('Некорректный формат данных от API');
      }
    } catch (error) {
      console.error('❌ Ошибка HTTP fallback:', error);
      
      // 🔧 ДОПОЛНИТЕЛЬНЫЙ FALLBACK: Если наш API недоступен, генерируем моковые данные
      if (this.lastPrice) {
        const mockPrice = this.generateMockPrice(this.lastPrice.price);
        console.log('🎭 Используем mock данные:', mockPrice);
        this.notifySubscribers(mockPrice);
      }
    }
  }

  // 🔧 НОВЫЙ МЕТОД: Генерация реалистичных mock данных на основе последней цены
  generateMockPrice(basePrice = 45000) {
    // Генерируем небольшое изменение цены (-0.1% до +0.1%)
    const change = (Math.random() - 0.5) * 0.002; // 0.2% максимальное изменение
    const newPrice = basePrice * (1 + change);
    
    return {
      price: Math.round(newPrice * 100) / 100,
      change_24h: 0,
      change_percentage_24h: 0,
      last_updated: new Date().toISOString(),
      source: 'mock_data'
    };
  }

  stopHttpFallback() {
    if (this.fallbackInterval) {
      console.log('🛑 Остановка HTTP fallback');
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }

  notifySubscribers(priceData) {
    if (this.subscribers.size === 0) return;
    
    console.log(`📢 Уведомление ${this.subscribers.size} подписчиков:`, {
      price: priceData.price,
      source: priceData.source,
      mode: this.connectionMode
    });
    
    this.subscribers.forEach(callback => {
      try {
        callback(priceData);
      } catch (error) {
        console.error('❌ Ошибка в callback подписчика:', error);
      }
    });
  }

  disconnect() {
    console.log('🔌 Отключение WebSocket service...');
    this.shouldReconnect = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.stopHttpFallback();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // 🔧 НОВЫЙ МЕТОД: Информация о состоянии подключения
  getConnectionInfo() {
    return {
      mode: this.connectionMode,
      environment: this.environment,
      isConnected: this.connectionMode === 'websocket' ? (this.ws && this.ws.readyState === WebSocket.OPEN) : !!this.fallbackInterval,
      subscribersCount: this.subscribers.size,
      lastPrice: this.lastPrice,
      shouldUseWebSocket: this.shouldUseWebSocket
    };
  }
}

// Создаем singleton instance
const webSocketService = new WebSocketService();

export default webSocketService; 