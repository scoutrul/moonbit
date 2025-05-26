const express = require('express');
const { body, query, validationResult } = require('express-validator');
const WebSocket = require('ws');
const logger = require('../utils/logger');
const router = express.Router();

/**
 * @route GET /api/data/ohlcv
 * @desc Получает исторические OHLCV данные по биткоину
 * @access Public
 */
router.get(
  '/ohlcv',
  [
    query('symbol').default('BTCUSDT').isIn(['BTCUSDT']).withMessage('Неверный или неподдерживаемый символ'),
    query('interval').default('60').isIn(['1', '3', '5', '15', '60', '240', 'D', 'W', 'M']).withMessage('Неверный или неподдерживаемый интервал'),
    query('limit').default(200).isInt({ min: 1, max: 1000 }).withMessage('Лимит должен быть от 1 до 1000'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { symbol, interval, limit } = req.query;
      
      logger.info(`[DataRoutes] Запрос OHLCV данных: ${symbol}, ${interval}, лимит ${limit}`);
      
      // Использовать BitcoinService вместо Bybit
      const bitcoinService = require('../services/bitcoinService');
      
      // Получаем исторические данные
      const data = await bitcoinService.getHistoricalData(
        limit ? parseInt(limit) : 200
      );
      
      res.json(data);
    } catch (error) {
      logger.error('[DataRoutes] Ошибка в /ohlcv:', error);
      next(error);
    }
  }
);

/**
 * Инициализирует WebSocket сервер для передачи данных в реальном времени
 * @param {Object} server - HTTP сервер Express
 */
const initializeWebSockets = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', (ws, req) => {
    // Парсим параметры из URL
    const url = new URL(req.url || '', `ws://${req.headers.host}`);
    const symbol = url.searchParams.get('symbol') || 'BTCUSDT';
    const interval = url.searchParams.get('interval') || '60';

    logger.info(`[DataRoutes] WebSocket соединение установлено для ${symbol}-${interval}`);

    // Проверка валидности параметров
    const validSymbols = ['BTCUSDT'];
    const validIntervals = ['1', '3', '5', '15', '60', '240', 'D', 'W', 'M'];
    
    if (!validSymbols.includes(symbol) || !validIntervals.includes(interval)) {
      logger.warn(`[DataRoutes] Неверные параметры WebSocket: ${symbol}, ${interval}. Закрытие соединения.`);
      ws.close(1008, 'Неверный символ или интервал');
      return;
    }

    // Обработчик сообщений от клиента
    ws.on('message', (message) => {
      logger.info(`[DataRoutes] WebSocket получил сообщение: ${message}`);
    });

    // Обработчик закрытия соединения
    ws.on('close', () => {
      logger.info(`[DataRoutes] WebSocket соединение закрыто для ${symbol}-${interval}`);
    });

    // Обработчик ошибок
    ws.on('error', (error) => {
      logger.error(`[DataRoutes] WebSocket ошибка для ${symbol}-${interval}:`, error);
    });

    // Эмулируем отправку данных в реальном времени
    // Для тестирования UI - отправляем случайные данные каждые 5 секунд
    const interval_id = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // Генерация случайных данных в формате OHLCV
        const mockData = {
          timestamp: Date.now(),
          open: (60000 + Math.random() * 5000).toFixed(2),
          high: (65000 + Math.random() * 5000).toFixed(2),
          low: (58000 + Math.random() * 5000).toFixed(2),
          close: (63000 + Math.random() * 5000).toFixed(2),
          volume: (Math.random() * 100).toFixed(2)
        };
        ws.send(JSON.stringify(mockData));
      }
    }, 5000);

    // Очистка интервала при закрытии соединения
    ws.on('close', () => {
      clearInterval(interval_id);
    });
  });

  // Обработка запросов на обновление соединения
  server.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/api/data/realtime')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  logger.info('[DataRoutes] WebSocket сервер инициализирован и прикреплен к HTTP серверу.');
};

router.initializeWebSockets = initializeWebSockets;

module.exports = router; 