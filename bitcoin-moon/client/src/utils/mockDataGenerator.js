/**
 * Утилита для генерации моковых данных для графиков
 */

// Глобальный кэш для свечных данных по таймфреймам
const candlestickCache = {
  '1m': null,
  '3m': null,
  '5m': null,
  '15m': null,
  '30m': null,
  '1h': null,
  '4h': null,
  '12h': null,
  '1d': null,
  '1w': null,
  '1M': null,
  '1y': null,
  'all': null
};

// Глобальная текущая цена биткоина
let globalCurrentPrice = 68500;
let lastUpdateTimestamp = Date.now();

// Подписчики на обновления цены в реальном времени
const priceUpdateSubscribers = [];

/**
 * Генерирует случайное число в указанном диапазоне
 * @param {number} min - Минимальное значение
 * @param {number} max - Максимальное значение
 * @returns {number} Случайное число
 */
const randomNumber = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * Генерирует случайное число с вероятностным отклонением от базы
 * @param {number} base - Базовое значение
 * @param {number} volatility - Волатильность (процент от базы)
 * @returns {number} Случайное число
 */
const randomWithVolatility = (base, volatility) => {
  const changePercent = randomNumber(-volatility, volatility);
  return base * (1 + changePercent / 100);
};

/**
 * Возвращает количество свечей для таймфрейма
 * @param {string} timeframe - Временной интервал
 * @returns {number} Количество свечей
 */
const getCandleCount = (timeframe) => {
  switch (timeframe) {
    case '1m': return 120; // 2 часа
    case '3m': return 120; // 6 часов
    case '5m': return 120; // 10 часов
    case '15m': return 96; // 24 часа
    case '30m': return 96; // 48 часов
    case '1h': return 168; // 7 дней
    case '4h': return 120; // 20 дней
    case '12h': return 60; // 30 дней
    case '1d': return 90; // 3 месяца
    case '1w': return 52; // 1 год
    case '1M': return 36; // 3 года
    case '1y': return 10; // 10 лет
    case 'all': return 15; // Вся история
    default: return 60;
  }
};

/**
 * Возвращает интервал времени в миллисекундах для таймфрейма
 * @param {string} timeframe - Временной интервал
 * @returns {number} Интервал в миллисекундах
 */
const getTimeInterval = (timeframe) => {
  switch (timeframe) {
    case '1m': return 60 * 1000; // 1 минута
    case '3m': return 3 * 60 * 1000; // 3 минуты
    case '5m': return 5 * 60 * 1000; // 5 минут
    case '15m': return 15 * 60 * 1000; // 15 минут
    case '30m': return 30 * 60 * 1000; // 30 минут
    case '1h': return 60 * 60 * 1000; // 1 час
    case '4h': return 4 * 60 * 60 * 1000; // 4 часа
    case '12h': return 12 * 60 * 60 * 1000; // 12 часов
    case '1d': return 24 * 60 * 60 * 1000; // 1 день
    case '1w': return 7 * 24 * 60 * 60 * 1000; // 1 неделя
    case '1M': return 30 * 24 * 60 * 60 * 1000; // 1 месяц (примерно)
    case '1y': return 365 * 24 * 60 * 60 * 1000; // 1 год
    case 'all': return 365 * 24 * 60 * 60 * 1000; // Используем 1 год для всей истории
    default: return 24 * 60 * 60 * 1000; // По умолчанию 1 день
  }
};

/**
 * Возвращает волатильность для таймфрейма
 * @param {string} timeframe - Временной интервал
 * @returns {number} Волатильность в процентах
 */
const getVolatility = (timeframe) => {
  switch (timeframe) {
    case '1m': return 0.2;
    case '3m': return 0.3;
    case '5m': return 0.4;
    case '15m': return 0.6;
    case '30m': return 0.8;
    case '1h': return 1;
    case '4h': return 1.5;
    case '12h': return 2;
    case '1d': return 3;
    case '1w': return 5;
    case '1M': return 10;
    case '1y': return 20;
    case 'all': return 30;
    default: return 3;
  }
};

