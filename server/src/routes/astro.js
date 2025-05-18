const express = require('express');
const astroService = require('../services/AstroService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/astro/events
 * @desc Получение астрологических событий
 * @param {string} start - Начальная дата (ISO формат)
 * @param {string} end - Конечная дата (ISO формат)
 */
router.get('/events', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    let startDate = start ? new Date(start) : new Date();
    let endDate = end ? new Date(end) : null;
    
    // Проверка валидности дат
    if (start && isNaN(startDate.getTime())) {
      return res.status(400).json({ 
        error: 'Неверный формат начальной даты',
        message: 'Используйте формат ISO 8601' 
      });
    }
    
    if (end && isNaN(endDate.getTime())) {
      return res.status(400).json({ 
        error: 'Неверный формат конечной даты',
        message: 'Используйте формат ISO 8601' 
      });
    }
    
    const events = await astroService.getAstroEvents(startDate, endDate);
    res.json(events);
  } catch (error) {
    logger.error('Ошибка при получении астрологических событий:', error);
    res.status(500).json({ 
      error: 'Не удалось получить данные о астрологических событиях',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/astro/upcoming
 * @desc Получение предстоящих астрологических событий
 * @param {number} limit - Количество событий
 */
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Проверка валидности параметра limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({ 
        error: 'Неверный параметр limit',
        message: 'limit должен быть положительным числом' 
      });
    }
    
    const events = await astroService.getUpcomingEvents(limitNum);
    res.json(events);
  } catch (error) {
    logger.error('Ошибка при получении предстоящих астрологических событий:', error);
    res.status(500).json({ 
      error: 'Не удалось получить данные о предстоящих астрологических событиях',
      message: error.message 
    });
  }
});

module.exports = router; 