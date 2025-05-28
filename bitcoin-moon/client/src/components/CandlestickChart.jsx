import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import BitcoinService from '../services/BitcoinService';
import EventsService from '../services/EventsService';
import { subscribeToPriceUpdates } from '../utils/mockDataGenerator';

const CandlestickChart = ({ timeframe }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const markersSeriesRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [events, setEvents] = useState([]);
  const unsubscribeRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Инициализируем состояние темы при первом рендере
    const isDark = document.documentElement.classList.contains('dark');
    console.log('CandlestickChart - Начальная инициализация темы:', isDark ? 'темная' : 'светлая');
    return isDark;
  });

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
    if (!candlestickSeriesRef.current || data.length === 0) return;

    // Получаем последнюю свечу
    const lastCandle = data[data.length - 1];
    
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
      const updatedData = [...data];
      updatedData[updatedData.length - 1] = updatedCandle;
      
      // Обновляем график
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.update(updatedCandle);
      }
    }
  }, [data]);

  // Эффект для отслеживания изменения темы
  useEffect(() => {
    // Проверяем текущее состояние темы при монтировании
    const currentIsDark = document.documentElement.classList.contains('dark');
    console.log('CandlestickChart - Текущее состояние темы при монтировании:', currentIsDark ? 'темная' : 'светлая');
    
    if (currentIsDark !== isDarkMode) {
      console.log('CandlestickChart - Обновляем состояние темы при монтировании');
      setIsDarkMode(currentIsDark);
    }
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          const newIsDarkMode = document.documentElement.classList.contains('dark');
          console.log('CandlestickChart - Обнаружено изменение темы:', newIsDarkMode ? 'темная' : 'светлая');
          
          if (newIsDarkMode !== isDarkMode) {
            console.log('CandlestickChart - Обновляем состояние isDarkMode');
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
  
  // Загрузка данных при монтировании или изменении timeframe
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Загружаем данные для графика
        const chartData = await BitcoinService.getCandlestickData(timeframe);
        setData(chartData);
        
        // Загружаем события для отображения на графике
        const eventsData = await EventsService.getEventsForChart(timeframe);
        console.log('Загружено событий:', eventsData.length, eventsData);
        setEvents(eventsData);
        
        if (candlestickSeriesRef.current && chartData.length > 0) {
          candlestickSeriesRef.current.setData(chartData);
          
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
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
  }, [timeframe, handlePriceUpdate]);

  // Создание графика при монтировании компонента, изменении данных или темы
  useEffect(() => {
    if (chartContainerRef.current && data.length > 0) {
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

      // Добавляем свечной график с цветами, соответствующими теме
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: isDarkMode ? '#26a69a' : '#4caf50',
        downColor: isDarkMode ? '#ef5350' : '#f44336', // Разные оттенки красного для разных тем
        borderVisible: false,
        wickUpColor: isDarkMode ? '#26a69a' : '#4caf50',
        wickDownColor: isDarkMode ? '#ef5350' : '#f44336', // Разные оттенки красного для разных тем
      });

      candlestickSeries.setData(data);
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      
      // Добавляем серию маркеров
      const markersSeries = chart.addLineSeries({
        lineVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      
      markersSeriesRef.current = markersSeries;
      
      // Добавляем маркеры событий
      if (events.length > 0) {
        console.log('Создаем маркеры для событий:', events.length);
        const markers = events.map(event => {
          const eventDate = new Date(event.date);
          const price = getApproximatePriceForDate(eventDate, data);
          console.log(`Маркер для события "${event.title}": дата=${eventDate}, цена=${price}`);
          
          // Определяем цвет маркера в зависимости от типа события
          let color;
          let shape;
          
          switch (event.type) {
            case 'moon':
              color = '#6366f1'; // Индиго
              shape = 'circle';
              break;
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
          
          return {
            time: Math.floor(eventDate.getTime() / 1000),
            position: 'aboveBar',
            color,
            shape,
            text: `${event.icon || ''} ${event.title}`,
            size: 2, // Увеличиваем размер маркера
          };
        });
        
        console.log('Добавляем маркеры на график:', markers);
        markersSeries.setMarkers(markers);
        
        // Добавляем больше наглядных меток с текстом
        for (const event of events) {
          // Создаем ещё одну серию для отображения текстовых меток
          const textSeries = chart.addLineSeries({
            lineVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          });
          
          const eventDate = new Date(event.date);
          const eventTime = Math.floor(eventDate.getTime() / 1000);
          const price = getApproximatePriceForDate(eventDate, data);
          
          // Проверяем, попадает ли событие в диапазон данных графика
          if (eventTime >= data[0].time && eventTime <= data[data.length - 1].time) {
            // Помечаем важные события на графике
            textSeries.setData([
              { time: eventTime, value: price * 1.02 } // Немного выше цены
            ]);
            
            // Создаем метку с названием события
            textSeries.setMarkers([
              {
                time: eventTime,
                position: 'aboveBar',
                shape: 'arrowDown',
                color: event.type === 'moon' ? '#6366f1' : event.type === 'astro' ? '#ec4899' : '#f97316',
                text: `${event.icon || ''} ${event.title}`,
                size: 3,
              }
            ]);
          }
        }
      }
      
      chart.timeScale().fitContent();

      // Добавляем подсказки при наведении на маркеры
      chart.subscribeCrosshairMove((param) => {
        if (param.time && events.length > 0) {
          const crosshairTime = param.time;
          
          // Находим событие рядом с позицией курсора
          const nearbyEvent = events.find(event => {
            const eventTime = Math.floor(new Date(event.date).getTime() / 1000);
            // Учитываем таймфрейм для определения "близости" события
            const threshold = getTimeThreshold(timeframe);
            return Math.abs(eventTime - crosshairTime) < threshold;
          });
          
          if (nearbyEvent) {
            // Здесь можно отобразить всплывающую подсказку с информацией о событии
            // В простом варианте можно вывести в консоль
            console.log('Событие:', nearbyEvent.title, nearbyEvent.date);
          }
        }
      });

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
  }, [data, events, timeframe, isDarkMode]);

  // Обработчик добавления новой свечи
  useEffect(() => {
    if (!data.length || !candlestickSeriesRef.current) return;

    // Функция для получения и добавления новой свечи
    const checkForNewCandle = async () => {
      try {
        // Проверяем, нужно ли добавить новую свечу
        const lastCandle = data[data.length - 1];
        const now = Date.now() / 1000;
        
        // Определяем интервал времени для текущего таймфрейма в секундах
        let timeIntervalInSeconds;
        switch (timeframe) {
          case '1m': timeIntervalInSeconds = 60; break;
          case '3m': timeIntervalInSeconds = 3 * 60; break;
          case '5m': timeIntervalInSeconds = 5 * 60; break;
          case '15m': timeIntervalInSeconds = 15 * 60; break;
          case '30m': timeIntervalInSeconds = 30 * 60; break;
          case '1h': timeIntervalInSeconds = 60 * 60; break;
          case '4h': timeIntervalInSeconds = 4 * 60 * 60; break;
          case '12h': timeIntervalInSeconds = 12 * 60 * 60; break;
          case '1d': timeIntervalInSeconds = 24 * 60 * 60; break;
          case '1w': timeIntervalInSeconds = 7 * 24 * 60 * 60; break;
          case '1M': timeIntervalInSeconds = 30 * 24 * 60 * 60; break;
          case '1y': timeIntervalInSeconds = 365 * 24 * 60 * 60; break;
          default: timeIntervalInSeconds = 24 * 60 * 60;
        }
        
        // Если прошло достаточно времени, загружаем новые данные
        if (now - lastCandle.time > timeIntervalInSeconds) {
          const newData = await BitcoinService.getCandlestickData(timeframe);
          setData(newData);
          
          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.setData(newData);
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке новой свечи:', error);
      }
    };

    // Запускаем проверку новых свечей каждую минуту
    const intervalId = setInterval(checkForNewCandle, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [data, timeframe]);

  // Функция для определения порога времени в зависимости от таймфрейма
  const getTimeThreshold = (timeframe) => {
    switch (timeframe) {
      case '1m': return 30; // 30 секунд
      case '3m': return 90; // 1.5 минуты
      case '5m': return 150; // 2.5 минуты
      case '15m': return 450; // 7.5 минут
      case '30m': return 900; // 15 минут
      case '1h': return 1800; // 30 минут
      case '4h': return 7200; // 2 часа
      case '12h': return 21600; // 6 часов
      case '1d': return 43200; // 12 часов
      case '1w': return 302400; // 3.5 дня
      case '1M': return 1209600; // 14 дней
      case '1y': return 15552000; // 180 дней
      case 'all': return 31104000; // 360 дней
      default: return 43200; // 12 часов
    }
  };

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

  if (loading && data.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return <div className="h-[400px]" ref={chartContainerRef} />;
};

export default CandlestickChart;
