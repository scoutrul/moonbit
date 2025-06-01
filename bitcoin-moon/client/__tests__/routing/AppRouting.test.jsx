import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../../src/App';
import Header from '../../src/components/Header';
import Dashboard from '../../src/components/Dashboard';
import About from '../../src/components/About';

// Мокаем все компоненты кроме Header, который мы будем тестировать
vi.mock('../../src/components/Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard Component</div>
}));

vi.mock('../../src/components/About', () => ({
  default: () => <div data-testid="about">About Component</div>
}));

vi.mock('../../src/components/ErrorBoundary', () => ({
  default: ({ children }) => <div data-testid="error-boundary">{children}</div>
}));

vi.mock('../../src/components/DevPanel', () => ({
  default: () => <div data-testid="dev-panel">DevPanel Component</div>
}));

describe('App Routing', () => {
  test('должен отображать Dashboard при загрузке корневого маршрута', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('about')).not.toBeInTheDocument();
  });
  
  test('должен отображать About при загрузке /about маршрута', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <App />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('about')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });
});

describe('Header Navigation', () => {
  const toggleDarkMode = vi.fn();
  
  beforeEach(() => {
    toggleDarkMode.mockClear();
  });
  
  test('должен иметь ссылку на страницу О проекте', () => {
    render(
      <MemoryRouter>
        <Header darkMode={false} toggleDarkMode={toggleDarkMode} />
      </MemoryRouter>
    );
    
    const aboutLink = screen.getByText('О проекте');
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink.getAttribute('href')).toBe('/about');
  });
  
  test('должен переключать тему при клике на кнопку', () => {
    render(
      <MemoryRouter>
        <Header darkMode={false} toggleDarkMode={toggleDarkMode} />
      </MemoryRouter>
    );
    
    const themeToggleButton = screen.getByRole('button');
    fireEvent.click(themeToggleButton);
    
    expect(toggleDarkMode).toHaveBeenCalledTimes(1);
  });
  
  test('должен отображать правильную иконку в зависимости от темы', () => {
    // Светлая тема
    const { rerender } = render(
      <MemoryRouter>
        <Header darkMode={false} toggleDarkMode={toggleDarkMode} />
      </MemoryRouter>
    );
    
    // В светлой теме должна быть иконка луны
    expect(screen.getByRole('button').querySelector('path').getAttribute('d')).toContain('M20.354 15.354');
    
    // Тёмная тема
    rerender(
      <MemoryRouter>
        <Header darkMode={true} toggleDarkMode={toggleDarkMode} />
      </MemoryRouter>
    );
    
    // В темной теме должна быть иконка солнца
    expect(screen.getByRole('button').querySelector('path').getAttribute('d')).toContain('M12 3v1m0 16v1m9-9h-1M4 12H3m15.364');
  });
}); 