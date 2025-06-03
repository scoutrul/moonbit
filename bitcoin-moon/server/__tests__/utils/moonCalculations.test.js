import {
  calculateMoonPhase,
  getMoonPhaseName,
  getMoonPhasesForPeriod,
  findNextSignificantPhases,
} from '../../src/utils/moonCalculations.js';

describe('Функции расчета фаз луны', () => {
  describe('calculateMoonPhase', () => {
    it('должен рассчитывать фазу луны для заданной даты', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const phase = calculateMoonPhase(date);
      
      expect(typeof phase).toBe('object');
      expect(phase).toHaveProperty('phase');
      expect(phase).toHaveProperty('illumination');
      expect(phase).toHaveProperty('age');
      expect(phase.illumination).toBeGreaterThanOrEqual(0);
      expect(phase.illumination).toBeLessThanOrEqual(1);
    });

    it('должен возвращать разные фазы для разных дат', () => {
      const date1 = new Date('2024-01-01T12:00:00Z');
      const date2 = new Date('2024-01-15T12:00:00Z');
      
      const phase1 = calculateMoonPhase(date1);
      const phase2 = calculateMoonPhase(date2);
      
      expect(phase1.age).not.toBe(phase2.age);
    });
  });

  describe('getMoonPhaseName', () => {
    it('должен возвращать правильные названия фаз', () => {
      expect(getMoonPhaseName(0)).toBe('new_moon');
      expect(getMoonPhaseName(0.25)).toBe('first_quarter');
      expect(getMoonPhaseName(0.5)).toBe('full_moon');
      expect(getMoonPhaseName(0.75)).toBe('last_quarter');
    });

    it('должен обрабатывать промежуточные значения', () => {
      expect(getMoonPhaseName(0.1)).toBe('waxing_crescent');
      expect(getMoonPhaseName(0.4)).toBe('waxing_gibbous');
      expect(getMoonPhaseName(0.6)).toBe('waning_gibbous');
      expect(getMoonPhaseName(0.9)).toBe('waning_crescent');
    });
  });

  describe('getMoonPhasesForPeriod', () => {
    it('должен возвращать фазы для заданного периода', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const phases = getMoonPhasesForPeriod(startDate, endDate);
      
      expect(Array.isArray(phases)).toBe(true);
      expect(phases.length).toBeGreaterThan(0);
      
      phases.forEach(phase => {
        expect(phase).toHaveProperty('date');
        expect(phase).toHaveProperty('phase');
        expect(phase).toHaveProperty('illumination');
        expect(new Date(phase.date)).toBeInstanceOf(Date);
      });
    });
  });

  describe('findNextSignificantPhases', () => {
    it('должен находить следующие значимые фазы', () => {
      const fromDate = new Date('2024-01-01');
      const phases = findNextSignificantPhases(fromDate, 4);
      
      expect(Array.isArray(phases)).toBe(true);
      expect(phases.length).toBeLessThanOrEqual(4);
      
      phases.forEach(phase => {
        expect(phase).toHaveProperty('date');
        expect(phase).toHaveProperty('phase');
        expect(['new_moon', 'first_quarter', 'full_moon', 'last_quarter']).toContain(phase.phase);
      });
    });
  });
});
