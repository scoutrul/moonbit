import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { container } from './inversify.config';
import { TYPES } from './types/types';
import { IConfig, IDataSyncService, ILogger } from './types/interfaces';
import bitcoinRoutes from './routes/bitcoin';
import moonRoutes from './routes/moon';
import astroRoutes from './routes/astro';
import eventsRoutes from './routes/events';
import healthRoutes from './routes/health';

// Получаем зависимости из контейнера
const config = container.get<IConfig>(TYPES.Config);
const logger = container.get<ILogger>(TYPES.Logger);
const dataSyncService = container.get<IDataSyncService>(TYPES.DataSyncService);

// Создаем экземпляр приложения Express
const app = express();

// Настраиваем middleware
app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Регистрируем маршруты
app.use('/api/health', healthRoutes);
app.use('/api/bitcoin', bitcoinRoutes);
app.use('/api/moon', moonRoutes);
app.use('/api/astro', astroRoutes);
app.use('/api/events', eventsRoutes);

// Добавляем корневой маршрут для базовой проверки
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    name: 'MoonBit API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/health',
      '/api/bitcoin',
      '/api/moon', 
      '/api/astro',
      '/api/events'
    ]
  });
});

// Обработка ошибок
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Ошибка запроса:', { error: err.message, stack: err.stack });
  
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: config.environment === 'development' ? err.message : undefined
  });
});

// Запускаем сервер
const server = app.listen(config.port, () => {
  logger.info(`Сервер запущен на порту ${config.port} в режиме ${config.environment}`);
  
  // Запускаем сервисы синхронизации данных
  dataSyncService.start();
  
  logger.info('Сервисы синхронизации данных запущены');
});

// Обработка завершения работы приложения
process.on('SIGTERM', () => {
  logger.info('SIGTERM получен, завершение работы сервера');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT получен, завершение работы сервера');
  gracefulShutdown();
});

/**
 * Корректное завершение работы сервера
 */
function gracefulShutdown() {
  logger.info('Запуск корректного завершения работы');
  
  // Останавливаем сервисы синхронизации
  dataSyncService.stop();
  
  // Закрываем HTTP сервер
  server.close(() => {
    logger.info('HTTP сервер закрыт');
    process.exit(0);
  });
  
  // Устанавливаем таймаут на закрытие сервера
  setTimeout(() => {
    logger.error('Не удалось корректно завершить работу, принудительное завершение');
    process.exit(1);
  }, 10000);
}

export default app; 