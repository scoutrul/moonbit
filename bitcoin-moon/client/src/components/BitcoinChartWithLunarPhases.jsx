import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import BitcoinService from '../services/BitcoinService';
import EventsService from '../services/EventsService';
import AstroService from '../services/AstroService';
import { subscribeToPriceUpdates } from '../utils/mockDataGenerator';

/**
 * Компонент для отображения графика биткоина с фазами Луны
 * @param {Object} props - свойства компонента
 * @param {string} props.timeframe - выбранный таймфрейм
 */
const BitcoinChartWithLunarPhases = ({ timeframe, data }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(data || []);
  const [events, setEvents] = useState([]);
  const [lunarEvents, setLunarEvents] = useState([]);
  const unsubscribeRef = useRef(null);
  const [isChartFocused, setIsChartFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Инициализируем состояние темы при первом рендере
    const isDark = document.documentElement.classList.contains('dark');
    console.log('Начальная инициализация темы:', isDark ? 'темная' : 'светлая');
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
    // Проверяем текущее состояние темы при монтировании
    const currentIsDark = document.documentElement.classList.contains('dark');
    console.log('Текущее состояние темы при монтировании:', currentIsDark ? 'темная' : 'светлая');
    
    if (currentIsDark !== isDarkMode) {
      console.log('Обновляем состояние темы при монтировании');
      setIsDarkMode(currentIsDark);
    }
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          const newIsDarkMode = document.documentElement.classList.contains('dark');
          console.log('Обнаружено изменение темы:', newIsDarkMode ? 'темная' : 'светлая');
          
          if (newIsDarkMode !== isDarkMode) {
            console.log('Обновляем состояние isDarkMode');
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
            
            // Получаем лунные события за указанный период через сервис событий
            const lunarEvents = await EventsService.getLunarEvents(startDate, endDate);
            console.log('Получено лунных событий:', lunarEvents.length, lunarEvents);
            
            // Нормализуем формат событий
            const normalizedEvents = lunarEvents.map(event => {
              // Если событие уже в правильном формате, оставляем как есть
              if (event.time) return event;
              
              // Иначе преобразуем в нужный формат
              return {
                time: new Date(event.date).getTime() / 1000,
                type: event.type,
                title: event.title || event.phaseName,
                icon: event.icon,
                phaseName: event.phaseName || event.title
              };
            });
            
            // Сохраняем данные для отладки
            if (typeof window !== 'undefined') {
              window.__DEBUG_LUNAR_EVENTS = {
                timeframe,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                lunarPhases: normalizedEvents,
                sortedLunarPhases: [...normalizedEvents].sort((a, b) => a.time - b.time)
              };
            }
            
            setLunarEvents(normalizedEvents);
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
      }
      
      const theme = isDarkMode ? darkTheme : lightTheme;
      console.log('Создаем график с темой:', isDarkMode ? 'темная' : 'светлая');

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 600,
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
        handleScroll: {
          // Прокрутку графика разрешаем только если график в фокусе или нажата клавиша Ctrl
          vertTouchDrag: false,
          horzTouchDrag: false,
          mouseWheel: false,
          pressedMouseMove: true,
        },
        handleScale: {
          // Масштабирование разрешаем только если график в фокусе или нажата клавиша Ctrl
          axisPressedMouseMove: true,
          mouseWheel: false,
          pinch: false,
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

      candlestickSeries.setData(chartData);
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      
      // Добавляем маркеры для лунных фаз
      if (lunarEvents && lunarEvents.length > 0) {
        try {
          // Создаем маркеры для лунных фаз
          const lunarMarkers = lunarEvents.map((event) => {
            // Определяем цвет маркера в зависимости от типа события
            const markerColor = event.type === 'new_moon' 
              ? isDarkMode ? '#64748b' : '#334155' 
              : isDarkMode ? '#f1f5f9' : '#94a3b8';
              
            const price = getApproximatePriceForDate(new Date(event.time * 1000), chartData);
            
            return {
              time: event.time,
              position: 'aboveBar',
              shape: 'text',
              text: event.icon || (event.type === 'new_moon' ? '🌑' : '🌕'),
              size: 1,
              price: price * 1.01
            };
          });
          
          // Проверяем, отсортированы ли маркеры по времени
          const isSorted = lunarMarkers.every((marker, i, arr) => 
            i === 0 || arr[i-1].time <= marker.time
          );
          
          if (!isSorted) {
            console.log('Маркеры не отсортированы, сортируем по времени');
            lunarMarkers.sort((a, b) => a.time - b.time);
          } else {
            console.log('Маркеры уже отсортированы по времени');
          }
          
          console.log('Добавляем маркеры лунных фаз на график:', lunarMarkers);
          
          // Добавляем маркеры на график
          candlestickSeriesRef.current.setMarkers(lunarMarkers);
        } catch (err) {
          console.error('Ошибка при добавлении маркеров лунных фаз:', err);
        }
      } else {
        console.log('Нет данных о лунных фазах для отображения на графике');
      }
      
      // Добавляем остальные события
      if (events.length > 0) {
        console.log('Добавляем маркеры для событий:', events.length);
        
        // Сортируем события по времени
        const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedEvents.forEach(event => {
          if (event.type !== 'new_moon' && event.type !== 'full_moon') { // Пропускаем лунные события, т.к. мы их уже добавили
            const eventDate = new Date(event.date);
            const eventTime = Math.floor(eventDate.getTime() / 1000);
            const price = getApproximatePriceForDate(eventDate, chartData);
            
            if (price) {
              // Определяем цвет маркера в зависимости от типа события
              let color;
              let shape;
              let position;
              let priceOffset = 1.0;
              
              // Классифицируем события по типам
              const isAstroEvent = ['solar_eclipse', 'lunar_eclipse', 'astro', 'moon'].includes(event.type);
              const isEconomicEvent = ['economic', 'user'].includes(event.type);
              
              switch (event.type) {
                case 'solar_eclipse':
                  color = '#ff6b6b'; // Красный
                  shape = 'diamond';
                  position = 'belowBar';
                  priceOffset = 0.97; // Ниже графика
                  break;
                case 'lunar_eclipse':
                  color = '#6c5ce7'; // Фиолетовый
                  shape = 'diamond';
                  position = 'aboveBar';
                  priceOffset = 1.03; // Выше графика
                  break;
                case 'astro':
                  color = '#ec4899'; // Розовый
                  shape = 'square';
                  position = 'aboveBar';
                  priceOffset = 1.04; // Ещё выше
                  break;
                case 'economic':
                  color = '#10b981'; // Зеленый
                  shape = 'diamond';
                  position = 'aboveBar';
                  priceOffset = 1.06; // Значительно выше
                  break;
                case 'user':
                  color = '#f97316'; // Оранжевый
                  shape = 'arrowUp';
                  position = 'aboveBar';
                  priceOffset = 1.08; // Самые высокие
                  break;
                default:
                  color = '#60a5fa'; // Синий
                  shape = 'circle';
                  position = 'aboveBar';
                  priceOffset = 1.05;
              }
              
              const marker = {
                time: eventTime,
                position: position,
                color,
                shape,
                text: `${event.icon || ''} ${event.title}`,
                size: 2
              };
              
              // Распределяем маркеры по соответствующим массивам
              if (isAstroEvent) {
                candlestickSeriesRef.current.setMarkers([marker]);
              } else if (isEconomicEvent) {
                candlestickSeriesRef.current.setMarkers([marker]);
              }
            }
          }
        });
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

      // Добавляем обработчики фокуса
      const handleChartFocus = () => {
        setIsChartFocused(true);
        if (chartRef.current) {
          chartRef.current.applyOptions({
            handleScroll: {
              vertTouchDrag: true,
              horzTouchDrag: true,
              mouseWheel: true,
              pressedMouseMove: true,
            },
            handleScale: {
              axisPressedMouseMove: true,
              mouseWheel: true,
              pinch: true,
            },
          });
        }
      };

      const handleChartBlur = () => {
        setIsChartFocused(false);
        if (chartRef.current) {
          chartRef.current.applyOptions({
            handleScroll: {
              vertTouchDrag: false,
              horzTouchDrag: false,
              mouseWheel: false,
              pressedMouseMove: true,
            },
            handleScale: {
              axisPressedMouseMove: true,
              mouseWheel: false,
              pinch: false,
            },
          });
        }
      };

      // Обработчик клавиши Ctrl
      const handleKeyDown = (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (chartRef.current) {
            chartRef.current.applyOptions({
              handleScroll: {
                mouseWheel: true,
              },
              handleScale: {
                mouseWheel: true,
              },
            });
          }
        }
      };

      const handleKeyUp = (e) => {
        if (!isChartFocused && chartRef.current) {
          chartRef.current.applyOptions({
            handleScroll: {
              mouseWheel: false,
            },
            handleScale: {
              mouseWheel: false,
            },
          });
        }
      };

      // Добавляем слушатели событий
      chartContainerRef.current.addEventListener('mouseenter', handleChartFocus);
      chartContainerRef.current.addEventListener('mouseleave', handleChartBlur);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if (chartContainerRef.current) {
          chartContainerRef.current.removeEventListener('mouseenter', handleChartFocus);
          chartContainerRef.current.removeEventListener('mouseleave', handleChartBlur);
        }
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          candlestickSeriesRef.current = null;
        }
      };
    }
  }, [chartData, lunarEvents, events, timeframe, isDarkMode, isChartFocused]);

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
          <div className="flex items-center text-xs">
            <span className="flex items-center mr-3">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
              <span className="text-gray-600 dark:text-gray-300">Новолуние</span>
            </span>
            <span className="flex items-center mr-3">
              <span className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></span>
              <span className="text-gray-600 dark:text-gray-300">Полнолуние</span>
            </span>
            <span className="flex items-center mr-3">
              <span className="w-3 h-3 rounded-sm bg-pink-500 mr-1"></span>
              <span className="text-gray-600 dark:text-gray-300">Астро</span>
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 transform rotate-45 bg-green-500 mr-1"></span>
              <span className="text-gray-600 dark:text-gray-300">Экономика</span>
            </span>
          </div>
        </div>
        <div className="animate-pulse h-[600px] bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        <div className="h-[600px] flex items-center justify-center text-red-500">
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
        <div className="flex items-center text-xs">
          <span className="flex items-center mr-3">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
            <span className="text-gray-600 dark:text-gray-300">Новолуние</span>
          </span>
          <span className="flex items-center mr-3">
            <span className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></span>
            <span className="text-gray-600 dark:text-gray-300">Полнолуние</span>
          </span>
          <span className="flex items-center mr-3">
            <span className="w-3 h-3 rounded-sm bg-pink-500 mr-1"></span>
            <span className="text-gray-600 dark:text-gray-300">Астро</span>
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 transform rotate-45 bg-green-500 mr-1"></span>
            <span className="text-gray-600 dark:text-gray-300">Экономика</span>
          </span>
        </div>
      </div>
      <div 
        ref={chartContainerRef} 
        data-testid="bitcoin-chart"
        className="w-full h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow"
        tabIndex={0}
        title="Для масштабирования кликните на график или используйте Ctrl+колесико мыши"
      />
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
        Для масштабирования кликните на график или используйте Ctrl+колесико мыши
      </div>
    </div>
  );
};

export default BitcoinChartWithLunarPhases;