import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import EventsService from '../services/EventsService';

// Инициализируем русскую локализацию
dayjs.locale('ru');

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEconomicEvents = async () => {
      try {
        setLoading(true);
        // Используем EventsService для получения экономических событий
        const data = await EventsService.getEconomicEvents(10);
        
        if (data && data.length > 0) {
          setEvents(data);
          setError(null);
        } else {
          console.warn('Получен пустой массив экономических событий');
          setEvents([]);
        }
      } catch (err) {
        console.error('Ошибка при загрузке экономических событий:', err);
        setError('Не удалось загрузить экономические события');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEconomicEvents();
  }, []);

  const formatDate = (dateString) => {
    return dayjs(dateString).format('D MMMM YYYY');
  };

  const getEventIcon = (event) => {
    // Если у события есть иконка, используем её
    if (event.icon) {
      return event.icon;
    }
    
    // Иначе используем иконку по типу события
    switch (event.type) {
      case 'moon':
        return '🌙';
      case 'astro':
        return '✨';
      case 'economic':
        return '📊';
      case 'user':
        return '📌';
      default:
        return '📅';
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Предстоящие экономические события</h3>
        <div className="animate-pulse space-y-3">
          {Array(3)
            .fill(0)
            .map((_, index) => (
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

  if (error) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Предстоящие экономические события</h3>
        <div className="text-red-500 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Предстоящие экономические события</h3>

      {events.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Нет предстоящих экономических событий</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id || `economic-${event.date}`} className="flex items-start p-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-xl mr-3">{getEventIcon(event)}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-white">{event.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.date)}</p>
                {event.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
                )}
                {event.impact && (
                  <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                    event.impact === 'high' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                      : event.impact === 'medium' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {event.impact === 'high' 
                      ? 'Высокая важность' 
                      : event.impact === 'medium' 
                        ? 'Средняя важность' 
                        : 'Низкая важность'}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpcomingEvents;
