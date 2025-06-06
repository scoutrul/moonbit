import React from 'react';
import BaseChart, { BaseChartData, BaseChartProps } from './BaseChart';
import { Badge } from '../../atoms/Badge';
import { Icon } from '../../atoms/Icon';

export interface CurrencyInfo {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
}

export interface CurrencyChartProps extends Omit<BaseChartProps, 'onDataUpdate'> {
  currency?: CurrencyInfo;
  showCurrencyInfo?: boolean;
  timeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
  onDataUpdate?: (data: BaseChartData[], currency: CurrencyInfo | undefined) => void;
}

const defaultBitcoinInfo: CurrencyInfo = {
  symbol: 'BTC',
  name: 'Bitcoin',
  currentPrice: 0,
  change24h: 0,
  changePercent24h: 0,
};

export const CurrencyChart: React.FC<CurrencyChartProps> = ({
  currency = defaultBitcoinInfo,
  showCurrencyInfo = true,
  timeframe = '1d',
  onTimeframeChange,
  onDataUpdate,
  className = '',
  ...baseChartProps
}) => {
  const handleDataUpdate = (data: BaseChartData[]) => {
    // Update current price from latest data point
    if (data.length > 0) {
      const latestCandle = data[data.length - 1];
      const updatedCurrency = {
        ...currency,
        currentPrice: latestCandle.close,
      };
      
      if (onDataUpdate) {
        onDataUpdate(data, updatedCurrency);
      }
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number, changePercent: number): string => {
    const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
    const percentStr = changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
    return `${changeStr} (${percentStr})`;
  };

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Currency Info Header */}
      {showCurrencyInfo && (
        <div className="flex items-center justify-between bg-dark-card p-4 rounded-lg border border-dark-border">
          <div className="flex items-center space-x-3">
            <Icon name="bitcoin" size="lg" color="bitcoin" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-white">{currency.name}</h3>
                <Badge variant="moon" size="sm">{currency.symbol}</Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatPrice(currency.currentPrice)}
              </div>
              <div className={`text-sm ${currency.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatChange(currency.change24h, currency.changePercent24h)}
              </div>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange?.(tf)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-bitcoin-orange text-white'
                    : 'text-moon-silver hover:bg-dark-hover'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <BaseChart
        {...baseChartProps}
        onDataUpdate={handleDataUpdate}
        className="min-h-[400px]"
      />
    </div>
  );
};

export default CurrencyChart; 