import api from './api';
import { generateMockEvents } from '../utils/mockDataGenerator';

/**
 * Сервис для работы с астрономическими событиями
 */
class AstroService {
  /**
   * Получает астрономические события для указанного периода
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Promise<Array>} Промис с массивом событий
   */
  async getAstroEvents(startDate, endDate) {
    try {
      console.log('AstroService: Запрашиваем астрономические события', { startDate, endDate });
      const response = await api.get('/astro/events', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      // 🔧 ИСПРАВЛЕНИЕ: Проверяем что response.data является массивом
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        console.warn('AstroService: Получены некорректные данные от API (не массив или пустые), используем моковые данные');
        // Генерируем моковые данные, если API вернул некорректные данные
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
            phaseName: event.title,
            date: event.date,  // 🆕 Добавляем date для совместимости с BitcoinChartWithLunarPhases
            subtype: event.title === 'Новолуние' ? 'new_moon' : 'full_moon' // 🆕 Добавляем subtype
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
        phaseName: event.phaseName || event.title,
        date: event.date,  // 🆕 Добавляем date для совместимости с BitcoinChartWithLunarPhases
        subtype: event.title === 'Новолуние' ? 'new_moon' : 'full_moon' // 🆕 Добавляем subtype
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
          phaseName: event.title,
          date: event.date,  // 🆕 Добавляем date для совместимости
          subtype: event.title === 'Новолуние' ? 'new_moon' : 'full_moon' // 🆕 Добавляем subtype
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
}

// Экспортируем синглтон
export default new AstroService(); 