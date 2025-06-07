export interface ILogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

export interface IConfig {
  port: number;
  environment: string;
  cors: {
    origin: string | string[];
    methods: string[];
  };
  sync: {
    bitcoin: number;
    moon: number;
    astro: number;
    events: number;
  };
  paths: {
    logs: string;
    cache: string;
  };
  api: {
    coingecko: string;
    farmsense: string;
  };
  logging: {
    level: string;
    fileMaxSize: number;
    file: string;
  };
  cache?: {
    ttl: number;
    ohlc: number;
    bitcoin: {
      priceTtl: number;
      historyTtl: number;
      priceFile: string;
      historicalFile: string;
      dataFile: string;
    };
    moon: {
      phaseTtl: number;
      phaseFile: string;
    };
    astro: {
      dataTtl: number;
      dataFile: string;
    };
    events: {
      dataTtl: number;
      dataFile: string;
    };
  };
  redis?: {
    url: string;
  };
  client?: {
    url: string;
  };
  DEBUG?: boolean;
}

// Bitcoin interfaces
export interface IBitcoinPrice {
  price: number;
  change_24h: number;
  change_percentage_24h: number;
  currency: string;
  last_updated: string | null;
}

export interface IBitcoinHistoricalData {
  data: Array<{
    timestamp: number;
    price: number;
  }>;
  currency: string;
}

export interface IBitcoinPriceResponse {
  usd: {
    price: number;
    change_24h: number;
    market_cap: number;
    volume_24h: number;
  };
}

export interface IBitcoinHistoricalResponse {
  usd: {
    data: Array<{
      timestamp: number;
      price: number;
    }>;
  };
}

export interface IBitcoinService {
  getCurrentPrice(): Promise<IBitcoinPriceResponse>;
  getHistoricalData(days: string, currency: string): Promise<IBitcoinHistoricalResponse>;
  updatePriceData(): Promise<IBitcoinPriceResponse>;
  updateHistoricalData(): Promise<IBitcoinHistoricalResponse>;
  getPriceAnalysis(): Promise<any>;
  getBybitCandlestickData(timeframe: string, limit: number): Promise<Array<any>>;
  getCandlestickDataWithPagination(timeframe: string, limit: number, endTime?: number): Promise<Array<any>>;
}

// Moon interfaces
export interface IMoonPhase {
  date: string;
  phase: number;
  phaseName: string;
}

export interface IMoonSignificantPhase {
  date: string;
  type: string;
  phase: number;
  phaseName: string;
  title: string;
  icon: string;
}

export interface IMoonService {
  updatePhaseData(): Promise<any>;
  getCurrentPhase(): Promise<IMoonPhase>;
  getPhasesForPeriod(startDate: string, endDate: string): Promise<IMoonPhase[]>;
  getNextSignificantPhases(count?: number): Promise<IMoonSignificantPhase[]>;
  getUpcomingLunarEvents(days?: number): Promise<IMoonSignificantPhase[]>;
  getHistoricalLunarEvents(startDate: string, endDate: string): Promise<IMoonSignificantPhase[]>;
}

// Repositories
export interface IBitcoinRepository {
  fetchCurrentPrice(): Promise<IBitcoinPrice>;
  fetchHistoricalData(days: number): Promise<IBitcoinHistoricalData>;
  getCacheData(): any;
  updateCache(data: any): void;
}

export interface IMoonRepository {
  fetchMoonPhases(): Promise<any>;
  getPhasesCache(): any;
  calculatePhase(date: Date): number;
  getPhaseName(phase: number): string;
  calculateUpcomingSignificantPhases(startDate: Date, count: number): IMoonSignificantPhase[];
}

// DataSync
export interface IDataSyncService {
  initialize(): void;
  start(): void;
  stop(): void;
  syncAll(): Promise<boolean>;
  syncBitcoinData(): Promise<boolean>;
  syncMoonData(): Promise<boolean>;
  syncAstroData(): Promise<boolean>;
  syncEventsData(): Promise<boolean>;
} 