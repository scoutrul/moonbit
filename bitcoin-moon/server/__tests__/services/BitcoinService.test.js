const BitcoinService = require('../../src/services/BitcoinService');
const bitcoinRepository = require('../../src/repositories/BitcoinRepository');

// Мокируем модуль репозитория
jest.mock('../../src/repositories/BitcoinRepository');

// Мокируем модуль логирования
jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('BitcoinService', () => {
  // Очистка моков перед каждым тестом
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePriceData', () => {
    it('should call repository to fetch price data', async () => {
      // Мокируем ответ репозитория
      const mockPriceData = { price: 55000, change24h: 3.2 };
      bitcoinRepository.fetchCurrentPrice.mockResolvedValue(mockPriceData);

      // Вызываем тестируемый метод
      const result = await BitcoinService.updatePriceData();

      // Проверяем результат
      expect(result).toEqual(mockPriceData);
      expect(bitcoinRepository.fetchCurrentPrice).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentPrice', () => {
    it('should return price data from repository cache', () => {
      // Мокируем данные из кэша репозитория
      bitcoinRepository.getPriceCache.mockReturnValue({
        usd: {
          price: 50000,
          change_24h: 2.5,
          last_updated: new Date().toISOString(),
          change_percentage_24h: 2.5
        }
      });

      // Вызываем тестируемый метод
      const result = BitcoinService.getCurrentPrice();

      // Проверяем результат
      expect(result).toHaveProperty('price', 50000);
      expect(result).toHaveProperty('change_24h', 2.5);
      expect(bitcoinRepository.getPriceCache).toHaveBeenCalledTimes(1);
    });

    it('should trigger cache update if data is stale', () => {
      // Мокируем устаревшие данные из кэша
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 2); // 2 часа назад
      
      bitcoinRepository.getPriceCache.mockReturnValue({
        usd: {
          price: 50000,
          change_24h: 2.5,
          last_updated: oldDate.toISOString(),
          change_percentage_24h: 2.5
        }
      });

      // Сохраняем оригинальный метод updatePriceData
      const originalUpdatePriceData = BitcoinService.updatePriceData;
      // Заменяем на мок для проверки вызова
      BitcoinService.updatePriceData = jest.fn().mockResolvedValue({});

      // Вызываем тестируемый метод
      const result = BitcoinService.getCurrentPrice();

      // Проверяем результат
      expect(result).toHaveProperty('price', 50000);
      expect(BitcoinService.updatePriceData).toHaveBeenCalledTimes(1);

      // Восстанавливаем оригинальный метод
      BitcoinService.updatePriceData = originalUpdatePriceData;
    });
  });

  describe('getHistoricalData', () => {
    it('should return historical data from repository cache', () => {
      // Мокируем данные из кэша репозитория
      const mockData = [
        { timestamp: 1617235200, price: 58000 },
        { timestamp: 1617321600, price: 59500 }
      ];
      
      bitcoinRepository.getHistoricalCache.mockReturnValue({
        usd: {
          data: mockData,
          last_updated: new Date().toISOString()
        }
      });

      // Вызываем тестируемый метод
      const result = BitcoinService.getHistoricalData();

      // Проверяем результат
      expect(result).toEqual(mockData);
      expect(bitcoinRepository.getHistoricalCache).toHaveBeenCalledTimes(1);
    });
  });
});
