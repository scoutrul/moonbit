import api from './api';
import { 
  generateMockEvents, 
  generateMockSolarEvents, 
  generateMockSeasonalEvents, 
  generateMockSolarEclipses, 
  generateMockLunarEclipses 
} from '../utils/mockDataGenerator';

/**
 * Сервис для работы с астрономическими событиями
 */
class AstroService {
  /**
   * Получает все солнечные события (солнцестояния, равноденствия, затмения)
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @param {Array<string>} types - Типы событий ['seasonal', 'solar_eclipse', 'lunar_eclipse']
   * @returns {Promise<Object>} Промис с объектом, содержащим все типы солнечных событий
   */
  async getSolarEvents(startDate, endDate, types = ['seasonal', 'solar_eclipse', 'lunar_eclipse']) {
    try {
      console.log('AstroService: Запрашиваем солнечные события с', startDate, 'по', endDate, 'типы:', types);
      
      const response = await api.get('/astro/solar-events', {
        params: { 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          types: types.join(',')
        }
      });
      
      console.log('🔍 AstroService.getSolarEvents RAW response:', response.data);
      
      if (!response.data || !response.data.events) {
        console.warn('AstroService: Получены пустые данные от API, используем моковые данные');
        console.log('🔍 Response structure:', { hasData: !!response.data, hasEvents: !!response.data?.events });
        return this._generateMockSolarEvents(startDate, endDate, types);
      }
      
      // Преобразуем события в унифицированный формат
      const result = {
        seasonal: [],
        solarEclipses: [],
        lunarEclipses: []
      };
      
      if (response.data.events.seasonal) {
        result.seasonal = response.data.events.seasonal.map(event => ({
          time: Math.floor(new Date(event.date).getTime() / 1000),
          type: 'seasonal',
          subtype: event.type, // Используем event.type как subtype
          title: event.title,
          description: event.description,
          icon: this._getSeasonalIcon(event.type)
        }));
      }
      
      if (response.data.events.solarEclipses) {
        result.solarEclipses = response.data.events.solarEclipses.map(event => ({
          time: Math.floor(new Date(event.date).getTime() / 1000),
          type: 'solar_eclipse',
          eclipseType: event.type,
          title: event.title,
          description: event.description,
          icon: '🌒', // Иконка для солнечного затмения
          magnitude: event.magnitude,
          visibility: event.visibility
        }));
      }
      
      if (response.data.events.lunarEclipses) {
        result.lunarEclipses = response.data.events.lunarEclipses.map(event => ({
          time: Math.floor(new Date(event.date).getTime() / 1000),
          type: 'lunar_eclipse',
          eclipseType: event.type,
          title: event.title,
          description: event.description,
          icon: '🌕', // Иконка для лунного затмения
          magnitude: event.magnitude,
          visibility: event.visibility
        }));
      }
      
      console.log('AstroService: Получено солнечных событий:', {
        seasonal: result.seasonal.length,
        solarEclipses: result.solarEclipses.length,
        lunarEclipses: result.lunarEclipses.length
      });
      
      // ДИАГНОСТИКА: Проверим структуру данных API
      console.log('🔍 RAW API response.data:', response.data);
      console.log('🔍 Обработанный result:', result);
      
      return result;
    } catch (error) {
      console.error('Error fetching solar events:', error);
      console.warn('AstroService: Ошибка API, используем моковые данные');
      return this._generateMockSolarEvents(startDate, endDate, types);
    }
  }

  /**
   * Получает сезонные события (солнцестояния и равноденствия) для года
   * @param {number} year - Год
   * @returns {Promise<Array>} Промис с массивом сезонных событий
   */
  async getSeasonalEvents(year = new Date().getFullYear()) {
    try {
      console.log('AstroService: Запрашиваем сезонные события для года', year);
      
      const response = await api.get('/astro/seasonal', {
        params: { year }
      });
      
      if (!response.data || !response.data.events) {
        console.warn('AstroService: Получены пустые данные от API, используем моковые данные');
        return this._generateMockSeasonalEvents(year);
      }
      
      return response.data.events.map(event => ({
        time: event.time,
        type: 'seasonal',
        subtype: event.subtype,
        title: event.title,
        description: event.description,
        icon: event.icon
      }));
      
    } catch (error) {
      console.error('Error fetching seasonal events:', error);
      console.warn('AstroService: Ошибка API, используем моковые данные');
      return this._generateMockSeasonalEvents(year);
    }
  }

