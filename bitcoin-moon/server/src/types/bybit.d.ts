// Типы для Bybit API
export type BybitSupportedInterval = '1' | '3' | '5' | '15' | '60' | '240' | 'D' | 'W' | 'M';
export type BybitSupportedSymbol = 'BTCUSDT'; // Пока только BTCUSDT, но можно расширить

export interface BybitKlineRequestParams {
  category: 'spot' | 'linear' | 'inverse';
  symbol: BybitSupportedSymbol;
  interval: BybitSupportedInterval;
  start?: number; // Timestamp в миллисекундах
  end?: number; // Timestamp в миллисекундах
  limit?: number; // Макс. 1000, по умолчанию 200
}

// [timestamp, open, high, low, close, volume, turnover]
export type BybitRawKline = [string, string, string, string, string, string, string];

export interface BybitKlineResponse {
  retCode: number;
  retMsg: string;
  result: {
    symbol: BybitSupportedSymbol;
    category: 'spot' | 'linear' | 'inverse';
    list: BybitRawKline[];
  };
  retExtInfo: any;
  time: number;
}

export interface OHLCVData {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  // turnover?: string; // Опционально, если нужен оборот
}

// Типы для WebSocket сообщений от Bybit
export interface BybitWebSocketKlinePushData {
  start: number; // Начало свечи (timestamp ms)
  end: number; // Конец свечи (timestamp ms)
  interval: BybitSupportedInterval;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  turnover: string;
  confirm: boolean; // false - предварительная, true - окончательная
  timestamp: number; // Timestamp сообщения
}

export interface BybitWebSocketUpdateData {
  topic: string; // e.g., kline.1.BTCUSDT
  type: 'snapshot' | 'delta'; // Тип обновления
  ts: number; // Timestamp сообщения от Bybit (в наносекундах или миллисекундах, уточнить по докам)
  data: BybitWebSocketKlinePushData[];
}
