import express from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types/types';
import { AstroController } from '../controllers/AstroController';

const router = express.Router();
const astroController = container.get<AstroController>(TYPES.AstroController);

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

/**
 * @route GET /api/astro/seasonal
 * @description Получить сезонные солнечные события (солнцестояния и равноденствия)
 * @param {number} year - Год для расчета (по умолчанию текущий)
 * @access Public
 */
router.get('/seasonal', astroController.getSeasonalEvents.bind(astroController));

/**
 * @route GET /api/astro/solar-eclipses
 * @description Получить солнечные затмения
 * @param {number} year - Год для расчета (по умолчанию текущий)
 * @access Public
 */
router.get('/solar-eclipses', astroController.getSolarEclipses.bind(astroController));

/**
 * @route GET /api/astro/lunar-eclipses
 * @description Получить лунные затмения
 * @param {number} year - Год для расчета (по умолчанию текущий)
 * @access Public
 */
router.get('/lunar-eclipses', astroController.getLunarEclipses.bind(astroController));

/**
 * @route GET /api/astro/solar-events
 * @description Получить все солнечные события для диапазона дат
 * @param {string} startDate - Начальная дата (ISO string)
 * @param {string} endDate - Конечная дата (ISO string)
 * @param {string} types - Типы событий через запятую: seasonal,solar_eclipse,lunar_eclipse
 * @access Public
 */
router.get('/solar-events', astroController.getAllSolarEvents.bind(astroController));

/**
 * @route GET /api/astro/solar-cache/stats
 * @description Получить статистику кэша солнечных событий
 * @access Public
 */
router.get('/solar-cache/stats', astroController.getSolarCacheStats.bind(astroController));

/**
 * @route DELETE /api/astro/solar-cache
 * @description Очистить кэш солнечных событий
 * @access Public
 */
router.delete('/solar-cache', astroController.clearSolarCache.bind(astroController));

export default router; 