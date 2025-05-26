const fs = require('fs');
const logger = require('../utils/logger');
const bitcoinService = require('./bitcoinService');
const moonService = require('./moonService');
const config = require('../config');

/**
 * Сервис синхронизации данных
 * Упрощенная версия, отвечающая за координацию обновления данных из основных сервисов
 */
class DataSyncService {
  constructor() {
    this.initialized = false;
    this.intervalIds = {
      bitcoin: null,
      moon: null
    };
    
    this.intervalTimes = {
      bitcoin: config.sync.bitcoin,   // 5 минут
      moon: config.sync.moon,         // 1 час
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
    
    // Выполняем начальную синхронизацию основных данных
    this.syncAll()
      .then(() => {
        logger.info('Начальная синхронизация данных успешно завершена');
        
        // В разработке не нужно запускать периодическую синхронизацию
        if (process.env.NODE_ENV !== 'development' && process.env.DISABLE_SYNC !== 'true') {
          this.startPeriodicSync();
        } else {
          logger.info('Периодическая синхронизация отключена в режиме разработки');
        }
        
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
    logger.info('Начало синхронизации основных данных');
    
    try {
      // Запускаем синхронизацию основных сервисов
      await Promise.all([
        this.syncBitcoinData(),
        this.syncMoonData()
      ]);
      
      logger.info('Синхронизация основных данных успешно завершена');
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации данных', { error });
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
      // Запускаем обновление текущих цен и исторических данных
      const priceData = await bitcoinService.updatePriceData();
      
      logger.info('Данные о биткоине успешно синхронизированы', {
        priceDataUpdated: !!priceData
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
}

// Синглтон экземпляр сервиса
module.exports = new DataSyncService(); 