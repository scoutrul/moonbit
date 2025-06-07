// BitcoinChartService.js - Сервис для работы с реальными данными Bitcoin графиков

class BitcoinChartService {
  constructor() {
    // Используем localhost для браузера, а не docker-сеть
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    
    // Если переменная содержит docker-сеть, заменяем на localhost для браузера
    if (this.baseUrl.includes('server:3001')) {
      this.baseUrl = 'http://localhost:3001/api';
    }
    
    console.log(`🔧 BitcoinChartService: API URL: ${this.baseUrl}`);
    
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 минут
  }

  /**
   * Получает начальные данные для графика
   * @param {string} timeframe - Временной интервал (1d, 1h, etc.)
   * @param {number} limit - Количество свечей
   * @returns {Promise<Object>} Данные графика
   */
  async getInitialData(timeframe = '1d', limit = 100) {
    try {
      console.log(`📊 BitcoinChartService: Загружаем начальные данные (${timeframe}, ${limit})`);
      
      const response = await fetch(
        `${this.baseUrl}/bitcoin/infinite-scroll?timeframe=${timeframe}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log(`✅ BitcoinChartService: Получено ${result.data.length} свечей`);
      
      return {
        data: result.data.map(this.formatCandlestickData),
        hasMore: result.hasMore,
        timeframe: result.timeframe
      };
    } catch (error) {
      console.error('❌ BitcoinChartService: Ошибка при загрузке начальных данных:', error);
      throw error;
    }
  }

  /**
   * Получает исторические данные для infinite scroll
   * @param {string} timeframe - Временной интервал
   * @param {number} limit - Количество свечей
   * @param {number} endTime - Время окончания (unix timestamp)
   * @returns {Promise<Object>} Исторические данные
   */
  async getHistoricalData(timeframe = '1d', limit = 50, endTime) {
    try {
      console.log(`📈 BitcoinChartService: Загружаем исторические данные до ${new Date(endTime * 1000).toLocaleDateString()}`);
      
      const url = `${this.baseUrl}/bitcoin/infinite-scroll?timeframe=${timeframe}&limit=${limit}&endTime=${endTime}`;
      
      // Проверяем кэш
      const cacheKey = `historical_${timeframe}_${limit}_${endTime}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log(`💾 BitcoinChartService: Используем кэшированные данные`);
        return cached;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      const formattedResult = {
        data: result.data.map(this.formatCandlestickData),
        hasMore: result.hasMore,
        timeframe: result.timeframe,
        count: result.count
      };
      
      // Кэшируем результат
      this.setCache(cacheKey, formattedResult);
      
      console.log(`✅ BitcoinChartService: Получено ${result.data.length} исторических свечей`);
      
      return formattedResult;
    } catch (error) {
      console.error('❌ BitcoinChartService: Ошибка при загрузке исторических данных:', error);
      throw error;
    }
  }

  /**
   * Форматирует данные свечи для lightweight-charts
   * @param {Object} candle - Сырые данные свечи
   * @returns {Object} Отформатированная свеча
   */
  formatCandlestickData = (candle) => {
    return {
      time: candle.time,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume || 0)
    };
  }

  /**
   * Получает данные из кэша
   * @param {string} key - Ключ кэша
   * @returns {Object|null} Кэшированные данные или null
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Сохраняет данные в кэш
   * @param {string} key - Ключ кэша
   * @param {Object} data - Данные для кэширования
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Очищает кэш
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 BitcoinChartService: Кэш очищен');
  }
}

export default new BitcoinChartService(); 