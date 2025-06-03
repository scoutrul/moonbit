import { container } from '../../src/inversify.config.js';
import { TYPES } from '../../src/types/types.js';
import { IDataSyncService, IBitcoinService, IMoonService } from '../../src/types/interfaces.js';

// Мокаем некоторые методы, чтобы не делать реальные API запросы
jest.mock('../../src/services/BitcoinService.js', () => {
  return {
    __esModule: true,
    BitcoinService: jest.fn().mockImplementation(() => ({
      getCurrentPrice: jest.fn().mockReturnValue({
        usd: { price: 50000, change_24h: 2.5, market_cap: 1000000000, volume_24h: 50000000 }
      }),
      getHistoricalData: jest.fn().mockReturnValue({
        usd: { data: [] }
      }),
      updatePriceData: jest.fn().mockResolvedValue({ usd: { price: 50000 } }),
      updateHistoricalData: jest.fn().mockResolvedValue({ usd: { data: [] } }),
      getPriceAnalysis: jest.fn().mockReturnValue({})
    })),
    default: {
      getCurrentPrice: jest.fn().mockReturnValue({
        usd: { price: 50000, change_24h: 2.5, market_cap: 1000000000, volume_24h: 50000000 }
      }),
      getHistoricalData: jest.fn().mockReturnValue({
        usd: { data: [] }
      }),
      updatePriceData: jest.fn().mockResolvedValue({ usd: { price: 50000 } }),
      updateHistoricalData: jest.fn().mockResolvedValue({ usd: { data: [] } }),
      getPriceAnalysis: jest.fn().mockReturnValue({})
    }
  };
});

jest.mock('../../src/services/MoonService.js', () => {
  return {
    __esModule: true,
    MoonService: jest.fn().mockImplementation(() => ({
      getCurrentPhase: jest.fn().mockReturnValue({ phase: 0.5, phaseName: 'Полнолуние' }),
      updatePhaseData: jest.fn().mockResolvedValue({ current: {}, phases: [] }),
      getPhasesForPeriod: jest.fn().mockReturnValue([]),
      getNextSignificantPhases: jest.fn().mockReturnValue([])
    })),
    default: {
      getCurrentPhase: jest.fn().mockReturnValue({ phase: 0.5, phaseName: 'Полнолуние' }),
      updatePhaseData: jest.fn().mockResolvedValue({ current: {}, phases: [] }),
      getPhasesForPeriod: jest.fn().mockReturnValue([]),
      getNextSignificantPhases: jest.fn().mockReturnValue([])
    }
  };
});

jest.mock('../../src/services/AstroService.js', () => {
  return {
    __esModule: true,
    AstroService: jest.fn().mockImplementation(() => ({
      getAstroEvents: jest.fn().mockReturnValue([]),
      updateAstroData: jest.fn().mockResolvedValue({ retrograde: [], aspects: [] })
    })),
    default: {
      getAstroEvents: jest.fn().mockReturnValue([]),
      updateAstroData: jest.fn().mockResolvedValue({ retrograde: [], aspects: [] })
    }
  };
});

jest.mock('../../src/services/EventsService.js', () => {
  return {
    __esModule: true,
    EventsService: jest.fn().mockImplementation(() => ({
      getRecentEvents: jest.fn().mockReturnValue([]),
      updateEvents: jest.fn().mockResolvedValue({ events: [] })
    })),
    default: {
      getRecentEvents: jest.fn().mockReturnValue([]),
      updateEvents: jest.fn().mockResolvedValue({ events: [] })
    }
  };
});

jest.mock('../../src/utils/logger.js', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Integration Tests', () => {
  let dataSyncService;
  let bitcoinService;
  let moonService;
  let astroService;
  let eventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Получаем сервисы из контейнера DI
    dataSyncService = container.get(TYPES.DataSyncService);
    bitcoinService = container.get(TYPES.BitcoinService);
    moonService = container.get(TYPES.MoonService);
    astroService = container.get(TYPES.AstroService);
    eventsService = container.get(TYPES.EventsService);
  });

  afterEach(async () => {
    if (dataSyncService && dataSyncService.stop) {
      await dataSyncService.stop();
    }
  });

  describe('DataSyncService', () => {
    it('должен инициализироваться без ошибок', () => {
      expect(dataSyncService).toBeDefined();
      expect(typeof dataSyncService.start).toBe('function');
      expect(typeof dataSyncService.stop).toBe('function');
    });

    it('должен запускать синхронизацию данных', async () => {
      await dataSyncService.start();
      
      expect(dataSyncService.initialized).toBe(true);
    });

    it('должен останавливать синхронизацию данных', async () => {
      await dataSyncService.start();
      await dataSyncService.stop();
      
      expect(dataSyncService.initialized).toBe(false);
    });
  });

  describe('Service Integration', () => {
    it('все сервисы должны быть доступны', () => {
      expect(bitcoinService).toBeDefined();
      expect(moonService).toBeDefined();
      expect(astroService).toBeDefined();
      expect(eventsService).toBeDefined();
    });

    it('сервисы должны иметь необходимые методы', () => {
      expect(typeof bitcoinService.getCurrentPrice).toBe('function');
      expect(typeof moonService.getCurrentPhase).toBe('function');
      expect(typeof astroService.getAstroEvents).toBe('function');
      expect(typeof eventsService.getRecentEvents).toBe('function');
    });
  });
});