/**
 * Генерирует моковые данные для свечного графика биткоина
 * @param {string} timeframe - Временной интервал
 * @returns {Array} Массив данных для свечного графика
 */
export const generateCandlestickData = (timeframe = '1d') => {
  // Проверяем, есть ли данные в кэше
  if (candlestickCache[timeframe]) {
    return candlestickCache[timeframe];
  }
  
  const now = new Date();
  const data = [];
  
  // Задаем базовую цену и волатильность
  let basePrice = globalCurrentPrice; // Используем глобальную цену
  const volatility = getVolatility(timeframe);
  const timeInterval = getTimeInterval(timeframe);
  const count = getCandleCount(timeframe);
  
  // Генерируем данные
  for (let i = count - 1; i >= 0; i--) {
    // Вычисляем время для свечи
    const time = new Date(now.getTime() - i * timeInterval);
    
    // Генерируем цены для свечи
    const open = randomWithVolatility(basePrice, volatility);
    const close = randomWithVolatility(open, volatility);
    
    // Генерируем high и low относительно open и close
    const high = Math.max(open, close) * (1 + randomNumber(0, volatility / 2) / 100);
    const low = Math.min(open, close) * (1 - randomNumber(0, volatility / 2) / 100);
    
    // Генерируем объем
    const volume = randomNumber(10000, 50000);
    
    // Добавляем свечу в массив данных
    data.push({
      time: Math.floor(time.getTime() / 1000), // Unix timestamp в секундах
      open,
      high,
      low,
      close,
      volume,
    });
    
    // Обновляем базовую цену для следующей свечи
    basePrice = close;
  }
  
  // Сохраняем данные в кэше
  candlestickCache[timeframe] = data;
  
  // Обновляем глобальную текущую цену
  if (data.length > 0) {
    globalCurrentPrice = data[data.length - 1].close;
  }
  
  return data;
};

/**
 * Добавляет новую свечу к существующим данным
 * @param {string} timeframe - Временной интервал
 * @returns {Object|null} Новая свеча или null, если еще не пришло время
 */
export const addNewCandle = (timeframe) => {
  if (!candlestickCache[timeframe]) {
    generateCandlestickData(timeframe);
    return null;
  }
  
  const currentTimestamp = Date.now();
  const timeInterval = getTimeInterval(timeframe);
  const latestCandle = candlestickCache[timeframe][candlestickCache[timeframe].length - 1];
  const latestCandleTimestamp = latestCandle.time * 1000;
  
  // Проверяем, прошло ли достаточно времени для новой свечи
  if (currentTimestamp - latestCandleTimestamp < timeInterval) {
    return null;
  }
  
  const volatility = getVolatility(timeframe);
  const open = latestCandle.close;
  const close = randomWithVolatility(open, volatility);
  const high = Math.max(open, close) * (1 + randomNumber(0, volatility / 2) / 100);
  const low = Math.min(open, close) * (1 - randomNumber(0, volatility / 2) / 100);
  const volume = randomNumber(10000, 50000);
  
  const newCandle = {
    time: Math.floor(currentTimestamp / 1000),
    open,
    high,
    low,
    close,
    volume,
  };
  
  // Добавляем новую свечу и удаляем самую старую
  candlestickCache[timeframe].push(newCandle);
  candlestickCache[timeframe].shift();
  
  // Обновляем глобальную текущую цену
  globalCurrentPrice = close;
  
  // Уведомляем подписчиков о новой цене
  notifyPriceUpdateSubscribers();
  
  return newCandle;
};

/**
 * Обновляет последнюю свечу в данных
 * @param {string} timeframe - Временной интервал
 * @returns {Object|null} Обновленная свеча или null, если данных нет
 */
