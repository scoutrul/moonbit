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

  // Plugin system integration
  const {
    pluginManager,
    isReady: pluginsReady,
    error: pluginError,
    registerPlugin,
    renderEvents,
    onTimeframeChange,
    loading: pluginsLoading
  } = useEventPlugins(chartRef.current, {
    timeframe,
    config: pluginConfig,
    debug: import.meta.env?.DEV || false
  });

  // Visible range change handler
  const handleVisibleRangeChange = useCallback((range: { from: UTCTimestamp; to: UTCTimestamp } | null) => {
    if (onVisibleRangeChange) {
      onVisibleRangeChange(range);
    }
  }, [onVisibleRangeChange]);

  // Infinite scroll handler
  const handleLogicalRangeChange = useCallback((logicalRange: LogicalRange | null) => {
    if (!enableInfiniteScroll || !onLoadMoreData || !logicalRange || isLoadingMore) {
      return;
    }

    // Check if we need to load more data on the left (historical data)
    if (logicalRange.from < loadMoreThreshold) {
      setIsLoadingMore(true);
      onLoadMoreData('left', logicalRange);
      
      // Reset loading state after a delay (will be managed by parent component)
      setTimeout(() => setIsLoadingMore(false), 1000);
    }
    
    // Check if we need to load more data on the right (future data, if applicable)
    const totalBars = data.length;
    if (logicalRange.to > totalBars - loadMoreThreshold) {
      setIsLoadingMore(true);
      onLoadMoreData('right', logicalRange);
      
      setTimeout(() => setIsLoadingMore(false), 1000);
    }
  }, [enableInfiniteScroll, onLoadMoreData, loadMoreThreshold, isLoadingMore, data.length]);

  // Chart initialization
  useEffect(() => {
    if (!chartContainerRef.current || isInitialized) return;

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
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10B981', // green-500
      downColor: '#EF4444', // red-500
      borderDownColor: '#EF4444',
      borderUpColor: '#10B981',
      wickDownColor: '#EF4444',
      wickUpColor: '#10B981',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    setIsInitialized(true);

    // Set initial visible range if provided
    if (initialVisibleRange) {
      chart.timeScale().setVisibleRange(initialVisibleRange);
    }

    // Auto resize handling
    if (autosize) {
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }

    return () => {
      chart.remove();
    };
  }, [width, height, autosize, enableZoomPersistence, initialVisibleRange]);

  // Separate effect for subscribing to chart events after initialization
  useEffect(() => {
    if (!chartRef.current || !isInitialized) return;

    const chart = chartRef.current;
    
    // Subscribe to visible time range changes
    chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    
    // Subscribe to logical range changes for infinite scroll
    if (enableInfiniteScroll) {
      chart.timeScale().subscribeVisibleLogicalRangeChange(handleLogicalRangeChange);
    }

    return () => {
      // Cleanup subscriptions
      try {
        chart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
        if (enableInfiniteScroll) {
          chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleLogicalRangeChange);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [isInitialized, handleVisibleRangeChange, handleLogicalRangeChange, enableInfiniteScroll]);

  // Separate effect for notifying parent when chart is ready
  useEffect(() => {
    if (!chartRef.current || !isInitialized || !onChartReady) return;

    onChartReady(chartRef.current);
  }, [isInitialized, onChartReady]);

  // Plugin registration
  useEffect(() => {
    if (!enablePlugins || !pluginsReady || !plugins.length) return;

    const registerPlugins = async () => {
      for (const plugin of plugins) {
        try {
          await registerPlugin(plugin);
        } catch (error) {
          console.error(`Failed to register plugin ${plugin.id}:`, error);
        }
      }
    };

    registerPlugins();
  }, [enablePlugins, pluginsReady, plugins, registerPlugin]);

  // Event rendering
  useEffect(() => {
    if (!enablePlugins || !pluginsReady || !events.length) return;

    renderEvents(events);
  }, [enablePlugins, pluginsReady, events, renderEvents]);

  // Timeframe changes
  useEffect(() => {
    if (!enablePlugins || !pluginsReady) return;

    onTimeframeChange(timeframe);
  }, [enablePlugins, pluginsReady, timeframe, onTimeframeChange]);

  // Data updates
  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) return;

    try {
      // Sort data by time to ensure correct order
      const sortedData = [...data].sort((a, b) => a.time - b.time);
      seriesRef.current.setData(sortedData as CandlestickData[]);
      
      if (onDataUpdate) {
        onDataUpdate(sortedData);
      }

      // Auto-fit content on first load if no initial range specified
      if (!initialVisibleRange && chartRef.current) {
        // Small delay to ensure data is rendered
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [data, onDataUpdate, initialVisibleRange]);

  // Chart utility methods
  const resetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().resetTimeScale();
    }
  }, []);

  const fitContent = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  const setVisibleRange = useCallback((range: { from: UTCTimestamp; to: UTCTimestamp }) => {
    if (chartRef.current) {
      chartRef.current.timeScale().setVisibleRange(range);
    }
  }, []);

  // Export utility functions (can be accessed via ref)
  useEffect(() => {
    if (chartRef.current && onChartReady) {
      const chart = chartRef.current;
      // Add utility methods to chart instance
      (chart as any).resetZoom = resetZoom;
      (chart as any).fitContent = fitContent;
      (chart as any).setVisibleRange = setVisibleRange;
    }
  }, [isInitialized, resetZoom, fitContent, setVisibleRange]);

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