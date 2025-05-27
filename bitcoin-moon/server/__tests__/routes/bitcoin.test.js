const request = require('supertest');
const express = require('express');
const bitcoinService = require('../../src/services/BitcoinService');

// Мокируем сервис биткоина
jest.mock('../../src/services/BitcoinService');

// Мокируем модуль логирования
jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('Bitcoin API Routes', () => {
  let app;

  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();

    // Создаем тестовое Express приложение
    app = express();
    app.use(express.json());
    
    // Создаем упрощенный мок-маршрутизатор 
    const router = express.Router();
    
    // Добавляем тестируемые маршруты
    router.get('/price', (req, res) => {
      try {
        const price = bitcoinService.getCurrentPrice();
        res.json(price);
      } catch (error) {
        res.status(500).json({ error: 'Error', message: error.message });
      }
    });

    router.get('/history', (req, res) => {
      try {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const history = bitcoinService.getHistoricalData('usd', days);
        res.json(history);
      } catch (error) {
        res.status(500).json({ error: 'Error', message: error.message });
      }
    });

    router.get('/trend', (req, res) => {
      try {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const trend = bitcoinService.analyzePriceTrend('usd', days);
        res.json(trend);
      } catch (error) {
        res.status(500).json({ error: 'Error', message: error.message });
      }
    });

    // Монтируем маршрутизатор
    app.use('/api/bitcoin', router);
  });

  describe('GET /api/bitcoin/price', () => {
    it('должен возвращать текущую цену биткоина', async () => {
      // Мокируем данные о цене
      bitcoinService.getCurrentPrice.mockReturnValue({
        price: 60000,
        change_24h: 5.2,
        currency: 'usd',
        last_updated: new Date().toISOString()
      });

      // Отправляем запрос на тестовый эндпоинт
      const response = await request(app).get('/api/bitcoin/price');

      // Проверяем ответ
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('price', 60000);
      expect(response.body).toHaveProperty('change_24h', 5.2);
      expect(bitcoinService.getCurrentPrice).toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки из сервиса', async () => {
      // Мокируем ошибку в сервисе
      bitcoinService.getCurrentPrice.mockImplementation(() => {
        throw new Error('Service error');
      });

      // Отправляем запрос на тестовый эндпоинт
      const response = await request(app).get('/api/bitcoin/price');

      // Проверяем ответ
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(bitcoinService.getCurrentPrice).toHaveBeenCalled();
    });
  });

  describe('GET /api/bitcoin/history', () => {
    it('должен возвращать исторические данные с параметрами по умолчанию', async () => {
      // Мокируем исторические данные
      const mockHistoryData = [
        { timestamp: 1617235200, price: 58000 },
        { timestamp: 1617321600, price: 59500 }
      ];
      
      bitcoinService.getHistoricalData.mockReturnValue(mockHistoryData);

      // Отправляем запрос на тестовый эндпоинт
      const response = await request(app).get('/api/bitcoin/history');

      // Проверяем ответ
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHistoryData);
      expect(bitcoinService.getHistoricalData).toHaveBeenCalledWith('usd', 30);
    });

    it('должен использовать параметр days из запроса', async () => {
      // Мокируем исторические данные
      const mockHistoryData = [
        { timestamp: 1617235200, price: 58000 }
      ];
      
      bitcoinService.getHistoricalData.mockReturnValue(mockHistoryData);

      // Отправляем запрос с параметром days
      const response = await request(app).get('/api/bitcoin/history?days=7');

      // Проверяем ответ
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHistoryData);
      expect(bitcoinService.getHistoricalData).toHaveBeenCalledWith('usd', 7);
    });
  });

  describe('GET /api/bitcoin/trend', () => {
    it('должен возвращать анализ тренда цены', async () => {
      // Мокируем данные о тренде
      const mockTrendData = {
        trend: 'умеренный рост',
        change: 5000,
        changePercentage: 8.5
      };
      
      bitcoinService.analyzePriceTrend.mockReturnValue(mockTrendData);

      // Отправляем запрос на тестовый эндпоинт
      const response = await request(app).get('/api/bitcoin/trend');

      // Проверяем ответ
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTrendData);
      expect(bitcoinService.analyzePriceTrend).toHaveBeenCalledWith('usd', 30);
    });
  });
});