export const updateLastCandle = (timeframe) => {
  if (!candlestickCache[timeframe] || candlestickCache[timeframe].length === 0) {
    return null;
  }
  
  const currentTimestamp = Date.now();
  const volatility = getVolatility(timeframe) * 0.3; // Снижаем волатильность для обновлений
  const lastCandle = candlestickCache[timeframe][candlestickCache[timeframe].length - 1];
  
  // Генерируем новую цену закрытия
  const newClose = randomWithVolatility(lastCandle.close, volatility);
  
  // Обновляем high и low
  const newHigh = Math.max(lastCandle.high, newClose);
  const newLow = Math.min(lastCandle.low, newClose);
  
  // Обновляем объем
  const newVolume = lastCandle.volume + randomNumber(100, 1000);
  
  // Обновляем свечу
  const updatedCandle = {
    ...lastCandle,
    high: newHigh,
    low: newLow,
    close: newClose,
    volume: newVolume,
  };
  
  // Обновляем свечу в кэше
  candlestickCache[timeframe][candlestickCache[timeframe].length - 1] = updatedCandle;
  
  // Обновляем глобальную текущую цену
  globalCurrentPrice = newClose;
  
  // Уведомляем подписчиков о новой цене
  notifyPriceUpdateSubscribers();
  
  return updatedCandle;
};

/**
 * Генерирует моковые данные для текущей цены биткоина
 * @param {string} currency - Валюта (usd, eur, rub)
 * @returns {Object} Объект с текущей ценой и изменениями
 */
export const generateCurrentPrice = (currency = 'usd') => {
  const now = new Date();
  const timeSinceLastUpdate = (now.getTime() - lastUpdateTimestamp) / 1000; // в секундах
  
  // Генерируем изменение цены пропорционально времени, прошедшему с последнего обновления
  const volatilityFactor = Math.min(timeSinceLastUpdate / 60, 1); // Максимум 1 минута
  const volatility = 0.5 * volatilityFactor;
  
  // Генерируем новую цену
  const newPrice = randomWithVolatility(globalCurrentPrice, volatility);
  const change = newPrice - globalCurrentPrice;
  
  // Обновляем глобальную цену
  globalCurrentPrice = newPrice;
  lastUpdateTimestamp = now.getTime();
  
  // Конвертируем цену в зависимости от валюты
  let price = newPrice;
  if (currency === 'eur') {
    price = newPrice * 0.93; // Примерный курс EUR/USD
  } else if (currency === 'rub') {
    price = newPrice * 91.5; // Примерный курс RUB/USD
  }
  
  // Рассчитываем изменение за 24 часа (случайное значение)
  const change24h = randomNumber(-1500, 1500);
  const changePercentage24h = (change24h / price) * 100;
  
  return {
    price,
    currency,
    last_updated: now.toISOString(),
    change_24h: change24h,
    change_percentage_24h: changePercentage24h,
  };
};

/**
 * Генерирует моковые исторические данные цены биткоина
 * @param {string} currency - Валюта (usd, eur, rub)
 * @param {number} days - Количество дней
 * @returns {Object} Объект с историческими данными
 */
export const generateHistoricalData = (currency = 'usd', days = 30) => {
  const now = new Date();
  const data = [];
  let basePrice = globalCurrentPrice;
  const volatility = 2;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const price = randomWithVolatility(basePrice, volatility);
    
    data.push({
      date: date.toISOString().split('T')[0],
      price,
    });
    
    basePrice = price;
  }
  
  return {
    currency,
    days,
    data,
  };
};

/**
 * Подписывает колбэк на обновления цены в реальном времени
 * @param {Function} callback - Функция, которая будет вызвана при обновлении цены
 * @returns {Function} Функция для отписки
 */
export const subscribeToPriceUpdates = (callback) => {
  priceUpdateSubscribers.push(callback);
  
  // Возвращаем функцию для отписки
  return () => {
    const index = priceUpdateSubscribers.indexOf(callback);
    if (index !== -1) {
      priceUpdateSubscribers.splice(index, 1);
    }
  };
};

