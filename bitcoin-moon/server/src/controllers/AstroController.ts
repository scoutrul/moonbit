import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import logger from '../utils/logger';

/**
 * Контроллер для работы с астрономическими данными
 */
@injectable()
export class AstroController {
  constructor(@inject(TYPES.AstroService) private astroService: any) {}

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
} 