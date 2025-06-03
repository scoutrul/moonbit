import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger, IConfig, IMoonRepository, IMoonSignificantPhase } from '../types/interfaces';

/**
 * Репозиторий для работы с данными о луне
 */
@injectable()
export class MoonRepository implements IMoonRepository {
  private phasesCache: any = null;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfig
  ) {
    this.logger.info('MoonRepository: инициализация');
  }

  /**
   * Получает данные о фазах луны
   * @returns {Promise<any>} Данные о фазах луны
   */
  public async fetchMoonPhases(): Promise<any> {
    this.logger.debug('MoonRepository: запрос данных о фазах луны');
    
    // Заглушка для запроса к API
    return {
      phases: [
        {
          date: new Date().toISOString(),
          phase: 0.5,
          phaseName: 'Полнолуние'
        }
      ]
    };
  }

  /**
   * Получает кэшированные данные о фазах луны
   * @returns {any} Кэшированные данные о фазах луны
   */
  public getPhasesCache(): any {
    return this.phasesCache;
  }

  /**
   * Вычисляет фазу луны для указанной даты
   * @param {Date} date - Дата для вычисления фазы
   * @returns {number} Фаза луны (от 0 до 1)
   */
  public calculatePhase(date: Date): number {
    // Упрощенный расчет фазы луны
    const now = new Date();
    const daysSinceEpoch = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
    const moonCycle = 29.53; // Лунный цикл в днях
    const phase = (daysSinceEpoch % moonCycle) / moonCycle;
    
    return phase;
  }

  /**
   * Получает название фазы луны по ее числовому значению
   * @param {number} phase - Фаза луны (от 0 до 1)
   * @returns {string} Название фазы луны
   */
  public getPhaseName(phase: number): string {
    if (phase < 0.03 || phase >= 0.97) return 'Новолуние';
    if (phase < 0.22) return 'Растущий серп';
    if (phase < 0.28) return 'Первая четверть';
    if (phase < 0.47) return 'Растущая луна';
    if (phase < 0.53) return 'Полнолуние';
    if (phase < 0.72) return 'Убывающая луна';
    if (phase < 0.78) return 'Последняя четверть';
    return 'Убывающий серп';
  }

  /**
   * Вычисляет предстоящие значимые фазы луны
   * @param {Date} startDate - Начальная дата
   * @param {number} count - Количество фаз для вычисления
   * @returns {IMoonSignificantPhase[]} Значимые фазы луны
   */
  public calculateUpcomingSignificantPhases(startDate: Date, count: number): IMoonSignificantPhase[] {
    const significantPhases: IMoonSignificantPhase[] = [];
    const now = new Date(startDate);
    const moonCycle = 29.53; // Лунный цикл в днях
    const msInDay = 24 * 60 * 60 * 1000;
    
    // Значимые фазы: новолуние (0), первая четверть (0.25), полнолуние (0.5), последняя четверть (0.75)
    const significantPhaseValues = [0, 0.25, 0.5, 0.75];
    const phaseNames = ['Новолуние', 'Первая четверть', 'Полнолуние', 'Последняя четверть'];
    const phaseTypes = ['new', 'first-quarter', 'full', 'last-quarter'];
    const icons = ['new-moon', 'first-quarter', 'full-moon', 'last-quarter'];
    
    for (let i = 0; i < count; i++) {
      const dayOffset = i * (moonCycle / 4); // Примерно каждые 7.38 дней
      const phaseDate = new Date(now.getTime() + dayOffset * msInDay);
      const phaseIndex = i % 4;
      
      significantPhases.push({
        date: phaseDate.toISOString(),
        type: phaseTypes[phaseIndex],
        phase: significantPhaseValues[phaseIndex],
        phaseName: phaseNames[phaseIndex],
        title: phaseNames[phaseIndex],
        icon: icons[phaseIndex]
      });
    }
    
    return significantPhases;
  }
} 