/**
 * Уведомляет всех подписчиков об обновлении цены
 */
const notifyPriceUpdateSubscribers = () => {
  const priceData = {
    price: globalCurrentPrice,
    timestamp: Date.now(),
  };
  
  priceUpdateSubscribers.forEach(callback => {
    try {
      callback(priceData);
    } catch (error) {
      console.error('Ошибка при вызове подписчика:', error);
    }
  });
};

// Запускаем обновление данных каждые несколько секунд для имитации вебсокетов
setInterval(() => {
  // Обновляем данные по разным таймфреймам с разной частотой
  const currentSecond = Math.floor(Date.now() / 1000);
  
  // Обновляем мелкие таймфреймы чаще
  if (candlestickCache['1m']) updateLastCandle('1m');
  if (currentSecond % 3 === 0 && candlestickCache['3m']) updateLastCandle('3m');
  if (currentSecond % 5 === 0 && candlestickCache['5m']) updateLastCandle('5m');
  if (currentSecond % 15 === 0 && candlestickCache['15m']) updateLastCandle('15m');
  if (currentSecond % 30 === 0 && candlestickCache['30m']) updateLastCandle('30m');
  if (currentSecond % 60 === 0) {
    if (candlestickCache['1h']) updateLastCandle('1h');
    if (candlestickCache['4h']) updateLastCandle('4h');
    if (candlestickCache['12h']) updateLastCandle('12h');
    if (candlestickCache['1d']) updateLastCandle('1d');
    if (candlestickCache['1w']) updateLastCandle('1w');
  }
  
  // Проверяем, нужно ли добавить новые свечи
  Object.keys(candlestickCache).forEach(tf => {
    if (candlestickCache[tf]) {
      addNewCandle(tf);
    }
  });
}, 1000);

// Добавляем новую функцию для генерации моковых событий

// Солнечные события - математические расчеты (упрощенная версия серверной логики)
/**
 * Вычисляет приблизительный Julian Day для сезонного события
 * @param {number} year - Год 
 * @param {string} season - Сезон (spring, summer, autumn, winter)
 * @returns {number} Julian Day
 */
const getSeasonApprox = (year, season) => {
  const Y = (year - 2000) / 1000;
  
  let JDE0;
  switch (season) {
    case 'spring': // March equinox
      JDE0 = 2451623.80984 + 365242.37404 * Y + 0.05169 * Y * Y - 0.00411 * Y * Y * Y - 0.00057 * Y * Y * Y * Y;
      break;
    case 'summer': // June solstice
      JDE0 = 2451716.56767 + 365241.62603 * Y + 0.00325 * Y * Y + 0.00888 * Y * Y * Y - 0.00030 * Y * Y * Y * Y;
      break;
    case 'autumn': // September equinox
      JDE0 = 2451810.21715 + 365242.01767 * Y - 0.11575 * Y * Y + 0.00337 * Y * Y * Y + 0.00078 * Y * Y * Y * Y;
      break;
    case 'winter': // December solstice
      JDE0 = 2451900.05952 + 365242.74049 * Y - 0.06223 * Y * Y - 0.00823 * Y * Y * Y + 0.00032 * Y * Y * Y * Y;
      break;
  }
  
  return JDE0;
};

/**
 * Конвертирует Julian Day в JavaScript Date
 * @param {number} jd - Julian Day
 * @returns {Date} JavaScript Date
 */
const julianToDate = (jd) => {
  const a = jd + 0.5;
  const z = Math.floor(a);
  const f = a - z;
  
  let A = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    A = z + 1 + alpha - Math.floor(alpha / 4);
  }
  
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  
  const day = B - D - Math.floor(30.6001 * E) + f;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  
  const hours = (day - Math.floor(day)) * 24;
  const minutes = (hours - Math.floor(hours)) * 60;
  const seconds = (minutes - Math.floor(minutes)) * 60;
  
  return new Date(year, month - 1, Math.floor(day), Math.floor(hours), Math.floor(minutes), Math.floor(seconds));
};

