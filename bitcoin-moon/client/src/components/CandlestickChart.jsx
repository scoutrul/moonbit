import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import BitcoinService from '../services/BitcoinService';

const CandlestickChart = ({ timeframe }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Цвета для графика
  const lightTheme = {
    layout: {
      background: { color: '#ffffff' },
      textColor: '#333',
    },
    grid: {
      vertLines: { color: '#f0f0f0' },
      horzLines: { color: '#f0f0f0' },
    },
    crosshair: {
      vertLine: { color: '#758696' },
      horzLine: { color: '#758696' },
    },
  };

  const darkTheme = {
    layout: {
      background: { color: '#1f2937' },
      textColor: '#d1d5db',
    },
    grid: {
      vertLines: { color: '#2d3748' },
      horzLines: { color: '#2d3748' },
    },
    crosshair: {
      vertLine: { color: '#758696' },
      horzLine: { color: '#758696' },
    },
  };

  // Создание графика при монтировании компонента
  useEffect(() => {
    if (chartContainerRef.current) {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const theme = isDarkMode ? darkTheme : lightTheme;

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: theme.layout,
        grid: theme.grid,
        crosshair: theme.crosshair,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#4caf50',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#4caf50',
        wickDownColor: '#ef5350',
      });

      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;

      const handleResize = () => {
        if (chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          candlestickSeriesRef.current = null;
        }
      };
    }
  }, []);

  // Применяем тему при изменении dark mode
  useEffect(() => {
    if (chartRef.current) {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const theme = isDarkMode ? darkTheme : lightTheme;

      chartRef.current.applyOptions({
        layout: theme.layout,
        grid: theme.grid,
        crosshair: theme.crosshair,
        timeScale: {
          ...chartRef.current.timeScale().options(),
          borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
        },
      });
    }
  }, [lightTheme, darkTheme]);

  // Загрузка данных при монтировании или изменении timeframe
  useEffect(() => {
    const fetchData = async () => {
      if (!candlestickSeriesRef.current) return;

      try {
        setLoading(true);
        setError(null);

        const data = await BitcoinService.getCandlestickData(timeframe);

        candlestickSeriesRef.current.setData(data);

        if (chartRef.current && data.length > 0) {
          chartRef.current.timeScale().fitContent();
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных графика:', err);
        setError('Не удалось загрузить данные графика');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Настраиваем периодическое обновление данных (раз в минуту)
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, [timeframe]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return <div ref={chartContainerRef} />;
};

export default CandlestickChart;
