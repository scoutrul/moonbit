import express from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types/types';

const router = express.Router();

/**
 * @route GET /api/astro/current
 * @description Получить текущие астрономические данные
 * @access Public
 */
router.get('/current', (req, res) => {
  res.json({
    date: new Date().toISOString(),
    sun: {
      phase: 'day',
      elevation: 45,
      azimuth: 180
    },
    mercury: {
      phase: 'normal',
      retrograde: false
    },
    venus: {
      phase: 'normal',
      retrograde: false
    },
    mars: {
      phase: 'normal',
      retrograde: false
    }
  });
});

/**
 * @route GET /api/astro/events
 * @description Получить астрономические события
 * @param {string} startDate - Начальная дата
 * @param {string} endDate - Конечная дата
 * @access Public
 */
router.get('/events', (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  
  res.json({
    days,
    events: [
      {
        date: new Date().toISOString(),
        type: 'retrograde',
        planet: 'Mercury',
        title: 'Меркурий ретроградный',
        description: 'Меркурий входит в ретроградную фазу',
        icon: 'mercury'
      }
    ]
  });
});

router.get('/planets', (req, res) => {
  res.json({
    planets: [
      {
        name: 'Mercury',
        position: {
          longitude: 150,
          latitude: 0,
          distance: 0.39
        },
        retrograde: true
      },
      {
        name: 'Venus',
        position: {
          longitude: 210,
          latitude: 0,
          distance: 0.72
        },
        retrograde: false
      }
    ]
  });
});

export default router; 