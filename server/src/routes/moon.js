const express = require('express');
const moonService = require('../services/MoonService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/moon/current
 * @desc Получение текущей фазы Луны
 */
router.get('/current', async (req, res) => {
  try {
    const currentPhase = await moonService.getCurrentMoonPhase();
    res.json(currentPhase);
  } catch (error) {
    logger.error('Ошибка при получении текущей фазы Луны:', error);
    res.status(500).json({ 
      error: 'Не удалось получить данные о текущей фазе Луны',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/moon/phases
 * @desc Получение фаз Луны в заданном периоде
 * @param {string} start - Начальная дата (ISO формат)
 * @param {string} end - Конечная дата (ISO формат)
 */
router.get('/phases', async (req, res) => {
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
    
    const phases = await moonService.getMoonPhases(startDate, endDate);
    res.json(phases);
  } catch (error) {
    logger.error('Ошибка при получении фаз Луны:', error);
    res.status(500).json({ 
      error: 'Не удалось получить данные о фазах Луны',
      message: error.message 
    });
  }
});

/**
 * @route GET /api/moon/phase/:date
 * @desc Получение фазы Луны для конкретной даты
 * @param {string} date - Дата в формате ISO
 */
router.get('/phase/:date', async (req, res) => {
  try {
    const dateParam = req.params.date;
    const date = new Date(dateParam);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ 
        error: 'Неверный формат даты',
        message: 'Используйте формат ISO 8601' 
      });
    }
    
    const phase = await moonService.getMoonPhaseForDate(date);
    res.json(phase);
  } catch (error) {
    logger.error('Ошибка при получении фазы Луны для даты:', error);
    res.status(500).json({ 
      error: 'Не удалось получить данные о фазе Луны',
      message: error.message 
    });
  }
});

module.exports = router; 