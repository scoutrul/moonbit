const fetch = require('node-fetch');
const logger = require('../utils/logger');

/**
 * Сервис для работы с астрологическими данными
 */
class AstroService {
  constructor() {
    // Кэш для астрологических событий
    this.astroEventsCache = [];
    this.lastUpdate = null;
    
    // Предопределенные астрологические события
    this.presetEvents = [
      // Ретроградный Меркурий на 2023-2024
      { date: '2023-12-13', end_date: '2024-01-01', title: 'Ретроградный Меркурий', type: 'retrograde', planet: 'mercury', icon: '☿' },
      { date: '2024-04-01', end_date: '2024-04-25', title: 'Ретроградный Меркурий', type: 'retrograde', planet: 'mercury', icon: '☿' },
      { date: '2024-08-05', end_date: '2024-08-28', title: 'Ретроградный Меркурий', type: 'retrograde', planet: 'mercury', icon: '☿' },
      { date: '2024-11-26', end_date: '2024-12-15', title: 'Ретроградный Меркурий', type: 'retrograde', planet: 'mercury', icon: '☿' },
      
      // Ретроградная Венера на 2024
      { date: '2024-07-22', end_date: '2024-09-03', title: 'Ретроградная Венера', type: 'retrograde', planet: 'venus', icon: '♀' },
      
      // Ретроградный Марс на 2024
      { date: '2024-12-06', end_date: '2025-02-23', title: 'Ретроградный Марс', type: 'retrograde', planet: 'mars', icon: '♂' },
      
      // Другие значимые астрологические события
      { date: '2024-01-11', title: 'Новолуние в Козероге', type: 'new_moon', sign: 'capricorn', icon: '🌑' },
      { date: '2024-01-25', title: 'Полнолуние в Льве', type: 'full_moon', sign: 'leo', icon: '🌕' },
      { date: '2024-02-09', title: 'Новолуние в Водолее', type: 'new_moon', sign: 'aquarius', icon: '🌑' },
      { date: '2024-02-24', title: 'Полнолуние в Деве', type: 'full_moon', sign: 'virgo', icon: '🌕' },
      { date: '2024-03-10', title: 'Новолуние в Рыбах', type: 'new_moon', sign: 'pisces', icon: '🌑' },
      { date: '2024-03-25', title: 'Полнолуние в Весах', type: 'full_moon', sign: 'libra', icon: '🌕' },
      { date: '2024-04-08', title: 'Новолуние в Овне (Солнечное затмение)', type: 'solar_eclipse', sign: 'aries', icon: '🌑' },
      { date: '2024-04-23', title: 'Полнолуние в Скорпионе (Лунное затмение)', type: 'lunar_eclipse', sign: 'scorpio', icon: '🌕' },
      { date: '2024-05-08', title: 'Новолуние в Тельце', type: 'new_moon', sign: 'taurus', icon: '🌑' },
      { date: '2024-05-23', title: 'Полнолуние в Стрельце', type: 'full_moon', sign: 'sagittarius', icon: '🌕' },
      { date: '2024-06-06', title: 'Новолуние в Близнецах', type: 'new_moon', sign: 'gemini', icon: '🌑' },
      { date: '2024-06-21', title: 'Полнолуние в Козероге', type: 'full_moon', sign: 'capricorn', icon: '🌕' },
      { date: '2024-07-05', title: 'Новолуние в Раке', type: 'new_moon', sign: 'cancer', icon: '🌑' },
      { date: '2024-07-21', title: 'Полнолуние в Водолее', type: 'full_moon', sign: 'aquarius', icon: '🌕' },
      { date: '2024-08-04', title: 'Новолуние во Льве', type: 'new_moon', sign: 'leo', icon: '🌑' },
      { date: '2024-08-19', title: 'Полнолуние в Рыбах', type: 'full_moon', sign: 'pisces', icon: '🌕' },
      { date: '2024-09-02', title: 'Новолуние в Деве', type: 'new_moon', sign: 'virgo', icon: '🌑' },
      { date: '2024-09-17', title: 'Полнолуние в Овне', type: 'full_moon', sign: 'aries', icon: '🌕' },
      { date: '2024-10-02', title: 'Новолуние в Весах (Солнечное затмение)', type: 'solar_eclipse', sign: 'libra', icon: '🌑' },
      { date: '2024-10-17', title: 'Полнолуние в Тельце (Лунное затмение)', type: 'lunar_eclipse', sign: 'taurus', icon: '🌕' },
      { date: '2024-11-01', title: 'Новолуние в Скорпионе', type: 'new_moon', sign: 'scorpio', icon: '🌑' },
      { date: '2024-11-15', title: 'Полнолуние в Близнецах', type: 'full_moon', sign: 'gemini', icon: '🌕' },
      { date: '2024-12-01', title: 'Новолуние в Стрельце', type: 'new_moon', sign: 'sagittarius', icon: '🌑' },
      { date: '2024-12-15', title: 'Полнолуние в Раке', type: 'full_moon', sign: 'cancer', icon: '🌕' },
      { date: '2024-12-30', title: 'Новолуние в Козероге', type: 'new_moon', sign: 'capricorn', icon: '🌑' }
    ];
  }

