const request = require('supertest');
const express = require('express');
const bitcoinRoutes = require('../../src/routes/bitcoin');
const bitcoinService = require('../../src/services/BitcoinService');

// Мокируем сервис биткоина
jest.mock('../../src/services/BitcoinService');

// Мокируем модуль логирования
jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn()
}));

describe('Bitcoin API Routes', () => {
  let app;

  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();
    
    // Создаем тестовое Express приложение
    app = express();
    app.use(express.json());
    app.use('/api/bitcoin', bitcoinRoutes);
  });

  describe('GET /api/bitcoin/price', () => {
    it('should return current bitcoin price', async () => {
      // Мокируем данные о цене
      bitcoinService.getCurrentPrice.mockResolvedValue({
        price: 60000,
        change24h: 5.2
      });

      // Отправляем запрос на тестовый эндпоинт
      const response = await request(app).get('/api/bitcoin/price');
      
      // Проверяем ответ
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        price: 60000,
        change24h: 5.2
      });
      expect(bitcoinService.getCurrentPrice).toHaveBeenCalled();
    });

    it('should handle errors from service', async () => {
      // Мокируем ошибку в сервисе
      const error = new Error('Service error');
      bitcoinService.getCurrentPrice.mockRejectedValue(error);

      // Отправляем запрос на тестовый эндпоинт
      const response = await request(app).get('/api/bitcoin/price');
      
      // Проверяем ответ
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(bitcoinService.getCurrentPrice).toHaveBeenCalled();
    });
  });

  describe('GET /api/bitcoin/candles', () => {
    it('should return candlestick data with default timeframe', async () => {
      // Мокируем данные о свечах
      const mockCandleData = [
        { time: 1617235200, open: 58000, high: 59000, low: 57500, close: 58800 },
        { time: 1617321600, open: 58800, high: 60000, low: 58500, close: 59500 }
      ];
      bitcoinService.getCandlestickData.mockResolvedValue(mockCandleData);

      // Отправляем запрос на тестовый эндпоинт
      const response = await request(app).get('/api/bitcoin/candles');
      
      // Проверяем ответ
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCandleData);
      expect(bitcoinService.getCandlestickData).toHaveBeenCalledWith('1d');
    });

    it('should return candlestick data with specified timeframe', async () => {
      // Мокируем данные о свечах
      const mockCandleData = [
        { time: 1617235200, open: 58000, high: 59000, low: 57500, close: 58800 },
        { time: 1617238800, open: 58800, high: 60000, low: 58500, close: 59500 }
      ];
      bitcoinService.getCandlestickData.mockResolvedValue(mockCandleData);

      // Отправляем запрос на тестовый эндпоинт с параметром
      const response = await request(app).get('/api/bitcoin/candles?timeframe=1h');
      
      // Проверяем ответ
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCandleData);
      expect(bitcoinService.getCandlestickData).toHaveBeenCalledWith('1h');
    });

    it('should return 400 for invalid timeframe', async () => {
      // Отправляем запрос с недопустимым параметром timeframe
      const response = await request(app).get('/api/bitcoin/candles?timeframe=invalid');
      
      // Проверяем ответ
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(bitcoinService.getCandlestickData).not.toHaveBeenCalled();
    });

    it('should handle errors from service', async () => {
      // Мокируем ошибку в сервисе
      const error = new Error('Service error');
      bitcoinService.getCandlestickData.mockRejectedValue(error);

      // Отправляем запрос на тестовый эндпоинт
      const response = await request(app).get('/api/bitcoin/candles');
      
      // Проверяем ответ
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(bitcoinService.getCandlestickData).toHaveBeenCalled();
    });
  });
}); 