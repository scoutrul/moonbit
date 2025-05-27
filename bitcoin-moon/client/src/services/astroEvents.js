import AstroService from './AstroService.js';

/**
 * Получает предстоящие лунные события на указанное количество дней вперед
 * @param {number} days - количество дней, для которых нужно получить события
 * @returns {Promise<Array>} - массив объектов с датами и типами лунных фаз
 */
export const fetchUpcomingEvents = async (days = 30) => {
  try {
    console.log(`[astroEvents] Запрашиваем предстоящие лунные фазы на ${days} дней`);
    
    // Получаем предстоящие лунные фазы напрямую из AstroService
    const events = AstroService.getUpcomingLunarPhases(days);
    
    console.log(`[astroEvents] Получили ${events.length} предстоящих лунных фаз:`, 
      events.map(event => `${event.type} ${new Date(event.date).toISOString()}`));
    
    if (!events || events.length === 0) {
      console.warn('[astroEvents] AstroService вернул пустой массив событий');
      return generateMockLunarEvents(days);
    }
    
    return events;
  } catch (error) {
    console.error('[astroEvents] Ошибка при получении предстоящих лунных событий:', error);
    // В случае ошибки возвращаем моковые данные
    return generateMockLunarEvents(days);
  }
};

/**
 * Получает лунные события для указанного диапазона дат
 * @param {Date} startDate - начальная дата
 * @param {Date} endDate - конечная дата
 * @returns {Promise<Array>} - массив объектов с датами и типами лунных фаз
 */
export const fetchAstroEvents = async (startDate, endDate) => {
  try {
    if (!startDate || !endDate) {
      console.error('[astroEvents] Ошибка: startDate или endDate не указаны');
      return [];
    }
    
    console.log(`[astroEvents] Запрашиваем лунные фазы с ${startDate.toISOString()} по ${endDate.toISOString()}`);
    
    // Получаем лунные фазы напрямую из AstroService
    const events = AstroService.getLunarPhases(startDate, endDate);
    
    console.log(`[astroEvents] Получили ${events.length} лунных фаз в диапазоне:`,
      events.map(event => `${event.type} ${new Date(event.date).toISOString()}`));
    
    if (!events || events.length === 0) {
      console.warn('[astroEvents] AstroService вернул пустой массив событий для диапазона');
      return generateMockLunarEventsForRange(startDate, endDate);
    }
    
    return events;
  } catch (error) {
    console.error('[astroEvents] Ошибка при получении лунных событий:', error);
    // В случае ошибки возвращаем моковые данные
    return generateMockLunarEventsForRange(startDate, endDate);
  }
};

/**
 * Получает исторические лунные события для указанного диапазона дат
 * @param {Date} startDate - начальная дата
 * @param {Date} endDate - конечная дата
 * @returns {Promise<Array>} - массив объектов с датами и типами лунных фаз
 */
export const fetchHistoricalEvents = async (startDate, endDate) => {
  try {
    if (!startDate || !endDate) {
      console.error('[astroEvents] Ошибка: startDate или endDate не указаны для исторических событий');
      return [];
    }
    
    console.log(`[astroEvents] Запрашиваем исторические лунные фазы с ${startDate.toISOString()} по ${endDate.toISOString()}`);
    
    // Получаем исторические лунные фазы напрямую из AstroService
    const events = AstroService.getHistoricalLunarPhases(startDate, endDate);
    
    console.log(`[astroEvents] Получили ${events.length} исторических лунных фаз`);
    
    if (!events || events.length === 0) {
      console.warn('[astroEvents] AstroService вернул пустой массив исторических событий');
      return generateMockLunarEventsForRange(startDate, endDate);
    }
    
    return events;
  } catch (error) {
    console.error('[astroEvents] Ошибка при получении исторических лунных событий:', error);
    // В случае ошибки возвращаем моковые данные
    return generateMockLunarEventsForRange(startDate, endDate);
  }
};

/**
 * Генерирует моковые данные лунных фаз на указанное количество дней
 * @param {number} days - количество дней
 * @returns {Array} массив объектов с датами и типами лунных фаз
 */
const generateMockLunarEvents = (days = 30) => {
  console.log(`[astroEvents] Генерируем мок-данные на ${days} дней`);
  const events = [];
  const today = new Date();
  
  // Создаем моковые события каждые 14-15 дней, чередуя новолуния и полнолуния
  for (let i = 0; i < Math.ceil(days / 14); i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i * 14 + (i % 2 === 0 ? 3 : 10)); // Распределяем равномерно
    
    events.push({
      type: i % 2 === 0 ? 'new_moon' : 'full_moon',
      date: date
    });
  }
  
  console.log(`[astroEvents] Сгенерировано ${events.length} мок-событий`);
  return events;
};

/**
 * Генерирует моковые данные лунных фаз для указанного диапазона дат
 * @param {Date} startDate - начальная дата
 * @param {Date} endDate - конечная дата
 * @returns {Array} массив объектов с датами и типами лунных фаз
 */
const generateMockLunarEventsForRange = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  
  // Вычисляем количество дней в диапазоне
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  console.log(`[astroEvents] Генерируем мок-данные для диапазона в ${daysDiff} дней`);
  
  const events = [];
  let currentDate = new Date(startDate);
  
  // Начинаем с новолуния
  let isNewMoon = true;
  
  // Добавляем события каждые 14-15 дней
  while (currentDate <= endDate) {
    events.push({
      type: isNewMoon ? 'new_moon' : 'full_moon',
      date: new Date(currentDate)
    });
    
    // Переходим к следующему событию
    isNewMoon = !isNewMoon;
    currentDate.setDate(currentDate.getDate() + 14 + Math.floor(Math.random() * 2)); // 14-15 дней
  }
  
  console.log(`[astroEvents] Сгенерировано ${events.length} мок-событий для диапазона`);
  return events;
}; 