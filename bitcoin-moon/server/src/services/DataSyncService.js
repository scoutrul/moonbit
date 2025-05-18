const logger = require('../utils/logger');
const BitcoinService = require('./BitcoinService');
const MoonService = require('./MoonService');
const AstroService = require('./AstroService');
const EventsService = require('./EventsService');

/**
 * Сервис для синхронизации данных из внешних источников
 * Управляет периодическим обновлением данных
 */
class DataSyncService {
  constructor() {
    this.isInitialized = false;
    this.syncIntervals = {
      bitcoin: null,
      moon: null,
      astro: null,
      events: null
    };
    
    this.syncTimes = {
      bitcoin: parseInt(process.env.BITCOIN_SYNC_MINUTES || '15', 10),
      moon: parseInt(process.env.MOON_SYNC_MINUTES || '60', 10),
      astro: parseInt(process.env.ASTRO_SYNC_MINUTES || '120', 10),
      events: parseInt(process.env.EVENTS_SYNC_MINUTES || '30', 10)
    };
  }

  /**
   * Инициализирует сервис синхронизации
   */
  initialize() {
    if (this.isInitialized) {
      logger.warn('DataSyncService уже был инициализирован');
      return;
    }

    logger.info('Инициализация DataSyncService...');
    
    // Выполняем первоначальную синхронизацию
    this.syncAll()
      .then(() => {
        logger.info('Первоначальная синхронизация завершена');
        
        // Настраиваем периодическую синхронизацию
        this.setupSyncIntervals();
        
        this.isInitialized = true;
      })
      .catch(error => {
        logger.error('Ошибка при первоначальной синхронизации', { error });
      });
  }
  
  /**
   * Настраивает интервалы синхронизации для всех источников данных
   */
  setupSyncIntervals() {
    // Синхронизация данных биткоина
    this.syncIntervals.bitcoin = setInterval(() => {
      this.syncBitcoinData()
        .catch(error => logger.error('Ошибка при синхронизации данных биткоина', { error }));
    }, this.syncTimes.bitcoin * 60 * 1000);
    
    // Синхронизация данных луны
    this.syncIntervals.moon = setInterval(() => {
      this.syncMoonData()
        .catch(error => logger.error('Ошибка при синхронизации данных луны', { error }));
    }, this.syncTimes.moon * 60 * 1000);
    
    // Синхронизация астрологических данных
    this.syncIntervals.astro = setInterval(() => {
      this.syncAstroData()
        .catch(error => logger.error('Ошибка при синхронизации астрологических данных', { error }));
    }, this.syncTimes.astro * 60 * 1000);
    
    // Синхронизация событий
    this.syncIntervals.events = setInterval(() => {
      this.syncEventsData()
        .catch(error => logger.error('Ошибка при синхронизации данных событий', { error }));
    }, this.syncTimes.events * 60 * 1000);
    
    logger.info('Настроены интервалы синхронизации данных', { 
      intervals: {
        bitcoin: `${this.syncTimes.bitcoin} мин`,
        moon: `${this.syncTimes.moon} мин`,
        astro: `${this.syncTimes.astro} мин`,
        events: `${this.syncTimes.events} мин`
      }
    });
  }
  
  /**
   * Синхронизирует все данные
   */
  async syncAll() {
    logger.info('Синхронизация всех данных...');
    
    const startTime = Date.now();
    
    try {
      await Promise.all([
        this.syncBitcoinData(),
        this.syncMoonData(),
        this.syncAstroData(),
        this.syncEventsData()
      ]);
      
      const duration = Date.now() - startTime;
      logger.info(`Синхронизация всех данных завершена за ${duration}мс`);
      
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации всех данных', { error });
      throw error;
    }
  }
  
  /**
   * Синхронизирует данные биткоина
   */
  async syncBitcoinData() {
    logger.info('Синхронизация данных биткоина...');
    const startTime = Date.now();
    
    try {
      await BitcoinService.updatePriceData();
      await BitcoinService.updateHistoricalData();
      
      const duration = Date.now() - startTime;
      logger.info(`Синхронизация данных биткоина завершена за ${duration}мс`);
      
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации данных биткоина', { error });
      throw error;
    }
  }
  
  /**
   * Синхронизирует данные о фазах луны
   */
  async syncMoonData() {
    logger.info('Синхронизация данных луны...');
    const startTime = Date.now();
    
    try {
      await MoonService.updateMoonPhases();
      
      const duration = Date.now() - startTime;
      logger.info(`Синхронизация данных луны завершена за ${duration}мс`);
      
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации данных луны', { error });
      throw error;
    }
  }
  
  /**
   * Синхронизирует астрологические данные
   */
  async syncAstroData() {
    logger.info('Синхронизация астрологических данных...');
    const startTime = Date.now();
    
    try {
      await AstroService.updateAstroData();
      
      const duration = Date.now() - startTime;
      logger.info(`Синхронизация астрологических данных завершена за ${duration}мс`);
      
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации астрологических данных', { error });
      throw error;
    }
  }
  
  /**
   * Синхронизирует данные о событиях
   */
  async syncEventsData() {
    logger.info('Синхронизация данных о событиях...');
    const startTime = Date.now();
    
    try {
      await EventsService.updateEvents();
      
      const duration = Date.now() - startTime;
      logger.info(`Синхронизация данных о событиях завершена за ${duration}мс`);
      
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации данных о событиях', { error });
      throw error;
    }
  }
  
  /**
   * Останавливает все синхронизации
   */
  stopAll() {
    logger.info('Остановка всех синхронизаций...');
    
    Object.values(this.syncIntervals).forEach(interval => {
      if (interval) {
        clearInterval(interval);
      }
    });
    
    this.syncIntervals = {
      bitcoin: null,
      moon: null,
      astro: null,
      events: null
    };
    
    this.isInitialized = false;
    
    logger.info('Все синхронизации остановлены');
  }
}

// Синглтон экземпляр сервиса
module.exports = new DataSyncService(); 