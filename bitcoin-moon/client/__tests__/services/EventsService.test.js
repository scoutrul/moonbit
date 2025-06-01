import { describe, test, expect, beforeEach, vi } from 'vitest';
import EventsService from '../../src/services/EventsService';

// Мокаем fetch глобально
global.fetch = vi.fn();

describe('EventsService', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    fetch.mockClear();
  });

  test('должен успешно получать экономические события', async () => {
    // Устанавливаем мок для успешного ответа
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          id: '1',
          title: 'Заседание ФРС',
          date: new Date(new Date().getTime() + 86400000 * 3).toISOString(),
          type: 'economic',
          icon: '📊',
          description: 'Решение по ключевой ставке',
          impact: 'high'
        }
      ])
    });

    const result = await EventsService.getEconomicEvents(10);
    
    // Проверяем, что fetch был вызван с правильным URL
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/events/economic'), expect.any(Object));
    
    // Проверяем, что переданы параметры запроса (количество событий)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('limit=10'), expect.any(Object));
    
    // Проверяем результат
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('date');
    expect(result[0]).toHaveProperty('type', 'economic');
  });

  test('должен корректно обрабатывать ошибки API', async () => {
    // Устанавливаем мок для ошибки сети
    fetch.mockRejectedValueOnce(new Error('Ошибка сети'));

    // Перехватываем вывод в консоль
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Вызываем метод сервиса
    const result = await EventsService.getEconomicEvents(10);
    
    // Проверяем, что ошибка была залогирована
    expect(consoleSpy).toHaveBeenCalled();
    
    // Проверяем, что метод возвращает моковые данные при ошибке
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    
    // Очищаем мок консоли
    consoleSpy.mockRestore();
  });

  test('должен возвращать моковые данные при пустом ответе API', async () => {
    // Устанавливаем мок для успешного, но пустого ответа
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([])
    });

    // Перехватываем вывод в консоль
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await EventsService.getEconomicEvents(10);
    
    // Проверяем, что предупреждение было залогировано
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    // Проверяем, что метод возвращает моковые данные при пустом ответе
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    
    // Очищаем мок консоли
    consoleWarnSpy.mockRestore();
  });

  test('должен получать экономические события с указанным лимитом', async () => {
    // Устанавливаем мок для успешного ответа
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          id: '1',
          title: 'Заседание ФРС',
          date: new Date(new Date().getTime() + 86400000 * 3).toISOString(),
          type: 'economic',
          icon: '📊'
        },
        {
          id: '2',
          title: 'Отчет по инфляции',
          date: new Date(new Date().getTime() + 86400000 * 5).toISOString(),
          type: 'economic',
          icon: '📈'
        }
      ])
    });

    // Запрашиваем с лимитом 2
    const result = await EventsService.getEconomicEvents(2);
    
    // Проверяем, что fetch был вызван с правильным URL
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('limit=2'), expect.any(Object));
    
    // Проверяем результат
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(2);
  });

  test('должен использовать лимит по умолчанию, если он не указан', async () => {
    // Устанавливаем мок для успешного ответа
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          id: '1',
          title: 'Заседание ФРС',
          date: new Date(new Date().getTime() + 86400000 * 3).toISOString(),
          type: 'economic',
          icon: '📊'
        }
      ])
    });

    // Вызываем без указания лимита
    await EventsService.getEconomicEvents();
    
    // Проверяем, что fetch был вызван с лимитом по умолчанию
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('limit='), expect.any(Object));
  });
}); 