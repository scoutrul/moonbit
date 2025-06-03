import express from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types/types';

const router = express.Router();

// Пока заглушка для маршрутов луны
router.get('/phase', (req, res) => {
  res.json({
    date: new Date().toISOString(),
    phase: 0.5,
    phaseName: 'Полнолуние'
  });
});

router.get('/phases', (req, res) => {
  const startDate = req.query.startDate || new Date().toISOString();
  const endDate = req.query.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  res.json({
    startDate,
    endDate,
    phases: [
      {
        date: new Date().toISOString(),
        phase: 0.5,
        phaseName: 'Полнолуние'
      }
    ]
  });
});

router.get('/significant', (req, res) => {
  const count = parseInt(req.query.count as string) || 5;
  
  res.json({
    count,
    phases: [
      {
        date: new Date().toISOString(),
        type: 'full',
        phase: 0.5,
        phaseName: 'Полнолуние',
        title: 'Полнолуние',
        icon: 'full-moon'
      }
    ]
  });
});

router.get('/events', (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  
  res.json({
    days,
    events: [
      {
        date: new Date().toISOString(),
        type: 'full',
        phase: 0.5,
        phaseName: 'Полнолуние',
        title: 'Полнолуние',
        icon: 'full-moon'
      }
    ]
  });
});

export default router; 