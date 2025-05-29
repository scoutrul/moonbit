import express from 'express';
import economicController from '../controllers/EconomicController.js';

const router = express.Router();

router.get('/upcoming', economicController.getUpcomingEconomicEvents);
router.get('/by-importance', economicController.getEventsByImportance);
router.get('/period', economicController.getEventsForPeriod);

export default router;