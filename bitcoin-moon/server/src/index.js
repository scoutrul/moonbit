try {
  console.log('1. Импорт express');
  const express = require('express');
  console.log('2. Импорт cors');
  const cors = require('cors');
  console.log('3. Импорт path');
  const path = require('path');
  console.log('4. Импорт logger');
  const logger = require('./utils/logger');
  console.log('5. Импорт config');
  const config = require('./utils/config');
  console.log('6. Импорт middlewares');
  const { requestLogger, errorHandler, notFoundHandler } = require('./utils/middlewares');
  console.log('7. Импорт роутов');
  const bitcoinRoutes = require('./routes/bitcoin');
  const moonRoutes = require('./routes/moon');
  const astroRoutes = require('./routes/astro');
  const eventsRoutes = require('./routes/events');
  console.log('8. Импорт DataSyncService');
  const DataSyncService = require('./services/DataSyncService');
  console.log('9. Создание express app');
  const app = express();

  // Global middlewares
  app.use(cors({
    origin: config.cors.origin,
    optionsSuccessStatus: 200
  }));
  app.use(express.json());
  app.use(requestLogger);

  // API маршруты
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
    console.log(`Сервер запущен на порту ${config.server.port} (env: ${config.server.env})`);
    // Запуск периодического обновления данных
    DataSyncService.initialize();
  });
} catch (e) {
  console.error('FATAL ERROR при запуске сервера:', e);
  process.exit(1);
} 