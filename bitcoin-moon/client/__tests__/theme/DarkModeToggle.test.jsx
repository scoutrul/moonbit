import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../../src/App';
import { MemoryRouter } from 'react-router-dom';

// Мокаем все зависимые компоненты для изоляции тестирования темы
vi.mock('../../src/components/Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard Component</div>
}));

vi.mock('../../src/components/About', () => ({
  default: () => <div data-testid="about">About Component</div>
}));

vi.mock('../../src/components/DevPanel', () => ({
  default: () => <div data-testid="dev-panel">DevPanel Component</div>
}));

// Сохраняем оригинальные значения localStorage и matchMedia
const originalLocalStorage = { ...window.localStorage };
const originalMatchMedia = window.matchMedia;

describe('Dark Mode Toggle', () => {
  // Мокаем localStorage и matchMedia перед каждым тестом
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
    
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
    
    // Очищаем DOM между тестами
    document.documentElement.classList.remove('dark');
  });
  
  // Восстанавливаем оригинальные значения после тестов
  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
    
    window.matchMedia = originalMatchMedia;
  });
  
  test('должен использовать светлую тему по умолчанию, если нет сохраненных предпочтений', () => {
    // Настраиваем localStorage для возврата null
    window.localStorage.getItem.mockReturnValue(null);
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    // Проверяем, что тема по умолчанию - светлая (отсутствие класса dark)
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
  
  test('должен использовать темную тему, если она сохранена в localStorage', () => {
    // Настраиваем localStorage для возврата значения 'true'
    window.localStorage.getItem.mockReturnValue('true');
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    // Проверяем, что применена темная тема (наличие класса dark)
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
  
  test('должен использовать предпочтения системы, если localStorage пуст', () => {
    // Настраиваем localStorage для возврата null
    window.localStorage.getItem.mockReturnValue(null);
    
    // Настраиваем matchMedia для возврата true (темная тема предпочтительна)
    window.matchMedia.mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    // Проверяем, что применена темная тема (наличие класса dark)
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
  
  test('должен переключать тему при нажатии на кнопку', () => {
    // Настраиваем localStorage для возврата 'false' (светлая тема)
    window.localStorage.getItem.mockReturnValue('false');
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    // Проверяем, что изначально применена светлая тема
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    
    // Находим кнопку переключения темы и кликаем по ней
    const themeToggleButton = screen.getByRole('button', { 
      name: /Включить темную тему/i 
    });
    
    act(() => {
      fireEvent.click(themeToggleButton);
    });
    
    // Проверяем, что тема переключилась на темную
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('darkMode', 'true');
    
    // Проверяем, что при повторном клике тема переключается обратно на светлую
    act(() => {
      fireEvent.click(themeToggleButton);
    });
    
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('darkMode', 'false');
  });
}); 