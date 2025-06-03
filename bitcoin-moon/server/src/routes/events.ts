import express from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types/types';

const router = express.Router();

// Пока заглушка для маршрутов событий
router.get('/upcoming', (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  
  res.json({
    days,
    events: [
      {
        date: new Date().toISOString(),
        type: 'moon',
        title: 'Полнолуние',
        description: 'Полнолуние в Водолее',
        icon: 'full-moon'
      },
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'astro',
        title: 'Меркурий ретроградный',
        description: 'Меркурий входит в ретроградную фазу',
        icon: 'mercury'
      }
    ]
  });
});

router.get('/historical', (req, res) => {
  const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = req.query.endDate || new Date().toISOString();
  
  res.json({
    startDate,
    endDate,
    events: [
      {
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'moon',
        title: 'Новолуние',
        description: 'Новолуние в Раке',
        icon: 'new-moon'
      }
    ]
  });
});

export default router; 