  /**
   * Получает солнечные затмения для года
   * @param {number} year - Год
   * @returns {Promise<Array>} Промис с массивом солнечных затмений
   */
  async getSolarEclipses(year = new Date().getFullYear()) {
    try {
      console.log('AstroService: Запрашиваем солнечные затмения для года', year);
      
      const response = await api.get('/astro/solar-eclipses', {
        params: { year }
      });
      
      if (!response.data || !response.data.eclipses) {
        console.warn('AstroService: Получены пустые данные от API, используем моковые данные');
        return this._generateMockSolarEclipses(year);
      }
      
      return response.data.eclipses.map(event => ({
        time: event.time,
        type: 'solar_eclipse',
        eclipseType: event.eclipseType,
        title: event.title,
        description: event.description,
        icon: event.icon,
        magnitude: event.magnitude,
        visibility: event.visibility
      }));
      
    } catch (error) {
      console.error('Error fetching solar eclipses:', error);
      console.warn('AstroService: Ошибка API, используем моковые данные');
      return this._generateMockSolarEclipses(year);
    }
  }

  /**
   * Получает лунные затмения для года
   * @param {number} year - Год
   * @returns {Promise<Array>} Промис с массивом лунных затмений
   */
  async getLunarEclipses(year = new Date().getFullYear()) {
    try {
      console.log('AstroService: Запрашиваем лунные затмения для года', year);
      
      const response = await api.get('/astro/lunar-eclipses', {
        params: { year }
      });
      
      if (!response.data || !response.data.eclipses) {
        console.warn('AstroService: Получены пустые данные от API, используем моковые данные');
        return this._generateMockLunarEclipses(year);
      }
      
      return response.data.eclipses.map(event => ({
        time: event.time,
        type: 'lunar_eclipse',
        eclipseType: event.eclipseType,
        title: event.title,
        description: event.description,
        icon: event.icon,
        magnitude: event.magnitude,
        visibility: event.visibility
      }));
      
    } catch (error) {
      console.error('Error fetching lunar eclipses:', error);
      console.warn('AstroService: Ошибка API, используем моковые данные');
      return this._generateMockLunarEclipses(year);
    }
  }

  /**
   * Получает астрономические события для указанного периода (лунные фазы)
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Promise<Array>} Промис с массивом событий
   */
  async getAstroEvents(startDate, endDate) {
    try {
      console.log('AstroService: Запрашиваем астрономические события с', startDate, 'по', endDate);
      // Форматируем даты в ISO строки
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();
      
      // Запрашиваем данные о лунных событиях с сервера
      const response = await api.get('/astro/events', {
        params: { startDate: startISO, endDate: endISO }
      });
      
      // Проверяем, что получены реальные данные
      if (!response.data || response.data.length === 0 || Object.keys(response.data).length === 0) {
        console.warn('AstroService: Получены пустые данные от API, используем моковые данные');
        // Генерируем моковые данные, если API вернул пустые данные
        const mockEvents = generateMockEvents()
          .filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= startDate && eventDate <= endDate && event.type === 'moon';
          })
          .map(event => ({
            time: new Date(event.date).getTime() / 1000,
            type: event.type,
            title: event.title,
            icon: event.icon,
            phaseName: event.title
          }));
        
        console.log('AstroService: Сгенерировано моковых данных:', mockEvents.length);
        // Сортируем данные по времени
        return mockEvents.sort((a, b) => a.time - b.time);
      }
      
      // Преобразуем события в формат, ожидаемый клиентом
      const events = response.data.map(event => ({
        time: new Date(event.date).getTime() / 1000, // Конвертируем в Unix timestamp
        type: event.type,
        title: event.title,
        icon: event.icon,
        phaseName: event.phaseName
      }));
      
