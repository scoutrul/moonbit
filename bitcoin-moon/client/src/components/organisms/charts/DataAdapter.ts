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
  private baseUrl = 'https://api.bybit.com';
  
  getAvailableTimeframes(): string[] {
    return ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '1w', '1M'];
  }

  async getAvailableSymbols(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v5/market/instruments-info?category=spot`);
      const data = await response.json();
      
      if (data.retCode === 0) {
        return data.result.list
          .filter((instrument: any) => instrument.quoteCoin === 'USDT')
          .map((instrument: any) => instrument.symbol);
      }
      return ['BTCUSDT', 'ETHUSDT']; // fallback
    } catch (error) {
      console.error('Error fetching symbols:', error);
      return ['BTCUSDT', 'ETHUSDT']; // fallback
    }
  }

  async fetchChartData(symbol: string, timeframe: string): Promise<BaseChartData[]> {
    try {
      // Convert timeframe to Bybit format
      const bybitTimeframe = this.convertTimeframe(timeframe);
      
      const response = await fetch(
        `${this.baseUrl}/v5/market/kline?category=spot&symbol=${symbol}&interval=${bybitTimeframe}&limit=200`
      );
      
      const data = await response.json();
      
      if (data.retCode === 0 && data.result?.list) {
        return data.result.list
          .map((item: any[]) => ({
            time: Math.floor(parseInt(item[0]) / 1000) as any, // Convert to UTCTimestamp
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
          }))
          .reverse() // Bybit returns data in descending order
          .sort((a, b) => a.time - b.time); // Ensure ascending order
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw new Error(`Failed to fetch chart data: ${error}`);
    }
  }

  async fetchCurrencyInfo(symbol: string): Promise<CurrencyInfo> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v5/market/tickers?category=spot&symbol=${symbol}`
      );
      
      const data = await response.json();
      
      if (data.retCode === 0 && data.result?.list?.[0]) {
        const ticker = data.result.list[0];
        
        return {
          symbol: symbol.replace('USDT', ''),
          name: this.getSymbolName(symbol),
          currentPrice: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChange24h || '0'),
          changePercent24h: parseFloat(ticker.priceChangePercent24h || '0'),
        };
      }
      
      throw new Error('Invalid ticker data');
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
    // Convert our internal timeframe format to Bybit format
    const timeframeMap: Record<string, string> = {
      '1m': '1',
      '3m': '3',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '2h': '120',
      '4h': '240',
      '6h': '360',
      '12h': '720',
      '1d': 'D',
      '1w': 'W',
      '1M': 'M',
    };
    
    return timeframeMap[timeframe] || 'D';
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