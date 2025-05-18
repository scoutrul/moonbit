const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const logger = require('./utils/logger');

// Роуты
const bitcoinRoutes = require('./routes/bitcoin');
const moonRoutes = require('./routes/moon');
const astroRoutes = require('./routes/astro');
const eventsRoutes = require('./routes/events');

// Инициализация сервисов
const DataSyncService = require('./services/DataSyncService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Логирование HTTP запросов
app.use((req, res, next) => {
  const start = Date.now();
  
  // Логируем запрос после завершения
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.http(req, res, responseTime);
  });
  
  next();
});

// API маршруты
app.use('/api/bitcoin', bitcoinRoutes);
app.use('/api/moon', moonRoutes);
app.use('/api/astro', astroRoutes);
app.use('/api/events', eventsRoutes);

// Отдача статичных файлов в production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  
  // Запуск периодического обновления данных
  DataSyncService.initialize();
}); 