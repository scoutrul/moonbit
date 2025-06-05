import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger, IConfig, IBitcoinService, IBitcoinPriceResponse, IBitcoinHistoricalResponse } from '../types/interfaces';
import crypto from 'crypto';

/**
 * Сервис для работы с данными о биткоине
 * Предоставляет методы для получения текущей цены и исторических данных
 */
@injectable()
export class BitcoinService implements IBitcoinService {
  private cacheFilePath: string;
  private priceData: IBitcoinPriceResponse;
  private historicalData: IBitcoinHistoricalResponse;
  private lastUpdated: Date;
  private bybitApiKey: string = 'yeQUyZ3dZUpaapHoXG';
  private bybitApiSecret: string = 'LJEIF5s68zTBENsW0XJaBUn0Ou1C1ZulNbZS';
  private bybitApiUrl: string = 'https://api.bybit.com';

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfig
  ) {
    this.cacheFilePath = path.join(this.config.paths.cache, 'bitcoin_data.json');
    this.priceData = {
      usd: {
        price: 0,
        change_24h: 0,
        market_cap: 0,
        volume_24h: 0
      }
    };
    this.historicalData = {
      usd: {
        data: []
      }
    };
    this.lastUpdated = new Date(0);

    // Загружаем данные из кэша при инициализации
    this.loadFromCache();
  }

  /**
   * Получает текущую цену биткоина
   * @returns {Promise<IBitcoinPriceResponse>} Текущая цена и другие метрики
   */
  public async getCurrentPrice(): Promise<IBitcoinPriceResponse> {
    try {
      // Проверяем, не устарели ли данные (15 минут)
      const now = new Date();
      const cacheAge = now.getTime() - this.lastUpdated.getTime();
      const maxCacheAge = this.config.cache?.bitcoin.priceTtl || 15 * 60 * 1000;

      if (cacheAge > maxCacheAge) {
        this.logger.debug('BitcoinService: данные устарели, обновляем');
        await this.updatePriceData();
      }

      return this.priceData;
    } catch (error) {
      this.logger.error('BitcoinService: ошибка при получении текущей цены', { error });
      return this.priceData; // Возвращаем кэшированные данные в случае ошибки
    }
  }

  /**
   * Получает исторические данные о цене биткоина
   * @param {string} days - Количество дней для исторических данных
   * @param {string} currency - Валюта для данных
   * @returns {Promise<IBitcoinHistoricalResponse>} Исторические данные о цене
   */
  public async getHistoricalData(days: string, currency: string): Promise<IBitcoinHistoricalResponse> {
    try {
      const daysNum = parseInt(days, 10) || 30;
      const curr = currency?.toLowerCase() || 'usd';

      // Проверяем, нужно ли обновить исторические данные (раз в 12 часов)
      const now = new Date();
      const cacheAge = now.getTime() - this.lastUpdated.getTime();
      const maxCacheAge = this.config.cache?.bitcoin.historyTtl || 12 * 60 * 60 * 1000;

      if (cacheAge > maxCacheAge) {
        this.logger.debug('BitcoinService: исторические данные устарели, обновляем');
        await this.updateHistoricalData();
      }

      // Фильтруем данные по запрошенному периоду
      const msInDay = 24 * 60 * 60 * 1000;
      const startTimestamp = now.getTime() - daysNum * msInDay;
      
      const filteredData: IBitcoinHistoricalResponse = {
        usd: {
          data: this.historicalData.usd.data.filter(
            item => item.timestamp >= startTimestamp
          )
        }
      };

      return filteredData;
    } catch (error) {
      this.logger.error('BitcoinService: ошибка при получении исторических данных', { error });
      return this.historicalData; // Возвращаем кэшированные данные в случае ошибки
    }
  }

  /**
   * Обновляет данные о текущей цене биткоина
   * @returns {Promise<IBitcoinPriceResponse>} Обновленные данные о цене
   */
  public async updatePriceData(): Promise<IBitcoinPriceResponse> {
    try {
      this.logger.info('BitcoinService: обновление данных о цене биткоина');
      
      // Используем данные с Bybit API
      const response = await this.fetchBybitPrice();
      
      this.priceData = {
        usd: {
          price: response.price,
          change_24h: response.change_24h,
          market_cap: 1000000000, // Примерное значение
          volume_24h: 50000000 // Примерное значение
        }
      };
      
      this.lastUpdated = new Date();
      this.saveToCache();
      
      return this.priceData;
    } catch (error) {
      this.logger.error('BitcoinService: ошибка при обновлении данных о цене', { error });
      throw error;
    }
  }

  /**
   * Обновляет исторические данные о цене биткоина
   * @returns {Promise<IBitcoinHistoricalResponse>} Обновленные исторические данные
   */
  public async updateHistoricalData(): Promise<IBitcoinHistoricalResponse> {
    try {
      this.logger.info('BitcoinService: обновление исторических данных о биткоине');
      
      // В реальном приложении здесь будет запрос к API
      // Для примера генерируем моковые данные
      const data = this.generateHistoricalData(90); // Данные за 90 дней
      
      this.historicalData = {
        usd: {
          data
        }
      };
      
      this.lastUpdated = new Date();
      this.saveToCache();
      
      return this.historicalData;
    } catch (error) {
      this.logger.error('BitcoinService: ошибка при обновлении исторических данных', { error });
      throw error;
    }
  }

  /**
   * Получает анализ цены биткоина
   * @returns {Promise<any>} Анализ цены
   */
  public async getPriceAnalysis(): Promise<any> {
    try {
      // Получаем актуальные данные
      await this.getCurrentPrice();
      const historicalData = await this.getHistoricalData('30', 'usd');
      
      // Простой анализ тренда
      const prices = historicalData.usd.data.map(item => item.price);
      const firstPrice = prices[0] || 0;
      const lastPrice = prices[prices.length - 1] || 0;
      
      const trend = firstPrice < lastPrice ? 'bullish' : 'bearish';
      
      // Находим максимумы и минимумы для определения уровней поддержки и сопротивления
      const sortedPrices = [...prices].sort((a, b) => a - b);
      const support = sortedPrices[Math.floor(sortedPrices.length * 0.1)]; // 10-й процентиль
      const resistance = sortedPrices[Math.floor(sortedPrices.length * 0.9)]; // 90-й процентиль
      
      // Расчет RSI (упрощенный вариант)
      let gains = 0;
      let losses = 0;
      
      for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) {
          gains += change;
        } else {
          losses -= change;
        }
      }
      
      const avgGain = gains / prices.length;
      const avgLoss = losses / prices.length;
      
      const rs = avgGain / (avgLoss || 1); // Избегаем деления на ноль
      const rsi = 100 - (100 / (1 + rs));
      
      return {
        trend,
        support,
        resistance,
        rsi: Math.round(rsi),
        price: this.priceData.usd.price,
        change_24h: this.priceData.usd.change_24h
      };
    } catch (error) {
      this.logger.error('BitcoinService: ошибка при анализе цены', { error });
      return {
        trend: 'unknown',
        support: 0,
        resistance: 0,
        rsi: 50,
        price: this.priceData.usd.price,
        change_24h: 0
      };
    }
  }

  /**
   * Получает данные о цене биткоина с Bybit
   * @returns {Promise<{price: number, change_24h: number}>} Данные о цене
   */
  private async fetchBybitPrice(): Promise<{price: number, change_24h: number}> {
    try {
      this.logger.info('BitcoinService: запрос данных о цене биткоина с Bybit API');
      
      // Подготовка заголовков для аутентификации
      const timestamp = Date.now().toString();
      const recvWindow = '5000';
      
      // Создание подписи
      const queryString = `api_key=${this.bybitApiKey}&recv_window=${recvWindow}&timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.bybitApiSecret)
        .update(queryString)
        .digest('hex');
      
      // Настройка заголовков
      const headers = {
        'X-BAPI-API-KEY': this.bybitApiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'X-BAPI-SIGN': signature
      };
      
      // Получение тикера BTCUSDT
      const response = await axios.get(`${this.bybitApiUrl}/v5/market/tickers`, {
        params: {
          category: 'spot',
          symbol: 'BTCUSDT'
        },
        headers
      });
      
      if (response.data && response.data.result && response.data.result.list && response.data.result.list.length > 0) {
        const btcData = response.data.result.list[0];
        const price = parseFloat(btcData.lastPrice);
        const prevPrice = parseFloat(btcData.prevPrice24h);
        const change_24h = price - prevPrice;
        
        this.logger.debug('BitcoinService: получены данные о цене биткоина с Bybit', { price, change_24h });
        
        return {
          price,
          change_24h
        };
      } else {
        throw new Error('Некорректный ответ от Bybit API');
      }
    } catch (error) {
      this.logger.error('BitcoinService: ошибка при получении данных с Bybit', { error });
      // Возвращаем резервные данные в случае ошибки
      return await this.fetchCurrentPrice();
    }
  }

  /**
   * Получает исторические данные о цене биткоина с Bybit
   * @param {string} timeframe - Временной интервал (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w)
   * @param {number} limit - Количество свечей
   * @returns {Promise<Array<{time: number, open: number, high: number, low: number, close: number, volume: number}>>} 
   */
  public async getBybitCandlestickData(timeframe: string = '1d', limit: number = 200): Promise<Array<any>> {
    try {
      this.logger.info(`BitcoinService: запрос данных свечей с Bybit API, таймфрейм: ${timeframe}`);
      
      // Подготовка заголовков для аутентификации
      const timestamp = Date.now().toString();
      const recvWindow = '5000';
      
      // Создание подписи
      const queryString = `api_key=${this.bybitApiKey}&recv_window=${recvWindow}&timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.bybitApiSecret)
        .update(queryString)
        .digest('hex');
      
      // Настройка заголовков
      const headers = {
        'X-BAPI-API-KEY': this.bybitApiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'X-BAPI-SIGN': signature
      };
      
      // Конвертируем таймфрейм для API Bybit
      let interval = '1';
      switch(timeframe) {
        case '1m': interval = '1'; break;
        case '5m': interval = '5'; break;
        case '15m': interval = '15'; break;
        case '30m': interval = '30'; break;
        case '1h': interval = '60'; break;
        case '4h': interval = '240'; break;
        case '1d': interval = 'D'; break;
        case '1w': interval = 'W'; break;
        default: interval = 'D';
      }
      
      // Получение исторических данных
      const response = await axios.get(`${this.bybitApiUrl}/v5/market/kline`, {
        params: {
          category: 'spot',
          symbol: 'BTCUSDT',
          interval,
          limit
        },
        headers
      });
      
      if (response.data && response.data.result && response.data.result.list && response.data.result.list.length > 0) {
        // Преобразуем данные в нужный формат
        // Bybit возвращает данные в формате [timestamp, open, high, low, close, volume, turnover]
        const candlestickData = response.data.result.list.map((item: string[]) => ({
          time: Math.floor(parseInt(item[0]) / 1000), // конвертируем миллисекунды в секунды
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5])
        })).reverse(); // Разворачиваем массив, так как Bybit возвращает данные от новых к старым
        
        this.logger.debug(`BitcoinService: получено ${candlestickData.length} свечей с Bybit`);
        
        return candlestickData;
      } else {
        throw new Error('Некорректный ответ от Bybit API при запросе свечей');
      }
    } catch (error) {
      this.logger.error('BitcoinService: ошибка при получении свечей с Bybit', { error });
      // В случае ошибки генерируем моковые данные
      return this.generateCandlestickData(timeframe, limit);
    }
  }

  /**
   * Генерирует моковые данные свечей
   * @param {string} timeframe - Временной интервал
   * @param {number} limit - Количество свечей
   * @returns {Array<{time: number, open: number, high: number, low: number, close: number, volume: number}>}
   * @private
   */
  private generateCandlestickData(timeframe: string, limit: number): Array<any> {
    const data = [];
    const now = new Date();
    const basePrice = 50000;
    let intervalInMs;
    
    // Определяем интервал времени в миллисекундах
    switch(timeframe) {
      case '1m': intervalInMs = 60 * 1000; break;
      case '5m': intervalInMs = 5 * 60 * 1000; break;
      case '15m': intervalInMs = 15 * 60 * 1000; break;
      case '30m': intervalInMs = 30 * 60 * 1000; break;
      case '1h': intervalInMs = 60 * 60 * 1000; break;
      case '4h': intervalInMs = 4 * 60 * 60 * 1000; break;
      case '1d': intervalInMs = 24 * 60 * 60 * 1000; break;
      case '1w': intervalInMs = 7 * 24 * 60 * 60 * 1000; break;
      default: intervalInMs = 24 * 60 * 60 * 1000;
    }
    
    // Генерируем свечи
    for (let i = limit; i >= 0; i--) {
      const timestamp = now.getTime() - i * intervalInMs;
      const volatility = basePrice * 0.02; // 2% волатильность
      
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const volume = Math.round(1000 + Math.random() * 9000);
      
      data.push({
        time: Math.floor(timestamp / 1000),
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    return data;
  }

  /**
   * Загружает данные из кэша
   * @private
   */
  private loadFromCache(): void {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const cacheData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
        
        if (cacheData.priceData) {
          this.priceData = cacheData.priceData;
        }
        
        if (cacheData.historicalData) {
          this.historicalData = cacheData.historicalData;
        }
        
        if (cacheData.lastUpdated) {
          this.lastUpdated = new Date(cacheData.lastUpdated);
        }
        
        this.logger.debug('BitcoinService: данные успешно загружены из кэша');
      } else {
        this.logger.debug('BitcoinService: файл кэша не найден, будет создан при следующем обновлении');
      }
    } catch (error) {
      this.logger.error('BitcoinService: ошибка при загрузке данных из кэша', { error });
    }
  }

  /**
   * Сохраняет данные в кэш
   * @private
   */
  private saveToCache(): void {
    try {
      const cacheData = {
        priceData: this.priceData,
        historicalData: this.historicalData,
        lastUpdated: this.lastUpdated.toISOString()
      };
      
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(cacheData, null, 2));
      this.logger.debug('BitcoinService: данные успешно сохранены в кэш');
    } catch (error) {
      this.logger.error('BitcoinService: ошибка при сохранении данных в кэш', { error });
    }
  }

  /**
   * Генерирует моковые исторические данные
   * @param {number} days - Количество дней для генерации данных
   * @returns {Array} Массив исторических данных
   * @private
   */
  private generateHistoricalData(days: number): Array<{timestamp: number, price: number}> {
    const data = [];
    const now = new Date();
    const basePrice = 50000; // Базовая цена
    const msInDay = 24 * 60 * 60 * 1000;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now.getTime() - i * msInDay;
      // Генерируем случайную цену вокруг базовой цены с трендом вверх
      const randomFactor = 0.1; // 10% случайности
      const trendFactor = 0.05; // 5% общего тренда
      const dayFactor = (days - i) / days; // Фактор дня (от 0 до 1)
      
      const randomComponent = basePrice * randomFactor * (Math.random() * 2 - 1); // Случайное значение от -5% до +5%
      const trendComponent = basePrice * trendFactor * dayFactor; // Трендовая компонента
      
      const price = basePrice + trendComponent + randomComponent;
      
      data.push({
        timestamp,
        price: Math.round(price * 100) / 100 // Округляем до 2 знаков после запятой
      });
    }
    
    return data;
  }

  /**
   * Получает текущую цену биткоина (мок-реализация)
   * @returns {Promise<{price: number, change_24h: number}>} Текущая цена и изменение за 24 часа
   * @private
   */
  private async fetchCurrentPrice(): Promise<{price: number, change_24h: number}> {
    // В реальном приложении здесь будет запрос к API CoinGecko или другому сервису
    // Для примера возвращаем моковые данные
    
    const basePrice = 50000;
    const randomChange = Math.round((Math.random() * 2000 - 1000) * 100) / 100; // Случайное изменение от -1000 до +1000
    
    return {
      price: basePrice + randomChange,
      change_24h: randomChange
    };
  }
}

