import logger from '../utils/logger.js';

/**
 * Сервис для работы с солнечными и лунными затмениями
 */
class EclipseService {
  constructor() {
    // Данные о предстоящих солнечных затмениях
    this.solarEclipses = [
      {
        date: '2024-10-02T17:49:00Z',
        type: 'annular',
        title: 'Кольцеобразное солнечное затмение',
        icon: '☀️',
        visibility: 'Чили, Аргентина, Южный Атлантический океан',
        description: 'Кольцеобразное солнечное затмение, видимое в Южной Америке и части Атлантического океана'
      },
      {
        date: '2025-03-29T10:47:00Z',
        type: 'total',
        title: 'Полное солнечное затмение',
        icon: '🌞',
        visibility: 'Северная Африка, Европа, Россия',
        description: 'Полное солнечное затмение, видимое в части Европы, Северной Африки и России'
      },
      {
        date: '2026-08-12T17:46:00Z',
        type: 'total',
        title: 'Полное солнечное затмение',
        icon: '🌞',
        visibility: 'Арктика, Гренландия, Исландия, Испания',
        description: 'Полное солнечное затмение, видимое в Арктике, Гренландии, Исландии и части Испании'
      },
      {
        date: '2027-08-02T10:07:00Z',
        type: 'total',
        title: 'Полное солнечное затмение',
        icon: '🌞',
        visibility: 'Марокко, Испания, Алжир, Ливия, Египет, Саудовская Аравия',
        description: 'Одно из самых продолжительных полных солнечных затмений в XXI веке'
      }
    ];

    // Данные о предстоящих лунных затмениях
    this.lunarEclipses = [
      {
        date: '2024-09-18T02:44:00Z',
        type: 'partial',
        title: 'Частное лунное затмение',
        icon: '🌙',
        visibility: 'Америка, Европа, Африка',
        description: 'Частное лунное затмение, видимое в большей части Северной и Южной Америки, Европе и Африке'
      },
      {
        date: '2025-03-14T06:58:00Z',
        type: 'total',
        title: 'Полное лунное затмение',
        icon: '🌚',
        visibility: 'Восточная Азия, Австралия, Северная Америка',
        description: 'Полное лунное затмение, видимое в Восточной Азии, Австралии и большей части Северной Америки'
      },
      {
        date: '2025-09-07T19:12:00Z',
        type: 'total',
        title: 'Полное лунное затмение',
        icon: '🌚',
        visibility: 'Европа, Африка, Азия, Австралия',
        description: 'Полное лунное затмение, видимое в Европе, Африке, Азии и Австралии'
      },
      {
        date: '2026-03-03T11:34:00Z',
        type: 'total',
        title: 'Полное лунное затмение',
        icon: '🌚',
        visibility: 'Восточная Азия, Австралия, Северная Америка',
        description: 'Полное лунное затмение, видимое в Восточной Азии, Австралии и Северной Америке'
      }
    ];
  }

  /**
   * Получает предстоящие солнечные затмения
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Array} массив солнечных затмений
   */
  getUpcomingSolarEclipses(startDate = new Date(), endDate = null) {
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(start);
      end.setFullYear(end.getFullYear() + 10); // По умолчанию берем затмения на 10 лет вперед
      
      const events = this.solarEclipses
        .filter(eclipse => {
          const eclipseDate = new Date(eclipse.date);
          return eclipseDate >= start && eclipseDate <= end;
        })
        .map(eclipse => ({
          ...eclipse,
          type: 'solar_eclipse',
          category: 'astro'
        }));
      
      logger.debug(`EclipseService: найдено ${events.length} солнечных затмений`);
      return events;
    } catch (error) {
      logger.error('EclipseService: ошибка при получении солнечных затмений', error);
      return [];
    }
  }

  /**
   * Получает предстоящие лунные затмения
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Array} массив лунных затмений
   */
  getUpcomingLunarEclipses(startDate = new Date(), endDate = null) {
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(start);
      end.setFullYear(end.getFullYear() + 10); // По умолчанию берем затмения на 10 лет вперед
      
      const events = this.lunarEclipses
        .filter(eclipse => {
          const eclipseDate = new Date(eclipse.date);
          return eclipseDate >= start && eclipseDate <= end;
        })
        .map(eclipse => ({
          ...eclipse,
          type: 'lunar_eclipse',
          category: 'astro'
        }));
      
      logger.debug(`EclipseService: найдено ${events.length} лунных затмений`);
      return events;
    } catch (error) {
      logger.error('EclipseService: ошибка при получении лунных затмений', error);
      return [];
    }
  }

  /**
   * Получает все предстоящие затмения (солнечные и лунные)
   * @param {Date} startDate - начальная дата
   * @param {Date} endDate - конечная дата
   * @returns {Array} массив затмений
   */
  getAllEclipses(startDate = new Date(), endDate = null) {
    try {
      const solarEclipses = this.getUpcomingSolarEclipses(startDate, endDate);
      const lunarEclipses = this.getUpcomingLunarEclipses(startDate, endDate);
      
      // Объединяем и сортируем по дате
      const allEclipses = [...solarEclipses, ...lunarEclipses]
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      logger.debug(`EclipseService: найдено ${allEclipses.length} затмений (${solarEclipses.length} солнечных, ${lunarEclipses.length} лунных)`);
      return allEclipses;
    } catch (error) {
      logger.error('EclipseService: ошибка при получении всех затмений', error);
      return [];
    }
  }
}

const eclipseService = new EclipseService();
export default eclipseService;