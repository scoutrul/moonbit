import fs from 'fs';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger, IConfig, IDataSyncService, IBitcoinService, IMoonService } from '../types/interfaces';

/**
 * Сервис синхронизации данных
 * Отвечает за координацию обновления данных из всех сервисов
 */
@injectable()
export class DataSyncService implements IDataSyncService {
  private initialized: boolean = false;
  private intervalIds: {
    bitcoin: NodeJS.Timeout | null;
    moon: NodeJS.Timeout | null;
    astro: NodeJS.Timeout | null;
    events: NodeJS.Timeout | null;
  };

  private intervalTimes: {
    bitcoin: number;
    moon: number;
    astro: number;
    events: number;
  };

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.BitcoinService) private bitcoinService: IBitcoinService,
    @inject(TYPES.MoonService) private moonService: IMoonService,
    @inject(TYPES.AstroService) private astroService: any,
    @inject(TYPES.EventsService) private eventsService: any
  ) {
    this.intervalIds = {
      bitcoin: null,
      moon: null,
      astro: null,
      events: null,
    };

    this.intervalTimes = {
      bitcoin: this.config.sync.bitcoin, // 5 минут
      moon: this.config.sync.moon, // 1 час
      astro: this.config.sync.astro, // 12 часов
      events: this.config.sync.events, // 30 минут
    };

    // Создаем необходимые директории при инициализации
    this.createDirectories();
  }

  /**
   * Создает необходимые директории
   */
  private createDirectories(): void {
    const directories = [this.config.paths.logs, this.config.paths.cache];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
          this.logger.info(`Создана директория: ${dir}`);
        } catch (error) {
          this.logger.error(`Ошибка при создании директории ${dir}:`, { error });
        }
      }
    });
  }

  /**
   * Инициализирует сервис синхронизации данных
   */
  public initialize(): void {
    if (this.initialized) {
      this.logger.info('Сервис синхронизации данных уже инициализирован');
      return;
    }

    this.logger.info('Инициализация сервиса синхронизации данных');

    // Выполняем начальную синхронизацию всех данных
    this.syncAll()
      .then(() => {
        this.logger.info('Начальная синхронизация данных успешно завершена');

        // Запускаем регулярную синхронизацию данных
        this.startPeriodicSync();

        this.initialized = true;
      })
      .catch((error) => {
        this.logger.error('Ошибка при начальной синхронизации данных', { error });
      });
  }

  /**
   * Запускает периодическую синхронизацию данных по расписанию
   */
  private startPeriodicSync(): void {
    this.logger.info('Запуск периодической синхронизации данных');

    // Bitcoin данные - каждые 5 минут
    this.intervalIds.bitcoin = setInterval(() => {
      this.syncBitcoinData().catch((error) =>
        this.logger.error('Ошибка при синхронизации данных биткоина', { error })
      );
    }, this.intervalTimes.bitcoin);

    // Данные о луне - каждый час
    this.intervalIds.moon = setInterval(() => {
      this.syncMoonData().catch((error) =>
        this.logger.error('Ошибка при синхронизации данных луны', { error })
      );
    }, this.intervalTimes.moon);

    // Астрологические данные - каждые 12 часов
    this.intervalIds.astro = setInterval(() => {
      this.syncAstroData().catch((error) =>
        this.logger.error('Ошибка при синхронизации астрологических данных', { error })
      );
    }, this.intervalTimes.astro);

    // События - каждые 30 минут
    this.intervalIds.events = setInterval(() => {
      this.syncEventsData().catch((error) =>
        this.logger.error('Ошибка при синхронизации данных событий', { error })
      );
    }, this.intervalTimes.events);

    this.logger.info('Периодическая синхронизация данных успешно запущена');
  }

  /**
   * Останавливает все синхронизации данных
   * Реализация метода из интерфейса IDataSyncService
   */
  public stop(): void {
    this.stopAll();
  }

  /**
   * Останавливает все синхронизации данных
   */
  private stopAll(): void {
    this.logger.info('Остановка всех синхронизаций данных');

    // Очищаем все интервалы
    Object.keys(this.intervalIds).forEach((key) => {
      const typedKey = key as keyof typeof this.intervalIds;
      if (this.intervalIds[typedKey]) {
        clearInterval(this.intervalIds[typedKey] as NodeJS.Timeout);
        this.intervalIds[typedKey] = null;
      }
    });

    this.initialized = false;
    this.logger.info('Все синхронизации данных остановлены');
  }

  /**
   * Запускает сервис синхронизации
   * Реализация метода из интерфейса IDataSyncService
   */
  public start(): void {
    this.initialize();
  }

  /**
   * Синхронизирует все данные
   * @returns {Promise<boolean>} Результат синхронизации
   */
  public async syncAll(): Promise<boolean> {
    this.logger.info('Начало полной синхронизации данных');

    try {
      // Запускаем синхронизацию всех сервисов параллельно
      await Promise.all([
        this.syncBitcoinData(),
        this.syncMoonData(),
        this.syncAstroData(),
        this.syncEventsData(),
      ]);

      this.logger.info('Полная синхронизация данных успешно завершена');
      return true;
    } catch (error) {
      this.logger.error('Ошибка при полной синхронизации данных', { error });
      return false;
    }
  }

  /**
   * Синхронизирует данные о биткоине
   * @returns {Promise<boolean>} Результат синхронизации
   */
  public async syncBitcoinData(): Promise<boolean> {
    this.logger.debug('Синхронизация данных о биткоине');

    try {
      // Запускаем обновление текущих цен и исторических данных параллельно
      const [priceData, historicalData] = await Promise.all([
        this.bitcoinService.updatePriceData(),
        this.bitcoinService.updateHistoricalData(),
      ]);

      this.logger.info('Данные о биткоине успешно синхронизированы', {
        priceDataUpdated: !!priceData,
        historicalDataUpdated: !!historicalData,
      });

      return true;
    } catch (error) {
      this.logger.error('Ошибка при синхронизации данных о биткоине', { error });
      return false;
    }
  }

  /**
   * Синхронизирует данные о фазах луны
   * @returns {Promise<boolean>} Результат синхронизации
   */
  public async syncMoonData(): Promise<boolean> {
    this.logger.debug('Синхронизация данных о фазах луны');

    try {
      // Обновляем данные о фазах луны
      const moonData = await this.moonService.updatePhaseData();

      this.logger.info('Данные о фазах луны успешно синхронизированы', {
        dataUpdated: !!moonData,
      });

      return true;
    } catch (error) {
      this.logger.error('Ошибка при синхронизации данных о фазах луны', { error });
      return false;
    }
  }

  /**
   * Синхронизирует астрологические данные
   * @returns {Promise<boolean>} Результат синхронизации
   */
  public async syncAstroData(): Promise<boolean> {
    this.logger.debug('Синхронизация астрологических данных');

    try {
      // Обновляем астрологические данные
      const astroData = await this.astroService.updateAstroData();

      this.logger.info('Астрологические данные успешно синхронизированы', {
        dataUpdated: !!astroData,
      });

      return true;
    } catch (error) {
      this.logger.error('Ошибка при синхронизации астрологических данных', { error });
      return false;
    }
  }

  /**
   * Синхронизирует данные о событиях
   * @returns {Promise<boolean>} Результат синхронизации
   */
  public async syncEventsData(): Promise<boolean> {
    this.logger.debug('Синхронизация данных о событиях');

    try {
      // Обновляем данные о событиях
      const eventsData = await this.eventsService.updateEvents();

      this.logger.info('Данные о событиях успешно синхронизированы', {
        dataUpdated: !!eventsData,
      });

      return true;
    } catch (error) {
      this.logger.error('Ошибка при синхронизации данных о событиях', { error });
      return false;
    }
  }
} 