  /**
   * Получение всех астрологических событий
   * @param {Date} startDate - Начальная дата (по умолчанию - сегодня)
   * @param {Date} endDate - Конечная дата (по умолчанию - 30 дней вперед)
   */
  async getAstroEvents(startDate = new Date(), endDate = null) {
    // Если конечная дата не указана, устанавливаем на 30 дней вперед
    if (!endDate) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
    }
    
    // Обновляем кэш, если нужно
    await this.updateAstroEventsIfNeeded();
    
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    // Фильтруем события в заданном диапазоне дат
    return this.astroEventsCache.filter(event => {
      const eventDate = event.date.split('T')[0];
      return eventDate >= start && eventDate <= end;
    });
  }

  /**
   * Получение предстоящих астрологических событий
   * @param {number} limit - Количество событий
   */
  async getUpcomingEvents(limit = 5) {
    const today = new Date();
    const events = await this.getAstroEvents(today);
    
    // Сортируем по дате
    return events
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit);
  }

  /**
   * Обновление астрологических данных
   */
  async updateAstroEvents() {
    try {
      // На данный момент мы используем предустановленные данные,
      // но в будущем этот метод может быть расширен для запроса данных из API
      
      // Форматируем предустановленные события
      const formattedEvents = this.presetEvents.map(event => {
        const date = new Date(event.date);
        
        return {
          id: `${event.type}_${event.date}`,
          date: date.toISOString(),
          end_date: event.end_date ? new Date(event.end_date).toISOString() : null,
          title: event.title,
          type: event.type,
          icon: event.icon || this.getIconForEventType(event.type),
          planet: event.planet || null,
          sign: event.sign || null
        };
      });
      
      this.astroEventsCache = formattedEvents;
      this.lastUpdate = Date.now();
      
      logger.debug('Обновлены астрологические данные');
      return formattedEvents;
    } catch (error) {
      logger.error('Ошибка при обновлении астрологических данных:', error);
      throw error;
    }
  }

  /**
   * Обновляет кэш астрологических событий, если нужно
   */
  async updateAstroEventsIfNeeded() {
    if (this.shouldUpdateCache()) {
      await this.updateAstroEvents();
    }
    return this.astroEventsCache;
  }

  /**
   * Проверяет, нужно ли обновить кэш
   */
  shouldUpdateCache() {
    if (!this.lastUpdate) return true;
    
    // Обновляем астрологические данные раз в неделю
    const daysPassed = (Date.now() - this.lastUpdate) / (1000 * 60 * 60 * 24);
    return daysPassed >= 7;
  }

  /**
   * Возвращает иконку для типа события
   * @param {string} eventType - Тип события
   */
  getIconForEventType(eventType) {
    const icons = {
      new_moon: '🌑',
      full_moon: '🌕',
      retrograde: '↺',
      solar_eclipse: '☀️',
      lunar_eclipse: '🌕',
      planetary_alignment: '⚡️',
      default: '✨'
    };
    
    return icons[eventType] || icons.default;
  }
}

// Создаем синглтон
const astroService = new AstroService();

module.exports = astroService; 