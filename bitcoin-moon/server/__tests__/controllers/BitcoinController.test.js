import BitcoinController from '../../src/controllers/BitcoinController.js';
import bitcoinService from '../../src/services/BitcoinService.js';
import { validateResponse } from '../../src/utils/validators.js';

// Мокаем зависимости
jest.mock('../../src/services/BitcoinService.js');
jest.mock('../../src/utils/validators.js');
jest.mock('../../src/utils/logger.js');

describe('BitcoinController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Сбрасываем все моки перед каждым тестом
    jest.clearAllMocks();

    // Создаем моки для req, res и next
    req = {
      query: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Мокаем методы сервиса
    bitcoinService.getCurrentPrice = jest.fn().mockReturnValue({
      usd: {
        price: 50000,
        change_24h: 2.5,
        market_cap: 1000000000,
        volume_24h: 50000000,
      },
    });

    bitcoinService.getHistoricalData = jest.fn().mockReturnValue({
      usd: {
        data: [
          { timestamp: 1640995200000, price: 47000 },
          { timestamp: 1641081600000, price: 48000 },
          { timestamp: 1641168000000, price: 50000 },
        ],
      },
    });

    bitcoinService.getPriceAnalysis = jest.fn().mockReturnValue({
      trend: 'bullish',
      support: 45000,
      resistance: 55000,
      rsi: 65,
    });

    // Мокаем валидатор
    validateResponse.mockReturnValue({ isValid: true });
  });

  describe('getCurrentPrice', () => {
    it('должен возвращать текущую цену биткоина', async () => {
      await BitcoinController.getCurrentPrice(req, res, next);

      expect(bitcoinService.getCurrentPrice).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        usd: {
          price: 50000,
          change_24h: 2.5,
          market_cap: 1000000000,
          volume_24h: 50000000,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки', async () => {
      const error = new Error('API недоступен');
      bitcoinService.getCurrentPrice.mockImplementation(() => {
        throw error;
      });

      await BitcoinController.getCurrentPrice(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getHistoricalData', () => {
    it('должен возвращать исторические данные', async () => {
      req.query = { days: '7', currency: 'usd' };

      await BitcoinController.getHistoricalData(req, res, next);

      expect(bitcoinService.getHistoricalData).toHaveBeenCalledWith('7', 'usd');
      expect(res.json).toHaveBeenCalledWith({
        usd: {
          data: [
            { timestamp: 1640995200000, price: 47000 },
            { timestamp: 1641081600000, price: 48000 },
            { timestamp: 1641168000000, price: 50000 },
          ],
        },
      });
    });

    it('должен использовать значения по умолчанию', async () => {
      await BitcoinController.getHistoricalData(req, res, next);

      expect(bitcoinService.getHistoricalData).toHaveBeenCalledWith('30', 'usd');
    });
  });

  describe('getPriceAnalysis', () => {
    it('должен возвращать анализ цены', async () => {
      await BitcoinController.getPriceAnalysis(req, res, next);

      expect(bitcoinService.getPriceAnalysis).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        trend: 'bullish',
        support: 45000,
        resistance: 55000,
        rsi: 65,
      });
    });
  });
});
