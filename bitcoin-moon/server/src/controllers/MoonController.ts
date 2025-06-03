import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { IMoonService } from '../types/interfaces';
import logger from '../utils/logger';

/**
 * Контроллер для работы с данными о луне
 */
@injectable()
export class MoonController {
  constructor(@inject(TYPES.MoonService) private moonService: IMoonService) {}

  /**
   * Получает текущую фазу луны
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getCurrentPhase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('MoonController: запрос текущей фазы луны');
      
      const data = await this.moonService.getCurrentPhase();
      
      res.json(data);
    } catch (error) {
      logger.error('MoonController: ошибка при получении текущей фазы луны', { error });
      next(error);
    }
  }

  /**
   * Получает фазы луны за период
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getPhasesForPeriod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      logger.debug('MoonController: запрос фаз луны за период', { startDate, endDate });
      
      const data = await this.moonService.getPhasesForPeriod(startDate, endDate);
      
      res.json(data);
    } catch (error) {
      logger.error('MoonController: ошибка при получении фаз луны за период', { error });
      next(error);
    }
  }

  /**
   * Получает следующие значимые фазы луны
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getNextSignificantPhases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = parseInt(req.query.count as string) || 5;
      
      logger.debug('MoonController: запрос следующих значимых фаз луны', { count });
      
      const data = await this.moonService.getNextSignificantPhases(count);
      
      res.json(data);
    } catch (error) {
      logger.error('MoonController: ошибка при получении следующих значимых фаз луны', { error });
      next(error);
    }
  }
} 