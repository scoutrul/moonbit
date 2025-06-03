import BitcoinService from '../../src/services/BitcoinService.js';

// Мокаем внешние зависимости
jest.mock('axios');
jest.mock('../../src/utils/logger.js');

describe('BitcoinService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentPrice', () => {
    it('должен возвращать текущую цену биткоина', () => {
      const price = BitcoinService.getCurrentPrice();
      
      expect(price).toHaveProperty('usd');
      expect(price.usd).toHaveProperty('price');
      expect(typeof price.usd.price).toBe('number');
    });
  });

  describe('getHistoricalData', () => {
    it('должен возвращать исторические данные', () => {
      const data = BitcoinService.getHistoricalData('7', 'usd');
      
      expect(data).toHaveProperty('usd');
      expect(data.usd).toHaveProperty('data');
      expect(Array.isArray(data.usd.data)).toBe(true);
    });
  });
});
