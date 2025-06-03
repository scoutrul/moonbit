import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger, IConfig } from '../types/interfaces';

/**
 * Сервис для работы с астрономическими данными
 */
@injectable()
export class AstroService {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfig
  ) {
    this.logger.info('AstroService: инициализация');
  }

  /**
   * Обновляет астрономические данные
   * @returns {Promise<any>} Обновленные данные
   */
  public async updateAstroData(): Promise<any> {
    this.logger.info('AstroService: обновление астрономических данных');
    return Promise.resolve({ success: true });
  }

  /**
   * Получает астрономические события
   * @param {number} days - Количество дней для получения событий
   * @returns {Promise<any[]>} Астрономические события
   */
  public async getAstroEvents(days?: number): Promise<any[]> {
    return Promise.resolve([
      {
        date: new Date().toISOString(),
        type: 'retrograde',
        planet: 'Mercury',
        title: 'Меркурий ретроградный',
        description: 'Меркурий входит в ретроградную фазу',
        icon: 'mercury'
      }
    ]);
  }

  /**
   * Получает данные о планетах
   * @returns {Promise<any[]>} Данные о планетах
   */
  public async getPlanetsData(): Promise<any[]> {
    return Promise.resolve([
      {
        name: 'Mercury',
        position: {
          longitude: 150,
          latitude: 0,
          distance: 0.39
        },
        retrograde: true
      },
      {
        name: 'Venus',
        position: {
          longitude: 210,
          latitude: 0,
          distance: 0.72
        },
        retrograde: false
      }
    ]);
  }
} 