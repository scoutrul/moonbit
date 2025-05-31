/**
 * Сервис для прогнозирования данных биткоина и лунных фаз
 */
import BitcoinService from './BitcoinService';
import EventsService from './EventsService';

class ForecastService {
  /**
   * Генерирует прогнозные данные для графика, основываясь на последних доступных данных
   * @param {Array} historicalData - исторические данные свечей
   * @param {string} timeframe - временной интервал (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w)
   * @param {number} periods - количество будущих периодов для прогноза
   * @returns {Array} - массив прогнозных данных свечей
   */
  generateForecastData(historicalData, timeframe = '1d', periods = 30) {
    if (!historicalData || historicalData.length === 0) {
      console.error('Нет исторических данных для прогноза');
      return [];
    }

    // Берем последнюю свечу как основу для прогноза
    const lastCandle = historicalData[historicalData.length - 1];
    const forecastData = [];
    
    // Определяем интервал времени в секундах
    let intervalInSeconds;
    switch(timeframe) {
      case '1m': intervalInSeconds = 60; break;
      case '5m': intervalInSeconds = 5 * 60; break;
      case '15m': intervalInSeconds = 15 * 60; break;
      case '30m': intervalInSeconds = 30 * 60; break;
      case '1h': intervalInSeconds = 60 * 60; break;
      case '4h': intervalInSeconds = 4 * 60 * 60; break;
      case '1d': intervalInSeconds = 24 * 60 * 60; break;
      case '1w': intervalInSeconds = 7 * 24 * 60 * 60; break;
      default: intervalInSeconds = 24 * 60 * 60;
    }

    // Базовая волатильность, используемая для прогноза
    const volatility = lastCandle.close * 0.02; // 2% волатильность
    
    // Генерируем прогнозные свечи
    for (let i = 1; i <= periods; i++) {
      // Время следующей свечи
      const time = lastCandle.time + i * intervalInSeconds;
      
      // Генерируем случайные изменения цен с учетом предыдущих данных
      // Используем нормальное распределение для более реалистичных изменений
      const randomFactor = this._normalRandom(0, 1);
      const trendFactor = this._calculateTrend(historicalData); // Учитываем тренд
      
      // Рассчитываем цены для новой свечи
      const open = lastCandle.close;
      const close = open * (1 + (randomFactor * 0.01) + (trendFactor * 0.005));
      const high = Math.max(open, close) * (1 + Math.abs(randomFactor) * 0.005);
      const low = Math.min(open, close) * (1 - Math.abs(randomFactor) * 0.005);
      const volume = lastCandle.volume ? Math.max(1, lastCandle.volume * (1 + randomFactor * 0.1)) : 0;
      
      // Добавляем новую свечу в прогноз
      forecastData.push({
        time,
        open,
        high,
        low,
        close,
        volume,
        isForecast: true // Маркер, что это прогнозные данные
      });
    }

    return forecastData;
  }

  /**
   * Получает прогнозные и исторические данные для графика
   * @param {string} timeframe - временной интервал
   * @param {number} forecastPeriods - количество периодов для прогноза
   * @returns {Promise<Object>} - объект с историческими и прогнозными данными
   */
  async getExtendedChartData(timeframe = '1d', forecastPeriods = 30) {
    try {
      // Получаем исторические данные
      const historicalData = await BitcoinService.getCandlestickData(timeframe);
      
      // Генерируем прогноз
      const forecastData = this.generateForecastData(historicalData, timeframe, forecastPeriods);
      
      // Объединяем данные
      const combinedData = [...historicalData, ...forecastData];
      
      // Получаем временной диапазон для прогнозных лунных событий
      const startDate = new Date(historicalData[historicalData.length - 1].time * 1000);
      const endDate = new Date(forecastData[forecastData.length - 1].time * 1000);
      
      // Получаем лунные события для прогнозного периода
      const lunarEvents = await EventsService.getLunarEvents(startDate, endDate);
      
      return {
        historicalData,
        forecastData,
        combinedData,
        lunarEvents
      };
    } catch (error) {
      console.error('Ошибка при получении расширенных данных графика:', error);
      return {
        historicalData: [],
        forecastData: [],
        combinedData: [],
        lunarEvents: []
      };
    }
  }

  /**
   * Генерирует случайное число с нормальным распределением
   * @param {number} mean - среднее значение
   * @param {number} stdDev - стандартное отклонение
   * @returns {number} - случайное число
   * @private
   */
  _normalRandom(mean = 0, stdDev = 1) {
    // Используем метод Бокса-Мюллера для генерации нормально распределенной случайной величины
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdDev;
  }

  /**
   * Рассчитывает тренд на основе исторических данных
   * @param {Array} historicalData - исторические данные свечей
   * @returns {number} - коэффициент тренда (положительный - восходящий, отрицательный - нисходящий)
   * @private
   */
  _calculateTrend(historicalData) {
    if (historicalData.length < 10) return 0;
    
    // Используем последние 10 свечей для определения тренда
    const recentCandles = historicalData.slice(-10);
    const firstPrice = recentCandles[0].close;
    const lastPrice = recentCandles[recentCandles.length - 1].close;
    
    // Рассчитываем процентное изменение
    const percentChange = (lastPrice - firstPrice) / firstPrice;
    
    return percentChange;
  }
}

// Экспортируем синглтон
export default new ForecastService(); 