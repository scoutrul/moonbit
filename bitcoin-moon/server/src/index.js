const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const config = require('./utils/config');
const { requestLogger, errorHandler, notFoundHandler } = require('./utils/middlewares');

// Роуты
const bitcoinRoutes = require('./routes/bitcoin');
const moonRoutes = require('./routes/moon');
const astroRoutes = require('./routes/astro');
const eventsRoutes = require('./routes/events');

// Инициализация сервисов
const DataSyncService = require('./services/DataSyncService');

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
  logger.info(`Сервер запущен на порту ${config.server.port}`, { 
    port: config.server.port,
    env: config.server.env
  });
  
  // Запуск периодического обновления данных
  DataSyncService.initialize();
}); 