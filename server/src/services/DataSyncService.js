const cron = require('node-cron');
const BitcoinService = require('./BitcoinService');
const MoonService = require('./MoonService');
const AstroService = require('./AstroService');
const logger = require('../utils/logger');

/**
 * Сервис для периодической синхронизации данных из внешних API
 */
class DataSyncService {
  /**
   * Инициализация сервиса и запуск задач
   */
  static initialize() {
    // Запускаем задачи сразу при старте сервера
    this.syncBitcoinData();
    this.syncMoonData();
    this.syncAstroData();
    
    // Настраиваем периодическое обновление данных
    this.setupCronJobs();
    
    logger.info('DataSyncService инициализирован');
  }
  
  /**
   * Настройка расписания для периодического обновления данных
   */
  static setupCronJobs() {
    // Обновление данных о биткоине каждую минуту
    cron.schedule('* * * * *', async () => {
      try {
        await this.syncBitcoinData();
        logger.info('Данные о биткоине обновлены');
      } catch (error) {
        logger.error('Ошибка при обновлении данных о биткоине:', error);
      }
    });
    
    // Обновление данных о фазах Луны раз в день
    cron.schedule('0 0 * * *', async () => {
      try {
        await this.syncMoonData();
        logger.info('Данные о фазах Луны обновлены');
      } catch (error) {
        logger.error('Ошибка при обновлении данных о фазах Луны:', error);
      }
    });
    
    // Обновление астрологических данных раз в день
    cron.schedule('0 1 * * *', async () => {
      try {
        await this.syncAstroData();
        logger.info('Астрологические данные обновлены');
      } catch (error) {
        logger.error('Ошибка при обновлении астрологических данных:', error);
      }
    });
  }
  
  /**
   * Синхронизация данных о биткоине
   */
  static async syncBitcoinData() {
    try {
      await BitcoinService.updateCurrentPrice();
      await BitcoinService.updateCandlestickData();
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации данных о биткоине:', error);
      return false;
    }
  }
  
  /**
   * Синхронизация данных о фазах Луны
   */
  static async syncMoonData() {
    try {
      await MoonService.updateMoonPhases();
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации данных о фазах Луны:', error);
      return false;
    }
  }
  
  /**
   * Синхронизация астрологических данных
   */
  static async syncAstroData() {
    try {
      await AstroService.updateAstroEvents();
      return true;
    } catch (error) {
      logger.error('Ошибка при синхронизации астрологических данных:', error);
      return false;
    }
  }
}

module.exports = DataSyncService; 