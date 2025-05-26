import { RestClientV5, WebsocketClient, WSChangeEvent } from 'bybit-api';
import EventEmitter from 'events';
import config from '../config';
import redisClient from '../data/cache/redis';
import logger from '../utils/logger';
import {
  BybitSupportedInterval,
  BybitSupportedSymbol,
  OHLCVData,
  BybitKlineResponse,
  BybitRawKline,
  BybitWebSocketUpdateData,
  BybitWebSocketKlinePushData
} from '../types/bybit';

class BybitService {
  private restClient: RestClientV5;
  private wsClient: WebsocketClient;
  private activeSubscriptions: Map<string, { symbol: BybitSupportedSymbol; interval: BybitSupportedInterval }> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private readonly KLINE_CATEGORY = 'spot'; // Фокусируемся на споте для BTCUSDT

  constructor() {
    this.restClient = new RestClientV5({
      key: config.BYBIT.API_KEY,
      secret: config.BYBIT.API_SECRET,
      // testnet: process.env.NODE_ENV !== 'production', // Можно использовать testnet для разработки
    });

    this.wsClient = new WebsocketClient({
      key: config.BYBIT.API_KEY,
      secret: config.BYBIT.API_SECRET,
      // market: 'spot', // Указать 'spot' для V5 WebSocket
      testnet: process.env.NODE_ENV !== 'production',
    });

    this.initWebSocketHandlers();
  }

  private getCacheKey(
    symbol: BybitSupportedSymbol,
    interval: BybitSupportedInterval,
    // start?: number, // Ключ кэша теперь только по символу и интервалу для последней выборки
    // end?: number
  ): string {
    return `bybit:ohlcv:${symbol}:${interval}:latest`;
  }

  private transformRawKlineData(rawKlines: BybitRawKline[]): OHLCVData[] {
    return rawKlines.map((kline: BybitRawKline) => ({
      timestamp: parseInt(kline[0], 10),
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      // turnover: kline[6], // Если нужен оборот
    })).sort((a, b) => a.timestamp - b.timestamp); // Сортируем на всякий случай
  }

  public async getHistoricalData(
    symbol: BybitSupportedSymbol,
    interval: BybitSupportedInterval,
    limit: number = 200, // По умолчанию получаем последние 200 свечей
    // start?: number, // Убрали start/end для упрощения кэширования последней выборки
    // end?: number
  ): Promise<OHLCVData[]> {
    const cacheKey = this.getCacheKey(symbol, interval);

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.debug(`[BybitService] Cache hit for ${cacheKey}`);
        return JSON.parse(cachedData);
      }
      logger.debug(`[BybitService] Cache miss for ${cacheKey}`);

      const response: BybitKlineResponse = await this.restClient.getKline({
        category: this.KLINE_CATEGORY,
        symbol,
        interval,
        limit,
        // start, // Если нужно передавать start/end, раскомментировать
        // end,
      });

