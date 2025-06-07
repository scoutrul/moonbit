import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, CandlestickData, ColorType, LogicalRange } from 'lightweight-charts';
import { Spinner } from '../../atoms/Spinner';
import { useEventPlugins } from '../../../plugins/hooks/useEventPlugins';
import { EventPlugin, Event } from '../../../plugins';

export interface BaseChartData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface BaseChartProps {
  data: BaseChartData[];
  loading?: boolean;
  error?: string | null;
  width?: number;
  height?: number;
  autosize?: boolean;
  onChartReady?: (chart: IChartApi) => void;
  onDataUpdate?: (data: BaseChartData[]) => void;
  className?: string;
  // Plugin system props
  events?: Event[];
  plugins?: EventPlugin[];
  pluginConfig?: Record<string, any>;
  timeframe?: string;
  enablePlugins?: boolean;
  // Data loading props
  onVisibleRangeChange?: (range: { from: UTCTimestamp; to: UTCTimestamp } | null) => void;
  onLoadMoreData?: (direction: 'left' | 'right', visibleRange: LogicalRange) => void;
  enableInfiniteScroll?: boolean;
  loadMoreThreshold?: number; // количество баров для trigger загрузки
  enableZoomPersistence?: boolean;
  initialVisibleRange?: { from: UTCTimestamp; to: UTCTimestamp };
}

