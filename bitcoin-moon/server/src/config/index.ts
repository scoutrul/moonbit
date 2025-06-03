import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { injectable } from 'inversify';
import { IConfig } from '../types/interfaces';

// Получение пути текущего файла в ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем переменные окружения
dotenv.config();

// Проверка наличия обязательных переменных окружения
const requiredEnvVars = [
  'PORT',
  'CORS_ORIGIN',
  'LOG_LEVEL',
  'CACHE_TTL_OHLC',
  'REDIS_URL',
  'COINGECKO_API_KEY',
  'FARMSENSE_API_KEY',
];

// Предупреждения о отсутствующих переменных окружения
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.warn(`Предупреждение: Переменная окружения ${varName} не установлена.`);
  }
}

// Создаем пути к важным директориям
const rootDir = path.resolve(__dirname, '../../');
const logsDir = path.join(rootDir, 'logs');
const cacheDir = path.join(rootDir, 'src/data/cache');

// Создаем директории, если они не существуют
[logsDir, cacheDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Конфигурация сервера, реализующая интерфейс IConfig
 */
@injectable()
export class Config implements IConfig {
  port: number;
  environment: string;
  cors: {
    origin: string | string[];
    methods: string[];
  };
  sync: {
    bitcoin: number;
    moon: number;
    astro: number;
    events: number;
  };
  paths: {
    logs: string;
    cache: string;
  };
  api: {
    coingecko: string;
    farmsense: string;
  };
  
  // Дополнительные поля конфигурации
  logging: {
    level: string;
    fileMaxSize: number;
    file: string;
  };
  cache: {
    ttl: number;
    ohlc: number;
    bitcoin: {
      priceTtl: number;
      historyTtl: number;
      priceFile: string;
      historicalFile: string;
      dataFile: string;
    };
    moon: {
      phaseTtl: number;
      phaseFile: string;
    };
    astro: {
      dataTtl: number;
      dataFile: string;
    };
    events: {
      dataTtl: number;
      dataFile: string;
    };
  };
  redis: {
    url: string;
  };
  client: {
    url: string;
  };
  DEBUG: boolean;

  constructor() {
    this.port = parseInt(process.env.PORT || '3002', 10);
    this.environment = process.env.NODE_ENV || 'development';
    
    this.cors = {
      origin: process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',') 
        : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost', 'https://moonbit.onrender.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    };
    
    this.sync = {
      bitcoin: 5 * 60 * 1000, // 5 минут
      moon: 60 * 60 * 1000, // 1 час
      astro: 12 * 60 * 60 * 1000, // 12 часов
      events: 30 * 60 * 1000, // 30 минут
    };
    
    this.paths = {
      logs: logsDir,
      cache: cacheDir,
    };
    
    this.api = {
      coingecko: 'https://api.coingecko.com/api/v3',
      farmsense: 'https://api.farmsense.net/v1/moonphases/',
    };
    
    this.logging = {
      level: process.env.LOG_LEVEL || 'debug',
      fileMaxSize: parseInt(process.env.LOG_FILE_MAX_SIZE || '5242880', 10), // 5MB по умолчанию
      file: process.env.LOG_FILE || 'logs/server.log',
    };
    
    this.cache = {
      ttl: parseInt(process.env.CACHE_TTL || '3600000', 10), // 1 час по умолчанию
      ohlc: parseInt(process.env.CACHE_TTL_OHLC || '60', 10), // секунды
      bitcoin: {
        priceTtl: 15, // минут
        historyTtl: 12, // часов
        priceFile: 'bitcoin_price.json',
        historicalFile: 'bitcoin_historical.json',
        dataFile: 'bitcoin_data.json',
      },
      moon: {
        phaseTtl: 60, // минут
        phaseFile: 'moon_phase.json',
      },
      astro: {
        dataTtl: 12 * 60, // минут (12 часов)
        dataFile: 'astro_data.json',
      },
      events: {
        dataTtl: 30, // минут
        dataFile: 'events_data.json',
      },
    };
    
    this.redis = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    };
    
    this.client = {
      url: process.env.CLIENT_URL || 'http://localhost:3000',
    };
    
    this.DEBUG = process.env.DEBUG === 'true' || true;
  }
}

// Экспортируем экземпляр по умолчанию для обратной совместимости
export default new Config(); 