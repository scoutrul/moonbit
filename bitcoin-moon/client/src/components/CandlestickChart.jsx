import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import axios from 'axios';

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
        
        const response = await axios.get(`/api/bitcoin/candles?timeframe=${timeframe}`);
        const data = response.data.map(d => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        
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

  return (
    <div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="text-center text-red-500 my-4">
          {error}
        </div>
      )}
      
      <div
        ref={chartContainerRef}
        className="w-full relative"
        style={{ height: '400px' }}
      />
    </div>
  );
};

export default CandlestickChart; 