/**
 * Генерирует солнечные события для заданного года
 * @param {number} year - Год
 * @returns {Array} Массив солнечных событий
 */
const generateSolarEventsForYear = (year) => {
  const events = [];
  
  const seasons = [
    { key: 'spring', title: 'Весеннее равноденствие', icon: '🌸', type: 'spring_equinox' },
    { key: 'summer', title: 'Летнее солнцестояние', icon: '☀️', type: 'summer_solstice' },
    { key: 'autumn', title: 'Осеннее равноденствие', icon: '🍂', type: 'autumn_equinox' },
    { key: 'winter', title: 'Зимнее солнцестояние', icon: '❄️', type: 'winter_solstice' }
  ];
  
  for (const { key, title, icon, type } of seasons) {
    const jd = getSeasonApprox(year, key);
    const date = julianToDate(jd);
    
    events.push({
      id: `solar-${year}-${key}`,
      title,
      date: date.toISOString(),
      type: 'solar',
      subtype: type,
      icon,
      description: `${title} ${year} года. Астрономически значимое событие.`,
      category: 'seasonal'
    });
  }
  
  return events;
};

/**
 * Генерирует солнечные события для диапазона дат
 * @param {Date} startDate - Начальная дата
 * @param {Date} endDate - Конечная дата
 * @param {Array} types - Типы событий ['seasonal', 'solar_eclipse', 'lunar_eclipse']
 * @returns {Array} Массив солнечных событий
 */
export const generateMockSolarEvents = (startDate, endDate, types = ['seasonal', 'solar_eclipse', 'lunar_eclipse']) => {
  const events = [];
  
  // Определяем диапазон лет
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  // Добавляем сезонные события если запрошены
  if (types.includes('seasonal')) {
    for (let year = startYear; year <= endYear; year++) {
      const seasonalEvents = generateSolarEventsForYear(year);
      events.push(...seasonalEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
      }));
    }
  }
  
  // Добавляем затмения если запрошены
  if (types.includes('solar_eclipse') || types.includes('lunar_eclipse')) {
    const eclipses = generateEclipseEvents();
    events.push(...eclipses.filter(event => {
      const eventDate = new Date(event.date);
      const isInRange = eventDate >= startDate && eventDate <= endDate;
      const isRequestedType = types.includes(event.subtype);
      return isInRange && isRequestedType;
    }));
  }
  
  // Сортируем по дате
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return events;
};

/**
 * Генерирует сезонные события для года
 * @param {number} year - Год
 * @returns {Array} Массив сезонных событий
 */
export const generateMockSeasonalEvents = (year) => {
  return generateSolarEventsForYear(year);
};

/**
 * Генерирует солнечные затмения
 * @param {number} year - Год (используется для фильтрации)
 * @returns {Array} Массив солнечных затмений
 */
export const generateMockSolarEclipses = (year) => {
  const eclipses = generateEclipseEvents();
  return eclipses.filter(eclipse => {
    const eclipseYear = new Date(eclipse.date).getFullYear();
    return eclipseYear === year && eclipse.subtype === 'solar_eclipse';
  });
};

/**
 * Генерирует лунные затмения
 * @param {number} year - Год (используется для фильтрации)
 * @returns {Array} Массив лунных затмений
 */
export const generateMockLunarEclipses = (year) => {
  const eclipses = generateEclipseEvents();
  return eclipses.filter(eclipse => {
    const eclipseYear = new Date(eclipse.date).getFullYear();
    return eclipseYear === year && eclipse.subtype === 'lunar_eclipse';
  });
};

/**
 * Генерирует известные затмения для 2024-2025
 * @returns {Array} Массив затмений
 */
