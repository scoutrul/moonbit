// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import BitcoinService from '../services/BitcoinService';
import EventsService from '../services/EventsService';
import AstroService from '../services/AstroService';
import ForecastService from '../services/ForecastService';
import { subscribeToPriceUpdates } from '../utils/mockDataGenerator';
import ChartMemoryManager from './organisms/charts/ChartMemoryManager';
import webSocketService from '../services/WebSocketService';

/**
 * Универсальный компонент для отображения графика с астрономическими событиями
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
const UniversalChart = ({ timeframe, data = [] }) => {
  console.log('🚀 UniversalChart: Компонент инициализируется', { timeframe, dataLength: data?.length || 0 });
  
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
  // 🌞 Солнечные события
  const [solarEvents, setSolarEvents] = useState([]);
  const [showSolarEvents, setShowSolarEvents] = useState(true);
  // 🌙 Лунные события controls
  const [showLunarEvents, setShowLunarEvents] = useState(true);
  // 📊 UI Controls
  const [isEventsCollapsed, setIsEventsCollapsed] = useState(false);
  const [loadingTimeframe, setLoadingTimeframe] = useState(null); // Отслеживаем какой таймфрейм загружается
  const [isTransitioning, setIsTransitioning] = useState(false); // Состояние плавного перехода
  const [chartReady, setChartReady] = useState(false); // 🆕 NEW: Состояние готовности графика
  const unsubscribeRef = useRef(null);
  const [isChartFocused, setIsChartFocused] = useState(false);
  const previousTimeframeRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 🔧 ИСПРАВЛЕНИЕ: Правильная инициализация темы с проверкой всех источников
    try {
      // Сначала проверяем localStorage
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        const isDark = savedTheme === 'dark';
        console.log('🌙 Инициализация темы из localStorage:', isDark ? 'темная' : 'светлая');
        return isDark;
      }
      
      // Затем проверяем DOM
      const isDark = document.documentElement.classList.contains('dark');
      console.log('🌙 Инициализация темы из DOM:', isDark ? 'темная' : 'светлая');
      return isDark;
    } catch (error) {
      console.warn('⚠️ Ошибка при инициализации темы, используем темную по умолчанию:', error);
      return true; // Темная тема по умолчанию
    }
  });
  
  console.log('📊 Состояние компонента:', { 
    loading, 
    error: !!error, 
    chartDataLength: chartData.length, 
    forecastDataLength: forecastData.length,
    lunarEventsLength: lunarEvents.length,
    chartReady // 🆕 NEW: Добавляю в логи
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
      if (chartContainerRef.current) {
        chartContainerRef.current.dispatchEvent(customEvent);
      }
    };

    window.addEventListener('change-timeframe', handleTimeframeChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('change-timeframe', handleTimeframeChange);
    };
  }, [isDarkMode]);

  // 🔧 ИСПРАВЛЕНИЕ: useEffect для обновления темы существующего графика БЕЗ пересоздания
  useEffect(() => {
    if (chartRef.current && chartReady) {
      try {
        // Проверяем что график не был disposed
        chartRef.current.timeScale(); // Это вызовет ошибку если график disposed
        
        console.log('🎨 Обновляем тему существующего графика:', isDarkMode ? 'темная' : 'светлая');
        
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
        
        // Обновляем цвета свечей для текущей темы
        if (candlestickSeriesRef.current) {
          candlestickSeriesRef.current.applyOptions({
            upColor: isDarkMode ? '#26a69a' : '#4caf50',
            downColor: isDarkMode ? '#ef5350' : '#f44336',
            borderUpColor: isDarkMode ? '#26a69a' : '#4caf50',
            borderDownColor: isDarkMode ? '#ef5350' : '#f44336',
            wickUpColor: isDarkMode ? '#26a69a' : '#4caf50',
            wickDownColor: isDarkMode ? '#ef5350' : '#f44336',
          });
        }
        
        // Обновляем стиль легенды
        if (legendRef.current) {
          const legendStyle = {
            color: isDarkMode ? '#f1f5f9' : '#1e293b',
            backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
          };
          Object.assign(legendRef.current.style, legendStyle);
        }
        
      } catch (error) {
        console.warn('⚠️ График disposed или недоступен при обновлении темы:', error.message);
        // График уже disposed или недоступен, просто пропускаем обновление
        // Новый график будет создан с правильной темой
      }
    } else {
      console.log('📊 График не готов для обновления темы, ожидаем создания нового графика');
    }
  }, [isDarkMode, chartReady]); // 🔧 ИСПРАВЛЕНИЕ: Убираем timeframe из зависимостей

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
      
      // 🆕 NEW: Сбрасываем готовность графика при смене timeframe
      setChartReady(false);
      
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
      
      // 🔧 ИСПРАВЛЕНИЕ: Очищаем только данные графика, НЕ лунные события
      // Лунные события будут обновлены после загрузки новых данных
      setChartData([]);
      setForecastData([]);
      // НЕ очищаем лунные события сразу! setLunarEvents([]);
      // НЕ очищаем будущие события сразу! setFutureLunarEvents([]);
      
      console.log('✅ Состояние очищено для нового таймфрейма:', timeframe, '(лунные события сохранены)');
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
            
            // 🔧 ИСПРАВЛЕНИЕ: Заменяем старые события новыми для нового таймфрейма
            // Объединяем исторические и будущие события
            const allLunarEvents = [...historicalEvents, ...combinedLunarEvents];
            console.log('🌟 Заменяем лунные события для нового таймфрейма:', allLunarEvents.length);
            
            setLunarEvents(allLunarEvents);
            setFutureLunarEvents(combinedLunarEvents); // Обновляем будущие события
            setLunarEventsLoading(false);
            lunarEventsLoadedRef.current = true; // Отмечаем успешную загрузку
          } catch (err) {
            console.error('❌ Ошибка при загрузке исторических лунных событий:', err);
            setLunarEventsLoading(false);
            // Продолжаем выполнение, даже если не удалось загрузить лунные события
          }
        }
        
        // 🌞 Загружаем солнечные события
        if (chartData && chartData.length > 0) {
          try {
            const startDate = new Date(chartData[0].time * 1000);
            const endDate = new Date(chartData[chartData.length - 1].time * 1000);
            
            console.log(`🌞 Запрашиваем солнечные события: ${startDate.toISOString()} - ${endDate.toISOString()}`);
            
            // Запрашиваем все типы солнечных событий
            const solarData = await AstroService.getSolarEvents(startDate, endDate);
            console.log('🌞 Raw solar events response:', solarData);
            console.log('🔍 КОМПОНЕНТ: Детальная диагностика solarData:', {
              type: typeof solarData,
              isObject: typeof solarData === 'object',
              hasSeasonalKey: !!solarData?.seasonal,
              seasonalLength: solarData?.seasonal?.length || 0,
              hasSolarEclipses: !!solarData?.solarEclipses,
              solarEclipsesLength: solarData?.solarEclipses?.length || 0,
              hasLunarEclipses: !!solarData?.lunarEclipses,
              lunarEclipsesLength: solarData?.lunarEclipses?.length || 0,
              keys: solarData ? Object.keys(solarData) : 'no data'
            });
            
            if (!isMounted || requestController.isCancelled) return;
            
            // Объединяем все солнечные события в один массив с унифицированным форматом
            const allSolarEvents = [];
            
            // Добавляем сезонные события
            if (solarData.seasonal) {
              allSolarEvents.push(...solarData.seasonal.map(event => ({
                time: event.time,
                type: 'solar',
                subtype: event.subtype,
                title: event.title,
                description: event.description,
                icon: event.icon,
                category: 'seasonal'
              })));
            }
            
            // Добавляем солнечные затмения  
            if (solarData.solarEclipses) {
              allSolarEvents.push(...solarData.solarEclipses.map(event => ({
                time: event.time,
                type: 'solar',
                subtype: 'solar_eclipse',
                title: event.title,
                description: event.description,
                icon: event.icon,
                magnitude: event.magnitude,
                visibility: event.visibility,
                category: 'eclipse'
              })));
            }
            
            // Добавляем лунные затмения
            if (solarData.lunarEclipses) {
              allSolarEvents.push(...solarData.lunarEclipses.map(event => ({
                time: event.time,
                type: 'solar',
                subtype: 'lunar_eclipse',
                title: event.title,
                description: event.description,
                icon: event.icon,
                magnitude: event.magnitude,
                visibility: event.visibility,
                category: 'eclipse'
              })));
            }
            
            // Сортируем по времени
            allSolarEvents.sort((a, b) => a.time - b.time);
            
            console.log('🎉 Получено солнечных событий:', allSolarEvents.length);
            console.log('🌞 Солнечные события:', allSolarEvents);
            
            // Дополнительная диагностика
            allSolarEvents.forEach((event, index) => {
              console.log(`Event ${index}:`, {
                time: event.time,
                timeAsDate: new Date(event.time * 1000).toISOString(),
                subtype: event.subtype,
                title: event.title,
                icon: event.icon
              });
            });
            
            setSolarEvents(allSolarEvents);
          } catch (err) {
            console.error('❌ Ошибка при загрузке солнечных событий:', err);
            // Продолжаем выполнение, даже если не удалось загрузить солнечные события
          }
        }
        
        if (!isMounted || requestController.isCancelled) return;
        
        // 🔧 ИСПРАВЛЕНИЕ: Убираем создание графика отсюда - он будет создан в отдельном useEffect
        // График будет создан автоматически в useEffect при обновлении chartData
        
        // Проверяем отмену перед финальными операциями
        if (requestController.isCancelled) {
          console.log('🚫 Финальные операции пропущены: запрос отменен');
          return;
        }
        
        // Запускаем обновление текущей цены биткоина
        fetchPrice();
        
        // Set up proper intervals based on timeframe requirements
        // Chart data: update once per timeframe period
        // Current price: update every 3 seconds for real-time display
        
        // Calculate chart data refresh interval based on timeframe
        let chartDataInterval;
        switch(timeframe) {
          case '1m': chartDataInterval = 60 * 1000; break;           // 1 minute
          case '5m': chartDataInterval = 5 * 60 * 1000; break;      // 5 minutes  
          case '15m': chartDataInterval = 15 * 60 * 1000; break;    // 15 minutes
          case '30m': chartDataInterval = 30 * 60 * 1000; break;    // 30 minutes
          case '1h': chartDataInterval = 60 * 60 * 1000; break;     // 1 hour
          case '4h': chartDataInterval = 4 * 60 * 60 * 1000; break; // 4 hours
          case '1d': chartDataInterval = 24 * 60 * 60 * 1000; break; // 1 day
          case '1w': chartDataInterval = 7 * 24 * 60 * 60 * 1000; break; // 1 week
          default: chartDataInterval = 60 * 1000; break;            // Default: 1 minute
        }
        
        // Real-time price updates are now handled by WebSocket
        // Removed priceInterval in favor of WebSocket real-time updates
        
        // Chart data refresh interval (respects timeframe)
        const chartDataRefreshInterval = setInterval(() => {
          // Refresh chart data based on timeframe period
          if (isMounted && !document.hidden && !requestController.isCancelled) {
            console.log(`🔄 Refreshing chart data for timeframe: ${timeframe}`);
            fetchData(); // Re-fetch chart data
          }
        }, chartDataInterval);
        
        console.log(`📊 Set up intervals - Price: 3s, Chart data: ${chartDataInterval/1000}s (${timeframe})`);
        
        // 🆕 STEP 3.6: Подписываемся на real-time обновления цены через WebSocket
        console.log('🔗 Подключение к WebSocket для real-time price updates...');
        const unsubscribe = webSocketService.subscribe((priceData) => {
          console.log('📡 Получены real-time данные по WebSocket:', priceData);
          
          // Обновляем текущую цену
          setCurrentPrice(priceData);
          lastPriceRef.current = priceData.price;
          
          // 🆕 УДАЛЕНО: onPriceUpdate больше не используется
        });
        
        unsubscribeRef.current = unsubscribe;
        
        // 🔧 ИСПРАВЛЕНИЕ: setLoading(false) перенесено в useEffect создания графика
        // Сначала создастся график, потом уберется loading
        
        // Сбрасываем состояние загрузки таймфрейма
        resetLoadingState();
        
        return () => {
          clearInterval(chartDataRefreshInterval);
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
          
          // 🔧 ИСПРАВЛЕНИЕ: setLoading(false) тоже перенесено в useEffect создания графика
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
  }, [timeframe]); // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Убираем isDarkMode чтобы смена темы НЕ пересоздавала график!

  // Функция для получения текущей цены биткоина
  const fetchPrice = async () => {
    try {
      const data = await BitcoinService.getCurrentPrice('usd');
      setCurrentPrice(data);
      lastPriceRef.current = data.price;
      
      // 🆕 УДАЛЕНО: onPriceUpdate больше не используется
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

  // Отдельный useEffect для обновления данных И создания графика при первой загрузке данных
  useEffect(() => {
    // 🔧 НОВАЯ ЛОГИКА: Сначала проверяем нужно ли создать график
    if (!chartRef.current && chartData && chartData.length > 0 && chartContainerRef.current) {
      console.log('🚀 Создание ЕДИНСТВЕННОГО графика при загрузке данных:', { 
        chartDataLength: chartData.length, 
        timeframe, 
        isDarkMode 
      });

      // Remove existing chart through memory manager to prevent memory leaks
      if (chartRef.current) {
        const currentChartId = chartId.current;
        console.log(`🧹 Removing existing chart through memory manager: ${currentChartId}`);
        
        if (chartMemoryManager.hasChart(currentChartId)) {
          if (!chartMemoryManager.isChartDisposed(currentChartId)) {
            console.log(`🧹 Chart ${currentChartId} exists and not disposed, removing from memory manager`);
            chartMemoryManager.removeChart(currentChartId);
          } else {
            console.log(`✅ Chart ${currentChartId} already disposed, skipping removal`);
          }
        } else {
          console.log(`⚠️ Chart ${currentChartId} not found in memory manager, might be already cleaned up`);
        }
        
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        forecastSeriesRef.current = null;
        setChartReady(false);
      }
      
      // Удаляем старую легенду, если она существует
      if (legendRef.current && chartContainerRef.current.contains(legendRef.current)) {
        chartContainerRef.current.removeChild(legendRef.current);
        legendRef.current = null;
      }
      
      // Only clear chart-specific content, not the entire container
      const existingCharts = chartContainerRef.current.querySelectorAll('[data-chart-widget]');
      existingCharts.forEach(chart => chart.remove());
      
      const theme = isDarkMode ? darkTheme : lightTheme;
      console.log('🎨 Создаем ЕДИНСТВЕННЫЙ chart instance с темой:', isDarkMode ? 'темная' : 'светлая');

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

      // Добавляем свечной график с цветами, соответствующими теме
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: isDarkMode ? '#26a69a' : '#4caf50',
        downColor: isDarkMode ? '#ef5350' : '#f44336',
        borderVisible: false,
        wickUpColor: isDarkMode ? '#26a69a' : '#4caf50',
        wickDownColor: isDarkMode ? '#ef5350' : '#f44336',
      });
      
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      
      // Register chart with new ID
      const newChartId = `chart-${timeframe}-${Date.now()}`;
      chartId.current = newChartId;
      const containerId = chartContainerRef.current.id || `container-${newChartId}`;
      
      if (!chartContainerRef.current.id) {
        chartContainerRef.current.id = containerId;
      }
      
      chartMemoryManager.registerChart(newChartId, chart, containerId);
      console.log(`✅ Registered ЕДИНСТВЕННЫЙ chart with ID: ${newChartId}, Container: ${containerId}`);
      
      setChartReady(true);
      console.log('🎯 ЕДИНСТВЕННЫЙ график создан и готов к использованию');
      
      // 🔧 ИСПРАВЛЕНИЕ: Создаем легенду с правильным позиционированием относительно контейнера
      if (chartContainerRef.current) {
        legendRef.current = document.createElement('div');
        const legendStyle = {
          position: 'absolute',  // Остается absolute но относительно контейнера
          left: '12px',
          top: '12px',
          zIndex: '1000',
          fontSize: '14px',
          fontFamily: 'sans-serif',
          lineHeight: '18px',
          fontWeight: '300',
          color: isDarkMode ? '#f1f5f9' : '#1e293b',
          padding: '8px',
          borderRadius: '4px',
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none'  // Легенда не должна блокировать события графика
        };
        
        Object.assign(legendRef.current.style, legendStyle);
        chartContainerRef.current.appendChild(legendRef.current);
        console.log('📊 Легенда графика создана с правильным позиционированием');
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
        
        if (validCrosshairPoint) {
          const bar = param.seriesData.get(candlestickSeries);
          if (bar) {
            const close = bar.close;
            const open = bar.open;
            
            const isUp = close >= open;
            const changePercent = ((close - open) / open * 100).toFixed(2);
            const changeText = isUp ? `+${changePercent}%` : `${changePercent}%`;
            const changeColor = isUp ? (isDarkMode ? '#4ade80' : '#22c55e') : (isDarkMode ? '#f87171' : '#ef4444');
            
            const formattedClose = formatPrice(close);
            
            legendRef.current.innerHTML = `
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">Bitcoin (BTC/USD)</div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-weight: 500;">${formattedClose}</span>
                <span style="color: ${changeColor};">${changeText}</span>
              </div>
            `;
          }
        } else {
          // Show real current price instead of last candle price
          if (currentPrice.price) {
            const realPrice = currentPrice.price;
            const change24h = currentPrice.change_percentage_24h || 0;
            
            const isUp = change24h >= 0;
            const changeText = isUp ? `+${Math.abs(change24h).toFixed(2)}%` : `-${Math.abs(change24h).toFixed(2)}%`;
            const changeColor = isUp ? (isDarkMode ? '#4ade80' : '#22c55e') : (isDarkMode ? '#f87171' : '#ef4444');
            
            const formattedPrice = formatPrice(realPrice);
            
            legendRef.current.innerHTML = `
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">Bitcoin (BTC/USD) - LIVE</div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-weight: 500;">${formattedPrice}</span>
                <span style="color: ${changeColor};">${changeText}</span>
              </div>
            `;
          } else {
            // Fallback to last candle if no real price data
            const bar = getLastBar(candlestickSeries);
            if (bar) {
              const close = bar.close;
              const formattedClose = formatPrice(close);
              
              legendRef.current.innerHTML = `
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">Bitcoin (BTC/USD)</div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="font-weight: 500;">${formattedClose}</span>
                </div>
              `;
            }
          }
        }
      };
      
      // 🔧 НОВОЕ: Создаем элемент для тултипов маркеров
      const tooltipElement = document.createElement('div');
      tooltipElement.style.cssText = `
        position: absolute;
        background: ${isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
        color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
        border: 1px solid ${isDarkMode ? '#475569' : '#e2e8f0'};
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 12px;
        font-family: sans-serif;
        line-height: 1.4;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        pointer-events: none;
        z-index: 9999;
        display: none;
        max-width: 200px;
        backdrop-filter: blur(4px);
      `;
      chartContainerRef.current.appendChild(tooltipElement);

      // Переменная для хранения текущих маркеров
      let currentMarkers = [];

      // Обработчик движения перекрестия с поддержкой тултипов для маркеров
      const handleCrosshairMove = param => {
        // Обновляем легенду
        updateLegend(param);
        
        // Обрабатываем тултипы маркеров
        if (param.point && currentMarkers.length > 0) {
          const time = param.time;
          if (time) {
            // Находим маркер рядом с текущим временем (в пределах разумного диапазона)
            const tolerance = 86400; // 1 день в секундах
            const nearbyMarker = currentMarkers.find(marker => 
              Math.abs(marker.time - time) <= tolerance
            );
            
            if (nearbyMarker && nearbyMarker.title) {
              // Показываем тултип
              tooltipElement.innerHTML = nearbyMarker.title;
              tooltipElement.style.display = 'block';
              tooltipElement.style.left = `${param.point.x + 10}px`;
              tooltipElement.style.top = `${param.point.y - 35}px`;
            } else {
              // Скрываем тултип
              tooltipElement.style.display = 'none';
            }
          }
        } else {
          // Скрываем тултип если нет активной точки
          tooltipElement.style.display = 'none';
        }
      };

      // Подписываемся на событие движения перекрестия с новым обработчиком
      chart.subscribeCrosshairMove(handleCrosshairMove);
      
      // Инициализируем легенду
      updateLegend(undefined);

      // Сохраняем ссылку на функцию обновления маркеров
      chart.updateMarkers = (markers) => {
        currentMarkers = markers;
      };

      // Устанавливаем данные графика
      candlestickSeries.setData(chartData);
      console.log('✅ Данные установлены в новый график:', chartData.length, 'свечей');
      
      // 🔧 ИСПРАВЛЕНИЕ: После успешного создания графика убираем loading
      setLoading(false);
      console.log('🎉 График создан, setLoading(false) установлено');
    }

    // 🔧 ОБНОВЛЕНИЕ ДАННЫХ существующего графика (если график уже создан)
    if (!chartReady || !chartRef.current || !candlestickSeriesRef.current || loading) {
      console.log('📊 Chart not ready yet for data update, skipping...', { 
        chartReady, 
        chartExists: !!chartRef.current, 
        seriesExists: !!candlestickSeriesRef.current,
        loading
      });
      return;
    }

    console.log('📈 Updating chart data without recreation:', {
      chartDataLength: chartData?.length || 0,
      forecastDataLength: forecastData?.length || 0,
      lunarEventsLength: lunarEvents?.length || 0,
      chartReady,
      loading
    });

    try {
      // Update main candlestick data
      if (chartData && Array.isArray(chartData) && chartData.length > 0) {
        candlestickSeriesRef.current.setData(chartData);
        console.log('✅ Main chart data updated:', chartData.length, 'candles');
      }

      // Update/create forecast series
      if (forecastData && forecastData.length > 0 && showForecast) {
        console.log('📊 Adding/updating forecast data:', forecastData.length);
        
        if (!forecastSeriesRef.current) {
          // Create forecast series if it doesn't exist
          const forecastSeries = chartRef.current.addCandlestickSeries({
            upColor: isDarkMode ? 'rgba(38, 166, 154, 0.6)' : 'rgba(76, 175, 80, 0.6)',
            downColor: isDarkMode ? 'rgba(239, 83, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)',
            borderVisible: true,
            borderColor: isDarkMode ? '#64748b' : '#94a3b8',
            wickUpColor: isDarkMode ? 'rgba(38, 166, 154, 0.6)' : 'rgba(76, 175, 80, 0.6)',
            wickDownColor: isDarkMode ? 'rgba(239, 83, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)',
          });
          forecastSeriesRef.current = forecastSeries;
        }
        
        forecastSeriesRef.current.setData(forecastData);
      } else if (forecastSeriesRef.current && !showForecast) {
        // Remove forecast series if showForecast is disabled
        chartRef.current.removeSeries(forecastSeriesRef.current);
        forecastSeriesRef.current = null;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Создаем единый массив всех маркеров для правильного отображения
      const createAllMarkers = () => {
        console.log('🎯 Создание всех маркеров:', {
          lunarEventsCount: lunarEvents?.length || 0,
          solarEventsCount: solarEvents?.length || 0,
          showLunarEvents,
          showSolarEvents,
          showForecast
        });

        const allMarkers = [];
        const lastHistoricalTime = chartData?.length > 0 ? chartData[chartData.length - 1].time : 0;
        // 🔧 ИСПРАВЛЕНИЕ: Не объединяем данные, передаем их раздельно в getApproximatePriceForDate
        const combinedDataForSearch = [...(chartData || []), ...(forecastData || [])];

        // 🌙 Добавляем лунные маркеры
        if (lunarEvents && lunarEvents.length > 0 && showLunarEvents) {
          console.log('🌙 Обрабатываем лунные события:', lunarEvents.length);
          
          lunarEvents.forEach((event, index) => {
            const isNewMoon = event.type === 'new_moon';
            
            // Handle event time
            let eventTime;
            if (event.date) {
              eventTime = Math.floor(new Date(event.date).getTime() / 1000);
            } else if (event.time) {
              eventTime = typeof event.time === 'number' ? event.time : Math.floor(new Date(event.time).getTime() / 1000);
            } else {
              console.warn('Lunar event without time:', event);
              return;
            }
            
            // Skip forecast events if forecast is disabled
            const isInForecastPeriod = eventTime > lastHistoricalTime;
            if (isInForecastPeriod && !showForecast) {
              console.log('⏭️ Пропускаем лунное событие в прогнозном периоде (прогноз отключен)');
              return;
            }

            // Get approximate price for marker
            const eventDate = new Date(eventTime * 1000);
            const price = getApproximatePriceForDate(eventDate, combinedDataForSearch);
            
            if (!price) {
              console.warn('⚠️ Не удалось найти цену для лунного события:', event);
              return;
            }
            
            // Adaptive marker size based on timeframe
            let markerSize = 1;
            switch(timeframe) {
              case '1m':
              case '5m':
              case '15m':
                markerSize = 0.8;
                break;
              case '30m':
              case '1h':
                markerSize = 1;
                break;
              case '4h':
              case '1d':
                markerSize = 1.2;
                break;
              case '1w':
                markerSize = 1.5;
                break;
            }
            
            // Marker colors based on event type and theme
            let markerColor;
            if (event.isForecast) {
              markerColor = isNewMoon 
                ? (isDarkMode ? '#8b5cf6' : '#a855f7')
                : (isDarkMode ? '#ec4899' : '#d946ef');
            } else {
              markerColor = isNewMoon 
                ? (isDarkMode ? '#475569' : '#1e293b')
                : (isDarkMode ? '#facc15' : '#eab308');
            }
            
            // Smart positioning to avoid overlaps
            let priceOffset = 1.02;
            priceOffset += index * 0.005; // Небольшое смещение для каждого события
            
            const markerIcon = event.icon || (isNewMoon ? '🌑' : '🌕');
            
            allMarkers.push({
              time: eventTime,
              position: 'aboveBar',
              shape: 'text',
              text: markerIcon,
              size: markerSize,
              price: price * priceOffset,
              color: markerColor,
              type: 'lunar',
              id: `lunar-${eventTime}`, // Уникальный ID для тултипа
              title: `${event.phaseName || event.title} - ${formatDate(eventTime)}` // 🔧 Правильный атрибут для тултипа
            });
            
            console.log(`🌙 Добавлен лунный маркер: ${markerIcon} в ${new Date(eventTime * 1000).toISOString()}`);
          });
        }

        // 🌞 Добавляем солнечные маркеры
        if (solarEvents && solarEvents.length > 0 && showSolarEvents) {
          console.log('🌞 Обрабатываем солнечные события:', solarEvents.length);
          
          solarEvents.forEach((event, index) => {
            // Handle event time
            let eventTime;
            if (event.time) {
              eventTime = typeof event.time === 'number' ? event.time : Math.floor(new Date(event.time).getTime() / 1000);
            } else {
              console.warn('Solar event without time:', event);
              return;
            }
            
            // Get approximate price for marker
            const eventDate = new Date(eventTime * 1000);
            const price = getApproximatePriceForDate(eventDate, combinedDataForSearch);
            
            if (!price) {
              console.warn('⚠️ Не удалось найти цену для солнечного события:', event);
              return;
            }
            
            // Configure marker appearance based on event type
            let markerColor, markerPosition, priceOffset, markerSize;
            
            switch (event.subtype) {
              case 'spring_equinox':
                markerColor = isDarkMode ? '#10b981' : '#059669'; // Green
                markerPosition = 'belowBar';
                priceOffset = 0.96;
                markerSize = 1.5;
                break;
              case 'summer_solstice':
                markerColor = isDarkMode ? '#f59e0b' : '#d97706'; // Orange
                markerPosition = 'belowBar';
                priceOffset = 0.95;
                markerSize = 1.8;
                break;
              case 'autumn_equinox':
                markerColor = isDarkMode ? '#8b5cf6' : '#7c3aed'; // Purple
                markerPosition = 'belowBar';
                priceOffset = 0.94;
                markerSize = 1.5;
                break;
              case 'winter_solstice':
                markerColor = isDarkMode ? '#3b82f6' : '#2563eb'; // Blue
                markerPosition = 'belowBar';
                priceOffset = 0.93;
                markerSize = 1.8;
                break;
              case 'solar_eclipse':
                markerColor = isDarkMode ? '#ef4444' : '#dc2626'; // Red
                markerPosition = 'aboveBar';
                priceOffset = 1.07;
                markerSize = 2.0;
                break;
              case 'lunar_eclipse':
                markerColor = isDarkMode ? '#ec4899' : '#db2777'; // Pink
                markerPosition = 'aboveBar';
                priceOffset = 1.08;
                markerSize = 2.0;
                break;
              default:
                markerColor = isDarkMode ? '#fbbf24' : '#f59e0b'; // Yellow
                markerPosition = 'aboveBar';
                priceOffset = 1.06;
                markerSize = 1.2;
            }
            
            // Adaptive marker size based on timeframe
            switch(timeframe) {
              case '1m':
              case '5m':
              case '15m':
                markerSize *= 0.8;
                break;
              case '30m':
              case '1h':
                markerSize *= 1;
                break;
              case '4h':
              case '1d':
                markerSize *= 1.2;
                break;
              case '1w':
                markerSize *= 1.5;
                break;
            }
            
            // Adjust offset based on position to avoid overlaps
            priceOffset += index * 0.005; // Небольшое смещение для каждого события
            
            // Use icon if available, otherwise show text based on type
            const markerText = event.icon || (() => {
              switch (event.subtype) {
                case 'spring_equinox': return '🌱';
                case 'summer_solstice': return '☀️';
                case 'autumn_equinox': return '🍂';
                case 'winter_solstice': return '❄️';
                case 'solar_eclipse': return '🌒';
                case 'lunar_eclipse': return '🌕';
                default: return '🌞';
              }
            })();
            
            allMarkers.push({
              time: eventTime,
              position: markerPosition,
              shape: 'text',
              text: markerText,
              size: markerSize,
              price: price * priceOffset,
              color: markerColor,
              type: 'solar',
              id: `solar-${eventTime}`, // Уникальный ID для тултипа
              title: `${event.title} - ${formatDate(eventTime)}` // 🔧 Правильный атрибут для тултипа
            });
            
            console.log(`🌞 Добавлен солнечный маркер: ${markerText} в ${new Date(eventTime * 1000).toISOString()}, тип: ${event.subtype}`);
          });
        }

        // Sort all markers by time
        allMarkers.sort((a, b) => a.time - b.time);
        
        console.log(`📍 Создано всего маркеров: ${allMarkers.length}`);
        console.log('📍 Детали маркеров:', allMarkers.map(m => ({
          time: new Date(m.time * 1000).toISOString(),
          text: m.text,
          type: m.type,
          position: m.position
        })));

        return allMarkers;
      };

      // Создаем и устанавливаем все маркеры
      try {
        const allMarkers = createAllMarkers();
        
        if (allMarkers.length > 0) {
          console.log(`✅ Устанавливаем ${allMarkers.length} маркеров на график`);
          candlestickSeriesRef.current.setMarkers(allMarkers);
          
          // 🔧 НОВОЕ: Обновляем маркеры для тултипов
          if (chartRef.current && chartRef.current.updateMarkers) {
            chartRef.current.updateMarkers(allMarkers);
          }
          
          // Также устанавливаем маркеры на прогнозную серию если она существует
          if (forecastSeriesRef.current && showForecast) {
            const forecastMarkers = allMarkers.filter(marker => marker.time > lastHistoricalTime);
            if (forecastMarkers.length > 0) {
              console.log(`✅ Устанавливаем ${forecastMarkers.length} прогнозных маркеров`);
              forecastSeriesRef.current.setMarkers(forecastMarkers);
            }
          }
        } else {
          console.log('🚫 Нет маркеров для отображения');
          candlestickSeriesRef.current.setMarkers([]);
          if (forecastSeriesRef.current) {
            forecastSeriesRef.current.setMarkers([]);
          }
          
          // 🔧 НОВОЕ: Очищаем маркеры для тултипов
          if (chartRef.current && chartRef.current.updateMarkers) {
            chartRef.current.updateMarkers([]);
          }
        }
      } catch (err) {
        console.error('❌ Ошибка при создании маркеров:', err);
      }

      // Add other events markers
      if (events && events.length > 0) {
        console.log('📅 Adding event markers:', events.length);
        
        const eventMarkers = [];
        const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedEvents.forEach(event => {
          if (event.type !== 'new_moon' && event.type !== 'full_moon') {
            const eventDate = new Date(event.date);
            const eventTime = Math.floor(eventDate.getTime() / 1000);
            const combinedData = [...(chartData || []), ...(forecastData || [])];
            const price = getApproximatePriceForDate(eventDate, combinedData);
            
            if (price) {
              let color, shape, position, priceOffset = 1.0;
              
              switch (event.type) {
                case 'solar_eclipse':
                  color = '#ff6b6b';
                  shape = 'diamond';
                  position = 'belowBar';
                  priceOffset = 0.97;
                  break;
                case 'lunar_eclipse':
                  color = '#6c5ce7';
                  shape = 'diamond';
                  position = 'aboveBar';
                  priceOffset = 1.03;
                  break;
                case 'astro':
                  color = '#ec4899';
                  shape = 'square';
                  position = 'aboveBar';
                  priceOffset = 1.04;
                  break;
                case 'economic':
                  color = '#10b981';
                  shape = 'diamond';
                  position = 'aboveBar';
                  priceOffset = 1.06;
                  break;
                case 'user':
                  color = '#f97316';
                  shape = 'arrowUp';
                  position = 'aboveBar';
                  priceOffset = 1.08;
                  break;
                default:
                  color = '#60a5fa';
                  shape = 'circle';
                  position = 'aboveBar';
                  priceOffset = 1.05;
              }
              
              eventMarkers.push({
                time: eventTime,
                position: position,
                color,
                shape,
                text: `${event.icon || ''} ${event.title}`,
                size: 2,
                price: price * priceOffset
              });
            }
          }
        });
        
        // Add event markers to main series
        if (eventMarkers.length > 0) {
          const existingMarkers = candlestickSeriesRef.current.markers() || [];
          candlestickSeriesRef.current.setMarkers([...existingMarkers, ...eventMarkers]);
        }
      }

      // Fit chart content after updates
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }

    } catch (error) {
      console.error('❌ Error updating chart data:', error);
    }
  }, [chartData, forecastData, lunarEvents, solarEvents, events, showForecast, showSolarEvents, showLunarEvents, timeframe, chartReady, loading, isDarkMode]); // 🔧 Добавляем isDarkMode для обновления цветов маркеров

  // 🔧 ОТДЕЛЬНЫЙ useEffect для обновления ТОЛЬКО темы существующего графика БЕЗ пересоздания
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !chartReady) {
      console.log('🎨 График не готов для обновления темы');
      return;
    }

    console.log('🎨 Обновляем тему существующего графика:', isDarkMode ? 'темная' : 'светлая');

    try {
      const theme = isDarkMode ? darkTheme : lightTheme;
      
      // Обновляем настройки графика
      chartRef.current.applyOptions({
        ...theme,
        timeScale: {
          ...chartRef.current.options().timeScale,
          borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
        },
        rightPriceScale: {
          ...chartRef.current.options().rightPriceScale,
          borderColor: isDarkMode ? '#2d3748' : '#f0f0f0',
        },
      });

      // Обновляем цвета свечного графика
      candlestickSeriesRef.current.applyOptions({
        upColor: isDarkMode ? '#26a69a' : '#4caf50',
        downColor: isDarkMode ? '#ef5350' : '#f44336',
        wickUpColor: isDarkMode ? '#26a69a' : '#4caf50',
        wickDownColor: isDarkMode ? '#ef5350' : '#f44336',
      });

      // Обновляем прогнозную серию если существует
      if (forecastSeriesRef.current) {
        forecastSeriesRef.current.applyOptions({
          upColor: isDarkMode ? 'rgba(38, 166, 154, 0.6)' : 'rgba(76, 175, 80, 0.6)',
          downColor: isDarkMode ? 'rgba(239, 83, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)',
          borderColor: isDarkMode ? '#64748b' : '#94a3b8',
          wickUpColor: isDarkMode ? 'rgba(38, 166, 154, 0.6)' : 'rgba(76, 175, 80, 0.6)',
          wickDownColor: isDarkMode ? 'rgba(239, 83, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)',
        });
      }

      // Обновляем стили легенды
      if (legendRef.current) {
        const legendStyle = {
          color: isDarkMode ? '#f1f5f9' : '#1e293b',
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        };
        
        Object.assign(legendRef.current.style, legendStyle);
      }

      console.log('✅ Тема графика успешно обновлена БЕЗ пересоздания');
    } catch (error) {
      console.error('❌ Ошибка при обновлении темы графика:', error);
    }
  }, [isDarkMode, chartReady]); // Только isDarkMode и chartReady

  // Функция для получения приблизительной цены для даты события
  const getApproximatePriceForDate = (date, candleData) => {
    if (!candleData || candleData.length === 0) return null;
    
    const targetTimestamp = Math.floor(date.getTime() / 1000);
    
    console.log(`🔍 Поиск цены для события в ${new Date(targetTimestamp * 1000).toISOString()}`);
    console.log('📊 Доступные данные:', {
      totalCandles: candleData.length,
      firstTime: candleData[0] ? new Date(candleData[0].time * 1000).toISOString() : 'N/A',
      lastTime: candleData[candleData.length - 1] ? new Date(candleData[candleData.length - 1].time * 1000).toISOString() : 'N/A',
      targetTime: new Date(targetTimestamp * 1000).toISOString()
    });
    
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
    
    // 🔧 ИСПРАВЛЕНИЕ: Правильно определяем границу между историческими и прогнозными данными
    const historicalData = chartData || [];
    const forecastDataArray = forecastData || [];
    const lastHistoricalTime = historicalData.length > 0 ? historicalData[historicalData.length - 1].time : 0;
    
    console.log(`⏰ Временные границы:`, {
      lastHistoricalTime: new Date(lastHistoricalTime * 1000).toISOString(),
      targetTimestamp: new Date(targetTimestamp * 1000).toISOString(),
      isInFuture: targetTimestamp > lastHistoricalTime,
      forecastDataLength: forecastDataArray.length
    });
    
    // Если событие в будущем и у нас есть прогнозные данные
    if (targetTimestamp > lastHistoricalTime && forecastDataArray.length > 0) {
      console.log('🔮 Событие в прогнозном периоде, ищем в прогнозных данных');
      
      // Ищем ближайшую прогнозную свечу
      let closestForecastCandle = forecastDataArray[0];
      let minForecastDiff = Math.abs(targetTimestamp - closestForecastCandle.time);
      
      for (const candle of forecastDataArray) {
        const diff = Math.abs(targetTimestamp - candle.time);
        if (diff < minForecastDiff) {
          minForecastDiff = diff;
          closestForecastCandle = candle;
        }
      }
      
      console.log(`🎯 Найдена ближайшая прогнозная свеча:`, {
        time: new Date(closestForecastCandle.time * 1000).toISOString(),
        price: closestForecastCandle.close,
        diffSeconds: minForecastDiff
      });
      
      return closestForecastCandle.close;
    }
    
    // Для исторических событий используем ближайшую историческую свечу
    console.log(`📈 Найдена ближайшая историческая свеча:`, {
      time: new Date(closestCandle.time * 1000).toISOString(),
      price: closestCandle.close,
      diffSeconds: minDiff
    });
    
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
    
    // 🆕 NEW: Сбрасываем готовность графика сразу при клике
    setChartReady(false);
    
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

  // Add ChartMemoryManager instance
  const chartMemoryManager = ChartMemoryManager.getInstance();
  const chartId = useRef(`chart-${timeframe}-${Date.now()}`);
  
  // Initialize chart ID once on mount
  useEffect(() => {
    chartId.current = `chart-${timeframe}-${Date.now()}`;
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Ensure chart is removed when component unmounts
      const currentChartId = chartId.current;
      if (currentChartId) {
        console.log(`🏠 Component unmounting - cleaning up chart: ${currentChartId}`);
        
        // 🆕 CRITICAL FIX: Check if chart still exists and is not already disposed
        if (chartMemoryManager.hasChart(currentChartId)) {
          if (!chartMemoryManager.isChartDisposed(currentChartId)) {
            console.log(`🧹 Chart ${currentChartId} exists and not disposed, removing from memory manager`);
            chartMemoryManager.removeChart(currentChartId);
          } else {
            console.log(`✅ Chart ${currentChartId} already disposed, skipping cleanup`);
          }
        } else {
          console.log(`⚠️ Chart ${currentChartId} not found in memory manager, might be already cleaned up`);
        }
      }
    };
  }, []); // Empty dependency array for unmount only

  // Update legend when current price changes
  useEffect(() => {
    if (chartRef.current && legendRef.current && currentPrice.price) {
      // Trigger legend update to show new current price
      const updateLegend = chartRef.current.updateLegend;
      if (updateLegend) {
        updateLegend(undefined); // Call without crosshair param to show current price
      }
    }
  }, [currentPrice]);

  if (loading && chartData.length === 0) {
    return (
      <div className="w-full">
        {/* 🆕 STEP 3.3: Минималистичный loader по просьбе пользователя */}
        <div className="h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Загрузка...
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
      
      {/* 🌌 Панель управления астрономическими событиями */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Заголовок панели с кнопкой сворачивания */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            🌌 Астрономические события
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleForecast}
              className={`flex items-center gap-2 px-3 py-1 text-xs rounded-md transition-colors ${
                showForecast
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
              }`}
              title={showForecast ? 'Скрыть прогноз' : 'Показать прогноз'}
            >
              <span className="text-sm">📈</span>
              <span>Прогноз</span>
            </button>
            <button
              onClick={() => setIsEventsCollapsed(!isEventsCollapsed)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 rounded"
              title={isEventsCollapsed ? "Развернуть панель событий" : "Свернуть панель событий"}
            >
              {isEventsCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Содержимое панели (скрываемое) */}
        {!isEventsCollapsed && (
          <div className="p-3 space-y-4">
            {/* Лунные события */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🌙 Лунные фазы:</span>
                <button
                  onClick={() => setShowLunarEvents(!showLunarEvents)}
                  className={`flex items-center gap-2 px-3 py-1 text-xs rounded-md transition-colors ${
                    showLunarEvents
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                  }`}
                  title={showLunarEvents ? 'Скрыть лунные фазы' : 'Показать лунные фазы'}
                >
                  <span className="text-sm">🌙</span>
                  <span>{showLunarEvents ? 'Включено' : 'Выключено'}</span>
                  <span className="text-xs opacity-70">
                    ({lunarEvents.length})
                  </span>
                </button>
              </div>
            </div>

            {/* Солнечные события */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">☀️ Солнечные события:</span>
                  <button
                    onClick={() => setShowSolarEvents(!showSolarEvents)}
                    className={`flex items-center gap-2 px-3 py-1 text-xs rounded-md transition-colors ${
                      showSolarEvents
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                    }`}
                    title={showSolarEvents ? 'Скрыть солнечные события' : 'Показать солнечные события'}
                  >
                    <span className="text-sm">🌞</span>
                    <span>{showSolarEvents ? 'Включено' : 'Выключено'}</span>
                    <span className="text-xs opacity-70">
                      ({solarEvents.length})
                    </span>
                  </button>
                </div>
              </div>
              
              {/* Легенда солнечных событий */}
              {showSolarEvents && solarEvents.length > 0 && (
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full" title="Весеннее равноденствие"></span>
                    <span className="text-gray-600 dark:text-gray-400">🌱 Весна</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full" title="Летнее солнцестояние"></span>
                    <span className="text-gray-600 dark:text-gray-400">☀️ Лето</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full" title="Осеннее равноденствие"></span>
                    <span className="text-gray-600 dark:text-gray-400">🍂 Осень</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full" title="Зимнее солнцестояние"></span>
                    <span className="text-gray-600 dark:text-gray-400">❄️ Зима</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full" title="Солнечное затмение"></span>
                    <span className="text-gray-600 dark:text-gray-400">🌒 Солн. затм.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-pink-500 dark:bg-pink-400 rounded-full" title="Лунное затмение"></span>
                    <span className="text-gray-600 dark:text-gray-400">🌕 Лун. затм.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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

export default UniversalChart;