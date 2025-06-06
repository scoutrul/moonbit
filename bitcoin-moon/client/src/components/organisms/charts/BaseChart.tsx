import React, { useRef, useEffect, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, CandlestickData, ColorType } from 'lightweight-charts';
import { Spinner } from '../../atoms/Spinner';

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
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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

    // Notify parent component
    if (onChartReady) {
      onChartReady(chart);
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
  }, [width, height, autosize, onChartReady, isInitialized]);

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
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [data, onDataUpdate]);

  // Error handling
  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-dark-card rounded-lg border border-dark-border ${className}`}>
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Chart Error</div>
          <div className="text-moon-silver text-sm">{error}</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-dark-card rounded-lg border border-dark-border ${className}`}>
        <Spinner size="lg" color="bitcoin" />
      </div>
    );
  }

  return (
    <div className={`bg-dark-card rounded-lg border border-dark-border overflow-hidden ${className}`}>
      <div 
        ref={chartContainerRef}
        style={{ height: `${height}px` }}
        className="w-full"
      />
    </div>
  );
};

export default BaseChart; 