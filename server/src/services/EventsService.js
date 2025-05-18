const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Сервис для работы с пользовательскими событиями
 */
class EventsService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/events.db');
    this.db = null;
    this.initialized = false;
    
    // Создаем директорию для базы данных, если не существует
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  /**
   * Инициализация базы данных
   */
  async initialize() {
    if (this.initialized) return;
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Ошибка при подключении к базе данных:', err);
          reject(err);
          return;
        }
        
        // Создаем таблицу событий, если не существует
        this.db.run(`
          CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            color TEXT,
            icon TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            logger.error('Ошибка при создании таблицы событий:', err);
            reject(err);
            return;
          }
          
          this.initialized = true;
          logger.info('База данных событий инициализирована');
          resolve();
        });
      });
    });
  }

  /**
   * Получение всех событий
   */
  async getAllEvents() {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM events ORDER BY date', [], (err, rows) => {
        if (err) {
          logger.error('Ошибка при получении событий:', err);
          reject(err);
          return;
        }
        
        resolve(rows);
      });
    });
  }

  /**
   * Получение событий в заданном диапазоне дат
   * @param {string} startDate - Начальная дата в формате ISO
   * @param {string} endDate - Конечная дата в формате ISO
   */
  async getEventsByDateRange(startDate, endDate) {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM events WHERE date >= ? AND date <= ? ORDER BY date',
        [startDate, endDate],
        (err, rows) => {
          if (err) {
            logger.error('Ошибка при получении событий по диапазону дат:', err);
            reject(err);
            return;
          }
          
          resolve(rows);
        }
      );
    });
  }

  /**
   * Получение события по ID
   * @param {number} id - ID события
   */
  async getEventById(id) {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
        if (err) {
          logger.error(`Ошибка при получении события с ID ${id}:`, err);
          reject(err);
          return;
        }
        
        resolve(row);
      });
    });
  }

  /**
   * Создание нового события
   * @param {Object} event - Данные события
   */
  async createEvent(event) {
    await this.initialize();
    
    const { title, description, date, type, color, icon } = event;
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO events (title, description, date, type, color, icon)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description || '', date, type, color || '#3b82f6', icon || 'default'],
        function(err) {
          if (err) {
            logger.error('Ошибка при создании события:', err);
            reject(err);
            return;
          }
          
          logger.debug(`Создано новое событие с ID ${this.lastID}`);
          resolve({
            id: this.lastID,
            ...event
          });
        }
      );
    });
  }

  /**
   * Обновление события
   * @param {number} id - ID события
   * @param {Object} event - Данные для обновления
   */
  async updateEvent(id, event) {
    await this.initialize();
    
    const { title, description, date, type, color, icon } = event;
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE events 
         SET title = ?, description = ?, date = ?, type = ?, color = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [title, description || '', date, type, color || '#3b82f6', icon || 'default', id],
        function(err) {
          if (err) {
            logger.error(`Ошибка при обновлении события с ID ${id}:`, err);
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            const notFoundError = new Error(`Событие с ID ${id} не найдено`);
            notFoundError.statusCode = 404;
            reject(notFoundError);
            return;
          }
          
          logger.debug(`Обновлено событие с ID ${id}`);
          resolve({
            id,
            ...event
          });
        }
      );
    });
  }

  /**
   * Удаление события
   * @param {number} id - ID события
   */
  async deleteEvent(id) {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
        if (err) {
          logger.error(`Ошибка при удалении события с ID ${id}:`, err);
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          const notFoundError = new Error(`Событие с ID ${id} не найдено`);
          notFoundError.statusCode = 404;
          reject(notFoundError);
          return;
        }
        
        logger.debug(`Удалено событие с ID ${id}`);
        resolve({ id });
      });
    });
  }
}

// Создаем синглтон
const eventsService = new EventsService();

module.exports = eventsService; 