import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import BitcoinService from '../services/BitcoinService';
import AstroService from '../services/AstroService';

// Таймфреймы и их метки
const TIMEFRAMES = [
  { value: '1m', label: '1М' },
  { value: '5m', label: '5М' },
  { value: '15m', label: '15М' },
  { value: '30m', label: '30М' },
  { value: '1h', label: '1Ч' },
  { value: '4h', label: '4Ч' },
  { value: '1d', label: '1Д' },
  { value: '1w', label: '1Н' }
];

const BitcoinChart = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const markersSeriesRef = useRef(null);
  
  const [timeframe, setTimeframe] = useState('1d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Создаем и настраиваем график
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Создаем новый график
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#1E1E1E' },
        textColor: '#DDD',
      },
      grid: {
        vertLines: { color: '#444' },
        horzLines: { color: '#444' },
      },
      rightPriceScale: {
        borderColor: '#555',
      },
      timeScale: {
        borderColor: '#555',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Создаем серию для свечей
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Создаем серию для маркеров
    const markersSeries = chart.addLineSeries({
      color: 'rgba(0, 0, 0, 0)',
      lineWidth: 0,
    });

    // Сохраняем ссылки на график и серии
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    markersSeriesRef.current = markersSeries;

    // Делаем график адаптивным
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Очистка
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        markersSeriesRef.current = null;
      }
    };
  }, []);

  // Загружаем данные и обновляем график
  useEffect(() => {
    if (!candlestickSeriesRef.current || !markersSeriesRef.current) return;

    const loadChartData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Получаем данные OHLC для биткоина
        const bitcoinData = await BitcoinService.getCandlestickData(timeframe);

        if (!bitcoinData || bitcoinData.length === 0) {
          throw new Error('Не удалось получить данные о ценах биткоина');
        }

        // Обновляем данные свечей
        candlestickSeriesRef.current.setData(bitcoinData);

        // Получаем временной диапазон для астрономических событий
        const startTimestamp = bitcoinData[0].time;
        const endTimestamp = bitcoinData[bitcoinData.length - 1].time;
        const startDate = new Date(startTimestamp * 1000);
        const endDate = new Date(endTimestamp * 1000);

        // Получаем астрономические события для этого периода
        const astroEvents = await AstroService.getAstroEvents(startDate, endDate);

        // Преобразуем астрономические события в маркеры
        const markers = astroEvents.map(event => {
          // Определяем цвет и форму маркера в зависимости от типа события
          let color = '#FFFFFF';
          const shape = 'circle';
          let position = 'aboveBar';
          
          switch (event.type) {
            case 'full_moon':
              color = '#FFFFFF';
              break;
            case 'new_moon':
              color = '#222222';
              break;
            case 'lunar_eclipse':
              color = '#7B68EE';
              break;
            case 'solar_eclipse':
              color = '#FFA500';
              break;
            case 'astro':
              color = '#00BFFF';
              break;
            case 'economic':
              color = '#32CD32';
              position = 'belowBar';
              break;
            default:
              color = '#FFFFFF';
          }

          return {
            time: event.time,
            position: position,
            color: color,
            shape: shape,
            text: event.icon + ' ' + event.title,
            size: 1,
          };
        });

        // Устанавливаем маркеры на график
        markersSeriesRef.current.setMarkers(markers);

        // Применяем фиксированный диапазон видимой области графика
        chartRef.current.timeScale().fitContent();

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Не удалось загрузить данные графика');
        setIsLoading(false);
      }
    };

    loadChartData();
  }, [timeframe]);

  // Обработчик изменения таймфрейма
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  return (
    <div className="w-full bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Bitcoin/USD</h2>
        <div className="flex space-x-1">
          {TIMEFRAMES.map(({ value, label }) => (
            <button
              key={value}
              className={`px-2 py-1 text-xs rounded ${
                timeframe === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => handleTimeframeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center h-[500px] bg-gray-900 rounded">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {error && (
        <div className="flex justify-center items-center h-[500px] bg-gray-900 rounded">
          <div className="text-red-500">{error}</div>
        </div>
      )}
      
      <div 
        ref={chartContainerRef} 
        className={`w-full ${isLoading ? 'hidden' : 'block'}`}
      />
    </div>
  );
};

export default BitcoinChart; 