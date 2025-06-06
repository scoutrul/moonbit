import { BaseChartData } from './BaseChart';
import { CurrencyInfo } from './CurrencyChart';

// Abstract DataAdapter interface
export interface DataAdapter {
  fetchChartData(symbol: string, timeframe: string): Promise<BaseChartData[]>;
  fetchCurrencyInfo(symbol: string): Promise<CurrencyInfo>;
  getAvailableSymbols(): Promise<string[]>;
  getAvailableTimeframes(): string[];
}

// Raw data types from Bybit API
interface BybitKlineData {
  symbol: string;
  interval: string;
  openTime: number;
  closeTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  turnover: string;
}

interface BybitTickerData {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice24h: string;
  lowPrice24h: string;
  volume24h: string;
}

// Bybit API Adapter implementation
export class BybitAdapter implements DataAdapter {
  private baseUrl = '/api'; // Используем наш локальный API
  
  getAvailableTimeframes(): string[] {
    return ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '1w', '1M'];
  }

  async getAvailableSymbols(): Promise<string[]> {
    // Возвращаем статический список для начала
    return ['BTCUSDT', 'ETHUSDT'];
  }

  async fetchChartData(symbol: string, timeframe: string): Promise<BaseChartData[]> {
    try {
      // Convert timeframe to our API format
      const apiTimeframe = this.convertTimeframe(timeframe);
      
      const response = await fetch(
        `${this.baseUrl}/bitcoin/candles?timeframe=${apiTimeframe}&limit=200`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          time: item.time as any, // API уже возвращает правильный timestamp
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume || '0'),
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw new Error(`Failed to fetch chart data: ${error}`);
    }
  }

  async fetchCurrencyInfo(symbol: string): Promise<CurrencyInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/bitcoin/price`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        symbol: symbol.replace('USDT', ''),
        name: this.getSymbolName(symbol),
        currentPrice: parseFloat(data.price),
        change24h: parseFloat(data.change_24h || '0'),
        changePercent24h: parseFloat(data.change_percentage_24h || '0'),
      };
    } catch (error) {
      console.error('Error fetching currency info:', error);
      // Return default data on error
      return {
        symbol: symbol.replace('USDT', ''),
        name: this.getSymbolName(symbol),
        currentPrice: 0,
        change24h: 0,
        changePercent24h: 0,
      };
    }
  }

  private convertTimeframe(timeframe: string): string {
    // Convert our internal timeframe format to API format
    const timeframeMap: Record<string, string> = {
      '1m': '1m',
      '3m': '3m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '2h': '2h',
      '4h': '4h',
      '6h': '6h',
      '12h': '12h',
      '1d': '1d',
      '1w': '1w',
      '1M': '1M',
    };
    
    return timeframeMap[timeframe] || '1d';
  }

  private getSymbolName(symbol: string): string {
    const nameMap: Record<string, string> = {
      'BTCUSDT': 'Bitcoin',
      'ETHUSDT': 'Ethereum',
      'BNBUSDT': 'BNB',
      'ADAUSDT': 'Cardano',
      'DOGEUSDT': 'Dogecoin',
      'XRPUSDT': 'XRP',
      'DOTUSDT': 'Polkadot',
      'UNIUSDT': 'Uniswap',
    };
    
    return nameMap[symbol] || symbol.replace('USDT', '');
  }
}

// Factory for creating adapters
export const createDataAdapter = (type: 'bybit' = 'bybit'): DataAdapter => {
  switch (type) {
    case 'bybit':
      return new BybitAdapter();
    default:
      return new BybitAdapter();
  }
}; 