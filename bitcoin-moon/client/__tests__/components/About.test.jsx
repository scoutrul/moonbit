import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import About from '../../src/components/About';

describe('About Component', () => {
  test('должен отображать основную информацию о проекте', () => {
    render(<About />);
    
    // Проверяем заголовок
    expect(screen.getByText('О проекте «Биткоин и Луна»')).toBeInTheDocument();
    
    // Проверяем основные разделы
    expect(screen.getByText('Концепция проекта')).toBeInTheDocument();
    expect(screen.getByText('Основные функции')).toBeInTheDocument();
    expect(screen.getByText('Технологический стек')).toBeInTheDocument();
    expect(screen.getByText('Дисклеймер')).toBeInTheDocument();
    expect(screen.getByText('Контакты и поддержка')).toBeInTheDocument();
  });
  
  test('должен содержать список основных функций', () => {
    render(<About />);
    
    // Проверяем наличие основных функций проекта
    expect(screen.getByText(/Интерактивный график цены биткоина/i)).toBeInTheDocument();
    expect(screen.getByText(/Календарь предстоящих экономических и астрономических событий/i)).toBeInTheDocument();
    expect(screen.getByText(/Данные о корреляции между фазами Луны/i)).toBeInTheDocument();
    expect(screen.getByText(/Возможность переключения между различными временными интервалами/i)).toBeInTheDocument();
    expect(screen.getByText(/Поддержка светлой и тёмной темы/i)).toBeInTheDocument();
  });
  
  test('должен содержать информацию о технологическом стеке', () => {
    render(<About />);
    
    // Проверяем наличие секций технологического стека
    expect(screen.getByText('Клиентская часть')).toBeInTheDocument();
    expect(screen.getByText('Серверная часть')).toBeInTheDocument();
    
    // Проверяем наличие ключевых технологий
    expect(screen.getByText('React.js')).toBeInTheDocument();
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument();
    expect(screen.getByText('Lightweight Charts для графиков')).toBeInTheDocument();
    expect(screen.getByText('React Router для навигации')).toBeInTheDocument();
    expect(screen.getByText('Day.js для работы с датами')).toBeInTheDocument();
    
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('Express.js')).toBeInTheDocument();
    expect(screen.getByText(/Интеграция с API CoinGecko/i)).toBeInTheDocument();
    expect(screen.getByText(/Интеграция с астрономическими API/i)).toBeInTheDocument();
  });
  
  test('должен содержать дисклеймер', () => {
    render(<About />);
    
    // Проверяем наличие дисклеймера
    const disclaimer = screen.getByText(/Данный проект создан исключительно в образовательных и исследовательских целях/i);
    expect(disclaimer).toBeInTheDocument();
    
    // Проверяем, что дисклеймер находится в специальном блоке с желтым фоном
    expect(disclaimer.closest('div')).toHaveClass('bg-yellow-50');
  });
  
  test('должен содержать ссылку на GitHub репозиторий', () => {
    render(<About />);
    
    // Проверяем наличие ссылки на GitHub
    const githubLink = screen.getByText(/github.com\/yourusername\/bitcoin-moon/i);
    expect(githubLink).toBeInTheDocument();
    expect(githubLink.tagName).toBe('A');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/yourusername/bitcoin-moon');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
}); 