import express from 'express';
import cors from 'cors';
import path from 'path';
import logger from './utils/logger.js';
import config from './config/index.js';
import { requestLogger, errorHandler, notFoundHandler } from './utils/middlewares.js';
import bitcoinRoutes from './routes/bitcoin.js';
import moonRoutes from './routes/moon.js';
import astroRoutes from './routes/astro.js';
import eventsRoutes from './routes/events.js';
import economicRoutes from './routes/economic.js';
import { dataSyncService } from './services/DataSyncService.js';
import { fileURLToPath } from 'url';

// Получение пути текущего файла в ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  logger.info('Запуск сервера');
  logger.info(`Режим: ${config.server.env}`);
  logger.info('Создание express app');
  const app = express();

  // Global middlewares
  app.use(
    cors({
      origin: config.cors.origin,
      optionsSuccessStatus: 200,
    })
  );
  app.use(express.json());
  app.use(requestLogger);

  // API маршруты
  logger.info('Регистрация API маршрутов');
  app.use('/api/bitcoin', bitcoinRoutes);
  app.use('/api/moon', moonRoutes);
  app.use('/api/astro', astroRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/economic', economicRoutes);

  // Documentation
  app.get('/api/docs', (req, res) => {
    res.sendFile(path.join(__dirname, '../docs/api.html'));
  });
  
  // Middleware для API-запросов, если маршрут не найден
  app.use('/api', (req, res, next) => {
    logger.warn('Запрос к несуществующему API маршруту', {
      url: req.originalUrl,
      method: req.method,
    });
    
    res.status(404).json({
      message: 'API маршрут не найден',
      status: 404,
    });
  });

  // Обработка статических файлов только в production
  const isProduction = config.server.env === 'production';
  
  if (isProduction) {
    logger.info('Настройка статичных файлов для production');
    
    const clientDistPath = path.join(__dirname, '../../client/dist');
    const clientIndexPath = path.join(clientDistPath, 'index.html');
    
    // Проверяем существование директории и файла
    const fs = await import('fs');
    if (fs.existsSync(clientDistPath) && fs.existsSync(clientIndexPath)) {
      app.use(express.static(clientDistPath));
      
      // Все остальные запросы (не API) отправляем на клиентское приложение
      app.get('*', (req, res) => {
        res.sendFile(clientIndexPath);
      });
      
      logger.info('Статические файлы клиента настроены успешно');
    } else {
      logger.warn('Директория клиента не найдена:', clientDistPath);
      logger.warn('Режим production активен, но статические файлы не доступны');
      
      // Если статические файлы не найдены, обрабатываем 404 для всех оставшихся маршрутов
      app.use(notFoundHandler);
    }
  } else {
    logger.info('Режим разработки: статические файлы клиента не используются');
    
    // В режиме разработки обрабатываем 404 для всех оставшихся маршрутов
    app.use(notFoundHandler);
  }

  // Обработка ошибок
  app.use(errorHandler);

  // Запуск сервера
  app.listen(config.server.port, () => {
    logger.info(`Сервер запущен на порту ${config.server.port} (env: ${config.server.env})`);
    // Запуск периодического обновления данных
    logger.info('Инициализация сервиса синхронизации данных');
    dataSyncService.initialize();
  });
} catch (e) {
  logger.error('FATAL ERROR при запуске сервера:', e);
  process.exit(1);
}
