// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import BitcoinService from '../services/BitcoinService';
import EventsService from '../services/EventsService';
import AstroService from '../services/AstroService';
import ForecastService from '../services/ForecastService';
import { subscribeToPriceUpdates } from '../utils/mockDataGenerator';

/**
 * Компонент для отображения графика биткоина с фазами Луны
 * @typedef {Object} CandlestickData
 * @property {number} time - временная метка
 * @property {number} open - цена открытия
 * @property {number} high - максимальная цена
 * @property {number} low - минимальная цена
 * @property {number} close - цена закрытия
 * 
 * @param {Object} props - свойства компонента
 * @param {string} props.timeframe - выбранный таймфрейм
 * @param {CandlestickData[]} [props.data] - данные для отображения на графике (опционально)
 */
const BitcoinChartWithLunarPhases = ({ timeframe, data = [] }) => {
  console.log('🚀 BitcoinChartWithLunarPhases: Компонент инициализируется', { timeframe, dataLength: data?.length || 0 });
  
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const forecastSeriesRef = useRef(null);
  const legendRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [showForecast, setShowForecast] = useState(true);
  const [events, setEvents] = useState([]);
  const [lunarEvents, setLunarEvents] = useState([]);
  const [futureLunarEvents, setFutureLunarEvents] = useState([]);
  const [loadingTimeframe, setLoadingTimeframe] = useState(null); // Отслеживаем какой таймфрейм загружается
  const [isTransitioning, setIsTransitioning] = useState(false); // Состояние плавного перехода
  const unsubscribeRef = useRef(null);
  const [isChartFocused, setIsChartFocused] = useState(false);
  const previousTimeframeRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Инициализируем состояние темы при первом рендере
    const isDark = document.documentElement.classList.contains('dark');
    console.log('🌙 Начальная инициализация темы:', isDark ? 'темная' : 'светлая');
    return isDark;
  });
  
  console.log('📊 Состояние компонента:', { 
    loading, 
    error: !!error, 
    chartDataLength: chartData.length, 
    forecastDataLength: forecastData.length,
    lunarEventsLength: lunarEvents.length
  });
  
  // Состояние для текущей цены биткоина
  const [currentPrice, setCurrentPrice] = useState({
    price: null,
    change_24h: null,
    change_percentage_24h: null,
    last_updated: null
  });
  const [priceAnimation, setPriceAnimation] = useState(null); // 'up', 'down', null
  const lastPriceRef = useRef(null);

  // Таймфреймы для кнопок
  const timeframes = [
    { id: '1m', label: '1М' },
    { id: '5m', label: '5М' },
    { id: '15m', label: '15М' },
    { id: '30m', label: '30М' },
    { id: '1h', label: '1Ч' },
    { id: '4h', label: '4Ч' },
    { id: '1d', label: '1Д' },
    { id: '1w', label: '1Н' }
  ];

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
    
    // Обновляем данные текущей цены
    if (lastPriceRef.current !== null) {
      const newAnimation = priceData.price > lastPriceRef.current ? 'up' : 'down';
      setPriceAnimation(newAnimation);
      
      // Сбрасываем анимацию через 2 секунды
      setTimeout(() => {
        setPriceAnimation(null);
      }, 2000);
    }
    
    // Обновляем последнюю цену
    lastPriceRef.current = priceData.price;
    
    // Обновляем данные о цене
    setCurrentPrice(prevData => ({
      ...prevData,
      price: priceData.price,
      last_updated: new Date().toISOString(),
    }));
  }, [chartData]);

  // Функция для полного пересоздания графика
  const recreateChart = useCallback(() => {
    console.log('Пересоздание графика при изменении таймфрейма или темы');
    
    // Удаляем старый график, если он существует
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      forecastSeriesRef.current = null;
    }

    // Если контейнер еще не создан или компонент размонтирован, прерываем выполнение
    if (!chartContainerRef.current) return;

    // Создаем новый график
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight - 60, // Оставляем место для кнопок таймфрейма
      layout: isDarkMode ? darkTheme.layout : lightTheme.layout,
      grid: isDarkMode ? darkTheme.grid : lightTheme.grid,
      crosshair: isDarkMode ? darkTheme.crosshair : lightTheme.crosshair,
      timeScale: {
        timeVisible: true,
        secondsVisible: timeframe === '1m' || timeframe === '5m' || timeframe === '15m',
        borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
      },
      rightPriceScale: {
        borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
      },
      localization: {
        locale: 'ru-RU',
        dateFormat: 'dd MMM yyyy',
      },
    });

    // Сохраняем ссылку на график
    chartRef.current = chart;

    // Создаем серию свечей
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Сохраняем ссылку на серию свечей
    candlestickSeriesRef.current = candlestickSeries;

    // Устанавливаем данные
    if (chartData && chartData.length > 0) {
      candlestickSeries.setData(chartData);
    }

    // Создаем серию для прогноза
    if (showForecast && forecastData && forecastData.length > 0) {
      const forecastSeries = chart.addLineSeries({
        color: '#9b59b6',
        lineWidth: 2,
        lineStyle: 1, // Пунктирная линия
        lastValueVisible: false,
      });

      forecastSeries.setData(forecastData.map(candle => ({
        time: candle.time,
        value: candle.close
      })));

      forecastSeriesRef.current = forecastSeries;
    }

    // Подгоняем график под видимую область
    chart.timeScale().fitContent();

    // Добавляем маркеры лунных событий на график
    if (lunarEvents && lunarEvents.length > 0) {
      const markers = lunarEvents.map(event => {
        const time = new Date(event.date).getTime() / 1000;
        const price = getApproximatePriceForDate(new Date(event.date), chartData);
        
        return {
          time,
          position: 'inBar',
          color: event.type === 'new_moon' ? '#111827' : '#f3f4f6',
          shape: 'circle',
          size: 2,
          text: event.type === 'new_moon' ? 'Н' : 'П',
          tooltip: `${event.phaseName} - ${formatDate(time)}`,
          price: price || undefined
        };
      }).filter(marker => marker.price !== undefined);
      
      if (markers.length > 0) {
        candlestickSeries.setMarkers(markers);
      }
    }

    // Добавляем обработчики событий
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight - 60, // Оставляем место для кнопок таймфрейма
        });
      }
    };

    const handleChartFocus = () => {
      if (chartContainerRef.current) {
        setIsChartFocused(true);
      }
    };

    window.addEventListener('resize', handleResize);
    chartContainerRef.current.addEventListener('focus', handleChartFocus, true);
    chartContainerRef.current.addEventListener('click', handleChartFocus);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartContainerRef.current) {
        chartContainerRef.current.removeEventListener('focus', handleChartFocus, true);
        chartContainerRef.current.removeEventListener('click', handleChartFocus);
      }
    };
  }, [chartData, forecastData, lunarEvents, isDarkMode, timeframe, showForecast]);

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

    // Добавляем обработчик события изменения таймфрейма
    const handleTimeframeChange = (event) => {
      console.log('Событие изменения таймфрейма:', event.detail);
      
      // Диспатчим событие вверх до родительского компонента
      const customEvent = new CustomEvent('timeframe-changed', { 
        detail: { timeframe: event.detail },
        bubbles: true
      });
      chartContainerRef.current.dispatchEvent(customEvent);
    };

    window.addEventListener('change-timeframe', handleTimeframeChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('change-timeframe', handleTimeframeChange);
    };
  }, [isDarkMode]);

  // Эффект для обновления графика при изменении темы
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        layout: isDarkMode ? darkTheme.layout : lightTheme.layout,
        grid: isDarkMode ? darkTheme.grid : lightTheme.grid,
        crosshair: isDarkMode ? darkTheme.crosshair : lightTheme.crosshair,
        timeScale: {
          ...chartRef.current.timeScale().options(),
          borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
        },
        rightPriceScale: {
          ...chartRef.current.priceScale().options(),
          borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
        },
      });
    }
  }, [isDarkMode]);

  // Обновляем данные, когда получаем их извне
  useEffect(() => {
    if (data && data.length > 0) {
      console.log(`Получены новые данные для таймфрейма ${timeframe}, количество свечей: ${data.length}`);
      setChartData(data);
    }
  }, [data, timeframe]);
  
  // Добавляем состояние для отслеживания запросов лунных событий
  const [lunarEventsLoading, setLunarEventsLoading] = useState(false);
  const lunarEventsRequestsRef = useRef(new Map());
  const lunarEventsLoadedRef = useRef(false); // Флаг для отслеживания первичной загрузки
  const activeRequestRef = useRef(null); // Ссылка на активный запрос для отмены
  
  // Модифицированная функция для получения лунных событий с кэшированием
  const getLunarEventsWithCache = useCallback(async (startDate, endDate) => {
    // Создаем ключ для кэша на основе диапазона дат
    const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}`;
    
    // Проверяем, не выполняется ли уже запрос с такими параметрами
    if (lunarEventsRequestsRef.current.has(cacheKey)) {
      console.log(`Запрос лунных событий для ${cacheKey} уже выполняется, ожидаем результат`);
      return lunarEventsRequestsRef.current.get(cacheKey);
    }
    
    // Создаем новый промис для запроса
    const requestPromise = (async () => {
      try {
        console.log(`Запрос лунных событий в диапазоне: ${startDate.toISOString()} - ${endDate.toISOString()}`);
        const result = await EventsService.getLunarEvents(startDate, endDate);
        lunarEventsLoadedRef.current = true; // Отмечаем, что загрузка выполнена успешно
        return result;
      } catch (error) {
        console.error('Ошибка при получении лунных событий:', error);
        throw error;
      } finally {
        // Удаляем запрос из списка выполняющихся
        setTimeout(() => {
          lunarEventsRequestsRef.current.delete(cacheKey);
        }, 1000);
      }
    })();
    
    // Сохраняем промис в кэше выполняющихся запросов
    lunarEventsRequestsRef.current.set(cacheKey, requestPromise);
    
    return requestPromise;
  }, []);
  
  // Эффект для пересоздания графика при изменении таймфрейма
  useEffect(() => {
    console.log(`🔄 Изменение таймфрейма: ${previousTimeframeRef.current} -> ${timeframe}`);
    
    // Если таймфрейм изменился, отменяем предыдущие запросы и пересоздаем график
    if (previousTimeframeRef.current !== null && previousTimeframeRef.current !== timeframe) {
      console.log('⚠️ ОТМЕНА предыдущих запросов из-за смены таймфрейма');
      
      // Отменяем активный запрос, если он есть
      if (activeRequestRef.current) {
        activeRequestRef.current.isCancelled = true;
        console.log('🚫 Отменен активный запрос');
      }
      
      // Очищаем кэш лунных событий для избежания конфликтов
      lunarEventsRequestsRef.current.clear();
      
      // Сначала устанавливаем состояние загрузки
      setLoading(true);
      setError(null);
      
      // Сбрасываем флаг загрузки лунных событий
      lunarEventsLoadedRef.current = false;
      setLunarEventsLoading(false);
      
      // Очищаем данные ТОЛЬКО если это действительно новый таймфрейм
      setChartData([]);
      setForecastData([]);
      setLunarEvents([]);
      setFutureLunarEvents([]);
      
      console.log('✅ Состояние очищено для нового таймфрейма:', timeframe);
    }
    
    // Обновляем предыдущий таймфрейм в любом случае
    previousTimeframeRef.current = timeframe;
    
  }, [timeframe]);

  // Загрузка данных при монтировании или изменении timeframe
  useEffect(() => {
    console.log('⚡ useEffect loadData запущен:', { timeframe, dataLength: data?.length || 0, loading });
    
    let isMounted = true;
    const retryLimit = 3;
    let retryCount = 0;
    
    // Создаем объект для отслеживания отмены запроса
    const requestController = { isCancelled: false };
    activeRequestRef.current = requestController;
    
    const fetchData = async () => {
      console.log('🔄 fetchData начинается:', { isMounted, timeframe, retryCount, cancelled: requestController.isCancelled });
      
      if (!isMounted || requestController.isCancelled) {
        console.log('🚫 fetchData прерван: компонент размонтирован или запрос отменен');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('✅ Состояние обновлено: loading=true, error=null');

        let chartData = [];
        let forecast = [];
        let combinedLunarEvents = [];

        // Если данные не были переданы извне, загружаем их
        if (!data || data.length === 0) {
          console.log(`📡 Загрузка данных для таймфрейма ${timeframe}`);
          
          try {
            // Проверяем отмену перед каждым шагом
            if (requestController.isCancelled) {
              console.log('🚫 Запрос отменен перед загрузкой данных');
              return;
            }
            
            // Загружаем расширенные данные (исторические + прогноз)
            console.log('🎯 Вызываем ForecastService.getExtendedChartData...');
            const extendedData = await ForecastService.getExtendedChartData(timeframe, 30);
            
            // Еще одна проверка после асинхронного запроса
            if (!isMounted || requestController.isCancelled) {
              console.log('🚫 Запрос отменен после получения данных от ForecastService');
              return;
            }
            
            console.log('📋 Получены данные от ForecastService:', {
              historicalDataLength: extendedData.historicalData?.length || 0,
              forecastDataLength: extendedData.forecastData?.length || 0,
              lunarEventsLength: extendedData.lunarEvents?.length || 0
            });
            
            if (extendedData.historicalData && extendedData.historicalData.length > 0) {
              chartData = extendedData.historicalData;
              forecast = extendedData.forecastData || [];
              
              // Проверяем перед обновлением состояния
              if (!requestController.isCancelled) {
                setChartData(chartData);
                setForecastData(forecast);
                console.log('✅ Данные установлены в состояние:', { chartDataLength: chartData.length, forecastLength: forecast.length });
              }
              
              // Загружаем лунные события для исторического и прогнозного периода
              if (extendedData.lunarEvents && extendedData.lunarEvents.length > 0) {
                console.log('🌙 Получено лунных событий для прогноза:', extendedData.lunarEvents.length);
                if (!requestController.isCancelled) {
                  setFutureLunarEvents(extendedData.lunarEvents);
                  combinedLunarEvents = extendedData.lunarEvents;
                }
              }
            } else {
              throw new Error('Получены пустые данные от сервера');
            }
          } catch (err) {
            if (requestController.isCancelled) {
              console.log('🚫 Обработка ошибки пропущена: запрос отменен');
              return;
            }
            
            console.error('Ошибка при загрузке данных через ForecastService:', err);
            
            // Повторяем попытку загрузки данных напрямую через BitcoinService
            if (retryCount < retryLimit) {
              retryCount++;
              console.log(`Повторная попытка загрузки данных (${retryCount}/${retryLimit})`);
              
              try {
                const candlesData = await BitcoinService.getCandlestickData(timeframe);
                
                if (!isMounted || requestController.isCancelled) return;
                
                if (candlesData && candlesData.length > 0) {
                  chartData = candlesData;
                  setChartData(chartData);
                  
                  // Генерируем прогноз на основе полученных данных
                  forecast = ForecastService.generateForecastData(chartData, timeframe, 30);
                  setForecastData(forecast);
                } else {
                  throw new Error('Не удалось загрузить данные свечей');
                }
              } catch (retryError) {
                console.error(`Повторная попытка ${retryCount} также неудачна:`, retryError);
                if (retryCount >= retryLimit) {
                  // Используем fallback данные
                  console.log('Используем fallback данные для графика');
                  chartData = generateFallbackData(timeframe);
                  setChartData(chartData);
                  forecast = ForecastService.generateForecastData(chartData, timeframe, 30);
                  setForecastData(forecast);
                  setError('Не удалось подключиться к серверу. Отображаются демонстрационные данные.');
                }
              }
            } else {
              // Используем fallback данные после исчерпания попыток
              console.log('Все попытки исчерпаны, используем fallback данные');
              chartData = generateFallbackData(timeframe);
              setChartData(chartData);
              forecast = ForecastService.generateForecastData(chartData, timeframe, 30);
              setForecastData(forecast);
              setError('Сервер временно недоступен. Отображаются демонстрационные данные.');
            }
          }
        } else {
          chartData = data;
          // Генерируем прогноз на основе переданных данных
          forecast = ForecastService.generateForecastData(data, timeframe, 30);
          setChartData(data);
          setForecastData(forecast);
          
          // Если данные были переданы извне, получаем лунные события для прогнозного периода отдельно
          if (forecast && forecast.length > 0 && !lunarEventsLoadedRef.current) {
            const startDate = new Date(data[data.length - 1].time * 1000);
            const endDate = new Date(forecast[forecast.length - 1].time * 1000);
            
            console.log(`Запрашиваем лунные события для прогноза извне: ${startDate.toISOString()} - ${endDate.toISOString()}`);
            
            try {
              // Проверяем, не выполняется ли уже загрузка лунных событий
              if (!lunarEventsLoading) {
                setLunarEventsLoading(true);
                const futureEvents = await getLunarEventsWithCache(startDate, endDate);
                
                if (!isMounted || requestController.isCancelled) return;
                
                // Нормализуем формат будущих событий и отмечаем их как прогнозные
                const normalizedFutureEvents = futureEvents.map(event => {
                  return {
                    ...event,
                    isForecast: true
                  };
                });
                
                setFutureLunarEvents(normalizedFutureEvents);
                combinedLunarEvents = normalizedFutureEvents;
                setLunarEventsLoading(false);
              }
            } catch (err) {
              console.error('Ошибка при загрузке лунных событий для прогноза:', err);
              setLunarEventsLoading(false);
            }
          }
        }
        
        // Загружаем исторические лунные события
        if (chartData && chartData.length > 0 && !lunarEventsLoading) {
          try {
            const startDate = new Date(chartData[0].time * 1000);
            const endDate = new Date(chartData[chartData.length - 1].time * 1000);
            
            console.log(`🌙 Запрашиваем исторические лунные события: ${startDate.toISOString()} - ${endDate.toISOString()}`);
            
            // Избегаем повторных запросов на те же даты
            setLunarEventsLoading(true);
            const historicalEvents = await getLunarEventsWithCache(startDate, endDate);
            
            if (!isMounted || requestController.isCancelled) return;
            
            console.log('🎉 Получено исторических лунных событий:', historicalEvents.length);
            console.log('🌙 Исторические события:', historicalEvents);
            
            // Объединяем исторические и будущие события
            const allLunarEvents = [...historicalEvents, ...combinedLunarEvents];
            console.log('🌟 Устанавливаем в состояние всего лунных событий:', allLunarEvents.length);
            
            setLunarEvents(allLunarEvents);
            setLunarEventsLoading(false);
            lunarEventsLoadedRef.current = true; // Отмечаем успешную загрузку
          } catch (err) {
            console.error('❌ Ошибка при загрузке исторических лунных событий:', err);
            setLunarEventsLoading(false);
            // Продолжаем выполнение, даже если не удалось загрузить лунные события
          }
        }
        
        if (!isMounted || requestController.isCancelled) return;
        
        // Создаем график после загрузки данных
        if (chartData && chartData.length > 0) {
          console.log(`🎨 СОЗДАНИЕ ГРАФИКА для таймфрейма ${timeframe} с ${chartData.length} свечами`);
          setTimeout(() => {
            if (isMounted && !requestController.isCancelled) {
              console.log('⏰ Таймаут для создания графика выполняется');
              recreateChart();
            } else {
              console.log('🚫 Создание графика отменено');
            }
          }, 0);
        } else {
          console.log('❌ НЕ УДАЛОСЬ СОЗДАТЬ ГРАФИК: нет данных chartData');
          if (!requestController.isCancelled) {
            setError('Не удалось загрузить данные для графика');
          }
        }
        
        // Проверяем отмену перед финальными операциями
        if (requestController.isCancelled) {
          console.log('🚫 Финальные операции пропущены: запрос отменен');
          return;
        }
        
        // Запускаем обновление текущей цены биткоина
        fetchPrice();
        
        // Получаем текущую цену биткоина каждые 5 минут (вместо 60 секунд)
        const priceInterval = setInterval(() => {
          // Обновляем цену только если вкладка активна
          if (isMounted && !document.hidden && !requestController.isCancelled) {
            fetchPrice();
          }
        }, 5 * 60 * 1000); // 5 минут
        
        // Подписываемся на обновления цены в реальном времени
        const unsubscribe = subscribeToPriceUpdates(handlePriceUpdate);
        unsubscribeRef.current = unsubscribe;
        
        if (isMounted && !requestController.isCancelled) {
          setLoading(false);
          console.log('🎉 ЗАГРУЗКА ЗАВЕРШЕНА! setLoading(false) установлено');
        }
        
        // Сбрасываем состояние загрузки таймфрейма
        resetLoadingState();
        
        return () => {
          clearInterval(priceInterval);
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
          }
        };
      } catch (err) {
        if (requestController.isCancelled) {
          console.log('🚫 Обработка ошибки пропущена: запрос отменен');
          return;
        }
        
        console.error('Ошибка при загрузке данных графика:', err);
        if (isMounted && !requestController.isCancelled) {
          // Если все попытки неудачны, показываем fallback данные с предупреждением
          const fallbackData = generateFallbackData(timeframe);
          setChartData(fallbackData);
          const fallbackForecast = ForecastService.generateForecastData(fallbackData, timeframe, 30);
          setForecastData(fallbackForecast);
          
          setError(`Не удалось подключиться к серверу: ${err.message}. Отображаются демонстрационные данные.`);
          setLoading(false);
          
          // Все равно создаем график с fallback данными
          setTimeout(() => {
            if (isMounted && !requestController.isCancelled) {
              recreateChart();
            }
          }, 0);
        }
      }
    };

    // Генерация fallback данных
    const generateFallbackData = (timeframe) => {
      const data = [];
      const now = Date.now();
      const basePrice = 45000; // Базовая цена
      let intervalInMs;
      let periodsCount;
      
      // Определяем интервал и количество периодов
      switch(timeframe) {
        case '1m': intervalInMs = 60 * 1000; periodsCount = 100; break;
        case '5m': intervalInMs = 5 * 60 * 1000; periodsCount = 100; break;
        case '15m': intervalInMs = 15 * 60 * 1000; periodsCount = 100; break;
        case '30m': intervalInMs = 30 * 60 * 1000; periodsCount = 100; break;
        case '1h': intervalInMs = 60 * 60 * 1000; periodsCount = 100; break;
        case '4h': intervalInMs = 4 * 60 * 60 * 1000; periodsCount = 100; break;
        case '1d': intervalInMs = 24 * 60 * 60 * 1000; periodsCount = 90; break;
        case '1w': intervalInMs = 7 * 24 * 60 * 60 * 1000; periodsCount = 52; break;
        default: intervalInMs = 24 * 60 * 60 * 1000; periodsCount = 90; break;
      }
      
      for (let i = periodsCount; i >= 0; i--) {
        const time = Math.floor((now - (i * intervalInMs)) / 1000);
        
        // Генерируем реалистичные данные свечей
        const variance = 500 + Math.random() * 1000;
        const trend = (periodsCount - i) * 10; // Небольшой восходящий тренд
        
        const open = basePrice + trend + (Math.random() - 0.5) * variance;
        const close = open + (Math.random() - 0.5) * variance * 0.5;
        const high = Math.max(open, close) + Math.random() * variance * 0.3;
        const low = Math.min(open, close) - Math.random() * variance * 0.3;
        
        data.push({
          time,
          open: Math.round(open * 100) / 100,
          high: Math.round(high * 100) / 100,
          low: Math.round(low * 100) / 100,
          close: Math.round(close * 100) / 100,
        });
      }
      
      return data;
    };
    
    fetchData();
    
    // Очистка при размонтировании
    return () => {
      isMounted = false;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        forecastSeriesRef.current = null;
      }
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [timeframe]);

  // Функция для получения текущей цены биткоина
  const fetchPrice = async () => {
    try {
      const data = await BitcoinService.getCurrentPrice('usd');
      setCurrentPrice(data);
      lastPriceRef.current = data.price;
    } catch (err) {
      console.error('Ошибка при получении текущей цены биткоина:', err);
    }
  };

  // Функция для форматирования даты в русском формате
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Создание графика при монтировании компонента, изменении данных или темы
  useEffect(() => {
    if (chartContainerRef.current && chartData.length > 0) {
      // Если уже есть график, то удаляем его
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        forecastSeriesRef.current = null;
      }
      
      // Удаляем старую легенду, если она существует
      if (legendRef.current && chartContainerRef.current.contains(legendRef.current)) {
        chartContainerRef.current.removeChild(legendRef.current);
        legendRef.current = null;
      }
      
      const theme = isDarkMode ? darkTheme : lightTheme;
      console.log('Создаем график с темой:', isDarkMode ? 'темная' : 'светлая');

      const chart = createChart(chartContainerRef.current, {
        ...theme,
        width: chartContainerRef.current.clientWidth,
        height: 500,
        timeScale: {
          timeVisible: true,
          secondsVisible: timeframe === '1m' || timeframe === '3m' || timeframe === '5m',
          borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
          barSpacing: 6,
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

      // Проверяем и валидируем данные перед установкой
      if (chartData && Array.isArray(chartData) && chartData.length > 0) {
        try {
          candlestickSeries.setData(chartData);
          console.log('✅ Данные успешно установлены в candlestickSeries');
        } catch (setDataError) {
          console.error('❌ Ошибка при установке chartData в candlestickSeries:', setDataError);
          console.log('🔍 Проблемные данные chartData:', chartData.slice(0, 5));
          return; // Прерываем выполнение при ошибке
        }
      } else {
        console.error('❌ chartData не является массивом или пуст:', chartData);
        return;
      }
      
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      
      // Создаем легенду для графика
      if (chartContainerRef.current) {
        legendRef.current = document.createElement('div');
        const legendStyle = {
          position: 'absolute',
          left: '12px',
          top: '12px',
          zIndex: '1',
          fontSize: '14px',
          fontFamily: 'sans-serif',
          lineHeight: '18px',
          fontWeight: '300',
          color: isDarkMode ? '#f1f5f9' : '#1e293b',
          padding: '8px',
          borderRadius: '4px',
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(2px)'
        };
        
        // Применяем стили к легенде
        Object.assign(legendRef.current.style, legendStyle);
        chartContainerRef.current.appendChild(legendRef.current);
        console.log('📊 Легенда графика создана и добавлена');
      }
      
      // Функция для получения последней свечи
      const getLastBar = series => {
        const lastIndex = series.dataByIndex(Number.MAX_SAFE_INTEGER, -1);
        return series.dataByIndex(lastIndex);
      };
      
      // Функция обновления легенды
      const updateLegend = param => {
        if (!legendRef.current) return;
        
        const validCrosshairPoint = !(
          param === undefined || 
          param.time === undefined || 
          param.point.x < 0 || 
          param.point.y < 0
        );
        
        // Получаем данные о свече
        const bar = validCrosshairPoint 
          ? param.seriesData.get(candlestickSeries) 
          : getLastBar(candlestickSeries);
        
        if (!bar) return;
        
        // Получаем данные для отображения в легенде
        const time = bar.time;
        const open = bar.open;
        const high = bar.high;
        const low = bar.low;
        const close = bar.close;
        
        // Определяем, растет цена или падает
        const isUp = close >= open;
        const changePercent = ((close - open) / open * 100).toFixed(2);
        const changeText = isUp ? `+${changePercent}%` : `${changePercent}%`;
        const changeColor = isUp ? (isDarkMode ? '#4ade80' : '#22c55e') : (isDarkMode ? '#f87171' : '#ef4444');
        
        // Форматируем цены
        const formattedDate = formatDate(time);
        const formattedClose = formatPrice(close);
        
        // Устанавливаем HTML легенды (упрощенная версия)
        legendRef.current.innerHTML = `
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">Bitcoin (BTC/USD)</div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-weight: 500;">${formattedClose}</span>
            <span style="color: ${changeColor};">${changeText}</span>
          </div>
        `;
      };
      
      // Подписываемся на событие движения перекрестия
      chart.subscribeCrosshairMove(updateLegend);
      
      // Инициализируем легенду с последней свечой
      updateLegend(undefined);
      
      // Добавляем серию для прогнозных данных, если они есть
      if (forecastData && forecastData.length > 0 && showForecast) {
        console.log('Добавляем прогнозные данные на график:', forecastData.length);
        const forecastSeries = chart.addCandlestickSeries({
          upColor: isDarkMode ? 'rgba(38, 166, 154, 0.6)' : 'rgba(76, 175, 80, 0.6)',
          downColor: isDarkMode ? 'rgba(239, 83, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)',
          borderVisible: true,
          borderColor: isDarkMode ? '#64748b' : '#94a3b8',
          wickUpColor: isDarkMode ? 'rgba(38, 166, 154, 0.6)' : 'rgba(76, 175, 80, 0.6)',
          wickDownColor: isDarkMode ? 'rgba(239, 83, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)',
        });
        
        forecastSeries.setData(forecastData);
        forecastSeriesRef.current = forecastSeries;
      }
      
      // Добавляем маркеры для лунных фаз
      if (lunarEvents && lunarEvents.length > 0) {
        try {
          console.log('Добавляем маркеры лунных фаз на график:', lunarEvents.length);
          
          // Создаем маркеры для лунных фаз с улучшенным позиционированием
          const lunarMarkers = lunarEvents.map((event, index) => {
            // Определяем цвет маркера в зависимости от типа события и темы
            const isNewMoon = event.type === 'new_moon';
            
            // Правильно обрабатываем время события
            let eventTime;
            if (event.date) {
              // Если время в формате ISO string
              eventTime = Math.floor(new Date(event.date).getTime() / 1000);
            } else if (event.time) {
              // Если время в формате timestamp
              eventTime = typeof event.time === 'number' ? event.time : Math.floor(new Date(event.time).getTime() / 1000);
            } else {
              console.warn('Лунное событие без времени:', event);
              return null;
            }
            
            console.log(`🌙 Обрабатываем лунное событие: ${event.phaseName} на ${new Date(eventTime * 1000).toISOString()}`);
            
            // Адаптивные размеры в зависимости от таймфрейма
            let markerSize = 1;
            switch(timeframe) {
              case '1m':
              case '5m':
              case '15m':
                markerSize = 0.8; // Меньше для мелких таймфреймов
                break;
              case '30m':
              case '1h':
                markerSize = 1; // Стандартный размер
                break;
              case '4h':
              case '1d':
                markerSize = 1.2; // Больше для крупных таймфреймов
                break;
              case '1w':
                markerSize = 1.5; // Максимальный для недельного
                break;
            }
            
            // Улучшенные цвета для лучшего контраста в разных темах
            let markerColor;
            if (event.isForecast) {
              // Прогнозные события - более приглушенные цвета
              markerColor = isNewMoon 
                ? (isDarkMode ? '#8b5cf6' : '#a855f7')  // Фиолетовый
                : (isDarkMode ? '#ec4899' : '#d946ef'); // Розовый
            } else {
              // Исторические события - контрастные цвета
              markerColor = isNewMoon 
                ? (isDarkMode ? '#475569' : '#1e293b')  // Темно-серый
                : (isDarkMode ? '#facc15' : '#eab308'); // Желтый
            }
            
            // Получаем приблизительную цену для маркера
            const combinedData = [...chartData, ...forecastData];
            const eventDate = new Date(eventTime * 1000);
            const price = getApproximatePriceForDate(eventDate, combinedData);
            
            // Умное позиционирование - избегаем перекрытий
            const position = 'aboveBar';
            let priceOffset = 1.02; // Базовый отступ
            
            // Проверяем близкие события для избежания перекрытий
            const nearbyEvents = lunarEvents.filter((otherEvent, otherIndex) => {
              if (otherIndex >= index) return false; // Только предыдущие события
              
              const otherTime = otherEvent.date 
                ? Math.floor(new Date(otherEvent.date).getTime() / 1000)
                : (typeof otherEvent.time === 'number' ? otherEvent.time : Math.floor(new Date(otherEvent.time).getTime() / 1000));
              
              // Считаем близкими события в пределах определенного времени в зависимости от таймфрейма
              let proximityThreshold;
              switch(timeframe) {
                case '1m':
                case '5m':
                  proximityThreshold = 60 * 60; // 1 час
                  break;
                case '15m':
                case '30m':
                  proximityThreshold = 4 * 60 * 60; // 4 часа
                  break;
                case '1h':
                case '4h':
                  proximityThreshold = 24 * 60 * 60; // 1 день
                  break;
                case '1d':
                  proximityThreshold = 7 * 24 * 60 * 60; // 7 дней
                  break;
                case '1w':
                  proximityThreshold = 30 * 24 * 60 * 60; // 30 дней
                  break;
                default:
                  proximityThreshold = 24 * 60 * 60; // 1 день по умолчанию
              }
              
              return Math.abs(eventTime - otherTime) < proximityThreshold;
            });
            
            // Увеличиваем отступ для избежания перекрытий
            priceOffset += nearbyEvents.length * 0.01;
            
            // Определяем, попадает ли событие в прогнозную часть графика
            const isInForecastPeriod = eventTime > (chartData.length > 0 ? chartData[chartData.length - 1].time : 0);
            
            // Если eventTime в пределах прогнозного периода и showForecast отключен,
            // не добавляем маркер
            if (isInForecastPeriod && !showForecast) {
              return null;
            }
            
            // Выбираем подходящий emoji в зависимости от типа события
            let markerIcon;
            if (event.icon) {
              markerIcon = event.icon;
            } else {
              markerIcon = isNewMoon ? '🌑' : '🌕';
            }
            
            console.log(`✅ Создаем маркер для ${event.phaseName}: time=${eventTime}, price=${price?.toFixed(2)}, color=${markerColor}, size=${markerSize}`);
            
            return {
              time: eventTime,
              position: position,
              shape: 'text',
              text: markerIcon,
              size: markerSize,
              price: price ? price * priceOffset : undefined,
              color: markerColor,
              tooltip: `${event.phaseName} - ${formatDate(eventTime)}`
            };
          }).filter(marker => marker !== null && marker.price !== undefined); // Фильтруем null-значения и маркеры без цены
          
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
          
          // Разделяем маркеры на исторические и прогнозные
          const lastHistoricalTime = chartData.length > 0 ? chartData[chartData.length - 1].time : 0;
          
          const historicalMarkers = lunarMarkers.filter(marker => marker.time <= lastHistoricalTime);
          const forecastMarkers = lunarMarkers.filter(marker => marker.time > lastHistoricalTime);
          
          console.log(`Разделили маркеры: исторических - ${historicalMarkers.length}, прогнозных - ${forecastMarkers.length}`);
          
          // Добавляем исторические маркеры на основную серию
          if (historicalMarkers.length > 0) {
            candlestickSeriesRef.current.setMarkers(historicalMarkers);
          }
          
          // Добавляем прогнозные маркеры на прогнозную серию, если она есть и прогноз включен
          if (forecastMarkers.length > 0 && forecastSeriesRef.current && showForecast) {
            forecastSeriesRef.current.setMarkers(forecastMarkers);
          } else if (forecastMarkers.length > 0 && showForecast) {
            // Если прогнозной серии нет, но прогноз включен, добавляем все маркеры на основную серию
            candlestickSeriesRef.current.setMarkers(lunarMarkers);
          }
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
            const price = getApproximatePriceForDate(eventDate, [...chartData, ...forecastData]);
            
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
      
      // Показываем весь график, включая прогнозную часть
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

      // Обработчик события ухода курсора с графика для обновления легенды
      const handleLegendUpdate = () => {
        if (legendRef.current) {
          updateLegend(undefined);
        }
      };
      
      chartContainerRef.current.addEventListener('mouseleave', handleLegendUpdate);

      // Подписываемся на изменения видимого диапазона для подгрузки данных
      const handleVisibleRangeChange = (range) => {
        if (!range) return;
        
        console.log('📊 Изменение видимого диапазона:', range);
        
        // Если пользователь приблизился к началу данных (левый край)
        if (range.from < 10 && chartData.length > 0) {
          console.log('🔄 Подгрузка исторических данных...');
          
          // Получаем время первой свечи
          const firstCandleTime = chartData[0].time;
          const firstDate = new Date(firstCandleTime * 1000);
          
          // Вычисляем период для загрузки (зависит от таймфрейма)
          let daysToLoad = 30; // По умолчанию
          switch(timeframe) {
            case '1m':
            case '5m':
            case '15m':
              daysToLoad = 1; // 1 день для мелких таймфреймов
              break;
            case '30m':
            case '1h':
              daysToLoad = 7; // 1 неделя
              break;
            case '4h':
            case '1d':
              daysToLoad = 30; // 1 месяц
              break;
            case '1w':
              daysToLoad = 180; // 6 месяцев
              break;
          }
          
          // Вычисляем дату начала для новых данных
          const endDate = new Date(firstDate);
          const startDate = new Date(firstDate);
          startDate.setDate(startDate.getDate() - daysToLoad);
          
          console.log(`📅 Загрузка данных с ${startDate.toISOString()} по ${endDate.toISOString()}`);
          
          // Загружаем дополнительные исторические данные
          BitcoinService.getCandlestickData(timeframe, startDate, endDate)
            .then(newData => {
              if (newData && newData.length > 0) {
                console.log(`✅ Получено ${newData.length} новых свечей`);
                
                // Объединяем новые данные с существующими
                const combinedData = [...newData, ...chartData];
                console.log(`🔗 Объединено данных: ${combinedData.length} свечей`);
                
                // Правильное удаление дубликатов с использованием Map
                // Map автоматически перезаписывает значения с одинаковыми ключами
                const uniqueDataMap = new Map();
                
                combinedData.forEach(candle => {
                  // Проверяем, что свеча имеет корректную структуру
                  if (candle && typeof candle.time === 'number' && 
                      typeof candle.open === 'number' && 
                      typeof candle.high === 'number' && 
                      typeof candle.low === 'number' && 
                      typeof candle.close === 'number') {
                    uniqueDataMap.set(candle.time, candle);
                  } else {
                    console.warn('⚠️ Некорректная свеча обнаружена и пропущена:', candle);
                  }
                });
                
                // Преобразуем Map обратно в массив и сортируем
                const uniqueData = Array.from(uniqueDataMap.values()).sort((a, b) => a.time - b.time);
                
                console.log(`🔄 После удаления дубликатов: ${uniqueData.length} свечей`);
                
                // Дополнительная проверка на корректность сортировки
                let isSorted = true;
                for (let i = 1; i < uniqueData.length; i++) {
                  if (uniqueData[i].time <= uniqueData[i-1].time) {
                    console.error(`❌ Ошибка сортировки на индексе ${i}: время ${uniqueData[i].time} <= предыдущего ${uniqueData[i-1].time}`);
                    isSorted = false;
                    break;
                  }
                }
                
                if (!isSorted) {
                  console.error('❌ Данные не отсортированы корректно, отменяем обновление');
                  return;
                }
                
                // Проверяем, что у нас есть candlestickSeries перед обновлением
                if (!candlestickSeries) {
                  console.error('❌ candlestickSeries не найдена, отменяем обновление');
                  return;
                }
                
                try {
                  // Обновляем данные
                  setChartData(uniqueData);
                  candlestickSeries.setData(uniqueData);
                  
                  console.log(`📊 График успешно обновлен: всего ${uniqueData.length} свечей`);
                } catch (setDataError) {
                  console.error('❌ Ошибка при установке данных в график:', setDataError);
                  console.log('🔍 Первые 5 элементов данных:', uniqueData.slice(0, 5));
                  console.log('🔍 Последние 5 элементов данных:', uniqueData.slice(-5));
                }
              } else {
                console.log('⚠️ Новые данные пусты или не получены');
              }
            })
            .catch(error => {
              console.error('❌ Ошибка при загрузке дополнительных данных:', error);
            });
        }
      };
      
      chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if (chartContainerRef.current) {
          chartContainerRef.current.removeEventListener('mouseenter', handleChartFocus);
          chartContainerRef.current.removeEventListener('mouseleave', handleChartBlur);
          chartContainerRef.current.removeEventListener('mouseleave', handleLegendUpdate);
        }
        if (chartRef.current) {
          // Отписываемся от событий timeScale
          chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
          chart.unsubscribeCrosshairMove(updateLegend);
          
          chartRef.current.remove();
          chartRef.current = null;
          candlestickSeriesRef.current = null;
          forecastSeriesRef.current = null;
        }
        if (legendRef.current && chartContainerRef.current) {
          chartContainerRef.current.removeChild(legendRef.current);
          legendRef.current = null;
        }
      };
    }
  }, [chartData, forecastData, lunarEvents, timeframe, isDarkMode, showForecast]);

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
    
    // Проверяем, находится ли событие в будущем (после последней свечи)
    if (targetTimestamp > candleData[candleData.length - 1].time) {
      // Ищем соответствующую прогнозную свечу вместо использования последней реальной
      // Сначала проверяем, есть ли среди candleData прогнозные свечи
      const forecastCandles = candleData.filter(candle => candle.isForecast);
      
      if (forecastCandles.length > 0) {
        // Если есть прогнозные свечи, находим ближайшую к событию
        let closestForecastCandle = forecastCandles[0];
        let minForecastDiff = Math.abs(targetTimestamp - closestForecastCandle.time);
        
        for (const candle of forecastCandles) {
          const diff = Math.abs(targetTimestamp - candle.time);
          if (diff < minForecastDiff) {
            minForecastDiff = diff;
            closestForecastCandle = candle;
          }
        }
        
        return closestForecastCandle.close;
      } else {
        // Если прогнозных свечей нет, используем последнюю доступную
        const lastCandle = candleData[candleData.length - 1];
        return lastCandle.close;
      }
    }
    
    return closestCandle.close;
  };

  // Переключение отображения прогноза
  const toggleForecast = () => {
    setShowForecast(!showForecast);
  };

  // Обработчик клика по кнопке таймфрейма
  const handleTimeframeClick = useCallback((newTimeframe) => {
    // Блокируем клики во время загрузки
    if (loadingTimeframe || isTransitioning) {
      console.log('🚫 Клик заблокирован: идет загрузка');
      return;
    }
    
    // Если это тот же таймфрейм, ничего не делаем
    if (newTimeframe === timeframe) {
      console.log('⚠️ Попытка переключения на тот же таймфрейм');
      return;
    }
    
    console.log(`🔄 Начинаем переключение на таймфрейм: ${newTimeframe}`);
    
    // Устанавливаем состояние загрузки
    setLoadingTimeframe(newTimeframe);
    setIsTransitioning(true);
    
    // Добавляем небольшую задержку для плавного fade эффекта
    setTimeout(() => {
      // Диспатчим событие смены таймфрейма
      window.dispatchEvent(new CustomEvent('change-timeframe', { detail: newTimeframe }));
    }, 150); // Небольшая задержка для анимации
  }, [timeframe, loadingTimeframe, isTransitioning]);

  // Функция для сброса состояния загрузки
  const resetLoadingState = useCallback(() => {
    console.log('✅ Сбрасываем состояние загрузки');
    setLoadingTimeframe(null);
    
    // Сбрасываем состояние перехода с задержкой для завершения анимации
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Форматирование цены в валюте
  const formatPrice = (price) => {
    if (price === null) return '--';

    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Форматирование времени последнего обновления
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  // Получение класса для анимации цены
  const getPriceClass = () => {
    if (!priceAnimation) return 'text-2xl font-bold transition-colors duration-500';
    return `text-2xl font-bold transition-colors duration-500 ${
      priceAnimation === 'up' ? 'text-green-500' : 'text-red-500'
    }`;
  };

  // Отображение изменения цены
  const renderChange = () => {
    const change = currentPrice.change_percentage_24h;
    if (change === null) return null;

    const isPositive = change >= 0;
    const changeValue = Math.abs(change).toFixed(2);

    return (
      <span
        className={`ml-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
        title={`Изменение за 24 часа: ${isPositive ? '+' : '-'}${changeValue}%`}
      >
        {isPositive ? '▲' : '▼'} {changeValue}%
      </span>
    );
  };

  if (loading && chartData.length === 0) {
    return (
      <div className="w-full">
        <div className="animate-pulse h-[500px] bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
              Загрузка графика биткоина...
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Таймфрейм: {timeframe}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && chartData.length === 0) {
    return (
      <div className="w-full">
        <div className="h-[500px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Проблема с подключением
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Повторить попытку
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Предупреждение о демонстрационных данных */}
      {error && chartData.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {error}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-3 text-sm text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline"
            >
              Обновить
            </button>
          </div>
        </div>
      )}
      
      {/* Легенда типов событий */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center text-xs">
          <span className="flex items-center mr-3">
            <span className="text-lg mr-1">🌑</span>
            <span className="text-gray-600 dark:text-gray-300">Новолуние</span>
          </span>
          <span className="flex items-center mr-3">
            <span className="text-lg mr-1">🌕</span>
            <span className="text-gray-600 dark:text-gray-300">Полнолуние</span>
          </span>
          {/* Показываем информацию о прогнозных событиях если они есть */}
          {futureLunarEvents.length > 0 && showForecast && (
            <span className="flex items-center mr-3">
              <span className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: isDarkMode ? '#8b5cf6' : '#a855f7'}}></span>
              <span className="text-gray-600 dark:text-gray-300">Прогноз</span>
            </span>
          )}
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
        className={`w-full h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-sm relative transition-opacity duration-300 ${
          isTransitioning ? 'opacity-50' : 'opacity-100'
        }`}
        tabIndex={0}
      />

      <div className="flex justify-end items-center mb-1 gap-2 content-center">
          {timeframes.map((option) => {
            const isCurrentTimeframe = timeframe === option.id;
            const isLoadingThis = loadingTimeframe === option.id;
            const isDisabled = loadingTimeframe && !isLoadingThis;
            
            return (
              <button
                key={option.id}
                disabled={isDisabled || isTransitioning}
                className={`px-2 py-0.5 text-xs rounded-lg transition-all duration-200 min-w-[32px] relative ${
                  isCurrentTimeframe
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDisabled
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:shadow-sm'
                } ${isLoadingThis ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => handleTimeframeClick(option.id)}
                title={isDisabled ? 'Дождитесь завершения загрузки' : `Переключить на ${option.label}`}
              >
                {isLoadingThis ? (
                  <div className="flex items-center justify-center">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  option.label
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default BitcoinChartWithLunarPhases;