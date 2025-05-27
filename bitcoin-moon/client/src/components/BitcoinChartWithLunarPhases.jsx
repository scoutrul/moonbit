import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import BitcoinService from '../services/BitcoinService';
import EventsService from '../services/EventsService';
import { subscribeToPriceUpdates } from '../utils/mockDataGenerator';
import { fetchAstroEvents } from '../services/astroEvents.js';
import dayjs from 'dayjs';

/**
 * Компонент для отображения графика биткоина с фазами Луны
 * @param {Object} props - свойства компонента
 * @param {string} props.timeframe - выбранный таймфрейм
 */
const BitcoinChartWithLunarPhases = ({ timeframe, data }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const markersSeriesRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(data || []);
  const [events, setEvents] = useState([]);
  const [lunarEvents, setLunarEvents] = useState([]);
  const unsubscribeRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

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

  // Обработчик обновления данных в реальном времени
  const handlePriceUpdate = useCallback((priceData) => {
    if (!candlestickSeriesRef.current || chartData.length === 0) return;

    // Получаем последнюю свечу
    const lastCandle = chartData[chartData.length - 1];
    
    // Обновляем свечу
    if (lastCandle) {
      // Обновляем close, high и low
      const updatedCandle = {
        ...lastCandle,
        close: priceData.price,
        high: Math.max(lastCandle.high, priceData.price),
        low: Math.min(lastCandle.low, priceData.price)
      };

      // Обновляем данные
      const updatedData = [...chartData];
      updatedData[updatedData.length - 1] = updatedCandle;
      
      setChartData(updatedData);
      
      // Обновляем график
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.update(updatedCandle);
      }
    }
  }, [chartData]);

  // Эффект для отслеживания изменения темы
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          const newIsDarkMode = document.documentElement.classList.contains('dark');
          
          if (newIsDarkMode !== isDarkMode) {
            setIsDarkMode(newIsDarkMode);
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, [isDarkMode]);

  // Обновляем данные, когда получаем их извне
  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(data);
    }
  }, [data]);
  
  // Загрузка данных при монтировании или изменении timeframe
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Если данные не были переданы извне, загружаем их
        if (!data || data.length === 0) {
          // Загружаем данные для графика
          const chartData = await BitcoinService.getCandlestickData(timeframe);
          setChartData(chartData);
        }
        
        // Загружаем события для отображения на графике
        const eventsData = await EventsService.getEventsForChart(timeframe);
        console.log('Загружено событий:', eventsData.length, eventsData);
        setEvents(eventsData);
        
        // Получаем данные о лунных фазах
        if (chartData && chartData.length > 0) {
          try {
            const startDate = new Date(chartData[0].time * 1000);
            const endDate = new Date(chartData[chartData.length - 1].time * 1000);
            
            console.log(`Получаем лунные фазы для диапазона: ${startDate.toISOString()} - ${endDate.toISOString()}`);
            
            const lunarPhases = await fetchAstroEvents(startDate, endDate);
            console.log('Получено лунных фаз:', lunarPhases.length, lunarPhases);
            setLunarEvents(lunarPhases);
          } catch (err) {
            console.error('Ошибка при загрузке лунных фаз:', err);
          }
        }

      } catch (err) {
        console.error('Ошибка при загрузке данных графика:', err);
        setError('Не удалось загрузить данные графика');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Очищаем предыдущую подписку, если она была
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Подписываемся на обновления цены в реальном времени
    unsubscribeRef.current = subscribeToPriceUpdates(handlePriceUpdate);

    return () => {
      // Отписываемся при размонтировании компонента
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [timeframe, handlePriceUpdate, data, chartData]);

  // Создание графика при монтировании компонента, изменении данных или темы
  useEffect(() => {
    if (chartContainerRef.current && chartData.length > 0) {
      // Если уже есть график, то удаляем его
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        markersSeriesRef.current = null;
      }
      
      const theme = isDarkMode ? darkTheme : lightTheme;

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: theme.layout,
        grid: theme.grid,
        crosshair: theme.crosshair,
        timeScale: {
          timeVisible: true,
          secondsVisible: timeframe === '1m' || timeframe === '3m' || timeframe === '5m',
          borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
          barSpacing: 10,
          rightOffset: 5,
        },
        rightPriceScale: {
          borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
          entireTextOnly: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
      });

      // Добавляем свечной график
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#4caf50',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#4caf50',
        wickDownColor: '#ef5350',
      });

      candlestickSeries.setData(chartData);
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      
      // Добавляем серию маркеров
      const markersSeries = chart.addLineSeries({
        lineVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      
      markersSeriesRef.current = markersSeries;
      
      // Готовим маркеры для лунных фаз
      const lunarMarkers = [];
      
      if (lunarEvents.length > 0) {
        console.log('Добавляем маркеры лунных фаз:', lunarEvents.length);
        
        lunarEvents.forEach(phase => {
          const phaseDate = new Date(phase.date);
          const phaseTime = Math.floor(phaseDate.getTime() / 1000);
          const price = getApproximatePriceForDate(phaseDate, chartData);
          
          if (price) {
            // Определяем тип и стиль маркера
            const isNewMoon = phase.type === 'new_moon';
            const marker = {
              time: phaseTime,
              position: isNewMoon ? 'belowBar' : 'aboveBar',
              color: isNewMoon ? '#2962FF' : '#FFD600',
              shape: 'circle',
              text: isNewMoon ? 'Новолуние' : 'Полнолуние',
              size: 2
            };
            
            lunarMarkers.push(marker);
            
            // Создаем отдельную серию для текста
            const textSeries = chart.addLineSeries({
              lineVisible: false,
              lastValueVisible: false,
              priceLineVisible: false,
            });
            
            textSeries.setData([
              { time: phaseTime, value: isNewMoon ? price * 0.98 : price * 1.02 }
            ]);
            
            textSeries.setMarkers([{
              time: phaseTime,
              position: isNewMoon ? 'belowBar' : 'aboveBar',
              shape: 'arrowDown',
              color: isNewMoon ? '#2962FF' : '#FFD600',
              text: isNewMoon ? '🌑 Новолуние' : '🌕 Полнолуние',
              size: 2,
            }]);
          }
        });
      }
      
      // Добавляем остальные события
      if (events.length > 0) {
        console.log('Добавляем маркеры для событий:', events.length);
        
        events.forEach(event => {
          if (event.type !== 'moon') { // Пропускаем лунные события, т.к. мы их уже добавили
            const eventDate = new Date(event.date);
            const eventTime = Math.floor(eventDate.getTime() / 1000);
            const price = getApproximatePriceForDate(eventDate, chartData);
            
            if (price) {
              // Определяем цвет маркера в зависимости от типа события
              let color;
              let shape;
              
              switch (event.type) {
                case 'astro':
                  color = '#ec4899'; // Розовый
                  shape = 'square';
                  break;
                case 'user':
                  color = '#f97316'; // Оранжевый
                  shape = 'arrowUp';
                  break;
                default:
                  color = '#60a5fa'; // Синий
                  shape = 'circle';
              }
              
              lunarMarkers.push({
                time: eventTime,
                position: 'aboveBar',
                color,
                shape,
                text: `${event.icon || ''} ${event.title}`,
                size: 2
              });
              
              // Создаем отдельную серию для текста
              const textSeries = chart.addLineSeries({
                lineVisible: false,
                lastValueVisible: false,
                priceLineVisible: false,
              });
              
              textSeries.setData([
                { time: eventTime, value: price * 1.02 }
              ]);
              
              textSeries.setMarkers([{
                time: eventTime,
                position: 'aboveBar',
                shape: 'arrowDown',
                color,
                text: `${event.icon || ''} ${event.title}`,
                size: 2,
              }]);
            }
          }
        });
      }
      
      if (lunarMarkers.length > 0) {
        console.log('Устанавливаем маркеры на график:', lunarMarkers.length);
        markersSeries.setMarkers(lunarMarkers);
      }
      
      chart.timeScale().fitContent();
      
      // Обработчик изменения размера окна
      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
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
          markersSeriesRef.current = null;
        }
      };
    }
  }, [chartData, lunarEvents, events, timeframe, isDarkMode]);

  // Функция для получения приблизительной цены для даты события
  const getApproximatePriceForDate = (date, candleData) => {
    if (!candleData || candleData.length === 0) return null;
    
    const targetTimestamp = Math.floor(date.getTime() / 1000);
    
    // Ищем ближайшую свечу
    let closestCandle = candleData[0];
    let minDiff = Math.abs(targetTimestamp - closestCandle.time);
    
    for (const candle of candleData) {
      const diff = Math.abs(targetTimestamp - candle.time);
      if (diff < minDiff) {
        minDiff = diff;
        closestCandle = candle;
      }
    }
    
    // Для событий в будущем используем последнюю цену
    if (targetTimestamp > candleData[candleData.length - 1].time) {
      const lastCandle = candleData[candleData.length - 1];
      return lastCandle.close;
    }
    
    return closestCandle.close;
  };

  if (loading && chartData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            График Bitcoin с фазами Луны
          </h3>
          <div className="flex items-center">
            <span className="flex items-center mr-4">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Новолуние</span>
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Полнолуние</span>
            </span>
          </div>
        </div>
        <div className="animate-pulse h-[400px] bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error && chartData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            График Bitcoin с фазами Луны
          </h3>
        </div>
        <div className="h-[400px] flex items-center justify-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          График Bitcoin с фазами Луны
        </h3>
        <div className="flex items-center">
          <span className="flex items-center mr-4">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
            <span className="text-sm text-gray-600 dark:text-gray-300">Новолуние</span>
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></span>
            <span className="text-sm text-gray-600 dark:text-gray-300">Полнолуние</span>
          </span>
        </div>
      </div>
      <div 
        ref={chartContainerRef} 
        className="w-full h-[400px] bg-white dark:bg-gray-800 rounded-lg shadow"
      />
    </div>
  );
};

export default BitcoinChartWithLunarPhases; 