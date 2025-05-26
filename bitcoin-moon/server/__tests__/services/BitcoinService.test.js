const BitcoinService = require('../../src/services/BitcoinService');

// Мокируем модуль node-fetch
jest.mock('node-fetch');
const fetch = require('node-fetch');

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

  describe('getCurrentPrice', () => {
    it('should return cached price if cache is valid', async () => {
      // Устанавливаем мок для внутреннего метода
      const mockShouldUpdateCache = jest.spyOn(BitcoinService, 'shouldUpdateCache');
      mockShouldUpdateCache.mockReturnValue(false);

      // Установим данные в кэш
      BitcoinService.priceCache = {
        price: 50000,
        change24h: 2.5,
      };

      const result = await BitcoinService.getCurrentPrice();

      // Проверяем результат
      expect(result).toEqual({
        price: 50000,
        change24h: 2.5,
      });
      expect(mockShouldUpdateCache).toHaveBeenCalledWith('price');
      expect(fetch).not.toHaveBeenCalled();

      // Восстанавливаем оригинальный метод
      mockShouldUpdateCache.mockRestore();
    });

    it('should update price data if cache is invalid', async () => {
      // Устанавливаем мок для внутреннего метода
      const mockShouldUpdateCache = jest.spyOn(BitcoinService, 'shouldUpdateCache');
      mockShouldUpdateCache.mockReturnValue(true);

      // Мокируем ответ fetch
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          bitcoin: {
            usd: 55000,
            usd_24h_change: 3.2,
          },
        }),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await BitcoinService.getCurrentPrice();

      // Проверяем результат
      expect(result).toEqual({
        price: 55000,
        change24h: 3.2,
      });
      expect(mockShouldUpdateCache).toHaveBeenCalledWith('price');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
      );

      // Проверяем обновление кэша
      expect(BitcoinService.priceCache).toEqual({
        price: 55000,
        change24h: 3.2,
      });
      expect(BitcoinService.lastUpdate.price).toBeDefined();

      // Восстанавливаем оригинальный метод
      mockShouldUpdateCache.mockRestore();
    });

    it('should handle API errors', async () => {
      // Устанавливаем мок для внутреннего метода
      const mockShouldUpdateCache = jest.spyOn(BitcoinService, 'shouldUpdateCache');
      mockShouldUpdateCache.mockReturnValue(true);

      // Мокируем ошибку fetch
      fetch.mockRejectedValue(new Error('API Error'));

      // Проверяем, что ошибка обрабатывается
      await expect(BitcoinService.getCurrentPrice()).rejects.toThrow('API Error');

      // Восстанавливаем оригинальный метод
      mockShouldUpdateCache.mockRestore();
    });
  });

  describe('shouldUpdateCache', () => {
    it('should return true if cache is not set', () => {
      BitcoinService.lastUpdate.price = null;
      expect(BitcoinService.shouldUpdateCache('price')).toBe(true);
    });

    it('should return true if cache is expired', () => {
      // Устанавливаем время последнего обновления на 2 минуты назад
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      BitcoinService.lastUpdate.price = twoMinutesAgo;

      expect(BitcoinService.shouldUpdateCache('price')).toBe(true);
    });

    it('should return false if cache is still valid', () => {
      // Устанавливаем время последнего обновления на 30 секунд назад
      const thirtySecondsAgo = Date.now() - 30 * 1000;
      BitcoinService.lastUpdate.price = thirtySecondsAgo;

      expect(BitcoinService.shouldUpdateCache('price')).toBe(false);
    });
  });
});
