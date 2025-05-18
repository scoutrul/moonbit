const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const logger = require('./utils/logger');
const { requestLogger, errorHandler, notFoundHandler } = require('./utils/middlewares');

// Роуты
const bitcoinRoutes = require('./routes/bitcoin');
const moonRoutes = require('./routes/moon');
const astroRoutes = require('./routes/astro');
const eventsRoutes = require('./routes/events');

// Инициализация сервисов
const DataSyncService = require('./services/DataSyncService');

const app = express();
const PORT = process.env.PORT || 5000;

// Global middlewares
app.use(cors());
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
if (process.env.NODE_ENV === 'production') {
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
app.listen(PORT, () => {
  logger.info(`Сервер запущен на порту ${PORT}`, { port: PORT });
  
  // Запуск периодического обновления данных
  DataSyncService.initialize();
}); 