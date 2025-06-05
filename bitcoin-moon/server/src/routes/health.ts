import { Router, Request, Response } from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types/types';
import { ILogger } from '../types/interfaces';

const router = Router();

// Получаем зависимости из контейнера
const logger = container.get<ILogger>(TYPES.Logger);

/**
 * GET /api/health
 * Проверка состояния сервера и зависимостей
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        server: true,
        memory: true
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        unit: 'MB'
      }
    };

    // Проверяем использование памяти
    const memoryUsagePercent = (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100;
    healthStatus.services.memory = memoryUsagePercent < 90; // Если меньше 90% - OK

    // Определяем общий статус
    const allServicesHealthy = Object.values(healthStatus.services).every(service => service === true);
    healthStatus.status = allServicesHealthy ? 'healthy' : 'degraded';

    // Возвращаем 200 для healthy/degraded, 503 для unhealthy
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    logger.debug('Health check выполнен', { 
      status: healthStatus.status, 
      services: healthStatus.services,
      memory: healthStatus.memory 
    });
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Ошибка health check', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error during health check'
    });
  }
});

/**
 * GET /api/health/ready
 * Проверка готовности сервера к обработке запросов
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Проверяем что сервер готов принимать запросы
    const readinessChecks = {
      server: true,
      uptime: process.uptime() > 5 // Сервер работает больше 5 секунд
    };

    const isReady = Object.values(readinessChecks).every(check => check === true);
    
    const response = {
      ready: isReady,
      timestamp: new Date().toISOString(),
      checks: readinessChecks,
      uptime: process.uptime()
    };

    res.status(isReady ? 200 : 503).json(response);
  } catch (error) {
    logger.error('Ошибка readiness check', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    res.status(500).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: 'Internal server error during readiness check'
    });
  }
});

/**
 * GET /api/health/live
 * Liveness probe - просто проверяет что сервер отвечает
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router; 