      if (response.retCode === 0 && response.result && response.result.list) {
        const ohlcvData = this.transformRawKlineData(response.result.list);
        if (ohlcvData.length > 0) {
            await redisClient.setex(cacheKey, config.CACHE_TTL.OHLC, JSON.stringify(ohlcvData));
            logger.debug(`[BybitService] Data cached for ${cacheKey} with TTL ${config.CACHE_TTL.OHLC}s`);
        }
        return ohlcvData;
      }
      logger.error('[BybitService] Error fetching historical data:', response.retMsg, response.retExtInfo);
      throw new Error(`Failed to fetch historical data from Bybit: ${response.retMsg}`);
    } catch (error: any) {
      logger.error('[BybitService] Exception in getHistoricalData:', error.message || error);
      // Можно вернуть пустой массив или пробросить ошибку дальше, в зависимости от требований
      return []; // Возвращаем пустой массив при ошибке, чтобы фронтенд не падал
    }
  }

  private initWebSocketHandlers(): void {
    this.wsClient.on('update', (event: BybitWebSocketUpdateData) => {
      // logger.trace('[BybitService] WebSocket update event:', JSON.stringify(event, null, 2));
      if (event.topic && event.topic.startsWith('kline.')) {
        this.handleKlineUpdate(event);
      }
    });

    this.wsClient.on('open', (event: { wsKey: string }) => {
      logger.info(`[BybitService] WebSocket connection opened: ${event.wsKey}. Resubscribing...`);
      this.resubscribeAllActive();
    });

    this.wsClient.on('response', (response: any) => {
      logger.debug('[BybitService] WebSocket response:', JSON.stringify(response));
      if (response.op === 'subscribe' && !response.success) {
        logger.error(`[BybitService] Failed to subscribe to ${response.args?.join(',')}: ${response.ret_msg}`);
      }
    });

    this.wsClient.on('close', (event: { wsKey: string }) => {
      logger.warn(`[BybitService] WebSocket connection closed: ${event.wsKey}. Will attempt to reconnect.`);
    });

    this.wsClient.on('error', (error: any) => {
      logger.error('[BybitService] WebSocket error:', error.message || error);
    });

    this.wsClient.on('reconnect', (event: { wsKey: string }) => {
      logger.info(`[BybitService] WebSocket attempting to reconnect: ${event.wsKey}`);
    });

    // this.wsClient.on('change', (event: WSChangeEvent<any>) => {
    //   logger.info(`[BybitService] WebSocket state change: ${event.type}`);
    // });
  }

  private async handleKlineUpdate(event: BybitWebSocketUpdateData): Promise<void> {
    // logger.debug('[BybitService] Handling kline update:', JSON.stringify(event.data));
    const topicParts = event.topic.split('.');
    if (topicParts.length < 3) return;

    const interval = topicParts[1] as BybitSupportedInterval;
    const symbol = topicParts[2] as BybitSupportedSymbol;

    const klinePushData = event.data.find(d => d.confirm); // Берем только подтвержденные свечи

    if (klinePushData) {
      const ohlcv: OHLCVData = {
        timestamp: klinePushData.start,
        open: klinePushData.open,
        high: klinePushData.high,
        low: klinePushData.low,
        close: klinePushData.close,
        volume: klinePushData.volume,
      };

      logger.debug(`[BybitService] Emitting kline update for ${symbol}-${interval}:`, ohlcv);
      this.eventEmitter.emit(`klineUpdate:${symbol}:${interval}`, ohlcv);

      // Обновление кэша с новой свечой
      const cacheKey = this.getCacheKey(symbol, interval);
      try {
        const cachedValue = await redisClient.get(cacheKey);
        let updatedData: OHLCVData[] = [];
        if (cachedValue) {
          const cachedList: OHLCVData[] = JSON.parse(cachedValue);
          // Если последняя свеча такая же по времени, обновляем ее, иначе добавляем новую
          if (cachedList.length > 0 && cachedList[cachedList.length - 1].timestamp === ohlcv.timestamp) {
            updatedData = [...cachedList.slice(0, -1), ohlcv];
          } else {
            updatedData = [...cachedList, ohlcv];
            // Ограничиваем размер кэша, чтобы он не рос бесконечно (например, последние 1000 свечей)
            if (updatedData.length > 1000) {
              updatedData = updatedData.slice(updatedData.length - 1000);
            }
          }
        } else {
          updatedData = [ohlcv];
        }
        await redisClient.setex(cacheKey, config.CACHE_TTL.OHLC, JSON.stringify(updatedData));
        logger.debug(`[BybitService] Cache updated via WebSocket for ${cacheKey}`);
      } catch (e) {
        logger.error('[BybitService] Error updating cache from WebSocket:', e);
      }
    }
  }

  public subscribeToKlineUpdates(
    symbol: BybitSupportedSymbol,
    interval: BybitSupportedInterval,
    handler: (data: OHLCVData) => void
  ): () => void {
    const topic = `kline.${interval}.${symbol}`;
    const wsTopic = `kline.${interval}.${symbol}`; // Темы для V5 WS: kline.{interval}.{symbol}

    if (!this.wsClient.isWsOpen()) {
        logger.warn('[BybitService] WebSocket is not open. Attempting to connect and subscribe.');
        this.wsClient.connectPublic(); // Или connectPrivate, если нужны приватные данные
    }

    // Проверяем, активна ли подписка, чтобы не дублировать
    if (!this.activeSubscriptions.has(wsTopic)) {
      this.wsClient.subscribeV5(wsTopic, 'spot'); // Для V5 указываем 'spot' или 'linear'/'inverse'
      this.activeSubscriptions.set(wsTopic, { symbol, interval });
      logger.info(`[BybitService] Subscribed to WebSocket topic: ${wsTopic}`);
    }

    const eventName = `klineUpdate:${symbol}:${interval}`;
    this.eventEmitter.on(eventName, handler);
    logger.debug(`[BybitService] Event listener added for ${eventName}`);

    return () => {
      this.eventEmitter.off(eventName, handler);
      logger.debug(`[BybitService] Event listener removed for ${eventName}`);
      // Логику отписки от WS топика можно добавить, если много слушателей отписываются
      // и нужно экономить ресурсы. Пока оставляем подписку активной.
      // this.activeSubscriptions.delete(wsTopic);
      // this.wsClient.unsubscribeV5(wsTopic, 'spot');
    };
  }

  private resubscribeAllActive(): void {
    if (this.activeSubscriptions.size === 0) {
        logger.info('[BybitService] No active WebSocket subscriptions to restore.');
        return;
    }
    this.activeSubscriptions.forEach(({ interval, symbol }, topic) => {
      logger.info(`[BybitService] Re-subscribing to WebSocket topic: ${topic}`);
      this.wsClient.subscribeV5(topic, 'spot');
    });
  }

  public static validateSymbolInterval(symbol: any, interval: any): boolean {
    const validSymbols: BybitSupportedSymbol[] = ['BTCUSDT'];
    const validIntervals: BybitSupportedInterval[] = ['1', '3', '5', '15', '60', '240', 'D', 'W', 'M'];
    return validSymbols.includes(symbol) && validIntervals.includes(interval);
  }
}

export default new BybitService(); 