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
 * @param {CandlestickData[]} props.data - данные для отображения на графике
 */
const BitcoinChartWithLunarPhases = ({ timeframe, data }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const forecastSeriesRef = useRef(null);
  const legendRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(data || []);
  const [forecastData, setForecastData] = useState([]);
  const [showForecast, setShowForecast] = useState(true);
  const [events, setEvents] = useState([]);
  const [lunarEvents, setLunarEvents] = useState([]);
  const [futureLunarEvents, setFutureLunarEvents] = useState([]);
  const unsubscribeRef = useRef(null);
  const [isChartFocused, setIsChartFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Инициализируем состояние темы при первом рендере
    const isDark = document.documentElement.classList.contains('dark');
    console.log('Начальная инициализация темы:', isDark ? 'темная' : 'светлая');
    return isDark;
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

        let chartData = [];
        let forecast = [];
        let combinedLunarEvents = [];

        // Если данные не были переданы извне, загружаем их
        if (!data || data.length === 0) {
          // Загружаем расширенные данные (исторические + прогноз)
          const extendedData = await ForecastService.getExtendedChartData(timeframe, 30);
          chartData = extendedData.historicalData;
          forecast = extendedData.forecastData;
          setChartData(chartData);
          setForecastData(forecast);
          
          // Загружаем лунные события для исторического и прогнозного периода
          if (extendedData.lunarEvents && extendedData.lunarEvents.length > 0) {
            console.log('Получено лунных событий для прогноза:', extendedData.lunarEvents.length);
            setFutureLunarEvents(extendedData.lunarEvents);
            combinedLunarEvents = extendedData.lunarEvents;
          }
        } else {
          chartData = data;
          // Генерируем прогноз на основе переданных данных
          forecast = ForecastService.generateForecastData(data, timeframe, 30);
          setChartData(data);
          setForecastData(forecast);
          
          // Если данные были переданы извне, получаем лунные события для прогнозного периода отдельно
          if (forecast && forecast.length > 0) {
            const startDate = new Date(data[data.length - 1].time * 1000);
            const endDate = new Date(forecast[forecast.length - 1].time * 1000);
            
            console.log(`Запрашиваем лунные события для прогноза извне: ${startDate.toISOString()} - ${endDate.toISOString()}`);
            
            const futureEvents = await EventsService.getLunarEvents(startDate, endDate);
            
            // Нормализуем формат будущих событий и отмечаем их как прогнозные
            const normalizedFutureEvents = futureEvents.map(event => {
              // Определяем, является ли событие уже нормализованным
              if (event.time) {
                return {
                  ...event,
                  isFuture: true
                };
              }
              
              // Иначе преобразуем формат
              return {
                time: new Date(event.date).getTime() / 1000,
                type: event.type,
                title: event.title || event.phaseName,
                icon: event.icon,
                phaseName: event.phaseName || event.title,
                isFuture: true
              };
            });
            
            console.log(`Получено нормализованных будущих событий: ${normalizedFutureEvents.length}`);
            setFutureLunarEvents(normalizedFutureEvents);
            combinedLunarEvents = normalizedFutureEvents;
          }
        }
        
        // Загружаем события для отображения на графике
        const eventsData = await EventsService.getEventsForChart(timeframe);
        console.log('Загружено событий:', eventsData.length, eventsData);
        setEvents(eventsData);
        
        // Получаем данные о лунных фазах для исторического периода
        if (chartData && chartData.length > 0) {
          try {
            const startDate = new Date(chartData[0].time * 1000);
            const endDate = new Date(chartData[chartData.length - 1].time * 1000);
            
            console.log(`Получаем лунные фазы для исторического диапазона: ${startDate.toISOString()} - ${endDate.toISOString()}`);
            
            // Получаем лунные события за указанный период через сервис событий
            const lunarEvents = await EventsService.getLunarEvents(startDate, endDate);
            console.log('Получено исторических лунных событий:', lunarEvents.length, lunarEvents);
            
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
            
            // Сначала сохраняем только исторические события
            setLunarEvents(normalizedEvents);
            
            // Затем объединяем исторические и прогнозные лунные события
            if (combinedLunarEvents.length > 0) {
              console.log('Объединяем исторические и прогнозные лунные события');
              const normFutureLunarEvents = combinedLunarEvents.map(event => {
                if (event.time) return {
                  ...event,
                  isFuture: true
                };
                
                return {
                  time: new Date(event.date).getTime() / 1000,
                  type: event.type,
                  title: event.title || event.phaseName,
                  icon: event.icon,
                  phaseName: event.phaseName || event.title,
                  isFuture: true
                };
              });
              
              console.log('Нормализованные будущие события:', normFutureLunarEvents.length);
              
              const allEvents = [...normalizedEvents, ...normFutureLunarEvents];
              console.log('Все лунные события:', allEvents.length);
              
              // Удаляем дубликаты по времени
              const uniqueEvents = [];
              const timeMap = new Map();
              
              allEvents.forEach(event => {
                if (!timeMap.has(event.time)) {
                  timeMap.set(event.time, true);
                  uniqueEvents.push(event);
                }
              });
              
              // Важно: маркируем события, которые относятся к прогнозному периоду
              // Это позволит правильно их отображать на графике
              const lastHistoricalTime = chartData.length > 0 ? chartData[chartData.length - 1].time : 0;
              
              const markedEvents = uniqueEvents.map(event => ({
                ...event,
                isFuture: event.isFuture || (event.time > lastHistoricalTime)
              }));
              
              console.log('Уникальные лунные события:', markedEvents.length);
              setLunarEvents(markedEvents);
            }
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

  // Эффект для загрузки текущей цены биткоина
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const data = await BitcoinService.getCurrentPrice('usd');
        setCurrentPrice(data);
        lastPriceRef.current = data.price;
      } catch (err) {
        console.error('Ошибка при получении текущей цены биткоина:', err);
      }
    };

    fetchPrice();

    // Обновляем полные данные каждую минуту
    const interval = setInterval(fetchPrice, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

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

      candlestickSeries.setData(chartData);
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      
      // Создаем легенду для графика
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
          
          // Создаем маркеры для лунных фаз
          const lunarMarkers = lunarEvents.map((event) => {
            // Определяем цвет маркера в зависимости от типа события
            const isNewMoon = event.type === 'new_moon';
            
            // Разные цвета для исторических и прогнозных событий
            let markerColor;
            if (event.isFuture) {
              markerColor = isNewMoon ? '#ec4899' : '#8b5cf6'; // Розовый/Фиолетовый для прогноза
            } else {
              markerColor = isNewMoon 
                ? (isDarkMode ? '#64748b' : '#334155') 
                : (isDarkMode ? '#f1f5f9' : '#94a3b8');
            }
            
            // Получаем приблизительную цену для маркера
            const combinedData = [...chartData, ...forecastData];
            const eventDate = new Date(event.time * 1000);
            const price = getApproximatePriceForDate(eventDate, combinedData);
            
            // Устанавливаем разный стиль для будущих событий
            const size = event.isFuture ? 1.5 : 1;
            const position = 'aboveBar';
            
            // Определяем, попадает ли событие в прогнозную часть графика
            const isInForecastPeriod = event.time > (chartData.length > 0 ? chartData[chartData.length - 1].time : 0);
            
            // Если event.time в пределах прогнозного периода и showForecast отключен,
            // не добавляем маркер
            if (isInForecastPeriod && !showForecast) {
              return null;
            }
            
            return {
              time: event.time,
              position: position,
              shape: 'text',
              text: event.icon || (isNewMoon ? '🌑' : '🌕'),
              size: size,
              price: price * 1.01,
              color: markerColor
            };
          }).filter(marker => marker !== null); // Фильтруем null-значения
          
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

      // Добавляем обработчик события ухода курсора с графика
      chartContainerRef.current.addEventListener('mouseleave', () => {
        if (legendRef.current) {
          updateLegend(undefined);
        }
      });

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
          forecastSeriesRef.current = null;
        }
        if (legendRef.current && chartContainerRef.current) {
          chartContainerRef.current.removeChild(legendRef.current);
          legendRef.current = null;
        }
        chartContainerRef.current.removeEventListener('mouseleave', () => {});
      };
    }
  }, [chartData, forecastData, lunarEvents, events, timeframe, isDarkMode, isChartFocused, showForecast]);

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
        <div className="flex justify-between items-center mb-2">
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
        <div className="animate-pulse h-[500px] bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error && chartData.length === 0) {
    return (
      <div className="w-full">
        <div className="h-[500px] flex items-center justify-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div 
        ref={chartContainerRef} 
        data-testid="bitcoin-chart"
        className="w-full h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-sm relative"
        tabIndex={0}
      />

      <div className="flex justify-end items-center mb-1 gap-2 content-center">
          {timeframes.map((option) => (
            <button
              key={option.id}
              className={`px-2 py-0.5 text-xs rounded-lg transition-all ${
                timeframe === option.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => window.dispatchEvent(new CustomEvent('change-timeframe', { detail: option.id }))}
            >
              {option.label}
            </button>
            ))}
      </div>
    </div>
  );
};

export default BitcoinChartWithLunarPhases;