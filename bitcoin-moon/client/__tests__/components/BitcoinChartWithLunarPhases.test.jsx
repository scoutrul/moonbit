import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import BitcoinChartWithLunarPhases from '../../src/components/BitcoinChartWithLunarPhases';
import BitcoinService from '../../src/services/BitcoinService';
import AstroService from '../../src/services/AstroService';

// Мокаем сервисы
vi.mock('../../src/services/BitcoinService', () => ({
  default: {
    getBitcoinPriceHistory: vi.fn()
  }
}));

vi.mock('../../src/services/AstroService', () => ({
  default: {
    getMoonPhases: vi.fn()
  }
}));

// Мокаем LightweightCharts, так как эта библиотека работает с DOM напрямую
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    applyOptions: vi.fn(),
    resize: vi.fn(),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
      applyOptions: vi.fn()
    })),
    addCandlestickSeries: vi.fn(() => ({
      applyOptions: vi.fn(),
      setData: vi.fn(),
      setMarkers: vi.fn()
    })),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    remove: vi.fn()
  }))
}));

describe('BitcoinChartWithLunarPhases', () => {
  beforeEach(() => {
    // Очищаем все моки перед каждым тестом
    vi.clearAllMocks();
    
    // Мокаем данные о цене биткоина
    BitcoinService.getBitcoinPriceHistory.mockResolvedValue([
      { time: '2023-01-01', open: 16000, high: 16500, low: 15800, close: 16200 },
      { time: '2023-01-02', open: 16200, high: 16800, low: 16100, close: 16700 }
    ]);
    
    // Мокаем данные о фазах луны
    AstroService.getMoonPhases.mockResolvedValue([
      { date: '2023-01-01T12:00:00Z', phase: 'Новолуние', icon: '🌑' },
      { date: '2023-01-15T12:00:00Z', phase: 'Полнолуние', icon: '🌕' }
    ]);
    
    // Мокаем работу с DOM для компонента
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
      }))
    });
  });
  
  test('должен отображать селектор временного интервала', () => {
    render(<BitcoinChartWithLunarPhases />);
    
    expect(screen.getByText('1Д')).toBeInTheDocument();
    expect(screen.getByText('1Н')).toBeInTheDocument();
    expect(screen.getByText('1М')).toBeInTheDocument();
    expect(screen.getByText('3М')).toBeInTheDocument();
    expect(screen.getByText('1Г')).toBeInTheDocument();
    expect(screen.getByText('Всё')).toBeInTheDocument();
  });
  
  test('должен вызывать загрузку данных при монтировании', async () => {
    render(<BitcoinChartWithLunarPhases />);
    
    await waitFor(() => {
      expect(BitcoinService.getBitcoinPriceHistory).toHaveBeenCalledTimes(1);
      expect(AstroService.getMoonPhases).toHaveBeenCalledTimes(1);
    });
  });
  
  test('должен изменять временной интервал при клике на кнопку', async () => {
    render(<BitcoinChartWithLunarPhases />);
    
    // Ждем загрузки данных
    await waitFor(() => {
      expect(BitcoinService.getBitcoinPriceHistory).toHaveBeenCalledTimes(1);
    });
    
    // Кликаем на кнопку месячного интервала
    const monthButton = screen.getByText('1М');
    fireEvent.click(monthButton);
    
    // Проверяем, что загрузка данных была вызвана с новым интервалом
    await waitFor(() => {
      expect(BitcoinService.getBitcoinPriceHistory).toHaveBeenCalledTimes(2);
      expect(BitcoinService.getBitcoinPriceHistory).toHaveBeenLastCalledWith(expect.stringContaining('month'));
    });
  });
  
  test('должен отображать состояние загрузки', () => {
    // Мокаем долгую загрузку данных
    BitcoinService.getBitcoinPriceHistory.mockReturnValue(new Promise(() => {}));
    
    render(<BitcoinChartWithLunarPhases />);
    
    // Проверяем наличие индикатора загрузки
    expect(screen.getByText('Загрузка данных...')).toBeInTheDocument();
  });
  
  test('должен обрабатывать ошибки загрузки данных', async () => {
    // Мокаем ошибку при загрузке данных
    const errorMessage = 'Ошибка загрузки данных';
    BitcoinService.getBitcoinPriceHistory.mockRejectedValue(new Error(errorMessage));
    
    // Перехватываем console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<BitcoinChartWithLunarPhases />);
    
    // Ждем обработки ошибки
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    // Проверяем отображение сообщения об ошибке
    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument();
    
    // Восстанавливаем console.error
    consoleSpy.mockRestore();
  });
}); 