      // Сортируем данные по времени
      return events.sort((a, b) => a.time - b.time);
    } catch (error) {
      console.error('Error fetching astro events:', error);
      console.warn('AstroService: Ошибка API, используем моковые данные');
      
      // Генерируем моковые данные в случае ошибки
      const mockEvents = generateMockEvents()
        .filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= startDate && eventDate <= endDate && event.type === 'moon';
        })
        .map(event => ({
          time: new Date(event.date).getTime() / 1000,
          type: event.type,
          title: event.title,
          icon: event.icon,
          phaseName: event.title
        }));
      
      console.log('AstroService: Сгенерировано моковых данных:', mockEvents.length);
      // Сортируем данные по времени
      return mockEvents.sort((a, b) => a.time - b.time);
    }
  }

  /**
   * Получает текущую фазу Луны
   * @returns {Promise<Object>} Промис с информацией о текущей фазе Луны
   */
  async getCurrentMoonPhase() {
    try {
      console.log('AstroService: Запрашиваем текущую фазу луны');
      const response = await api.get('/moon/current');
      
      // Проверяем, что получены реальные данные
      if (!response.data || Object.keys(response.data).length === 0) {
        console.warn('AstroService: Получены пустые данные от API, используем моковые данные');
        // Возвращаем моковые данные в случае пустого ответа
        return {
          phase: 0.25,
          phaseName: 'Первая четверть',
          icon: '🌓',
          nextPhaseTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextPhaseName: 'Полнолуние'
        };
      }
      
      return {
        phase: response.data.phase,
        phaseName: response.data.phaseName,
        icon: response.data.icon,
        nextPhaseTime: response.data.nextPhaseTime,
        nextPhaseName: response.data.nextPhaseName
      };
    } catch (error) {
      console.error('Error fetching current moon phase:', error);
      console.warn('AstroService: Ошибка API, используем моковые данные');
      
      // Возвращаем резервные данные в случае ошибки
      return {
        phase: 0.25,
        phaseName: 'Первая четверть',
        icon: '🌓',
        nextPhaseTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextPhaseName: 'Полнолуние'
      };
    }
  }

  /**
   * Получает предстоящие лунные события
   * @param {number} days - Количество дней для поиска событий
   * @returns {Promise<Array>} Промис с массивом предстоящих лунных событий
   */
  async getUpcomingLunarEvents(days = 30) {
    try {
      console.log(`AstroService: Запрашиваем предстоящие лунные события на ${days} дней`);
      const response = await api.get('/moon/upcoming-events', {
        params: { days }
      });
      
      // Проверяем, что получены реальные данные
      if (!response.data || response.data.length === 0 || Object.keys(response.data).length === 0) {
        console.warn('AstroService: Получены пустые данные от API, используем моковые данные');
        
        // Генерируем моковые данные
        const now = new Date();
        const end = new Date(now);
        end.setDate(end.getDate() + days);
        
        const mockEvents = generateMockEvents()
          .filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= now && eventDate <= end && event.type === 'moon';
          })
          .map(event => ({
            time: new Date(event.date).getTime() / 1000,
            type: event.type,
            title: event.title,
            icon: event.icon,
            phaseName: event.title
          }));
        
        console.log('AstroService: Сгенерировано моковых данных:', mockEvents.length);
        // Сортируем данные по времени
        return mockEvents.sort((a, b) => a.time - b.time);
      }
      
      const events = response.data.map(event => ({
        time: new Date(event.date).getTime() / 1000,
        type: event.type,
        title: event.title,
        icon: event.icon,
        phaseName: event.phaseName
      }));
      
      // Сортируем данные по времени
      return events.sort((a, b) => a.time - b.time);
    } catch (error) {
      console.error('Error fetching upcoming lunar events:', error);
      console.warn('AstroService: Ошибка API, используем моковые данные');
      
      // Генерируем моковые данные в случае ошибки
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + days);
      
      const mockEvents = generateMockEvents()
        .filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= now && eventDate <= end && event.type === 'moon';
        })
        .map(event => ({
          time: new Date(event.date).getTime() / 1000,
          type: event.type,
          title: event.title,
          icon: event.icon,
          phaseName: event.title
        }));
      
      console.log('AstroService: Сгенерировано моковых данных:', mockEvents.length);
      // Сортируем данные по времени
      return mockEvents.sort((a, b) => a.time - b.time);
    }
  }

  /**
   * Получает следующие значимые фазы Луны
   * @param {number} count - Количество фаз для получения
   * @returns {Promise<Array>} Промис с массивом следующих значимых фаз
   */
  async getNextSignificantPhases(count = 4) {
    try {
      console.log(`AstroService: Запрашиваем ${count} следующих значимых лунных фаз`);
      const response = await api.get('/moon/next', {
        params: { count }
      });
      
      // Проверяем, что получены реальные данные
      if (!response.data || response.data.length === 0 || Object.keys(response.data).length === 0) {
        console.warn('AstroService: Получены пустые данные от API, используем моковые данные');
        
        // Генерируем моковые данные
        const now = new Date();
        const mockPhases = [];
        
        // Добавляем новолуния и полнолуния
        const phaseTypes = [
          { type: 'new_moon', title: 'Новолуние', icon: '🌑' },
          { type: 'full_moon', title: 'Полнолуние', icon: '🌕' }
        ];
        
        for (let i = 0; i < count; i++) {
          const phaseDate = new Date(now);
          phaseDate.setDate(phaseDate.getDate() + 14 * (i + 1));
          
          const phaseInfo = phaseTypes[i % 2];
          
          mockPhases.push({
            time: Math.floor(phaseDate.getTime() / 1000),
            type: phaseInfo.type,
            title: phaseInfo.title,
            icon: phaseInfo.icon,
            phaseName: phaseInfo.title
          });
        }
        
        console.log('AstroService: Сгенерировано моковых фаз:', mockPhases.length);
        return mockPhases.sort((a, b) => a.time - b.time);
      }
      
      const phases = response.data.map(phase => ({
        time: new Date(phase.date).getTime() / 1000,
        type: phase.type,
        title: phase.phaseName,
        icon: phase.icon,
        phaseName: phase.phaseName
      }));
      
      // Сортируем данные по времени
      return phases.sort((a, b) => a.time - b.time);
    } catch (error) {
      console.error('Error fetching next significant phases:', error);
      console.warn('AstroService: Ошибка API, используем моковые данные');
      
      // Генерируем моковые данные в случае ошибки
      const now = new Date();
      const mockPhases = [];
      
      // Добавляем новолуния и полнолуния
      const phaseTypes = [
        { type: 'new_moon', title: 'Новолуние', icon: '🌑' },
        { type: 'full_moon', title: 'Полнолуние', icon: '🌕' }
      ];
      
      for (let i = 0; i < count; i++) {
        const phaseDate = new Date(now);
        phaseDate.setDate(phaseDate.getDate() + 14 * (i + 1));
        
        const phaseInfo = phaseTypes[i % 2];
        
        mockPhases.push({
          time: Math.floor(phaseDate.getTime() / 1000),
          type: phaseInfo.type,
          title: phaseInfo.title,
          icon: phaseInfo.icon,
          phaseName: phaseInfo.title
        });
      }
      
      console.log('AstroService: Сгенерировано моковых фаз:', mockPhases.length);
      return mockPhases.sort((a, b) => a.time - b.time);
    }
  }

  /**
   * Получает анализ влияния фаз Луны на рынок биткоина
   * @returns {Promise<Object>} Промис с данными анализа
   */
  async getMoonInfluence() {
    try {
      console.log('AstroService: Запрашиваем анализ влияния фаз луны');
      const response = await api.get('/moon/influence');
      
      // Проверяем, что получены реальные данные
      if (!response.data || Object.keys(response.data).length === 0) {
        console.warn('AstroService: Получены пустые данные от API, используем моковые данные');
        // Возвращаем моковые данные в случае пустого ответа
        return {
          influence: 'neutral',
          description: 'По историческим данным, корреляция между фазами Луны и движением цены биткоина не является устойчивой.',
          disclaimer: 'Данный анализ представлен исключительно в информационных целях и не является инвестиционной рекомендацией.'
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching moon influence analysis:', error);
      console.warn('AstroService: Ошибка API, используем моковые данные');
      
      return {
        influence: 'neutral',
        description: 'По историческим данным, корреляция между фазами Луны и движением цены биткоина не является устойчивой.',
        disclaimer: 'Данный анализ представлен исключительно в информационных целях и не является инвестиционной рекомендацией.'
      };
    }
  }

  // Приватные методы для генерации моковых данных

  /**
   * Получает иконку для сезонного события
   * @param {string} seasonType - Тип сезонного события
   * @returns {string} Иконка
   */
  _getSeasonalIcon(seasonType) {
    const iconMap = {
      'spring_equinox': '🌱',
      'summer_solstice': '☀️',
      'autumn_equinox': '🍂',
      'winter_solstice': '❄️'
    };
    return iconMap[seasonType] || '🌞';
  }

  /**
   * Генерирует моковые солнечные события
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @param {Array} types - Типы событий
   * @returns {Object} Объект с солнечными событиями
   */
  _generateMockSolarEvents(startDate, endDate, types) {
    console.log('🔄 Генерируем mock solar events для периода:', startDate.toISOString(), '-', endDate.toISOString());
    
    const mockEvents = generateMockSolarEvents(startDate, endDate, types);
    
    // Группируем события по типам
    const result = {
      seasonal: [],
      solarEclipses: [],
      lunarEclipses: []
    };
    
    mockEvents.forEach(event => {
      const unifiedEvent = {
        time: Math.floor(new Date(event.date).getTime() / 1000),
        type: event.type,
        subtype: event.subtype,
        title: event.title,
        description: event.description,
        icon: event.icon
      };
      
      if (event.subtype === 'solar_eclipse') {
        result.solarEclipses.push({
          ...unifiedEvent,
          magnitude: event.magnitude,
          visibility: event.visibility
        });
      } else if (event.subtype === 'lunar_eclipse') {
        result.lunarEclipses.push({
          ...unifiedEvent,
          magnitude: event.magnitude,
          visibility: event.visibility
        });
      } else {
        result.seasonal.push(unifiedEvent);
      }
    });
    
    console.log('🔄 Mock events результат:', {
      seasonal: result.seasonal.length,
      solarEclipses: result.solarEclipses.length,
      lunarEclipses: result.lunarEclipses.length
    });
    
    return result;
  }

  /**
   * Генерирует моковые сезонные события
   * @param {number} year - Год
   * @returns {Array} Массив сезонных событий
   */
  _generateMockSeasonalEvents(year) {
    const mockEvents = generateMockSeasonalEvents(year);
    
    return mockEvents.map(event => ({
      time: Math.floor(new Date(event.date).getTime() / 1000),
      type: event.type,
      subtype: event.subtype,
      title: event.title,
      description: event.description,
      icon: event.icon
    }));
  }

  /**
   * Генерирует моковые солнечные затмения
   * @param {number} year - Год
   * @returns {Array} Массив солнечных затмений
   */
  _generateMockSolarEclipses(year) {
    const mockEvents = generateMockSolarEclipses(year);
    
    return mockEvents.map(event => ({
      time: Math.floor(new Date(event.date).getTime() / 1000),
      type: 'solar_eclipse',
      eclipseType: event.subtype,
      title: event.title,
      description: event.description,
      icon: event.icon,
      magnitude: event.magnitude,
      visibility: event.visibility
    }));
  }

  /**
   * Генерирует моковые лунные затмения
   * @param {number} year - Год
   * @returns {Array} Массив лунных затмений
   */
  _generateMockLunarEclipses(year) {
    const mockEvents = generateMockLunarEclipses(year);
    
    return mockEvents.map(event => ({
      time: Math.floor(new Date(event.date).getTime() / 1000),
      type: 'lunar_eclipse',
      eclipseType: event.subtype,
      title: event.title,
      description: event.description,
      icon: event.icon,
      magnitude: event.magnitude,
      visibility: event.visibility
    }));
  }
}

// Экспортируем синглтон
export default new AstroService(); 