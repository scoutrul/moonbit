import express, { Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import WebSocket from 'ws';
import BybitService from '../services/bybit.service';
import logger from '../utils/logger';
import { BybitSupportedSymbol, BybitSupportedInterval, OHLCVData } from '../types/bybit';

const router = express.Router();

// Маршрут для получения исторических данных OHLCV
router.get(
  '/bybit/ohlcv',
  [
    query('symbol')
      .default('BTCUSDT')
      .isIn(['BTCUSDT'])
      .withMessage('Invalid or unsupported symbol'),
    query('interval')
      .default('60')
      .isIn(['1', '3', '5', '15', '60', '240', 'D', 'W', 'M'])
      .withMessage('Invalid or unsupported interval'),
    query('limit')
      .default(200)
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
    // query('from').optional().isNumeric().withMessage('Invalid from timestamp'), // Если нужна поддержка from/to
    // query('to').optional().isNumeric().withMessage('Invalid to timestamp'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { symbol, interval, limit } = req.query;
      // const from = req.query.from ? parseInt(req.query.from as string) : undefined;
      // const to = req.query.to ? parseInt(req.query.to as string) : undefined;

      logger.info(`[DataRoutes] Request for Bybit OHLCV: ${symbol}, ${interval}, limit ${limit}`);

      const data = await BybitService.getHistoricalData(
        symbol as BybitSupportedSymbol,
        interval as BybitSupportedInterval,
        parseInt(limit as string)
        // from,
        // to
      );
      res.json(data);
    } catch (error) {
      logger.error('[DataRoutes] Error in /bybit/ohlcv:', error);
      next(error); // Передаем ошибку в централизованный обработчик
    }
  }
);

// Эта функция будет использоваться для "прикрепления" WebSocket сервера к HTTP серверу
export const initializeBybitWebSockets = (server: import('http').Server) => {
  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', (ws: WebSocket, req: Request) => {
    // Ожидаем, что query параметры будут переданы при установлении WebSocket соединения
    // express-ws обычно добавляет req.query, но для ws это может потребовать парсинга url
    const url = new URL(req.url || '', `ws://${req.headers.host}`);
    const symbol = (url.searchParams.get('symbol') as BybitSupportedSymbol | null) || 'BTCUSDT';
    const interval = (url.searchParams.get('interval') as BybitSupportedInterval | null) || '60';

    logger.info(`[DataRoutes] WebSocket connection established for ${symbol}-${interval}`);

    if (!BybitService.validateSymbolInterval(symbol, interval)) {
      logger.warn(
        `[DataRoutes] Invalid WebSocket params: ${symbol}, ${interval}. Closing connection.`
      );
      ws.close(1008, 'Invalid symbol or interval');
      return;
    }

    const klineUpdateHandler = (data: OHLCVData) => {
      if (ws.readyState === WebSocket.OPEN) {
        // logger.debug('[DataRoutes] Sending kline update via WebSocket:', data);
        ws.send(JSON.stringify(data));
      }
    };

    // Подписываемся на обновления
    const unsubscribe = BybitService.subscribeToKlineUpdates(symbol, interval, klineUpdateHandler);

    ws.on('message', (message: string) => {
      // Сервер может получать сообщения от клиента, например, для изменения подписки
      logger.info(`[DataRoutes] WebSocket received message: ${message}`);
      // Пока просто логируем, можно добавить обработку
    });

    ws.on('close', () => {
      logger.info(`[DataRoutes] WebSocket connection closed for ${symbol}-${interval}`);
      unsubscribe(); // Отписываемся от обновлений при закрытии соединения
    });

    ws.on('error', (error) => {
      logger.error(`[DataRoutes] WebSocket error for ${symbol}-${interval}:`, error);
      unsubscribe();
    });
  });

  server.on('upgrade', (request, socket, head) => {
    // Проверяем путь, чтобы только запросы на /api/data/bybit/realtime обрабатывались этим WebSocket сервером
    if (request.url?.startsWith('/api/data/bybit/realtime')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // Для других запросов на upgrade, можно либо закрыть сокет, либо передать другому обработчику
      socket.destroy();
    }
  });

  logger.info('[DataRoutes] Bybit WebSocket server initialized and attached to HTTP server.');
};

export default router;
