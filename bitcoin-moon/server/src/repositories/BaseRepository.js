import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import { fileURLToPath } from 'url';

// Получение пути текущего файла в ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Базовый класс для всех репозиториев
 * Предоставляет общие методы для работы с кэшем
 */
class BaseRepository {
  constructor(cacheFileName) {
    this.cacheDir = config.paths.cache;
    this.cacheFile = path.join(this.cacheDir, cacheFileName);

    // Проверяем/создаем директорию для кэша
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Загружает кэш из файла или возвращает значение по умолчанию
   * @param {Object} defaultValue - Значение по умолчанию
   * @returns {Object} Загруженные данные или значение по умолчанию
   */
  loadCache(defaultValue) {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error(`Ошибка при загрузке кэша из ${this.cacheFile}`, { error });
    }

    return defaultValue;
  }

  /**
   * Сохраняет данные в кэш
   * @param {Object} data - Данные для сохранения
   */
  saveCache(data) {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      logger.error(`Ошибка при сохранении кэша в ${this.cacheFile}`, { error });
    }
  }

  /**
   * Проверяет актуальность кэша
   * @param {Object} cache - Объект кэша с полем last_updated
   * @param {number} maxAgeMinutes - Максимальный возраст кэша в минутах
   * @returns {boolean} true, если кэш актуален, false - если устарел
   */
  isCacheValid(cache, maxAgeMinutes) {
    if (!cache || !cache.last_updated) {
      return false;
    }

    const cacheDate = new Date(cache.last_updated);
    const now = new Date();
    const diffMinutes = (now - cacheDate) / 1000 / 60;

    return diffMinutes < maxAgeMinutes;
  }
}

export default BaseRepository;