const generateEclipseEvents = () => {
  const eclipses = [
    // 2024 затмения
    {
      id: 'eclipse-2024-1',
      title: 'Полное солнечное затмение',
      date: new Date('2024-04-08T18:18:00Z').toISOString(),
      type: 'solar',
      subtype: 'solar_eclipse',
      icon: '🌑',
      description: 'Полное солнечное затмение, видимое в Северной Америке',
      magnitude: 1.05,
      duration: 268,
      visibility: 'Северная Америка'
    },
    {
      id: 'eclipse-2024-2',
      title: 'Частичное лунное затмение',
      date: new Date('2024-09-18T02:44:00Z').toISOString(),
      type: 'solar',
      subtype: 'lunar_eclipse',
      icon: '🌗',
      description: 'Частичное лунное затмение',
      magnitude: 0.08,
      duration: 64,
      visibility: 'Америка, Европа, Африка'
    },
    // 2025 затмения  
    {
      id: 'eclipse-2025-1',
      title: 'Полное лунное затмение',
      date: new Date('2025-03-14T06:59:00Z').toISOString(),
      type: 'solar',
      subtype: 'lunar_eclipse',
      icon: '🌕',
      description: 'Полное лунное затмение, видимое в Тихоокеанском регионе',
      magnitude: 1.18,
      duration: 65,
      visibility: 'Тихий океан, Америка, Западная Европа, Западная Африка'
    },
    {
      id: 'eclipse-2025-2',
      title: 'Частичное солнечное затмение',
      date: new Date('2025-03-29T10:48:00Z').toISOString(),
      type: 'solar', 
      subtype: 'solar_eclipse',
      icon: '🌘',
      description: 'Частичное солнечное затмение в Атлантике',
      magnitude: 0.94,
      duration: 0,
      visibility: 'Атлантический океан, Европа, Азия, Африка'
    },
    {
      id: 'eclipse-2025-3',
      title: 'Частичное лунное затмение',
      date: new Date('2025-09-07T18:11:00Z').toISOString(),
      type: 'solar',
      subtype: 'lunar_eclipse', 
      icon: '🌗',
      description: 'Частичное лунное затмение',
      magnitude: 0.06,
      duration: 27,
      visibility: 'Европа, Африка, Азия, Австралия'
    },
    {
      id: 'eclipse-2025-4',
      title: 'Частичное солнечное затмение',
      date: new Date('2025-09-21T19:43:00Z').toISOString(),
      type: 'solar',
      subtype: 'solar_eclipse',
      icon: '🌘',
      description: 'Частичное солнечное затмение в Тихом океане',
      magnitude: 0.86,
      duration: 0,
      visibility: 'Новая Зеландия, Антарктика'
    }
  ];
  
  return eclipses;
};

/**
 * Генерирует моковые данные о событиях (лунных, астрологических и солнечных)
 * @returns {Array} Массив моковых событий
 */