export const BaseChart: React.FC<BaseChartProps> = ({
  data,
  loading = false,
  error = null,
  width = 800,
  height = 400,
  autosize = true,
  onChartReady,
  onDataUpdate,
  className = '',
  // Plugin system props
  events = [],
  plugins = [],
  pluginConfig = {},
  timeframe = '1D',
  enablePlugins = true,
  // Data loading props
  onVisibleRangeChange,
  onLoadMoreData,
  enableInfiniteScroll = false,
  loadMoreThreshold = 10,
  enableZoomPersistence = true,
  initialVisibleRange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const isUnmountedRef = useRef(false);

  // Plugin system integration - НО ТОЛЬКО после полной инициализации графика
  const {
    pluginManager,
    isReady: pluginsReady,
    error: pluginError,
    registerPlugin,
    renderEvents,
    onTimeframeChange,
    loading: pluginsLoading
  } = useEventPlugins(enablePlugins && chartReady ? chartRef.current : null, {
    timeframe,
    config: pluginConfig,
    debug: import.meta.env?.DEV || false
  });

  // Visible range change handler
  const handleVisibleRangeChange = useCallback((range: { from: UTCTimestamp; to: UTCTimestamp } | null) => {
    if (onVisibleRangeChange && !isUnmountedRef.current) {
      onVisibleRangeChange(range);
    }
  }, [onVisibleRangeChange]);

  // Infinite scroll handler
  const handleLogicalRangeChange = useCallback((logicalRange: LogicalRange | null) => {
    if (!enableInfiniteScroll || !onLoadMoreData || !logicalRange || isLoadingMore || isUnmountedRef.current) {
      return;
    }

    // Check if we need to load more data on the left (historical data)
    if (logicalRange.from < loadMoreThreshold) {
      setIsLoadingMore(true);
      onLoadMoreData('left', logicalRange);
      
      // Reset loading state after a delay (will be managed by parent component)
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          setIsLoadingMore(false);
        }
      }, 1000);
    }
    
    // Check if we need to load more data on the right (future data, if applicable)
    const totalBars = data.length;
    if (logicalRange.to > totalBars - loadMoreThreshold) {
      setIsLoadingMore(true);
      onLoadMoreData('right', logicalRange);
      
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          setIsLoadingMore(false);
        }
      }, 1000);
    }
  }, [enableInfiniteScroll, onLoadMoreData, loadMoreThreshold, isLoadingMore, data.length]);

  // Единый useEffect для полной инициализации графика
  useEffect(() => {
    // Устанавливаем флаг что компонент смонтирован
    isUnmountedRef.current = false;

    if (isInitialized) {
      return;
    }

    const initializeChart = async () => {
      // Ждем пока ref будет установлен
      if (!chartContainerRef.current) {
        setTimeout(initializeChart, 10);
        return;
      }

      try {
        const chartOptions = {
          layout: {
            textColor: '#E5E7EB', // moon-silver
            background: { type: ColorType.Solid, color: '#1F2937' }, // dark-card
          },
          rightPriceScale: {
            borderColor: '#374151', // dark-border
          },
          timeScale: {
            borderColor: '#374151', // dark-border
            timeVisible: true,
            secondsVisible: false,
            // Enable zoom and scroll
            fixLeftEdge: false,
            fixRightEdge: false,
            lockVisibleTimeRangeOnResize: enableZoomPersistence,
            // Default bar spacing and offsets for better UX
            barSpacing: 6,
            rightOffset: 12,
          },
          grid: {
            vertLines: { color: '#374151' },
            horzLines: { color: '#374151' },
          },
          crosshair: {
            mode: 1, // CrosshairMode.Normal
          },
          width: autosize ? chartContainerRef.current.clientWidth : width,
          height: height,
          // Enable kinetic scrolling for better mobile UX
          kineticScroll: {
            touch: true,
            mouse: true,
          },
        };

        const chart = createChart(chartContainerRef.current, chartOptions);

        // Проверяем что компонент еще не размонтирован
        if (isUnmountedRef.current) {
          chart.remove();
          return;
        }

        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#10B981', // green-500
          downColor: '#EF4444', // red-500
          borderDownColor: '#EF4444',
          borderUpColor: '#10B981',
          wickDownColor: '#EF4444',
          wickUpColor: '#10B981',
        });

        // Сохраняем ссылки
        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        // Устанавливаем данные если они есть
        if (data && data.length > 0) {
          const sortedData = [...data].sort((a, b) => a.time - b.time);
          const uniqueData = sortedData.filter((item, index, arr) => {
            return index === 0 || item.time !== arr[index - 1].time;
          });
          candlestickSeries.setData(uniqueData as CandlestickData[]);
        }

        // Подписываемся на события
        chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
        
        if (enableInfiniteScroll) {
          chart.timeScale().subscribeVisibleLogicalRangeChange(handleLogicalRangeChange);
        }

        // Set initial visible range if provided
        if (initialVisibleRange) {
          chart.timeScale().setVisibleRange(initialVisibleRange);
        }

        // Auto resize handling
        if (autosize) {
          const handleResize = () => {
            if (chartContainerRef.current && chartRef.current && !isUnmountedRef.current) {
              chartRef.current.applyOptions({
                width: chartContainerRef.current.clientWidth,
              });
            }
          };

          window.addEventListener('resize', handleResize);
        }

        // Уведомляем о готовности графика
        setIsInitialized(true);
        setChartReady(true);

        // Диагностика: проверяем что canvas создался
        setTimeout(() => {
          if (chartContainerRef.current && !isUnmountedRef.current) {
            const canvasElements = chartContainerRef.current.querySelectorAll('canvas');
            console.log(`🎨 BaseChart: Canvas элементов создано: ${canvasElements.length}`);
            if (canvasElements.length > 0) {
              const firstCanvas = canvasElements[0] as HTMLCanvasElement;
              console.log(`🎨 BaseChart: Первый canvas размеры: ${firstCanvas.width}x${firstCanvas.height}px`);
              console.log(`🎨 BaseChart: Canvas видимый:`, firstCanvas.offsetWidth > 0 && firstCanvas.offsetHeight > 0);
            } else {
              console.warn('⚠️ BaseChart: Canvas элементы не созданы!');
              console.log('🔍 BaseChart: Контейнер размеры:', chartContainerRef.current.offsetWidth, 'x', chartContainerRef.current.offsetHeight);
              console.log('🔍 BaseChart: Контейнер innerHTML:', chartContainerRef.current.innerHTML.substring(0, 200));
            }
          }
        }, 200);

        // Уведомляем родительский компонент
        if (onChartReady) {
          onChartReady(chart);
        }

        // Auto-fit content
        if (!initialVisibleRange && data && data.length > 0) {
          setTimeout(() => {
            if (chartRef.current && !isUnmountedRef.current) {
              chartRef.current.timeScale().fitContent();
            }
          }, 100);
        }

      } catch (error) {
        console.error('❌ BaseChart: Error during chart initialization:', error);
        if (!isUnmountedRef.current) {
          setIsInitialized(false);
          setChartReady(false);
        }
      }
    };

    // Запускаем инициализацию
    setTimeout(initializeChart, 0);

    // Cleanup function
    return () => {
      isUnmountedRef.current = true;
      
      if (chartRef.current) {
        try {
          // Отписываемся от событий
          chartRef.current.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
          if (enableInfiniteScroll) {
            chartRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(handleLogicalRangeChange);
          }
          
          // Удаляем график
          chartRef.current.remove();
        } catch (error) {
          console.warn('Error during chart cleanup:', error);
        }
        
        chartRef.current = null;
        seriesRef.current = null;
      }
      
      if (autosize) {
        window.removeEventListener('resize', () => {});
      }
      
      setIsInitialized(false);
      setChartReady(false);
    };
  }, [width, height, autosize, enableZoomPersistence, initialVisibleRange, enableInfiniteScroll, handleVisibleRangeChange, handleLogicalRangeChange]);

  // Отдельный effect для обновления данных
  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0 || !isInitialized || isUnmountedRef.current) {
      return;
    }

    try {
      // Правильная сортировка данных по времени (по возрастанию)
      const sortedData = [...data].sort((a, b) => a.time - b.time);
      
      // Удаляем дубликаты по времени
      const uniqueData = sortedData.filter((item, index, arr) => {
        return index === 0 || item.time !== arr[index - 1].time;
      });
      
      seriesRef.current.setData(uniqueData as CandlestickData[]);
      
      if (onDataUpdate && !isUnmountedRef.current) {
        onDataUpdate(uniqueData);
      }

    } catch (error) {
      console.error('❌ BaseChart: Error updating chart data:', error);
    }
  }, [data, isInitialized]);

  // Plugin registration - ТОЛЬКО после готовности графика
  useEffect(() => {
    if (!enablePlugins || !chartReady || !pluginsReady || !plugins.length || isUnmountedRef.current) {
      return;
    }

    const registerPlugins = async () => {
      try {
        // Дополнительная проверка что график все еще активен
        if (!chartRef.current || isUnmountedRef.current) {
          console.warn('⚠️ BaseChart: Chart not available for plugin registration');
          return;
        }

        // Проверяем стабильность графика
        try {
          const timeScale = chartRef.current.timeScale();
          if (!timeScale) {
            console.warn('⚠️ BaseChart: Chart timeScale not available for plugins');
            return;
          }
        } catch (error) {
          console.warn('⚠️ BaseChart: Chart not stable for plugin registration:', error);
          return;
        }

        for (const plugin of plugins) {
          if (!isUnmountedRef.current && chartRef.current) {
            await registerPlugin(plugin);
          }
        }
      } catch (error) {
        console.error('Error registering plugins:', error);
      }
    };

    // Увеличиваем задержку для стабилизации графика
    setTimeout(() => {
      if (!isUnmountedRef.current && chartRef.current) {
        registerPlugins();
      }
    }, 500); // Увеличено с 100 до 500ms

  }, [enablePlugins, chartReady, pluginsReady, plugins, registerPlugin]);

  // Event rendering - ТОЛЬКО после готовности плагинов
  useEffect(() => {
    if (!enablePlugins || !chartReady || !pluginsReady || !events.length || isUnmountedRef.current) {
      return;
    }

    try {
      renderEvents(events);
    } catch (error) {
      console.error('Error rendering events:', error);
    }
  }, [enablePlugins, chartReady, pluginsReady, events, renderEvents]);

  // Timeframe changes
  useEffect(() => {
    if (!enablePlugins || !chartReady || !pluginsReady || isUnmountedRef.current) {
      return;
    }

    try {
      onTimeframeChange(timeframe);
    } catch (error) {
      console.error('Error changing timeframe:', error);
    }
  }, [enablePlugins, chartReady, pluginsReady, timeframe, onTimeframeChange]);

  // Chart utility methods
  const resetZoom = useCallback(() => {
    if (chartRef.current && !isUnmountedRef.current) {
      chartRef.current.timeScale().resetTimeScale();
    }
  }, []);

  const fitContent = useCallback(() => {
    if (chartRef.current && !isUnmountedRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  const setVisibleRange = useCallback((range: { from: UTCTimestamp; to: UTCTimestamp }) => {
    if (chartRef.current && !isUnmountedRef.current) {
      chartRef.current.timeScale().setVisibleRange(range);
    }
  }, []);

  // Error handling
  if (error || pluginError) {
    const displayError = error || pluginError;
    const isPluginError = !!pluginError;
    
    return (
      <div className={`flex items-center justify-center h-96 bg-dark-card rounded-lg border border-dark-border ${className}`}>
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">
            {isPluginError ? 'Plugin Error' : 'Chart Error'}
          </div>
          <div className="text-moon-silver text-sm">{displayError}</div>
          {isPluginError && (
            <div className="text-orange-400 text-xs mt-2">
              Chart will work without plugins
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state (including plugin loading and infinite scroll loading)
  if (loading || (enablePlugins && pluginsLoading)) {
    return (
      <div className={`flex items-center justify-center h-96 bg-dark-card rounded-lg border border-dark-border ${className}`}>
        <div className="flex flex-col items-center">
          <Spinner size="lg" color="bitcoin" />
          <div className="text-moon-silver text-sm mt-2">
            {isLoadingMore ? 'Loading more data...' : 
             enablePlugins && pluginsLoading ? 'Loading plugins...' : 
             'Loading chart...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-dark-card rounded-lg border border-dark-border overflow-hidden ${className}`}>
      {isLoadingMore && (
        <div className="absolute top-2 left-2 z-10">
          <div className="flex items-center bg-dark-bg px-2 py-1 rounded text-xs text-moon-silver">
            <Spinner size="sm" color="bitcoin" className="mr-2" />
            Loading data...
          </div>
        </div>
      )}
      <div 
        ref={chartContainerRef}
        style={{ height: `${height}px` }}
        className="w-full"
      />
    </div>
  );
};

export default BaseChart; 