// Экспортируем экземпляр по умолчанию для обратной совместимости
export default new BitcoinService(
  // Временные заглушки для логгера и конфига
  {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
  },
  {
    port: 3002,
    environment: 'development',
    cors: {
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    },
    sync: {
      bitcoin: 5 * 60 * 1000,
      moon: 60 * 60 * 1000,
      astro: 12 * 60 * 60 * 1000,
      events: 30 * 60 * 1000
    },
    paths: {
      logs: 'logs',
      cache: 'src/data/cache'
    },
    api: {
      coingecko: 'https://api.coingecko.com/api/v3',
      farmsense: 'https://api.farmsense.net/v1/moonphases/'
    },
    logging: {
      level: 'info',
      fileMaxSize: 5242880,
      file: 'server.log'
    },
    cache: {
      ttl: 3600000,
      ohlc: 60,
      bitcoin: {
        priceTtl: 15 * 60 * 1000,
        historyTtl: 12 * 60 * 60 * 1000,
        priceFile: 'bitcoin_price.json',
        historicalFile: 'bitcoin_historical.json',
        dataFile: 'bitcoin_data.json'
      },
      moon: {
        phaseTtl: 60 * 60 * 1000,
        phaseFile: 'moon_phase.json'
      },
      astro: {
        dataTtl: 12 * 60 * 60 * 1000,
        dataFile: 'astro_data.json'
      },
      events: {
        dataTtl: 30 * 60 * 1000,
        dataFile: 'events_data.json'
      }
    }
  }
); 