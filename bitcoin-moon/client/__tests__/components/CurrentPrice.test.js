import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import CurrentPrice from '../../src/components/CurrentPrice.jsx';

// Мокируем axios напрямую в тесте
jest.mock('axios', () => {
  return {
    get: jest.fn(),
  };
});

describe('CurrentPrice Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    render(<CurrentPrice />);

    // Проверяем, что компонент находится в состоянии загрузки
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should render price data correctly', async () => {
    // Мокируем успешный ответ от API
    axios.get.mockResolvedValue({
      data: {
        price: 50000,
        change24h: 2.5,
      },
    });

    render(<CurrentPrice />);

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText(/50 000,00 \$/)).toBeInTheDocument();
      expect(screen.getByText(/▲ 2.50%/)).toBeInTheDocument();
    });

    // Проверяем, что была вызвана правильная конечная точка API
    expect(axios.get).toHaveBeenCalledWith('/api/bitcoin/price');
  });

  it('should display negative price change correctly', async () => {
    // Мокируем успешный ответ от API с отрицательным изменением
    axios.get.mockResolvedValue({
      data: {
        price: 48000,
        change24h: -3.2,
      },
    });

    render(<CurrentPrice />);

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText(/48 000,00 \$/)).toBeInTheDocument();
      expect(screen.getByText(/▼ 3.20%/)).toBeInTheDocument();
    });

    // Проверяем наличие правильного класса для отрицательного изменения
    const changeElement = screen.getByText(/▼ 3.20%/);
    expect(changeElement).toHaveClass('text-red-500');
  });

  it('should handle API error', async () => {
    // Мокируем ошибку API
    axios.get.mockRejectedValue(new Error('Network Error'));

    render(<CurrentPrice />);

    // Ждем отображения ошибки
    await waitFor(() => {
      expect(screen.getByText('Не удалось загрузить данные о цене')).toBeInTheDocument();
    });
  });

  it('should set up and clean up interval timer', () => {
    // Мокируем setInterval и clearInterval
    jest.useFakeTimers();
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    // Рендерим компонент
    const { unmount } = render(<CurrentPrice />);

    // Проверяем, что интервал был установлен
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

    // Размонтируем компонент
    unmount();

    // Проверяем, что интервал был очищен
    expect(clearIntervalSpy).toHaveBeenCalled();

    // Восстанавливаем таймеры
    jest.useRealTimers();
  });
});
