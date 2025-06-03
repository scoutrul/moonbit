import express from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types/types';

const router = express.Router();

// Пока заглушка для маршрутов астрономических данных
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