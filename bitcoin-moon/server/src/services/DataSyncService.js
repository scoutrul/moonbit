const fs = require('fs');
const logger = require('../utils/logger');
const bitcoinService = require('./BitcoinService');
const moonService = require('./MoonService');
const astroService = require('./AstroService');
const eventsService = require('./EventsService');
const config = require('../utils/config');

/**
 * Сервис синхронизации данных
 * Отвечает за координацию обновления данных из всех сервисов
 */
class DataSyncService {
  constructor() {
    this.initialized = false;
    this.intervalIds = {
      bitcoin: null,
      moon: null,
      astro: null,
      events: null
    };
    
    this.intervalTimes = {
      bitcoin: 5 * 60 * 1000,   // 5 минут
      moon: 60 * 60 * 1000,    // 1 час
      astro: 12 * 60 * 60 * 1000, // 12 часов
      events: 30 * 60 * 1000    // 30 минут
    };
    
    // Создаем необходимые директории при инициализации
    this.createDirectories();
  }
  
  /**
   * Создает необходимые директории
   */
  createDirectories() {
    const directories = [
      config.paths.logs,
      config.paths.cache
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
          logger.info(`Создана директория: ${dir}`);
        } catch (error) {
          logger.error(`Ошибка при создании директории ${dir}:`, { error });
        }
      }
    });
  }
  
  /**
   * Инициализирует сервис синхронизации данных
   */
  initialize() {
    if (this.initialized) {
      logger.info('Сервис синхронизации данных уже инициализирован');
      return;
    }
    
    logger.info('Инициализация сервиса синхронизации данных');
    
    // Выполняем начальную синхронизацию всех данных
    this.syncAll()
      .then(() => {
        logger.info('Начальная синхронизация данных успешно завершена');
        
        // Запускаем регулярную синхронизацию данных
        this.startPeriodicSync();
        
        this.initialized = true;
      })
      .catch(error => {
        logger.error('Ошибка при начальной синхронизации данных', { error });
      });
  }
  
  /**
   * Запускает периодическую синхронизацию данных по расписанию
   */
  startPeriodicSync() {
    logger.info('Запуск периодической синхронизации данных');
    
    // Bitcoin данные - каждые 5 минут
    this.intervalIds.bitcoin = setInterval(() => {
      this.syncBitcoinData()
        .catch(error => logger.error('Ошибка при синхронизации данных биткоина', { error }));
    }, this.intervalTimes.bitcoin);
    
    // Данные о луне - каждый час
    this.intervalIds.moon = setInterval(() => {
      this.syncMoonData()
        .catch(error => logger.error('Ошибка при синхронизации данных луны', { error }));
    }, this.intervalTimes.moon);
    
    // Астрологические данные - каждые 12 часов
    this.intervalIds.astro = setInterval(() => {
      this.syncAstroData()
        .catch(error => logger.error('Ошибка при синхронизации астрологических данных', { error }));
    }, this.intervalTimes.astro);
    
    // События - каждые 30 минут
    this.intervalIds.events = setInterval(() => {
      this.syncEventsData()
        .catch(error => logger.error('Ошибка при синхронизации данных событий', { error }));
    }, this.intervalTimes.events);
    
    logger.info('Периодическая синхронизация данных успешно запущена');
  }
  
  /**
   * Останавливает все синхронизации данных
   */
  stopAll() {
    logger.info('Остановка всех синхронизаций данных');
    
    // Очищаем все интервалы
    Object.keys(this.intervalIds).forEach(key => {
      if (this.intervalIds[key]) {
        clearInterval(this.intervalIds[key]);
        this.intervalIds[key] = null;
      }
    });
    
    logger.info('Все синхронизации данных остановлены');
  }
  
  /**
   * Синхронизирует все данные
   * @returns {Promise<boolean>} Результат синхронизации
   */
  async syncAll() {
    logger.info('Начало полной синхронизации данных');
    
    try {
      // Запускаем синхронизацию всех сервисов параллельно
      await Promise.all([
        this.syncBitcoinData(),
        this.syncMoonData(),
        this.syncAstroData(),
        this.syncEventsData()
      ]);
      
      logger.info('Полная синхронизация данных успешно завершена');
      return true;
    } catch (error) {
      logger.error('Ошибка при полной синхронизации данных', { error });
      return false;
    }
  }
  
  /**
   * Синхронизирует данные о биткоине
   * @returns {Promise<boolean>} Результат синхронизации
   */
  async syncBitcoinData() {
    logger.debug('Синхронизация данных о биткоине');
    
    try {
      // Запускаем обновление текущих цен и исторических данных параллельно
      const [priceData, historicalData] = await Promise.all([
        bitcoinService.updatePriceData(),
        bitcoinService.updateHistoricalData()
      ]);
      
      logger.info('Данные о биткоине успешно синхронизированы', {
        priceDataUpdated: !!priceData,
        historicalDataUpdated: !!historicalData
      });
      
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации данных о биткоине', { error });
      return false;
    }
  }
  
  /**
   * Синхронизирует данные о фазах луны
   * @returns {Promise<boolean>} Результат синхронизации
   */
  async syncMoonData() {
    logger.debug('Синхронизация данных о фазах луны');
    
    try {
      // Обновляем данные о фазах луны
      const moonData = await moonService.updatePhaseData();
      
      logger.info('Данные о фазах луны успешно синхронизированы', {
        dataUpdated: !!moonData
      });
      
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации данных о фазах луны', { error });
      return false;
    }
  }
  
  /**
   * Синхронизирует астрологические данные
   * @returns {Promise<boolean>} Результат синхронизации
   */
  async syncAstroData() {
    logger.debug('Синхронизация астрологических данных');
    
    try {
      // Обновляем астрологические данные
      const astroData = await astroService.updateAstroData();
      
      logger.info('Астрологические данные успешно синхронизированы', {
        dataUpdated: !!astroData
      });
      
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации астрологических данных', { error });
      return false;
    }
  }
  
  /**
   * Синхронизирует данные о событиях
   * @returns {Promise<boolean>} Результат синхронизации
   */
  async syncEventsData() {
    logger.debug('Синхронизация данных о событиях');
    
    try {
      // Обновляем данные о событиях
      const eventsData = await eventsService.updateEvents();
      
      logger.info('Данные о событиях успешно синхронизированы', {
        dataUpdated: !!eventsData
      });
      
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации данных о событиях', { error });
      return false;
    }
  }
}

// Синглтон экземпляр сервиса
module.exports = new DataSyncService(); 