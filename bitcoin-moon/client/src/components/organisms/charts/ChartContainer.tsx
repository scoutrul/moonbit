import React, { useState, useEffect, useCallback, useId } from 'react';
import CurrencyChart, { CurrencyInfo } from './CurrencyChart';
import { BaseChartData } from './BaseChart';
import { DataAdapter, createDataAdapter } from './DataAdapter';
import { useChartMemoryManager } from './ChartMemoryManager';
import { IChartApi } from 'lightweight-charts';

export interface ChartContainerProps {
  symbol?: string;
  defaultTimeframe?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  height?: number;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  symbol = 'BTCUSDT',
  defaultTimeframe = '1d',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  height = 500,
  className = '',
}) => {
  const chartId = useId();
  const memoryManager = useChartMemoryManager();
  
  // State
  const [chartData, setChartData] = useState<BaseChartData[]>([]);
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo | undefined>();
  const [currentTimeframe, setCurrentTimeframe] = useState(defaultTimeframe);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data adapter
  const [dataAdapter] = useState<DataAdapter>(() => createDataAdapter('bybit'));
  
  // Auto refresh
  const [refreshTimer, setRefreshTimer] = useState<number | null>(null);

  // Fetch chart data
  const fetchChartData = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        setLoading(true);
      }
      setError(null);

      // Fetch both chart data and currency info in parallel
      const [chartDataResult, currencyInfoResult] = await Promise.all([
        dataAdapter.fetchChartData(symbol, currentTimeframe),
        dataAdapter.fetchCurrencyInfo(symbol),
      ]);

      setChartData(chartDataResult);
      setCurrencyInfo(currencyInfoResult);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  }, [dataAdapter, symbol, currentTimeframe]);

  // Handle timeframe changes
  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    if (newTimeframe !== currentTimeframe) {
      setCurrentTimeframe(newTimeframe);
    }
  }, [currentTimeframe]);

  // Handle chart ready
  const handleChartReady = useCallback((chart: IChartApi) => {
    // Register chart with memory manager
    memoryManager.registerChart(chartId, chart, `chart-container-${chartId}`);
  }, [memoryManager, chartId]);

  // Handle data updates
  const handleDataUpdate = useCallback((data: BaseChartData[], currency?: CurrencyInfo) => {
    // Additional processing if needed
    if (currency) {
      setCurrencyInfo(currency);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Auto refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const timer = setInterval(() => {
        fetchChartData(true); // Silent refresh
      }, refreshInterval);
      
      setRefreshTimer(timer);
      
      return () => {
        clearInterval(timer);
        setRefreshTimer(null);
      };
    }
  }, [autoRefresh, refreshInterval, fetchChartData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up chart from memory manager
      memoryManager.removeChart(chartId);
      
      // Clear refresh timer
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [memoryManager, chartId, refreshTimer]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    fetchChartData(true);
  }, [fetchChartData]);

  return (
    <div className={`chart-container ${className}`} id={`chart-container-${chartId}`}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-white">
            {currencyInfo?.name || 'Loading...'}
          </h2>
          
          {/* Manual Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1 text-sm bg-dark-card border border-dark-border text-moon-silver rounded hover:bg-dark-hover transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Auto Refresh Indicator */}
        {autoRefresh && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto refresh: {refreshInterval / 1000}s</span>
          </div>
        )}
      </div>

      {/* Currency Chart */}
      <CurrencyChart
        data={chartData}
        currency={currencyInfo}
        loading={loading}
        error={error}
        height={height}
        timeframe={currentTimeframe}
        onTimeframeChange={handleTimeframeChange}
        onChartReady={handleChartReady}
        onDataUpdate={handleDataUpdate}
        className="chart-widget"
      />

      {/* Debug Info (Development Only) */}
      {import.meta.env.DEV && (
        <details className="mt-4 p-2 bg-dark-card rounded border border-dark-border">
          <summary className="text-sm text-gray-400 cursor-pointer">Debug Info</summary>
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>Chart ID: {chartId}</div>
            <div>Symbol: {symbol}</div>
            <div>Timeframe: {currentTimeframe}</div>
            <div>Data Points: {chartData.length}</div>
            <div>Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}</div>
            <div>Memory Stats: {JSON.stringify(memoryManager.getStats(), null, 2)}</div>
          </div>
        </details>
      )}
    </div>
  );
};

export default ChartContainer; 