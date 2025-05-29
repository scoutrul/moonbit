import logger from '../utils/logger.js';

/**
 * Сервис для работы с экономическими событиями
 */
class EconomicEventsService {
  constructor() {
    this.economicEvents = [
      {
        title: 'Заседание ФРС США',
        description: 'Решение по процентной ставке',
        impact: 'high',
        category: 'monetary_policy',
        icon: '🏦'
      },
      {
        title: 'Отчет по инфляции CPI',
        description: 'Индекс потребительских цен США',
        impact: 'high',
        category: 'inflation',
        icon: '📊'
      },
      {
        title: 'Отчет по занятости NFP',
        description: 'Количество новых рабочих мест в США',
        impact: 'high',
        category: 'employment',
        icon: '👥'
      },
      {
        title: 'Заседание ЕЦБ',
        description: 'Решение Европейского центрального банка',
        impact: 'medium',
        category: 'monetary_policy',
        icon: '🇪🇺'
      },
      {
        title: 'Данные по ВВП',
        description: 'Квартальные данные по росту экономики',
        impact: 'medium',
        category: 'gdp',
        icon: '📈'
      },
      {
        title: 'Решение Банка Японии',
        description: 'Монетарная политика Японии',
        impact: 'medium',
        category: 'monetary_policy',
        icon: '🇯🇵'
      },
      {
        title: 'Индекс PMI',
        description: 'Индекс деловой активности',
        impact: 'low',
        category: 'business',
        icon: '🏭'
      },
      {
        title: 'Данные по розничным продажам',
        description: 'Потребительская активность',
        impact: 'low',
        category: 'retail',
        icon: '🛒'
      }
    ];
  }

  /**
   * Генерирует предстоящие экономические события
   */
  generateUpcomingEvents(days = 30) {
    const events = [];
    const now = new Date();
    
    for (let i = 1; i <= days; i++) {
      const eventDate = new Date(now);
      eventDate.setDate(now.getDate() + i);
      
      // Генерируем события с определенной вероятностью
      if (Math.random() < 0.15) { // 15% вероятность события в день
        const randomEvent = this.economicEvents[Math.floor(Math.random() * this.economicEvents.length)];
        
        events.push({
          id: `economic-${i}-${Date.now()}`,
          date: eventDate.toISOString(),
          title: randomEvent.title,
          description: randomEvent.description,
          impact: randomEvent.impact,
          category: randomEvent.category,
          icon: randomEvent.icon,
          type: 'economic'
        });
      }
    }
    
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Получает предстоящие экономические события
   */
  async getUpcomingEvents(days = 30) {
    try {
      logger.debug(`EconomicEventsService: получение событий на ${days} дней`);
      return this.generateUpcomingEvents(days);
    } catch (error) {
      logger.error('EconomicEventsService: ошибка при получении событий:', error);
      throw error;
    }
  }

  /**
   * Получает события по важности
   */
  async getEventsByImportance(importance = 'high') {
    try {
      const events = this.generateUpcomingEvents(60);
      return events.filter(event => event.impact === importance);
    } catch (error) {
      logger.error('EconomicEventsService: ошибка при фильтрации по важности:', error);
      throw error;
    }
  }

  /**
   * Получает события для периода
   */
  async getEventsForPeriod(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const events = this.generateUpcomingEvents(diffDays + 30);
      
      return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= start && eventDate <= end;
      });
    } catch (error) {
      logger.error('EconomicEventsService: ошибка при получении событий для периода:', error);
      throw error;
    }
  }
}

const economicEventsService = new EconomicEventsService();
export default economicEventsService;