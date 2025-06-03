import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import logger from '../utils/logger';

/**
 * Контроллер для работы с событиями
 */
@injectable()
export class EventsController {
  constructor(@inject(TYPES.EventsService) private eventsService: any) {}

  /**
   * Получает предстоящие события
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getUpcomingEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      
      logger.debug('EventsController: запрос предстоящих событий', { days });
      
      const events = await this.eventsService.getUpcomingEvents(days);
      
      res.json({ days, events });
    } catch (error) {
      logger.error('EventsController: ошибка при получении предстоящих событий', { error });
      next(error);
    }
  }

  /**
   * Получает исторические события
   * @param {Request} req - HTTP запрос
   * @param {Response} res - HTTP ответ
   * @param {NextFunction} next - Функция middleware
   */
  public async getHistoricalEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = req.query.endDate as string || new Date().toISOString();
      
      logger.debug('EventsController: запрос исторических событий', { startDate, endDate });
      
      const events = await this.eventsService.getHistoricalEvents(startDate, endDate);
      
      res.json({ startDate, endDate, events });
    } catch (error) {
      logger.error('EventsController: ошибка при получении исторических событий', { error });
      next(error);
    }
  }
} 