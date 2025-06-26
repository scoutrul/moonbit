import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { SolarService } from '../services/SolarService';
import logger from '../utils/logger';

/**
 * Контроллер для работы с астрономическими данными
 */
@injectable()
export class AstroController {
  constructor(
    @inject(TYPES.AstroService) private astroService: any,
    @inject(TYPES.SolarService) private solarService: SolarService
  ) {}

  /**
   * Получает астрономические события
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getAstroEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      
      logger.debug('AstroController: запрос астрономических событий', { days });
      
      const events = await this.astroService.getAstroEvents(days);
      
      res.json({ days, events });
    } catch (error) {
      logger.error('AstroController: ошибка при получении астрономических событий', { error });
      next(error);
    }
  }

  /**
   * Получает данные о планетах
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getPlanetsData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('AstroController: запрос данных о планетах');
      
      const planets = await this.astroService.getPlanetsData();
      
      res.json({ planets });
    } catch (error) {
      logger.error('AstroController: ошибка при получении данных о планетах', { error });
      next(error);
    }
  }

  /**
   * Получает сезонные солнечные события (солнцестояния и равноденствия)
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getSeasonalEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      logger.debug('AstroController: запрос сезонных событий', { year });
      
      const events = await this.solarService.calculateSeasonalEvents(year);
      
      res.json({ 
        year, 
        count: events.length,
        events 
      });
    } catch (error: any) {
      logger.error('AstroController: ошибка при получении сезонных событий', { error });
      next(error);
    }
  }

  /**
   * Получает солнечные затмения
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getSolarEclipses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      logger.debug('AstroController: запрос солнечных затмений', { year });
      
      const eclipses = await this.solarService.calculateSolarEclipses(year);
      
      res.json({ 
        year, 
        count: eclipses.length,
        eclipses 
      });
    } catch (error: any) {
      logger.error('AstroController: ошибка при получении солнечных затмений', { error });
      next(error);
    }
  }

  /**
   * Получает лунные затмения
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getLunarEclipses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      logger.debug('AstroController: запрос лунных затмений', { year });
      
      const eclipses = await this.solarService.calculateLunarEclipses(year);
      
      res.json({ 
        year, 
        count: eclipses.length,
        eclipses 
      });
    } catch (error: any) {
      logger.error('AstroController: ошибка при получении лунных затмений', { error });
      next(error);
    }
  }

  /**
   * Получает все солнечные события для диапазона дат
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getAllSolarEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      
      const typesParam = req.query.types as string;
      const requestedTypes = typesParam 
        ? typesParam.split(',') as ('seasonal' | 'solar_eclipse' | 'lunar_eclipse')[]
        : undefined;
      
      logger.debug('AstroController: запрос всех солнечных событий', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(),
        types: requestedTypes 
      });
      
      const events = await this.solarService.getAllSolarEvents(startDate, endDate, requestedTypes);
      
      // Группируем события по категориям для удобства клиента
      const seasonal = events.filter(event => event.category === 'seasonal');
      const solarEclipses = events.filter(event => event.category === 'eclipse' && event.type === 'solar_eclipse');
      const lunarEclipses = events.filter(event => event.category === 'eclipse' && event.type === 'lunar_eclipse');
      
      res.json({ 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        types: requestedTypes || ['seasonal', 'solar_eclipse', 'lunar_eclipse'],
        totalCount: events.length,
        events: {
          seasonal,
          solarEclipses,
          lunarEclipses,
          all: events // Также предоставляем плоский массив
        }
      });
    } catch (error: any) {
      logger.error('AstroController: ошибка при получении всех солнечных событий', { error });
      next(error);
    }
  }

  /**
   * Получает статистику кэша солнечных событий
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getSolarCacheStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('AstroController: запрос статистики кэша солнечных событий');
      
      const stats = this.solarService.getCacheStats();
      
      res.json({ 
        cache: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('AstroController: ошибка при получении статистики кэша', { error });
      next(error);
    }
  }

  /**
   * Очищает кэш солнечных событий
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async clearSolarCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('AstroController: очистка кэша солнечных событий');
      
      this.solarService.clearCache();
      
      res.json({ 
        success: true,
        message: 'Solar events cache cleared',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('AstroController: ошибка при очистке кэша', { error });
      next(error);
    }
  }
} 