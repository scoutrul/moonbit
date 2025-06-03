import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types/types';

// Interfaces
import {
  ILogger,
  IConfig,
  IBitcoinService,
  IMoonService,
  IBitcoinRepository,
  IMoonRepository,
  IDataSyncService
} from './types/interfaces';

// Implementations
import { Logger } from './utils/logger';
import { Config } from './config';
import { BitcoinService } from './services/BitcoinService';
import { MoonService } from './services/MoonService';
import { AstroService } from './services/AstroService';
import { EventsService } from './services/EventsService';
import { DataSyncService } from './services/DataSyncService';
import { BitcoinRepository } from './repositories/BitcoinRepository';
import { MoonRepository } from './repositories/MoonRepository';
import { BitcoinController } from './controllers/BitcoinController';
import { MoonController } from './controllers/MoonController';
import { AstroController } from './controllers/AstroController';
import { EventsController } from './controllers/EventsController';

const container = new Container();

// Core
container.bind<IConfig>(TYPES.Config).to(Config).inSingletonScope();
container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope();

// Repositories
container.bind<IBitcoinRepository>(TYPES.BitcoinRepository).to(BitcoinRepository).inSingletonScope();
container.bind<IMoonRepository>(TYPES.MoonRepository).to(MoonRepository).inSingletonScope();

// Services
container.bind<IBitcoinService>(TYPES.BitcoinService).to(BitcoinService).inSingletonScope();
container.bind<IMoonService>(TYPES.MoonService).to(MoonService).inSingletonScope();
container.bind(TYPES.AstroService).to(AstroService).inSingletonScope();
container.bind(TYPES.EventsService).to(EventsService).inSingletonScope();
container.bind<IDataSyncService>(TYPES.DataSyncService).to(DataSyncService).inSingletonScope();

// Controllers
container.bind(TYPES.BitcoinController).to(BitcoinController).inSingletonScope();
container.bind(TYPES.MoonController).to(MoonController).inSingletonScope();
container.bind(TYPES.AstroController).to(AstroController).inSingletonScope();
container.bind(TYPES.EventsController).to(EventsController).inSingletonScope();

export { container }; 