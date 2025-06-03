import MoonService from '../../src/services/MoonService.js';
import moonRepository from '../../src/repositories/MoonRepository.js';

// Mock the repository
jest.mock('../../src/repositories/MoonRepository.js', () => ({
  fetchMoonPhases: jest.fn(),
  getPhasesCache: jest.fn(),
  calculatePhase: jest.fn(),
  getPhaseName: jest.fn()
}));

// Мокаем модуль логирования
jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('MoonService', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();
  });

  describe('updatePhaseData', () => {
    it('должен вызывать метод репозитория для получения данных', async () => {
      // Мокируем ответ репозитория
      const mockPhaseData = { phases: [{ date: new Date(), phase: 0.25 }] };
      moonRepository.fetchMoonPhases.mockResolvedValue(mockPhaseData);

      // Вызываем тестируемый метод
      const result = await moonService.updatePhaseData();

      // Проверяем результат
      expect(result).toEqual(mockPhaseData);
      expect(moonRepository.fetchMoonPhases).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentPhase', () => {
    it('возвращает текущую фазу луны из кэша репозитория', () => {
      // Мокируем данные кэша
      const currentPhase = {
        date: new Date().toISOString(),
        phase: 0.25,
        phaseName: 'Первая четверть'
      };
      
      moonRepository.getPhasesCache.mockReturnValue({
        current: currentPhase,
        last_updated: new Date().toISOString(),
        phases: []
      });

      // Вызываем тестируемый метод
      const result = moonService.getCurrentPhase();

      // Проверяем результат
      expect(result).toEqual(currentPhase);
      expect(moonRepository.getPhasesCache).toHaveBeenCalledTimes(1);
    });

    it('рассчитывает фазу, если в кэше нет текущих данных', () => {
      // Мокируем пустой кэш
      moonRepository.getPhasesCache.mockReturnValue({
        last_updated: new Date().toISOString(),
        phases: []
      });

      // Мокируем расчет фазы
      moonRepository.calculatePhase.mockReturnValue(0.25);
      moonRepository.getPhaseName.mockReturnValue('Первая четверть');

      // Вызываем тестируемый метод
      const result = moonService.getCurrentPhase();

      // Проверяем результат
      expect(result).toHaveProperty('phase', 0.25);
      expect(result).toHaveProperty('phaseName', 'Первая четверть');
      expect(moonRepository.calculatePhase).toHaveBeenCalledTimes(1);
      expect(moonRepository.getPhaseName).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPhasesForPeriod', () => {
    it('возвращает фазы луны за период', () => {
      // Мокируем функции репозитория
      moonRepository.calculatePhase.mockImplementation(() => 0.25);
      moonRepository.getPhaseName.mockImplementation(() => 'Первая четверть');

      // Вызываем тестируемый метод
      const result = moonService.getPhasesForPeriod('2023-01-01', '2023-01-02');

      // Проверяем результат
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('phase', 0.25);
      expect(result[0]).toHaveProperty('phaseName', 'Первая четверть');
      expect(moonRepository.calculatePhase).toHaveBeenCalledTimes(2);
      expect(moonRepository.getPhaseName).toHaveBeenCalledTimes(2);
    });

    it('обрабатывает ошибки при некорректных датах', () => {
      // Проверяем, что метод выбрасывает ошибку при некорректных датах
      expect(() => moonService.getPhasesForPeriod('invalid-date', '2023-01-02')).toThrow('Некорректный формат дат');
    });
  });

  describe('getNextSignificantPhases', () => {
    it('возвращает следующие значимые фазы луны из кэша', () => {
      // Мокируем данные кэша
      const phases = [
        { date: new Date('2023-01-06'), type: 'Новолуние', phase: 0 },
        { date: new Date('2023-01-21'), type: 'Полнолуние', phase: 0.5 }
      ];
      
      moonRepository.getPhasesCache.mockReturnValue({
        last_updated: new Date().toISOString(),
        phases: phases
      });

      // Вызываем тестируемый метод
      const result = moonService.getNextSignificantPhases(2);

      // Проверяем результат
      expect(result).toEqual(phases);
      expect(moonRepository.getPhasesCache).toHaveBeenCalledTimes(1);
    });

    it('рассчитывает фазы, если кэш пустой', () => {
      // Мокируем пустой кэш
      moonRepository.getPhasesCache.mockReturnValue({
        last_updated: new Date().toISOString(),
        phases: []
      });

      // Мокируем расчет значимых фаз
      const phases = [{ date: new Date(), type: 'Новолуние', phase: 0 }];
      moonRepository.calculateUpcomingSignificantPhases.mockReturnValue(phases);

      // Вызываем тестируемый метод
      const result = moonService.getNextSignificantPhases(1);

      // Проверяем результат
      expect(result).toEqual(phases);
      expect(moonRepository.calculateUpcomingSignificantPhases).toHaveBeenCalledTimes(1);
    });
  });

  describe('analyzeMoonInfluence', () => {
    it('возвращает анализ влияния фаз луны', () => {
      // Вызываем тестируемый метод
      const result = moonService.analyzeMoonInfluence({});

      // Проверяем результат
      expect(result).toHaveProperty('newMoonImpact');
      expect(result).toHaveProperty('fullMoonImpact');
      expect(result).toHaveProperty('correlation');
    });
  });
});
