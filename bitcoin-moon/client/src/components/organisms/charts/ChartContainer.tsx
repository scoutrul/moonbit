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

  // Fetch chart data with hybrid approach (API + Mock fallback)
  const fetchChartData = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        setLoading(true);
      }
      setError(null);

      // Try to fetch real data first
      try {
        const [chartDataResult, currencyInfoResult] = await Promise.all([
          dataAdapter.fetchChartData(symbol, currentTimeframe),
          dataAdapter.fetchCurrencyInfo(symbol),
        ]);

        // Check if we got valid data
        if (chartDataResult && chartDataResult.length > 0) {
          console.log('✅ Demo: Используем реальные данные API', chartDataResult.length, 'точек');
          setChartData(chartDataResult);
          setCurrencyInfo(currencyInfoResult);
          // Generate lunar events based on real data timeframe
          const realEvents = generateMockLunarEvents(chartDataResult.length);
          setEvents(realEvents);
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ Demo: API недоступен, используем mock данные:', apiError);
      }

      // Fallback to high-quality mock data
      console.log('📊 Demo: Используем качественные mock данные для демонстрации');
      const mockData = generateMockData(200); // 200 дней данных
      const mockCurrency: CurrencyInfo = {
        symbol: 'BTC',
        name: 'Bitcoin (Demo)',
        currentPrice: mockData[mockData.length - 1]?.close || 50000,
        change24h: 1200,
        changePercent24h: 2.4,
      };
      const mockEvents = generateMockLunarEvents(mockData.length);

      setChartData(mockData);
      setCurrencyInfo(mockCurrency);
      setEvents(mockEvents);

    } catch (err) {
      console.error('❌ Demo: Критическая ошибка:', err);
      setError('Демо данные недоступны');
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
            MoonBit Demo Chart - Все возможности
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-moon-muted">
              Timeframe: <span className="text-moon-silver font-medium">{currentTimeframe}</span>
            </div>
            <div className="text-moon-muted">
              Data: <span className="text-moon-silver font-medium">{chartData.length} точек</span>
            </div>
            {currencyInfo && (
              <div className="text-moon-muted">
                Price: <span className="text-green-400 font-medium">${currencyInfo.currentPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-moon-silver">Infinite Scroll</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-moon-silver">Масштабирование</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-moon-silver">Фазы луны</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-moon-silver">Auto Refresh</span>
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
        
        // Plugin system - ENABLED for demo
        enablePlugins={true}
        plugins={plugins}
        pluginConfig={pluginConfig}
        events={events}
        
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
            className="px-4 py-2 bg-bitcoin text-white rounded-lg hover:bg-bitcoin/80 transition-colors text-sm flex items-center space-x-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
          </button>
          
          <button
            className="px-4 py-2 bg-dark-border text-moon-silver rounded-lg hover:bg-dark-border/80 transition-colors text-sm flex items-center space-x-2"
            onClick={() => setCurrentTimeframe(currentTimeframe === '1d' ? '1h' : '1d')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Change Timeframe</span>
          </button>
          
          <div className="h-6 w-px bg-dark-border"></div>
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-moon-muted">Данные:</span>
            <span className="text-moon-silver font-medium">{chartData.length} свечей</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-moon-muted">События:</span>
            <span className="text-purple-400 font-medium">{events.length} лунных фаз</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-moon-muted">Refresh:</span>
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400' : 'bg-gray-400'}`}></div>
            <span className="text-moon-silver font-medium">{autoRefresh ? 'ON' : 'OFF'}</span>
          </div>
          
          {isLoadingMore && (
            <div className="flex items-center space-x-2 text-sm text-bitcoin">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Loading more...</span>
            </div>
          )}
        </div>
      </div>

      {/* Инструкции */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <h4 className="text-md font-medium text-moon-silver mb-3 flex items-center space-x-2">
          <svg className="w-5 h-5 text-bitcoin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Возможности демо графика:</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-moon-muted">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">🖱️</span>
              <span>Перетаскивание мышью для навигации по времени</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">🔍</span>
              <span>Колесико мыши для масштабирования</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-400">🌙</span>
              <span>Лунные фазы отображаются как маркеры</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">⏳</span>
              <span>Infinite scroll - автозагрузка истории</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-orange-400">🔄</span>
              <span>Автообновление данных каждые 30 сек</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-red-400">ℹ️</span>
              <span>Hover на маркеры для деталей событий</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-bitcoin/10 border border-bitcoin/20 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <svg className="w-4 h-4 text-bitcoin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-bitcoin font-medium">
              Tip: Данные комбинируются из реального API и качественных mock данных для стабильной демонстрации
            </span>
          </div>
        </div>
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