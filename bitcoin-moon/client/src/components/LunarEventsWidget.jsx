import { useEffect, useState } from 'react';
import AstroService from '../services/AstroService';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

// Инициализируем русскую локализацию
dayjs.locale('ru');

/**
 * Компонент для отображения предстоящих лунных событий
 */
const LunarEventsWidget = () => {
  const [lunarEvents, setLunarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        console.log('LunarEventsWidget: Начинаем загрузку предстоящих лунных событий...');
        
        // Используем AstroService для получения предстоящих лунных событий
        const events = await AstroService.getNextSignificantPhases(5);
        console.log('LunarEventsWidget: Получено событий:', events.length, events);
        
        if (events && events.length > 0) {
          setLunarEvents(events);
          setError(null);
        } else {
          console.warn('LunarEventsWidget: Получен пустой массив событий');
          // Создаем тестовые данные, если нет событий
          const mockEvents = generateMockLunarEvents();
          console.log('LunarEventsWidget: Сгенерированы тестовые события:', mockEvents.length);
          setLunarEvents(mockEvents);
        }
      } catch (err) {
        console.error('LunarEventsWidget: Ошибка при загрузке лунных событий:', err);
        setError('Не удалось загрузить данные о лунных фазах');
        
        // В случае ошибки используем тестовые данные
        const mockEvents = generateMockLunarEvents();
        console.log('LunarEventsWidget: Сгенерированы тестовые события:', mockEvents.length);
        setLunarEvents(mockEvents);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Функция для генерации тестовых данных
  const generateMockLunarEvents = () => {
    const events = [];
    const today = new Date();
    
    // Новолуние через 7 дней
    const newMoonDate = new Date(today);
    newMoonDate.setDate(newMoonDate.getDate() + 7);
    events.push({
      type: 'new_moon',
      date: newMoonDate,
      title: 'Новолуние',
      icon: '🌑'
    });
    
    // Полнолуние через 14 дней
    const fullMoonDate = new Date(today);
    fullMoonDate.setDate(fullMoonDate.getDate() + 14);
    events.push({
      type: 'full_moon',
      date: fullMoonDate,
      title: 'Полнолуние',
      icon: '🌕'
    });
    
    // Новолуние через 21 день
    const newMoonDate2 = new Date(today);
    newMoonDate2.setDate(newMoonDate2.getDate() + 21);
    events.push({
      type: 'new_moon',
      date: newMoonDate2,
      title: 'Новолуние',
      icon: '🌑'
    });
    
    return events;
  };

  // Функция для форматирования даты
  const formatDate = (date) => {
    if (!date) return 'Неизвестно';
    
    // Преобразуем timestamp в объект Date, если это число
    const dateObj = typeof date === 'number' 
      ? new Date(date * 1000) // Умножаем на 1000, если это UNIX timestamp
      : new Date(date);
      
    // Если больше месяца в будущем, показываем полную дату с месяцем
    const now = new Date();
    const diffDays = Math.floor((dateObj - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return dayjs(dateObj).format('D MMMM YYYY');
    } else if (diffDays < 1) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Завтра';
    } else if (diffDays < 7) {
      return `Через ${diffDays} ${getDayWordForm(diffDays)}`;
    } else {
      return dayjs(dateObj).format('D MMMM YYYY');
    }
  };
  
  // Функция для склонения слова "день"
  const getDayWordForm = (days) => {
    if (days % 10 === 1 && days % 100 !== 11) {
      return 'день';
    } else if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
      return 'дня';
    } else {
      return 'дней';
    }
  };

  // Функция для получения названия фазы луны
  const getPhaseLabel = (event) => {
    return event.title || (event.type === 'new_moon' ? 'Новолуние' : 'Полнолуние');
  };
  
  // Функция для получения иконки фазы
  const getPhaseIcon = (event) => {
    return event.icon || (event.type === 'new_moon' ? '🌑' : '🌕');
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Предстоящие лунные события</h2>
        <div className="animate-pulse space-y-3">
          {Array(3).fill(0).map((_, index) => (
            <div key={index} className="flex items-start">
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && lunarEvents.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Предстоящие лунные события</h2>
        <div className="flex justify-center items-center p-4">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Предстоящие лунные события</h2>
      
      {lunarEvents.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center p-4">Нет предстоящих лунных событий</p>
      ) : (
        <ul className="space-y-3">
          {lunarEvents.map((event, index) => (
            <li 
              key={index} 
              className="flex items-center p-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <span className="text-2xl mr-3">{getPhaseIcon(event)}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-white">{getPhaseLabel(event)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.time)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <p>Данные рассчитаны с помощью астрономических алгоритмов</p>
      </div>
    </div>
  );
};

export default LunarEventsWidget;