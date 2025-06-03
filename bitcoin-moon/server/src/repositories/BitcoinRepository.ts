import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger, IConfig, IBitcoinRepository, IBitcoinPrice, IBitcoinHistoricalData } from '../types/interfaces';

/**
 * Репозиторий для работы с данными о биткоине
 */
@injectable()
export class BitcoinRepository implements IBitcoinRepository {
  private cacheData: any = null;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfig
  ) {
    this.logger.info('BitcoinRepository: инициализация');
  }

  /**
   * Получает текущую цену биткоина
   * @returns {Promise<IBitcoinPrice>} Текущая цена биткоина
   */
  public async fetchCurrentPrice(): Promise<IBitcoinPrice> {
    this.logger.debug('BitcoinRepository: запрос текущей цены биткоина');
    
    // Заглушка для запроса к API
    return {
      price: 50000 + Math.random() * 2000 - 1000,
      change_24h: Math.random() * 10 - 5,
      change_percentage_24h: Math.random() * 10 - 5,
      currency: 'usd',
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Получает исторические данные о цене биткоина
   * @param {number} days - Количество дней для исторических данных
   * @returns {Promise<IBitcoinHistoricalData>} Исторические данные о цене биткоина
   */
  public async fetchHistoricalData(days: number): Promise<IBitcoinHistoricalData> {
    this.logger.debug('BitcoinRepository: запрос исторических данных о биткоине', { days });
    
    // Генерируем моковые данные
    const data = [];
    const now = new Date();
    const basePrice = 50000;
    const msInDay = 24 * 60 * 60 * 1000;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now.getTime() - i * msInDay;
      const randomFactor = 0.1; // 10% случайности
      const randomComponent = basePrice * randomFactor * (Math.random() * 2 - 1);
      const price = basePrice + randomComponent;
      
      data.push({
        timestamp,
        price: Math.round(price * 100) / 100
      });
    }
    
    return {
      data,
      currency: 'usd'
    };
  }

  /**
   * Получает кэшированные данные
   * @returns {any} Кэшированные данные
   */
  public getCacheData(): any {
    return this.cacheData;
  }

  /**
   * Обновляет кэшированные данные
   * @param {any} data - Данные для кэширования
   */
  public updateCache(data: any): void {
    this.cacheData = data;
    this.logger.debug('BitcoinRepository: кэш обновлен');
  }
} 