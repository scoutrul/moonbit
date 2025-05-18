const fetch = require('node-fetch');
const logger = require('../utils/logger');

/**
 * Сервис для работы с данными о фазах Луны
 */
class MoonService {
  constructor() {
    // Кэш для данных о фазах Луны
    this.moonPhasesCache = [];
    this.lastUpdate = null;
  }

  /**
   * Получение фазы Луны на определенную дату
   * @param {Date} date - Дата для получения фазы Луны
   */
  async getMoonPhaseForDate(date = new Date()) {
    await this.updateMoonPhasesIfNeeded();
    
    const targetDate = new Date(date);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    const moonPhase = this.moonPhasesCache.find(phase => phase.date.includes(dateStr));
    return moonPhase || { 
      date: dateStr, 
      phase: 'unknown', 
      emoji: '🌑',
      illumination: 0
    };
  }

  /**
   * Получение всех фаз Луны в заданном периоде
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   */
  async getMoonPhases(startDate = new Date(), endDate = null) {
    // Если конечная дата не указана, устанавливаем на 30 дней вперед
    if (!endDate) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
    }
    
    await this.updateMoonPhasesIfNeeded();
    
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    return this.moonPhasesCache.filter(phase => {
      const phaseDate = phase.date.split('T')[0];
      return phaseDate >= start && phaseDate <= end;
    });
  }

  /**
   * Получение текущей фазы Луны
   */
  async getCurrentMoonPhase() {
    return this.getMoonPhaseForDate(new Date());
  }

  /**
   * Обновление данных о фазах Луны
   */
  async updateMoonPhases() {
    try {
      // Текущая дата
      const today = new Date();
      // Начало периода - 30 дней назад
      const startDate = new Date();
      startDate.setDate(today.getDate() - 30);
      // Конец периода - 90 дней вперед
      const endDate = new Date();
      endDate.setDate(today.getDate() + 90);
      
      // Получаем данные с API
      const response = await fetch(`https://www.farmsense.net/api/astro/moon-phase/?d=${startDate.getTime() / 1000},${endDate.getTime() / 1000}`);
      const data = await response.json();
      
      // Преобразуем данные
      const processedData = data.map(item => {
        // Определение фазы Луны на основе illumination
        const illum = parseFloat(item.illumination);
        const phase = this.getMoonPhaseFromIllumination(illum, item.phase_name);
        
        return {
          date: new Date(item.date * 1000).toISOString(),
          phase: phase.name,
          emoji: phase.emoji,
          illumination: illum
        };
      });
      
      this.moonPhasesCache = processedData;
      this.lastUpdate = Date.now();
      
      logger.debug('Обновлены данные о фазах Луны');
      return processedData;
    } catch (error) {
      logger.error('Ошибка при обновлении данных о фазах Луны:', error);
      // Если у нас нет cached данных и API недоступен, создаем мок-данные
      if (this.moonPhasesCache.length === 0) {
        this.createMockMoonPhases();
      }
      throw error;
    }
  }

  /**
   * Проверяет, нужно ли обновить кэш фаз Луны
   */
  async updateMoonPhasesIfNeeded() {
    if (this.shouldUpdateCache()) {
      await this.updateMoonPhases();
    }
    return this.moonPhasesCache;
  }

  /**
   * Проверяет, нужно ли обновить кэш
   */
  shouldUpdateCache() {
    if (!this.lastUpdate) return true;
    
    // Обновляем данные о фазах Луны раз в день
    const hoursPassed = (Date.now() - this.lastUpdate) / (1000 * 60 * 60);
    return hoursPassed >= 24;
  }

  /**
   * Получает название фазы Луны на основе illumination
   * @param {number} illumination - Освещенность Луны (0-1)
   * @param {string} phaseName - Название фазы из API
   */
  getMoonPhaseFromIllumination(illumination, phaseName) {
    // Предопределенные фазы
    const phases = [
      { name: 'new_moon', emoji: '🌑', illumination: 0 },
      { name: 'waxing_crescent', emoji: '🌒', illumination: 0.25 },
      { name: 'first_quarter', emoji: '🌓', illumination: 0.5 },
      { name: 'waxing_gibbous', emoji: '🌔', illumination: 0.75 },
      { name: 'full_moon', emoji: '🌕', illumination: 1 },
      { name: 'waning_gibbous', emoji: '🌖', illumination: 0.75 },
      { name: 'last_quarter', emoji: '🌗', illumination: 0.5 },
      { name: 'waning_crescent', emoji: '🌘', illumination: 0.25 }
    ];
    
    // Если у нас есть точное название фазы из API, используем его
    if (phaseName) {
      const matchedPhase = phases.find(p => 
        p.name.toLowerCase().includes(phaseName.toLowerCase()) ||
        phaseName.toLowerCase().includes(p.name.toLowerCase())
      );
      
      if (matchedPhase) return matchedPhase;
    }
    
    // Иначе определяем по illumination
    if (illumination >= 0.95) return phases[4]; // full_moon
    if (illumination <= 0.05) return phases[0]; // new_moon
    
    if (illumination < 0.5) {
      // Растущая Луна
      return illumination < 0.25 ? phases[1] : phases[2];
    } else {
      // Убывающая Луна
      return illumination > 0.75 ? phases[5] : phases[6];
    }
  }

  /**
   * Создает мок-данные для фаз Луны, если API недоступен
   */
  createMockMoonPhases() {
    const today = new Date();
    const phases = [];
    
    for (let i = -30; i <= 90; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      // Рассчитываем фазу Луны по приблизительной формуле
      // Лунный цикл - около 29.53 дней
      const lunarAge = (i % 29.53) / 29.53;
      const illumination = Math.sin(lunarAge * Math.PI);
      
      const phase = this.getMoonPhaseFromIllumination(Math.abs(illumination));
      
      phases.push({
        date: date.toISOString(),
        phase: phase.name,
        emoji: phase.emoji,
        illumination: Math.abs(illumination)
      });
    }
    
    this.moonPhasesCache = phases;
    this.lastUpdate = Date.now();
    
    logger.debug('Созданы мок-данные для фаз Луны');
    return phases;
  }
}

// Создаем синглтон
const moonService = new MoonService();

module.exports = moonService; 