export const generateMockEvents = () => {
  const now = new Date();
  const events = [];
  
  // Лунные фазы
  const moonPhases = [
    { title: 'Новолуние', icon: '🌑' },
    { title: 'Растущая луна', icon: '🌒' },
    { title: 'Первая четверть', icon: '🌓' },
    { title: 'Растущая луна', icon: '🌔' },
    { title: 'Полнолуние', icon: '🌕' },
    { title: 'Убывающая луна', icon: '🌖' },
    { title: 'Последняя четверть', icon: '🌗' },
    { title: 'Убывающая луна', icon: '🌘' }
  ];
  
  // Астрологические события
  const astroEvents = [
    { title: 'Солнце входит в знак Овна', icon: '♈' },
    { title: 'Меркурий ретроградный', icon: '☿' },
    { title: 'Венера в соединении с Юпитером', icon: '♀♃' },
    { title: 'Марс в квадрате с Сатурном', icon: '♂□♄' },
    { title: 'Юпитер входит в знак Рыб', icon: '♃♓' }
  ];
  
  // Добавляем солнечные события для текущего года и соседних лет
  const currentYear = now.getFullYear();
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    events.push(...generateSolarEventsForYear(year));
  }
  
  // Добавляем затмения
  events.push(...generateEclipseEvents());
  
  // Генерируем прошлые даты для лунных фаз
  for (let i = 0; i < 8; i++) {
    const randomPhase = moonPhases[Math.floor(Math.random() * moonPhases.length)];
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 90) - 1); // Случайно в пределах 90 дней назад
    
    events.push({
      id: `moon-past-${i}`,
      title: randomPhase.title,
      date: date.toISOString(),
      type: 'moon',
      icon: randomPhase.icon,
      description: `Влияние на рынок: ${Math.random() > 0.5 ? 'положительное' : 'отрицательное'}`
    });
  }
  
  // Генерируем прошлые даты для астрологических событий
  for (let i = 0; i < 6; i++) {
    const randomEvent = astroEvents[Math.floor(Math.random() * astroEvents.length)];
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 120) - 1); // Случайно в пределах 120 дней назад
    
    events.push({
      id: `astro-past-${i}`,
      title: randomEvent.title,
      date: date.toISOString(),
      type: 'astro',
      icon: randomEvent.icon,
      description: `Исторически ${Math.random() > 0.5 ? 'совпадало с ростом' : 'совпадало с падением'} рынка`
    });
  }
  
  // Генерируем будущие даты для лунных фаз
  for (let i = 0; i < 6; i++) {
    const randomPhase = moonPhases[Math.floor(Math.random() * moonPhases.length)];
    const date = new Date(now);
    date.setDate(date.getDate() + Math.floor(Math.random() * 60) + 1); // Случайно в ближайшие 60 дней
    
    events.push({
      id: `moon-${i}`,
      title: randomPhase.title,
      date: date.toISOString(),
      type: 'moon',
      icon: randomPhase.icon,
      description: `Влияние на рынок: ${Math.random() > 0.5 ? 'положительное' : 'отрицательное'}`
    });
  }
  
  // Генерируем будущие даты для астрологических событий
  for (let i = 0; i < 4; i++) {
    const randomEvent = astroEvents[Math.floor(Math.random() * astroEvents.length)];
    const date = new Date(now);
    date.setDate(date.getDate() + Math.floor(Math.random() * 90) + 1); // Случайно в ближайшие 90 дней
    
    events.push({
      id: `astro-${i}`,
      title: randomEvent.title,
      date: date.toISOString(),
      type: 'astro',
      icon: randomEvent.icon,
      description: `Исторически ${Math.random() > 0.5 ? 'совпадает с ростом' : 'совпадает с падением'} рынка`
    });
  }
  
  // Добавляем пользовательские события в прошлом
  events.push({
    id: 'user-past-1',
    title: 'Запуск биткоин-ETF',
    date: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString(),
    type: 'user',
    icon: '📈',
    description: 'Одобрение SEC биткоин-ETF на спотовом рынке'
  });
  
  events.push({
    id: 'user-past-2',
    title: 'Речь Пауэлла',
    date: new Date(now.getFullYear(), now.getMonth() - 1, 5).toISOString(),
    type: 'user',
    icon: '🎤',
    description: 'Выступление главы ФРС по монетарной политике'
  });
  
  // Добавляем пользовательские события в будущем
  events.push({
    id: 'user-1',
    title: 'Решение ФРС по ставке',
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15).toISOString(),
    type: 'user',
    icon: '📊',
    description: 'Ожидается повышение ставки на 25 базисных пунктов'
  });
  
  events.push({
    id: 'user-2',
    title: 'Халвинг биткоина',
    date: new Date(now.getFullYear(), now.getMonth() + 4, 10).toISOString(),
    type: 'user',
    icon: '📌',
    description: 'Уменьшение награды за блок вдвое'
  });
  
  // Сортируем по дате
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return events;
}; 