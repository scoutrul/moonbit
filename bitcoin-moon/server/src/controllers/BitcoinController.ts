import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { IBitcoinService } from '../types/interfaces';
import logger from '../utils/logger';

// ============ КОНСТАНТЫ ============
const API_LIMITS = {
  MAX_KLINE_LIMIT: 1000,             // Максимальный лимит свечей (соответствует Bybit API)
  MIN_KLINE_LIMIT: 1,                // Минимальный лимит свечей
  DEFAULT_KLINE_LIMIT: 200,          // Лимит по умолчанию для обычных запросов
  DEFAULT_PAGINATION_LIMIT: 50,     // Лимит по умолчанию для пагинации
} as const;

/**
 * Контроллер для работы с данными о биткоине
 */
@injectable()
export class BitcoinController {
  constructor(@inject(TYPES.BitcoinService) private bitcoinService: IBitcoinService) {}

  /**
   * Получает текущую цену биткоина
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getCurrentPrice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('BitcoinController: запрос текущей цены биткоина');
      
      const data = await this.bitcoinService.getCurrentPrice();
      
      // Преобразуем формат ответа в плоский объект для совместимости с клиентом
      const responseData = {
        price: data.usd.price,
        currency: 'usd',
        last_updated: new Date().toISOString(),
        change_24h: data.usd.change_24h,
        change_percentage_24h: data.usd.change_24h !== 0 ? (data.usd.change_24h / data.usd.price) * 100 : 0,
        market_cap: data.usd.market_cap,
        volume_24h: data.usd.volume_24h,
      };
      
      res.json(responseData);
    } catch (error) {
      logger.error('BitcoinController: ошибка при получении текущей цены', { error });
      next(error);
    }
  }

  /**
   * Получает исторические данные о цене биткоина
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getHistoricalData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query.days as string || '30';
      const currency = req.query.currency as string || 'usd';
      
      logger.debug('BitcoinController: запрос исторических данных о биткоине', { days, currency });
      
      const data = await this.bitcoinService.getHistoricalData(days, currency);
      
      res.json(data);
    } catch (error) {
      logger.error('BitcoinController: ошибка при получении исторических данных', { error });
      next(error);
    }
  }

  /**
   * Получает данные свечей с Bybit
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getBybitCandles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const timeframe = req.query.timeframe as string || '1d';
      const limit = parseInt(req.query.limit as string || API_LIMITS.DEFAULT_KLINE_LIMIT.toString(), 10);
      
      logger.debug('BitcoinController: запрос свечей с Bybit', { timeframe, limit });
      
      // Проверяем, что timeframe имеет допустимое значение
      const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
      if (!validTimeframes.includes(timeframe)) {
        res.status(400).json({ 
          error: 'Invalid timeframe', 
          validTimeframes 
        });
        return;
      }
      
      // Проверяем, что limit находится в допустимом диапазоне
      if (limit < API_LIMITS.MIN_KLINE_LIMIT || limit > API_LIMITS.MAX_KLINE_LIMIT) {
        res.status(400).json({ 
          error: 'Invalid limit', 
          validRange: { min: API_LIMITS.MIN_KLINE_LIMIT, max: API_LIMITS.MAX_KLINE_LIMIT } 
        });
        return;
      }
      
      const data = await this.bitcoinService.getBybitCandlestickData(timeframe, limit);
      
      res.json(data);
    } catch (error) {
      logger.error('BitcoinController: ошибка при получении свечей с Bybit', { error });
      next(error);
    }
  }

  /**
   * Получает анализ цены биткоина
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getPriceAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('BitcoinController: запрос анализа цены биткоина');
      
      const analysis = await this.bitcoinService.getPriceAnalysis();
      
      res.json(analysis);
    } catch (error) {
      logger.error('BitcoinController: ошибка при получении анализа цены', { error });
      next(error);
    }
  }

  /**
   * Получает пагинированные данные свечей для infinite scroll
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getCandlestickPagination(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const timeframe = req.query.timeframe as string || '1d';
      const limit = parseInt(req.query.limit as string || API_LIMITS.DEFAULT_PAGINATION_LIMIT.toString(), 10);
      const endTime = req.query.endTime ? parseInt(req.query.endTime as string, 10) : undefined;
      
      logger.debug('BitcoinController: запрос пагинированных свечей', { timeframe, limit, endTime });
      
      // Проверяем, что timeframe имеет допустимое значение
      const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
      if (!validTimeframes.includes(timeframe)) {
        res.status(400).json({ 
          error: 'Invalid timeframe', 
          validTimeframes 
        });
        return;
      }
      
      // Проверяем, что limit находится в допустимом диапазоне
      if (limit < API_LIMITS.MIN_KLINE_LIMIT || limit > API_LIMITS.MAX_KLINE_LIMIT) {
        res.status(400).json({ 
          error: 'Invalid limit', 
          validRange: { min: API_LIMITS.MIN_KLINE_LIMIT, max: API_LIMITS.MAX_KLINE_LIMIT } 
        });
        return;
      }
      
      const data = await this.bitcoinService.getCandlestickDataWithPagination(timeframe, limit, endTime);
      
      res.json({
        data,
        count: data.length,
        timeframe,
        endTime: endTime || Math.floor(Date.now() / 1000),
        hasMore: data.length === limit // Если получили полный лимит, вероятно есть еще данные
      });
    } catch (error) {
      logger.error('BitcoinController: ошибка при получении пагинированных свечей', { error });
      next(error);
    }
  }
}

// Создаем экземпляр контроллера и экспортируем методы для обратной совместимости
const bitcoinController = new BitcoinController({
  getCurrentPrice: async () => ({
    usd: { price: 50000, change_24h: 2.5, market_cap: 1000000000, volume_24h: 50000000 }
  }),
  getHistoricalData: async () => ({
    usd: { data: [] }
  }),
  updatePriceData: async () => ({
    usd: { price: 50000, change_24h: 2.5, market_cap: 1000000000, volume_24h: 50000000 }
  }),
  updateHistoricalData: async () => ({
    usd: { data: [] }
  }),
  getPriceAnalysis: async () => ({
    trend: 'bullish',
    support: 45000,
    resistance: 55000,
    rsi: 65
  }),
  getBybitCandlestickData: async () => ([]),
  getCandlestickDataWithPagination: async (timeframe, limit, endTime) => {
    // Генерируем моковые данные для заглушки
    const data = [];
    const now = endTime || Math.floor(Date.now() / 1000);
    let intervalInSeconds = 24 * 60 * 60; // 1 день по умолчанию
    
    switch(timeframe) {
      case '1h': intervalInSeconds = 60 * 60; break;
      case '1d': intervalInSeconds = 24 * 60 * 60; break;
      case '1w': intervalInSeconds = 7 * 24 * 60 * 60; break;
    }
    
    for (let i = 0; i < limit; i++) {
      const time = now - (i * intervalInSeconds);
      const basePrice = 45000 + Math.sin(time / (86400 * 30)) * 5000;
      const volatility = basePrice * 0.02;
      
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility * 0.3;
      const low = Math.min(open, close) - Math.random() * volatility * 0.3;
      
      data.push({
        time,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.round(1000 + Math.random() * 9000)
      });
    }
    
    return data.reverse(); // От старых к новым
  }
});

export default {
  getCurrentPrice: bitcoinController.getCurrentPrice.bind(bitcoinController),
  getHistoricalData: bitcoinController.getHistoricalData.bind(bitcoinController),
  getPriceAnalysis: bitcoinController.getPriceAnalysis.bind(bitcoinController),
  getBybitCandles: bitcoinController.getBybitCandles.bind(bitcoinController),
  getCandlestickPagination: bitcoinController.getCandlestickPagination.bind(bitcoinController)
}; 