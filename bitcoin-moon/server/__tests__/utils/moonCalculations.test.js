const {
  calculateMoonPhase,
  getMoonPhaseName,
  getMoonPhasesForPeriod,
  findNextSignificantPhases
} = require('../../src/utils/moonCalculations');

describe('Функции расчета фаз луны', () => {
  describe('calculateMoonPhase', () => {
    it('возвращает значение в диапазоне от 0 до 1', () => {
      const date = new Date();
      const phase = calculateMoonPhase(date);
      
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThanOrEqual(1);
    });
    
    it('принимает строковое представление даты', () => {
      const dateStr = '2023-01-01T12:00:00Z';
      const phase = calculateMoonPhase(dateStr);
      
      expect(typeof phase).toBe('number');
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThanOrEqual(1);
    });
    
    it('возвращает одинаковые значения для одинаковых дат', () => {
      const date1 = new Date('2022-01-01T12:00:00Z');
      const date2 = new Date('2022-01-01T12:00:00Z');
      
      const phase1 = calculateMoonPhase(date1);
      const phase2 = calculateMoonPhase(date2);
      
      expect(phase1).toBe(phase2);
    });
  });
  
  describe('getMoonPhaseName', () => {
    it('возвращает "Новолуние" для значений близких к 0', () => {
      expect(getMoonPhaseName(0)).toBe('Новолуние');
      expect(getMoonPhaseName(0.01)).toBe('Новолуние');
      expect(getMoonPhaseName(0.99)).toBe('Новолуние');
    });
    
    it('возвращает "Полнолуние" для значений около 0.5', () => {
      expect(getMoonPhaseName(0.5)).toBe('Полнолуние');
      expect(getMoonPhaseName(0.51)).toBe('Полнолуние');
      expect(getMoonPhaseName(0.56)).toBe('Полнолуние');
    });
    
    it('возвращает правильные названия для промежуточных фаз', () => {
      expect(getMoonPhaseName(0.25)).toBe('Первая четверть');
      expect(getMoonPhaseName(0.75)).toBe('Последняя четверть');
    });
  });
  
  describe('getMoonPhasesForPeriod', () => {
    it('возвращает правильное количество дней в диапазоне', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-10');
      
      // 10 дней включая начальную и конечную даты
      const expectedDaysCount = 10;
      
      const phases = getMoonPhasesForPeriod(startDate, endDate);
      
      expect(phases.length).toBe(expectedDaysCount);
    });
    
    it('возвращает правильные данные для каждого дня', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-01');
      
      const phases = getMoonPhasesForPeriod(startDate, endDate);
      
      expect(phases.length).toBe(1);
      expect(phases[0]).toHaveProperty('date');
      expect(phases[0]).toHaveProperty('phase');
      expect(phases[0]).toHaveProperty('phaseName');
      
      // Проверяем, что дата соответствует
      expect(phases[0].date.toDateString()).toBe(startDate.toDateString());
    });
  });
  
  describe('findNextSignificantPhases', () => {
    it('возвращает запрошенное количество фаз', () => {
      const fromDate = new Date();
      const count = 3;
      
      const phases = findNextSignificantPhases(fromDate, count);
      
      expect(phases.length).toBe(count);
    });
    
    it('возвращает только новолуния и полнолуния', () => {
      const fromDate = new Date();
      const phases = findNextSignificantPhases(fromDate, 6);
      
      phases.forEach(phase => {
        expect(['Новолуние', 'Полнолуние']).toContain(phase.type);
      });
    });
    
    it('возвращает фазы с возрастающими датами', () => {
      const fromDate = new Date();
      const phases = findNextSignificantPhases(fromDate, 4);
      
      for (let i = 1; i < phases.length; i++) {
        expect(phases[i].date.getTime()).toBeGreaterThan(phases[i-1].date.getTime());
      }
    });
  });
}); 