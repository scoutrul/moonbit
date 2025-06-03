import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger, IConfig, IBitcoinService, IBitcoinPriceResponse, IBitcoinHistoricalResponse } from '../types/interfaces';

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
      
      // В реальном приложении здесь будет запрос к API
      // Для примера используем моковые данные
      const response = await this.fetchCurrentPrice();
      
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