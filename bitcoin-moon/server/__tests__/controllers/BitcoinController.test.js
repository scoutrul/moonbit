const BitcoinController = require('../../src/controllers/BitcoinController');
const bitcoinService = require('../../src/services/BitcoinService');
const { validateResponse } = require('../../src/utils/validators');

// Мокаем зависимости
jest.mock('../../src/services/BitcoinService');
jest.mock('../../src/utils/validators');
jest.mock('../../src/utils/logger');

describe('BitcoinController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Сбрасываем все моки перед каждым тестом
    jest.clearAllMocks();

    // Создаем моки для req, res и next
    req = {
      query: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Мокаем методы сервиса
    bitcoinService.getCurrentPrice = jest.fn().mockReturnValue({
      price: 50000,
      currency: 'usd',
      last_updated: '2023-06-01T12:00:00Z',
      change_24h: 1000,
      change_percentage_24h: 2
    });

    bitcoinService.getHistoricalData = jest.fn().mockReturnValue([
      { date: '2023-05-01', price: 48000 },
      { date: '2023-05-02', price: 49000 },
      { date: '2023-05-03', price: 50000 }
    ]);

    // Мокаем валидацию
    validateResponse.mockImplementation((schema, data) => data);
  });

  describe('getCurrentPrice', () => {
    it('должен возвращать текущую цену биткоина', async () => {
      // Устанавливаем параметры запроса
      req.query.currency = 'usd';

      // Вызываем метод контроллера
      await BitcoinController.getCurrentPrice(req, res, next);

      // Проверяем, что сервис был вызван с правильными параметрами
      expect(bitcoinService.getCurrentPrice).toHaveBeenCalledWith('usd');

      // Проверяем, что ответ был отправлен с правильными данными
      expect(res.json).toHaveBeenCalledWith({
        price: 50000,
        currency: 'usd',
        last_updated: '2023-06-01T12:00:00Z',
        change_24h: 1000,
        change_percentage_24h: 2
      });

      // Проверяем, что next не был вызван (нет ошибок)
      expect(next).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки и вызывать next с ошибкой', async () => {
      // Имитируем ошибку в сервисе
      const error = new Error('Ошибка сервиса');
      bitcoinService.getCurrentPrice.mockImplementationOnce(() => {
        throw error;
      });

      // Вызываем метод контроллера
      await BitcoinController.getCurrentPrice(req, res, next);

      // Проверяем, что next был вызван с ошибкой
      expect(next).toHaveBeenCalledWith(error);

      // Проверяем, что ответ не был отправлен
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getHistoricalData', () => {
    it('должен возвращать исторические данные о биткоине', async () => {
      // Устанавливаем параметры запроса
      req.query.currency = 'usd';
      req.query.days = '30';

      // Вызываем метод контроллера
      await BitcoinController.getHistoricalData(req, res, next);

      // Проверяем, что сервис был вызван с правильными параметрами
      expect(bitcoinService.getHistoricalData).toHaveBeenCalledWith('usd', '30');

      // Проверяем, что ответ был отправлен с правильными данными
      expect(res.json).toHaveBeenCalledWith({
        currency: 'usd',
        days: '30',
        data: [
          { date: '2023-05-01', price: 48000 },
          { date: '2023-05-02', price: 49000 },
          { date: '2023-05-03', price: 50000 }
        ]
      });

      // Проверяем, что next не был вызван (нет ошибок)
      expect(next).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки и вызывать next с ошибкой', async () => {
      // Имитируем ошибку в сервисе
      const error = new Error('Ошибка сервиса');
      bitcoinService.getHistoricalData.mockImplementationOnce(() => {
        throw error;
      });

      // Вызываем метод контроллера
      await BitcoinController.getHistoricalData(req, res, next);

      // Проверяем, что next был вызван с ошибкой
      expect(next).toHaveBeenCalledWith(error);

      // Проверяем, что ответ не был отправлен
      expect(res.json).not.toHaveBeenCalled();
    });
  });
}); 