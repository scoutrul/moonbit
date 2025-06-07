import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, CandlestickData, ColorType, LogicalRange } from 'lightweight-charts';
import BitcoinChartService from '../../services/BitcoinChartService';

// ============ КОНСТАНТЫ ============
const CHART_CONSTANTS = {
  INITIAL_CANDLES_LIMIT: 1000,        // Количество свечей при первичной загрузке
  INFINITE_SCROLL_LIMIT: 50,          // Количество свечей при infinite scroll
  SCROLL_THRESHOLD: 10,               // Порог для триггера infinite scroll (свечей до края)
  LOADING_DEBOUNCE_MS: 3000,          // Время debounce для предотвращения множественных запросов
  CHART_HEIGHT: 650,                  // Высота графика в пикселях
} as const;

// Интерфейс для реальных данных Bitcoin
interface RealBitcoinData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Компонент графика с реальными данными и infinite scroll
const RealBitcoinChart: React.FC<{ 
  timeframe: string;
  onLoadMore: (direction: 'left' | 'right', endTime?: number, requiredCandles?: number) => void;
  isLoading: boolean;
  data: RealBitcoinData[];
}> = ({ timeframe, onLoadMore, isLoading, data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const isLoadingRef = useRef(false);

  // Рассчитывает количество свечей для заполнения видимого диапазона
  const calculateRequiredCandles = useCallback((visibleRange: any, direction: 'left' | 'right') => {
    if (!visibleRange || data.length === 0) return CHART_CONSTANTS.INFINITE_SCROLL_LIMIT;
    
    // Рассчитываем среднее время между свечами
    const timeInterval = data.length > 1 ? 
      (data[data.length - 1].time - data[0].time) / (data.length - 1) : 
      (timeframe === '1d' ? 86400 : timeframe === '1h' ? 3600 : 86400);
    
    // Видимый временной диапазон
    const visibleDuration = visibleRange.to - visibleRange.from;
    
    // Количество свечей в видимом диапазоне
    const visibleCandles = Math.ceil(visibleDuration / timeInterval);
    
    // Загружаем в 2-3 раза больше чем видимый диапазон для буфера
    const requiredCandles = Math.max(
      CHART_CONSTANTS.INFINITE_SCROLL_LIMIT, // Минимум 50
      Math.min(
        visibleCandles * 2, // В 2 раза больше видимых
        500 // Максимум 500 за раз
      )
    );
    
    console.log(`🔢 Расчет свечей: видимых=${visibleCandles}, запрашиваем=${requiredCandles}, интервал=${timeInterval}s`);
    return requiredCandles;
  }, [data, timeframe]);

  // Обработчик изменения видимого диапазона для infinite scroll
  const handleVisibleTimeRangeChange = useCallback((timeRange: any) => {
    if (!timeRange || isLoadingRef.current || isLoading || data.length === 0) return;

    const dataLength = data.length;
    const threshold = CHART_CONSTANTS.SCROLL_THRESHOLD;
    
    // Получаем временные границы данных
    const oldestDataTime = data[0]?.time;
    const newestDataTime = data[data.length - 1]?.time;
    
    // Временной интервал одной свечи
    const timeInterval = dataLength > 1 ? 
      (newestDataTime - oldestDataTime) / (dataLength - 1) : 
      (timeframe === '1d' ? 86400 : timeframe === '1h' ? 3600 : 86400);
    
    // Проверяем левый край (исторические данные)
    if (timeRange.from <= oldestDataTime + (threshold * timeInterval)) {
      if (oldestDataTime) {
        console.log('🔄 RealBitcoinChart: Подгружаем исторические данные (левый край)');
        isLoadingRef.current = true;
        
        // Рассчитываем требуемое количество свечей
        const requiredCandles = calculateRequiredCandles(timeRange, 'left');
        onLoadMore('left', oldestDataTime as number, requiredCandles);
        
        setTimeout(() => {
          isLoadingRef.current = false;
        }, CHART_CONSTANTS.LOADING_DEBOUNCE_MS);
      }
    }
    
    // Проверяем правый край (более новые данные)
    if (timeRange.to >= newestDataTime - (threshold * timeInterval)) {
      if (newestDataTime) {
        console.log('🔄 RealBitcoinChart: Подгружаем новые данные (правый край)');
        isLoadingRef.current = true;
        
        const requiredCandles = calculateRequiredCandles(timeRange, 'right');
        onLoadMore('right', newestDataTime as number, requiredCandles);
        
        setTimeout(() => {
          isLoadingRef.current = false;
        }, CHART_CONSTANTS.LOADING_DEBOUNCE_MS);
      }
    }
  }, [data, onLoadMore, isLoading, calculateRequiredCandles, timeframe]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('🚀 RealBitcoinChart: Создаем график с реальными данными');

    // Создаем график ОДИН раз
    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: '#E5E7EB',
        background: { type: ColorType.Solid, color: '#1F2937' },
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
        // Важно для infinite scroll
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
        barSpacing: 8,
        rightOffset: 15,
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      width: chartContainerRef.current.clientWidth,
      height: CHART_CONSTANTS.CHART_HEIGHT,
    });

    const series = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderDownColor: '#EF4444',
      borderUpColor: '#10B981',
      wickDownColor: '#EF4444',
      wickUpColor: '#10B981',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Подписываемся на изменения логического диапазона для infinite scroll
    chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange);

    // Устанавливаем данные
    if (data.length > 0) {
      series.setData(data as CandlestickData[]);
      // Устанавливаем видимый диапазон на последние свечи
      chart.timeScale().fitContent();
    }

    console.log(`✅ RealBitcoinChart: График создан с ${data.length} реальными свечами`);

    // Cleanup
    return () => {
      console.log('🧹 RealBitcoinChart: Очистка графика');
      if (chart) {
        try {
          chart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange);
        } catch (error) {
          console.warn('Warning during unsubscribe:', error);
        }
        chart.remove();
      }
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // Только при монтировании!

  // Отдельный эффект для обновления данных
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data as CandlestickData[]);
      console.log(`📊 RealBitcoinChart: Данные обновлены (${data.length} реальных свечей)`);
    }
  }, [data]);

  return (
    <div className="relative bg-dark-card rounded-lg border border-dark-border overflow-hidden" data-testid="real-bitcoin-chart">
      {isLoading && (
        <div className="absolute top-4 left-4 z-10 bg-dark-bg/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-dark-border">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-4 h-4 border-2 border-bitcoin border-t-transparent rounded-full animate-spin"></div>
            <span className="text-bitcoin font-medium">Загружаем реальные данные...</span>
          </div>
        </div>
      )}
      <div ref={chartContainerRef} style={{ height: `${CHART_CONSTANTS.CHART_HEIGHT}px`, width: '100%' }} />
    </div>
  );
};

