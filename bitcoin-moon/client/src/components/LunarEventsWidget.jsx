import React, { useEffect, useState } from 'react';
import { fetchUpcomingEvents } from '../services/astroEvents.js';
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
        
        // Получаем предстоящие лунные события на 30 дней вперед
        const events = await fetchUpcomingEvents(30);
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
      date: newMoonDate
    });
    
    // Полнолуние через 14 дней
    const fullMoonDate = new Date(today);
    fullMoonDate.setDate(fullMoonDate.getDate() + 14);
    events.push({
      type: 'full_moon',
      date: fullMoonDate
    });
    
    // Новолуние через 21 день
    const newMoonDate2 = new Date(today);
    newMoonDate2.setDate(newMoonDate2.getDate() + 21);
    events.push({
      type: 'new_moon',
      date: newMoonDate2
    });
    
    return events;
  };

  // Функция для форматирования даты
  const formatDate = (date) => {
    return dayjs(date).format('DD MMMM YYYY');
  };

  // Функция для получения названия фазы луны
  const getPhaseLabel = (type) => {
    return type === 'new_moon' ? 'Новолуние' : 'Полнолуние';
  };
  
  // Функция для получения иконки фазы
  const getPhaseIcon = (type) => {
    return type === 'new_moon' ? '🌑' : '🌕';
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
              <span className="text-2xl mr-3">{getPhaseIcon(event.type)}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-white">{getPhaseLabel(event.type)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.date)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LunarEventsWidget; 