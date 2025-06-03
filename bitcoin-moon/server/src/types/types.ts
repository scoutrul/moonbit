export const TYPES = {
  // Core
  Config: Symbol.for('Config'),
  Logger: Symbol.for('Logger'),
  
  // Services
  BitcoinService: Symbol.for('BitcoinService'),
  MoonService: Symbol.for('MoonService'),
  AstroService: Symbol.for('AstroService'),
  EventsService: Symbol.for('EventsService'),
  DataSyncService: Symbol.for('DataSyncService'),

  // Repositories
  BitcoinRepository: Symbol.for('BitcoinRepository'),
  MoonRepository: Symbol.for('MoonRepository'),
  AstroRepository: Symbol.for('AstroRepository'),
  EventsRepository: Symbol.for('EventsRepository'),

  // Controllers
  BitcoinController: Symbol.for('BitcoinController'),
  MoonController: Symbol.for('MoonController'),
  AstroController: Symbol.for('AstroController'),
  EventsController: Symbol.for('EventsController')
}; 