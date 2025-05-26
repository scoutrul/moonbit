import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

// Инициализируем русскую локализацию
dayjs.locale('ru');

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        // Получаем данные о предстоящих событиях
        const [moonResponse, astroResponse, userEventsResponse] = await Promise.all([
          axios.get('/api/moon/phases'),
          axios.get('/api/astro/events'),
          axios.get('/api/events'),
        ]);

        // Объединяем все события
        const allEvents = [
          ...moonResponse.data.map((e) => ({ ...e, type: 'moon' })),
          ...astroResponse.data.map((e) => ({ ...e, type: 'astro' })),
          ...userEventsResponse.data.map((e) => ({ ...e, type: 'user' })),
        ];

        // Сортируем по дате
        const sortedEvents = allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Фильтруем только будущие события
        const futureEvents = sortedEvents.filter((e) => new Date(e.date) > new Date());

        // Берем только ближайшие 5 событий
        setEvents(futureEvents.slice(0, 5));

        setError(null);
      } catch (err) {
        console.error('Ошибка при получении событий:', err);
        setError('Не удалось загрузить данные о предстоящих событиях');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString) => {
    return dayjs(dateString).format('D MMMM YYYY');
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'moon':
        return '🌙';
      case 'astro':
        return '✨';
      case 'user':
        return '📌';
      default:
        return '📅';
    }
  };

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Предстоящие события</h3>
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
      <div>
        <h3 className="text-lg font-semibold mb-4">Предстоящие события</h3>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Предстоящие события</h3>

      {events.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Нет предстоящих событий</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-start">
              <span className="text-xl mr-3">{getEventIcon(event.type)}</span>
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.date)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
        Добавить событие
      </button>
    </div>
  );
};

export default UpcomingEvents;
