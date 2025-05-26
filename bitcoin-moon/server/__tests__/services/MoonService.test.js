const moonService = require('../../src/services/MoonService');
const moonCalculations = require('../../src/utils/moonCalculations');

// Мокаем модуль moonCalculations
jest.mock('../../src/utils/moonCalculations');

describe('MoonService', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();

    // Очищаем кэш перед каждым тестом
    moonService.clearCache();
  });

  describe('getCurrentPhase', () => {
    it('возвращает текущую фазу луны', () => {
      // Настраиваем моки
      moonCalculations.calculateMoonPhase.mockReturnValue(0.25);
      moonCalculations.getMoonPhaseName.mockReturnValue('Первая четверть');

      // Вызываем тестируемый метод
      const result = moonService.getCurrentPhase();

      // Проверяем результат
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('phase', 0.25);
      expect(result).toHaveProperty('phaseName', 'Первая четверть');

      // Проверяем, что моки были вызваны
      expect(moonCalculations.calculateMoonPhase).toHaveBeenCalledTimes(1);
      expect(moonCalculations.getMoonPhaseName).toHaveBeenCalledTimes(1);
      expect(moonCalculations.getMoonPhaseName).toHaveBeenCalledWith(0.25);
    });

    it('обрабатывает ошибки при расчете фазы', () => {
      // Настраиваем моки, чтобы вызвать ошибку
      moonCalculations.calculateMoonPhase.mockImplementation(() => {
        throw new Error('Тестовая ошибка');
      });

      // Проверяем, что метод выбрасывает ошибку
      expect(() => moonService.getCurrentPhase()).toThrow('Тестовая ошибка');
    });
  });

  describe('getPhasesForPeriod', () => {
    it('возвращает фазы луны за период', () => {
      // Настраиваем моки
      const mockPhases = [
        { date: new Date('2023-01-01'), phase: 0.1, phaseName: 'Молодая луна' },
        { date: new Date('2023-01-02'), phase: 0.15, phaseName: 'Молодая луна' },
      ];

      moonCalculations.getMoonPhasesForPeriod.mockReturnValue(mockPhases);

      // Вызываем тестируемый метод
      const result = moonService.getPhasesForPeriod('2023-01-01', '2023-01-02');

      // Проверяем результат
      expect(result).toEqual(mockPhases);

      // Проверяем, что моки были вызваны с правильными параметрами
      expect(moonCalculations.getMoonPhasesForPeriod).toHaveBeenCalledTimes(1);
      expect(moonCalculations.getMoonPhasesForPeriod.mock.calls[0][0].toISOString()).toContain(
        '2023-01-01'
      );
      expect(moonCalculations.getMoonPhasesForPeriod.mock.calls[0][1].toISOString()).toContain(
        '2023-01-02'
      );
    });

    it('использует кэшированные данные при повторном запросе за тот же период', () => {
      // Настраиваем моки
      const mockPhases = [{ date: new Date('2023-01-01'), phase: 0.1, phaseName: 'Молодая луна' }];

      moonCalculations.getMoonPhasesForPeriod.mockReturnValue(mockPhases);

      // Первый запрос
      moonService.getPhasesForPeriod('2023-01-01', '2023-01-01');

      // Второй запрос за тот же период
      moonService.getPhasesForPeriod('2023-01-01', '2023-01-01');

      // Проверяем, что мок был вызван только один раз
      expect(moonCalculations.getMoonPhasesForPeriod).toHaveBeenCalledTimes(1);
    });
  });

  describe('getNextSignificantPhases', () => {
    it('возвращает следующие значимые фазы луны', () => {
      // Настраиваем моки
      const mockPhases = [
        { date: new Date('2023-01-06'), type: 'Новолуние', phase: 0 },
        { date: new Date('2023-01-21'), type: 'Полнолуние', phase: 0.5 },
      ];

      moonCalculations.findNextSignificantPhases.mockReturnValue(mockPhases);

      // Вызываем тестируемый метод
      const result = moonService.getNextSignificantPhases(2);

      // Проверяем результат
      expect(result).toEqual(mockPhases);

      // Проверяем, что моки были вызваны с правильными параметрами
      expect(moonCalculations.findNextSignificantPhases).toHaveBeenCalledTimes(1);
      expect(moonCalculations.findNextSignificantPhases).toHaveBeenCalledWith(expect.any(Date), 2);
    });

    it('использует кэшированные данные при повторном запросе в тот же день', () => {
      // Настраиваем моки
      const mockPhases = [{ date: new Date('2023-01-06'), type: 'Новолуние', phase: 0 }];

      moonCalculations.findNextSignificantPhases.mockReturnValue(mockPhases);

      // Первый запрос
      moonService.getNextSignificantPhases(1);

      // Второй запрос с тем же количеством фаз
      moonService.getNextSignificantPhases(1);

      // Проверяем, что мок был вызван только один раз
      expect(moonCalculations.findNextSignificantPhases).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache', () => {
    it('очищает кэш полностью', () => {
      // Заполняем кэш
      const mockPhases = [{ date: new Date(), phase: 0.1, phaseName: 'Молодая луна' }];
      moonCalculations.getMoonPhasesForPeriod.mockReturnValue(mockPhases);

      // Создаем записи в кэше
      moonService.getPhasesForPeriod('2023-01-01', '2023-01-01');
      moonService.getNextSignificantPhases(1);

      // Очищаем кэш
      moonService.clearCache();

      // Делаем запросы снова, должны вызваться опять моки
      moonService.getPhasesForPeriod('2023-01-01', '2023-01-01');
      moonService.getNextSignificantPhases(1);

      // Проверяем, что моки были вызваны дважды
      expect(moonCalculations.getMoonPhasesForPeriod).toHaveBeenCalledTimes(2);
      expect(moonCalculations.findNextSignificantPhases).toHaveBeenCalledTimes(2);
    });
  });
});