export const RealDataDemo: React.FC = () => {
  const [chartData, setChartData] = useState<RealBitcoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [timeframe, setTimeframe] = useState('1d');
  const [error, setError] = useState<string | null>(null);

  // Загружаем начальные данные
  useEffect(() => {
    loadInitialData();
  }, [timeframe]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 RealDataDemo: Загружаем начальные данные для ${timeframe}`);
      
      const result = await BitcoinChartService.getInitialData(timeframe, CHART_CONSTANTS.INITIAL_CANDLES_LIMIT);
      setChartData(result.data);
      
      console.log(`✅ RealDataDemo: Загружено ${result.data.length} свечей`);
    } catch (error) {
      console.error('❌ RealDataDemo: Ошибка загрузки данных:', error);
      setError('Ошибка загрузки данных. Проверьте подключение к серверу.');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик подгрузки данных для infinite scroll
  const handleLoadMore = useCallback(async (direction: 'left' | 'right', endTime?: number, requiredCandles?: number) => {
    if (loadingMore) return;
    
    try {
      setLoadingMore(true);
      const candlesToLoad = requiredCandles || CHART_CONSTANTS.INFINITE_SCROLL_LIMIT;
      console.log(`📊 RealDataDemo: Подгружаем ${direction === 'left' ? 'исторические' : 'новые'} данные (${candlesToLoad} свечей)`);
      
      if (direction === 'left' && endTime) {
        // Подгружаем исторические данные с динамическим лимитом
        const result = await BitcoinChartService.getHistoricalData(timeframe, candlesToLoad, endTime);
        
        if (result.data.length > 0) {
          setChartData(prevData => {
            // Фильтруем дубликаты по времени (граничные свечи)
            const existingTimes = new Set(prevData.map(item => item.time));
            const newData = result.data.filter(item => !existingTimes.has(item.time));
            
            console.log(`📈 RealDataDemo: Получено ${result.data.length} свечей, уникальных: ${newData.length}`);
            console.log(`📊 RealDataDemo: Было свечей: ${prevData.length}, добавляем: ${newData.length}`);
            
            if (newData.length === 0) {
              console.log('⚠️ RealDataDemo: Все полученные свечи являются дубликатами');
              return prevData;
            }
            
            const combined = [...newData, ...prevData].sort((a, b) => a.time - b.time);
            console.log(`✅ RealDataDemo: Итого свечей: ${combined.length}`);
            return combined;
          });
        }
      }
      // Для правого края пока не реализуем, так как у нас исторические данные
    } catch (error) {
      console.error('❌ RealDataDemo: Ошибка при подгрузке данных:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [timeframe, loadingMore]);

  const handleTimeframeChange = (newTimeframe: string) => {
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe);
      BitcoinChartService.clearCache(); // Очищаем кэш при смене таймфрейма
    }
  };

  const handleRefresh = () => {
    BitcoinChartService.clearCache();
    loadInitialData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-bitcoin border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-moon-silver text-lg">Загружаем реальные данные Bitcoin...</div>
          <div className="text-sm text-moon-silver/70 mt-2">Подключение к API сервера</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-xl mb-4">⚠️ Ошибка загрузки</div>
          <div className="text-moon-silver mb-6">{error}</div>
          <button
            onClick={handleRefresh}
            className="px-6 py-2 bg-bitcoin hover:bg-bitcoin/80 text-white rounded transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🚀 MoonBit - Реальные Данные Bitcoin
          </h1>
          <p className="text-moon-silver">
            График с живыми данными и автоматической подгрузкой истории
          </p>
        </div>

        {/* Controls */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-white">Реальный Bitcoin График</h2>
              <div className="flex items-center space-x-4 text-sm text-moon-silver">
                <span>Данные: <span className="text-green-400">{chartData.length} свечей</span></span>
                <span>Таймфрейм: <span className="text-bitcoin">{timeframe}</span></span>
                {loadingMore && (
                  <span className="text-bitcoin flex items-center space-x-1">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Загрузка...</span>
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Timeframe selector */}
              <select
                value={timeframe}
                onChange={(e) => handleTimeframeChange(e.target.value)}
                className="px-3 py-1 bg-dark-bg border border-dark-border rounded text-white text-sm"
                disabled={loadingMore}
              >
                <option value="1h">1 час</option>
                <option value="1d">1 день</option>
                <option value="1w">1 неделя</option>
              </select>
              
              <button
                onClick={handleRefresh}
                disabled={loadingMore}
                className="flex items-center space-x-2 px-4 py-2 bg-bitcoin hover:bg-bitcoin/80 disabled:opacity-50 text-white rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Обновить</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chart */}
        <RealBitcoinChart 
          timeframe={timeframe}
          data={chartData} 
          onLoadMore={handleLoadMore}
          isLoading={loadingMore}
        />

        {/* Instructions */}
        <div className="mt-8 bg-dark-card border border-dark-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🎯 Реальные данные Bitcoin с Infinite Scroll</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-moon-silver">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>📡 <strong>API интеграция</strong> - данные с сервера</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>🔍 <strong>Масштабирование</strong> - колесико мыши для зума</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">🎯</span>
                <span>⬅️ <strong>Скролл влево</strong> - загружает историю</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>💾 <strong>Кэширование</strong> - быстрые повторные запросы</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>📊 <strong>Стабильность</strong> - никаких блинков</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>⚡ <strong>Таймфреймы</strong> - 1h, 1d, 1w</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-400 font-medium">
                🎉 ГОТОВО: Полнофункциональный график с реальными данными и infinite scroll!
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 