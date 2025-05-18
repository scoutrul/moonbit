const express = require('express');
const eventsService = require('../services/EventsService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/events
 * @desc Получение всех пользовательских событий
 */
router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    // Если указан диапазон дат, фильтруем по нему
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ 
          error: 'Неверный формат даты',
          message: 'Используйте формат ISO 8601' 
        });
      }
      
      const events = await eventsService.getEventsByDateRange(start, end);
      return res.json(events);
    }
    
    // Иначе возвращаем все события
    const events = await eventsService.getAllEvents();
    res.json(events);
  } catch (error) {
    logger.error('Ошибка при получении событий:', error);
    res.status(500).json({ 
      error: 'Не удалось получить данные о событиях',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/events/:id
 * @desc Получение события по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await eventsService.getEventById(parseInt(id));
    
    if (!event) {
      return res.status(404).json({ 
        error: 'Событие не найдено',
        message: `Событие с ID ${id} не существует` 
      });
    }
    
    res.json(event);
  } catch (error) {
    logger.error(`Ошибка при получении события с ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Не удалось получить данные о событии',
      message: error.message 
    });
  }
});

/**
 * @route POST /api/events
 * @desc Создание нового события
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, date, type, color, icon } = req.body;
    
    // Проверка обязательных полей
    if (!title || !date || !type) {
      return res.status(400).json({ 
        error: 'Не все обязательные поля заполнены',
        message: 'Необходимо указать title, date и type' 
      });
    }
    
    // Проверка даты
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ 
        error: 'Неверный формат даты',
        message: 'Используйте формат ISO 8601' 
      });
    }
    
    const event = await eventsService.createEvent({
      title,
      description,
      date,
      type,
      color,
      icon
    });
    
    res.status(201).json(event);
  } catch (error) {
    logger.error('Ошибка при создании события:', error);
    res.status(500).json({ 
      error: 'Не удалось создать событие',
      message: error.message 
    });
  }
});

/**
 * @route PUT /api/events/:id
 * @desc Обновление события
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, type, color, icon } = req.body;
    
    // Проверка обязательных полей
    if (!title || !date || !type) {
      return res.status(400).json({ 
        error: 'Не все обязательные поля заполнены',
        message: 'Необходимо указать title, date и type' 
      });
    }
    
    // Проверка даты
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ 
        error: 'Неверный формат даты',
        message: 'Используйте формат ISO 8601' 
      });
    }
    
    const event = await eventsService.updateEvent(parseInt(id), {
      title,
      description,
      date,
      type,
      color,
      icon
    });
    
    res.json(event);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ 
        error: 'Событие не найдено',
        message: error.message 
      });
    }
    
    logger.error(`Ошибка при обновлении события с ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Не удалось обновить событие',
      message: error.message 
    });
  }
});

/**
 * @route DELETE /api/events/:id
 * @desc Удаление события
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await eventsService.deleteEvent(parseInt(id));
    
    res.json({ success: true, message: `Событие с ID ${id} успешно удалено` });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ 
        error: 'Событие не найдено',
        message: error.message 
      });
    }
    
    logger.error(`Ошибка при удалении события с ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Не удалось удалить событие',
      message: error.message 
    });
  }
});

module.exports = router; 