import React, { useState, useEffect, useCallback, useId } from 'react';
import CurrencyChart, { CurrencyInfo } from './CurrencyChart';
import { BaseChartData } from './BaseChart';
import { DataAdapter, createDataAdapter } from './DataAdapter';
import { useChartMemoryManager } from './ChartMemoryManager';
import { IChartApi } from 'lightweight-charts';
import { UTCTimestamp, LogicalRange } from 'lightweight-charts';
import { useEventPlugins } from '../../../plugins/hooks/useEventPlugins';
import { createLunarEventsPlugin } from '../../../plugins/implementations/LunarEventsPlugin';
import { Event } from '../../../types';

export interface ChartContainerProps {
  symbol?: string;
  defaultTimeframe?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  height?: number;
  className?: string;
}

// Симуляция данных для демонстрации infinite scroll
const generateMockData = (count: number, startTime?: number): BaseChartData[] => {
  const data: BaseChartData[] = [];
  const start = startTime || Math.floor(Date.now() / 1000) - (count * 86400); // 1 день = 86400 сек
  
  let lastPrice = 45000 + Math.random() * 10000;
  
  for (let i = 0; i < count; i++) {
    const time = (start + i * 86400) as UTCTimestamp;
    const change = (Math.random() - 0.5) * 2000;
    lastPrice += change;
    
    const open = lastPrice;
    const close = open + (Math.random() - 0.5) * 1000;
    const high = Math.max(open, close) + Math.random() * 500;
    const low = Math.min(open, close) - Math.random() * 500;
    
    data.push({
      time,
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
    });
  }
  
  return data;
};

// Симуляция лунных событий
const generateMockLunarEvents = (dataLength: number): Event[] => {
  const events: Event[] = [];
  const now = Math.floor(Date.now() / 1000);
  const daysBefore = dataLength;
  
  // Генерируем лунные события каждые ~29 дней (лунный цикл)
  for (let i = 0; i < Math.floor(daysBefore / 29); i++) {
    const eventTime = now - (daysBefore - i * 29) * 86400;
    const phases = ['new', 'first-quarter', 'full', 'last-quarter'];
    const phase = phases[i % 4];
    
    events.push({
      id: `lunar-${i}`,
      title: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Moon`,
      description: `Lunar ${phase} phase`,
      date: new Date(eventTime * 1000).toISOString(),
      timestamp: eventTime,
      type: 'lunar',
      subtype: phase,
      category: 'astronomy',
      important: phase === 'full' || phase === 'new',
      name: `🌙 ${phase}`,
    });
  }
  
  return events;
};

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
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
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
      setEvents(generateMockLunarEvents(chartDataResult.length));
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

  // Обработчик подгрузки дополнительных данных
  const handleLoadMoreData = useCallback(async (direction: 'left' | 'right', visibleRange: LogicalRange) => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Симулируем загрузку данных с сервера
    setTimeout(() => {
      if (direction === 'left') {
        // Загружаем исторические данные (к началу)
        const oldestTime = chartData[0]?.time || Math.floor(Date.now() / 1000);
        const newHistoricalData = generateMockData(50, oldestTime - 50 * 86400);
        const newEvents = generateMockLunarEvents(50);
        
        setChartData(prev => [...newHistoricalData, ...prev]);
        setEvents(prev => [...newEvents, ...prev]);
      } else {
        // Загружаем будущие данные (к концу) - если необходимо
        const newestTime = chartData[chartData.length - 1]?.time || Math.floor(Date.now() / 1000);
        const newFutureData = generateMockData(20, newestTime + 86400);
        
        setChartData(prev => [...prev, ...newFutureData]);
      }
      
      setIsLoadingMore(false);
    }, 1000); // Симулируем задержку сети
  }, [chartData, isLoadingMore]);

  // Обработчик изменения visible range
  const handleVisibleRangeChange = useCallback((range: { from: UTCTimestamp; to: UTCTimestamp } | null) => {
    // Убрали избыточное логирование
  }, []);

  // Настройка плагинов
  const plugins = [
    createLunarEventsPlugin({
      showFullMoon: true,
      showNewMoon: true,
      showQuarterMoon: true,
      fullMoonColor: '#FFD700',
      newMoonColor: '#4A5568',
      quarterMoonColor: '#C0C0C0',
      showLabels: true,
    }),
  ];

  const pluginConfig = {
    lunarEvents: {
      enabled: true,
      visible: true,
    },
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Информационная панель */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-moon-silver">
            MoonBit Chart - Advanced Features
          </h3>
          <div className="text-sm text-moon-muted">
            Timeframe: {currentTimeframe}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-moon-silver">Infinite Scroll</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-moon-silver">Auto Refresh</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-moon-silver">Dynamic Loading</span>
          </div>
        </div>
      </div>

      {/* График */}
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
        
        // Show advanced features
        showAdvancedFeatures={true}
        
        // Plugin system - TEMPORARILY DISABLED
        enablePlugins={false}
        plugins={[]}
        pluginConfig={{}}
        events={[]}
        
        // Advanced features
        enableInfiniteScroll={true}
        loadMoreThreshold={15}
        enableZoomPersistence={true}
        
        // Event handlers
        onVisibleRangeChange={handleVisibleRangeChange}
        onLoadMoreData={handleLoadMoreData}
      />

      {/* Панель управления */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            className="px-4 py-2 bg-bitcoin text-white rounded-lg hover:bg-bitcoin/80 transition-colors text-sm"
            onClick={() => {
              // Используем utility функции графика
              const chart = document.querySelector('canvas')?.closest('div') as any;
              if (chart && chart.resetZoom) {
                chart.resetZoom();
              }
            }}
          >
            Reset Zoom
          </button>
          
          <button
            className="px-4 py-2 bg-dark-border text-moon-silver rounded-lg hover:bg-dark-border/80 transition-colors text-sm"
            onClick={() => {
              const chart = document.querySelector('canvas')?.closest('div') as any;
              if (chart && chart.fitContent) {
                chart.fitContent();
              }
            }}
          >
            Fit Content
          </button>
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-moon-muted">Data points:</span>
            <span className="text-moon-silver font-medium">{chartData.length}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-moon-muted">Refresh:</span>
            <span className="text-moon-silver font-medium">{autoRefresh ? 'ON' : 'OFF'}</span>
          </div>
          
          {isLoadingMore && (
            <div className="flex items-center space-x-2 text-sm text-bitcoin">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Loading...</span>
            </div>
          )}
        </div>
      </div>

      {/* Инструкции */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <h4 className="text-md font-medium text-moon-silver mb-2">How to use:</h4>
        <ul className="text-sm text-moon-muted space-y-1">
          <li>• Scroll or drag the chart to see different time periods</li>
          <li>• Use mouse wheel to zoom in/out</li>
          <li>• Chart automatically loads more data when approaching edges</li>
          <li>• Lunar events are displayed as colored markers</li>
          <li>• Hover over markers to see event details</li>
        </ul>
      </div>

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