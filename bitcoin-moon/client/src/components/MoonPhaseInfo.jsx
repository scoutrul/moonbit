import React, { useEffect, useState } from 'react';
import AstroService from '../services/AstroService';

const MoonPhaseInfo = () => {
  const [moonPhase, setMoonPhase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загружаем информацию о текущей фазе луны
  useEffect(() => {
    const fetchMoonPhase = async () => {
      try {
        setIsLoading(true);
        const phaseInfo = await AstroService.getCurrentMoonPhase();
        
        if (phaseInfo) {
          setMoonPhase(phaseInfo);
          setError(null);
        } else {
          setError('Не удалось получить данные о фазе луны');
        }
      } catch (err) {
        console.error('Error fetching moon phase:', err);
        setError('Ошибка при получении данных о фазе луны');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoonPhase();

    // Обновляем данные каждые 12 часов
    const intervalId = setInterval(fetchMoonPhase, 12 * 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Форматирование даты следующей фазы
  const formatNextPhaseDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-2 text-gray-300">Загрузка данных о луне...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gray-800 rounded-lg shadow-md p-4">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!moonPhase) {
    return (
      <div className="w-full bg-gray-800 rounded-lg shadow-md p-4">
        <div className="text-gray-400">Нет данных о фазе луны</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center">
        <div className="text-4xl mr-4">{moonPhase.icon}</div>
        <div>
          <h2 className="text-xl font-bold text-white">Фаза Луны</h2>
          <div className="text-gray-300">{moonPhase.phaseName}</div>
          {moonPhase.nextPhaseTime && (
            <div className="text-gray-400 text-sm mt-1">
              {moonPhase.nextPhaseName}: {formatNextPhaseDate(moonPhase.nextPhaseTime)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoonPhaseInfo; 