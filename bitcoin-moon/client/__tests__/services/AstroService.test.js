import { describe, test, expect, beforeEach, vi } from 'vitest';
import AstroService from '../../src/services/AstroService';

// Мокаем fetch глобально
global.fetch = vi.fn();

describe('AstroService', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    fetch.mockClear();
  });

  test('должен успешно получать фазы луны', async () => {
    // Устанавливаем мок для успешного ответа
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          date: '2025-06-01T12:00:00Z',
          phase: 'Полнолуние',
          icon: '🌕'
        }
      ])
    });

    const result = await AstroService.getMoonPhases();
    
    // Проверяем, что fetch был вызван с правильным URL
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/astro/moonphases'), expect.any(Object));
    
    // Проверяем результат
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toHaveProperty('date');
    expect(result[0]).toHaveProperty('phase');
  });

  test('должен корректно обрабатывать ошибки API', async () => {
    // Устанавливаем мок для ошибки сети
    fetch.mockRejectedValueOnce(new Error('Ошибка сети'));

    // Перехватываем вывод в консоль
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Вызываем метод сервиса
    const result = await AstroService.getMoonPhases();
    
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

    const result = await AstroService.getMoonPhases();
    
    // Проверяем, что предупреждение было залогировано
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    // Проверяем, что метод возвращает моковые данные при пустом ответе
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    
    // Очищаем мок консоли
    consoleWarnSpy.mockRestore();
  });

  test('должен получать лунные события', async () => {
    // Устанавливаем мок для успешного ответа
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          date: '2025-06-05T23:12:00Z',
          title: 'Новолуние',
          description: 'Лунный цикл: Новолуние',
          type: 'moon',
          icon: '🌑'
        }
      ])
    });

    const result = await AstroService.getLunarEvents();
    
    // Проверяем, что fetch был вызван с правильным URL
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/astro/lunarevents'), expect.any(Object));
    
    // Проверяем результат
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toHaveProperty('date');
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('type', 'moon');
  });

  test('должен получать астрономические события', async () => {
    // Устанавливаем мок для успешного ответа
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          date: '2025-06-10T18:30:00Z',
          title: 'Солнечное затмение',
          description: 'Частичное солнечное затмение',
          type: 'astro',
          icon: '🌞'
        }
      ])
    });

    const result = await AstroService.getAstroEvents();
    
    // Проверяем, что fetch был вызван с правильным URL
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/astro/events'), expect.any(Object));
    
    // Проверяем результат
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toHaveProperty('date');
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('type', 'astro');
  });
}); 