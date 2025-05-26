const DataSyncService = require('../../src/services/DataSyncService');
const BitcoinService = require('../../src/services/BitcoinService');
const MoonService = require('../../src/services/MoonService');
const AstroService = require('../../src/services/AstroService');
const EventsService = require('../../src/services/EventsService');

// Мокаем некоторые методы, чтобы не делать реальные API запросы
jest.mock('../../src/services/BitcoinService', () => {
  const originalModule = jest.requireActual('../../src/services/BitcoinService');
  return {
    ...originalModule,
    updatePriceData: jest.fn().mockResolvedValue({ usd: { price: 50000 } }),
    updateHistoricalData: jest.fn().mockResolvedValue({ usd: { data: [] } }),
  };
});

jest.mock('../../src/services/MoonService', () => {
  const originalModule = jest.requireActual('../../src/services/MoonService');
  return {
    ...originalModule,
    updateMoonPhases: jest.fn().mockResolvedValue({ current: {}, phases: [] }),
  };
});

jest.mock('../../src/services/AstroService', () => {
  const originalModule = jest.requireActual('../../src/services/AstroService');
  return {
    ...originalModule,
    updateAstroData: jest.fn().mockResolvedValue({ retrograde: [], aspects: [] }),
  };
});

jest.mock('../../src/services/EventsService', () => {
  const originalModule = jest.requireActual('../../src/services/EventsService');
  return {
    ...originalModule,
    updateEvents: jest.fn().mockResolvedValue({ events: [] }),
  };
});

// Сбрасываем моки перед каждым тестом
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Интеграционные тесты сервисов', () => {
  // Тест на инициализацию DataSyncService
  test('DataSyncService должен инициализировать и синхронизировать все сервисы', async () => {
    // Переопределяем syncAll, чтобы не запускать реальную синхронизацию
    const syncAllSpy = jest.spyOn(DataSyncService, 'syncAll').mockResolvedValue(true);

    // Вызываем метод инициализации
    DataSyncService.initialize();

    // Проверяем, что syncAll был вызван
    expect(syncAllSpy).toHaveBeenCalledTimes(1);

    // Очищаем моки
    syncAllSpy.mockRestore();
  });

  // Тест на вызов всех сервисов при syncAll
  test('syncAll должен вызывать все сервисы синхронизации', async () => {
    // Переопределяем методы синхронизации отдельных сервисов
    const syncBitcoinSpy = jest.spyOn(DataSyncService, 'syncBitcoinData').mockResolvedValue(true);
    const syncMoonSpy = jest.spyOn(DataSyncService, 'syncMoonData').mockResolvedValue(true);
    const syncAstroSpy = jest.spyOn(DataSyncService, 'syncAstroData').mockResolvedValue(true);
    const syncEventsSpy = jest.spyOn(DataSyncService, 'syncEventsData').mockResolvedValue(true);

    // Вызываем syncAll
    await DataSyncService.syncAll();

    // Проверяем, что все методы синхронизации были вызваны
    expect(syncBitcoinSpy).toHaveBeenCalledTimes(1);
    expect(syncMoonSpy).toHaveBeenCalledTimes(1);
    expect(syncAstroSpy).toHaveBeenCalledTimes(1);
    expect(syncEventsSpy).toHaveBeenCalledTimes(1);

    // Очищаем моки
    syncBitcoinSpy.mockRestore();
    syncMoonSpy.mockRestore();
    syncAstroSpy.mockRestore();
    syncEventsSpy.mockRestore();
  });

  // Тест на синхронизацию Bitcoin данных
  test('syncBitcoinData должен вызывать методы BitcoinService', async () => {
    await DataSyncService.syncBitcoinData();

    expect(BitcoinService.updatePriceData).toHaveBeenCalledTimes(1);
    expect(BitcoinService.updateHistoricalData).toHaveBeenCalledTimes(1);
  });

  // Тест на синхронизацию Moon данных
  test('syncMoonData должен вызывать методы MoonService', async () => {
    await DataSyncService.syncMoonData();

    expect(MoonService.updateMoonPhases).toHaveBeenCalledTimes(1);
  });

  // Тест на синхронизацию Astro данных
  test('syncAstroData должен вызывать методы AstroService', async () => {
    await DataSyncService.syncAstroData();

    expect(AstroService.updateAstroData).toHaveBeenCalledTimes(1);
  });

  // Тест на синхронизацию Events данных
  test('syncEventsData должен вызывать методы EventsService', async () => {
    await DataSyncService.syncEventsData();

    expect(EventsService.updateEvents).toHaveBeenCalledTimes(1);
  });

  // Тест на остановку всех синхронизаций
  test('stopAll должен очищать все интервалы синхронизации', () => {
    // Мокаем clearInterval
    const originalClearInterval = global.clearInterval;
    global.clearInterval = jest.fn();

    // Устанавливаем фиктивные интервалы
    DataSyncService.syncIntervals = {
      bitcoin: 1,
      moon: 2,
      astro: 3,
      events: 4,
    };

    // Вызываем метод остановки
    DataSyncService.stopAll();

    // Проверяем, что clearInterval был вызван 4 раза
    expect(global.clearInterval).toHaveBeenCalledTimes(4);

    // Проверяем, что интервалы сброшены
    expect(DataSyncService.syncIntervals.bitcoin).toBeNull();
    expect(DataSyncService.syncIntervals.moon).toBeNull();
    expect(DataSyncService.syncIntervals.astro).toBeNull();
    expect(DataSyncService.syncIntervals.events).toBeNull();

    // Восстанавливаем оригинальный clearInterval
    global.clearInterval = originalClearInterval;
  });
});

// Тесты для взаимодействия между Bitcoin и Moon сервисами
describe('Тесты взаимодействия между сервисами', () => {
  test('Данные о фазах луны и цене биткоина должны быть согласованы по дате', () => {
    // Получаем текущие данные из обоих сервисов
    const bitcoinData = BitcoinService.getCurrentPrice();
    const moonData = MoonService.getCurrentPhase();

    // Проверяем, что обе даты существуют
    expect(bitcoinData.last_updated).toBeDefined();
    expect(moonData.date).toBeDefined();

    // Преобразуем строки дат в объекты Date для сравнения
    const bitcoinDate = new Date(bitcoinData.last_updated);
    const moonDate = new Date(moonData.date);

    // Проверяем, что даты не отличаются более чем на день
    // Это довольно мягкая проверка, т.к. данные могут обновляться с разной периодичностью
    const diffTime = Math.abs(bitcoinDate - moonDate);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeLessThan(1);
  });

  // Тест для проверки получения событий и совместимости их с фазами луны
  test('События и фазы луны должны иметь согласованные даты', () => {
    // Получаем ближайшие события и фазы луны
    const events = EventsService.getRecentEvents(5);
    const moonPhases = MoonService.getNextSignificantPhases(5);

    // Проверяем, что есть данные для анализа
    expect(events.length).toBeGreaterThan(0);
    expect(moonPhases.length).toBeGreaterThan(0);

    // Проверяем, что все даты в правильном формате
    events.forEach((event) => {
      expect(new Date(event.date).toString()).not.toBe('Invalid Date');
    });

    moonPhases.forEach((phase) => {
      expect(new Date(phase.date).toString()).not.toBe('Invalid Date');
    });
  });
});
