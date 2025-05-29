import express from 'express';
import eclipseController from '../controllers/eclipseController.js';

const router = express.Router();

router.get('/upcoming', eclipseController.getUpcomingEclipses);
router.get('/year/:year', eclipseController.getEclipsesForYear);

export default router;