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
import { dataSyncService } from './services/DataSyncService.js';
import { fileURLToPath } from 'url';

// Получение пути текущего файла в ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  logger.info('Запуск сервера');
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

  // Documentation
  app.get('/api/docs', (req, res) => {
    res.sendFile(path.join(__dirname, '../docs/api.html'));
  });

  // Отдача статичных файлов в production
  if (config.server.env === 'production') {
    logger.info('Настройка статичных файлов для production');
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
  }

  // Обработка несуществующих маршрутов
  app.use(notFoundHandler);

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
