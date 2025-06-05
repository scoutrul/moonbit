import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { IBitcoinService } from '../types/interfaces';
import logger from '../utils/logger';

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
      
      res.json(data);
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
      const limit = parseInt(req.query.limit as string || '200', 10);
      
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
      if (limit < 1 || limit > 1000) {
        res.status(400).json({ 
          error: 'Invalid limit', 
          validRange: { min: 1, max: 1000 } 
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
  getBybitCandlestickData: async () => ([])
});

export default {
  getCurrentPrice: bitcoinController.getCurrentPrice.bind(bitcoinController),
  getHistoricalData: bitcoinController.getHistoricalData.bind(bitcoinController),
  getPriceAnalysis: bitcoinController.getPriceAnalysis.bind(bitcoinController),
  getBybitCandles: bitcoinController.getBybitCandles.bind(bitcoinController)
}; 