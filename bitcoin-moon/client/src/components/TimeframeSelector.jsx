import { useState } from 'react';

const TimeframeSelector = ({ timeframe, onTimeframeChange }) => {
  const [showMore, setShowMore] = useState(false);

  // Основные таймфреймы, которые показываются всегда
  const mainTimeframes = [
    { id: '1m', label: '1 мин' },
    { id: '1h', label: '1 час' },
    { id: '1d', label: '1 день' },
    { id: '1w', label: '1 неделя' },
  ];

  // Дополнительные таймфреймы, которые показываются при нажатии "Ещё"
  const additionalTimeframes = [
    { id: '3m', label: '3 мин' },
    { id: '5m', label: '5 мин' },
    { id: '15m', label: '15 мин' },
    { id: '30m', label: '30 мин' },
    { id: '4h', label: '4 часа' },
    { id: '12h', label: '12 часов' },
    { id: '1M', label: '1 месяц' },
    { id: '1y', label: '1 год' },
    { id: 'all', label: 'Всё время' },
  ];

  // Комбинированный список таймфреймов с сортировкой по возрастанию
  const getOrderValue = (id) => {
    const orderMap = {
      '1m': 1, '3m': 2, '5m': 3, '15m': 4, '30m': 5,
      '1h': 6, '4h': 7, '12h': 8, '1d': 9, '1w': 10,
      '1M': 11, '1y': 12, 'all': 13
    };
    return orderMap[id] || 100;
  };

  const allTimeframes = showMore
    ? [...mainTimeframes, ...additionalTimeframes]
    : mainTimeframes;

  // Сортируем таймфреймы по возрастанию
  const displayedTimeframes = [...allTimeframes].sort(
    (a, b) => getOrderValue(a.id) - getOrderValue(b.id)
  );

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex flex-wrap justify-center items-center gap-2">
        {displayedTimeframes.map((option) => (
          <button
            key={option.id}
            className={`px-3 py-1 text-sm rounded-lg transition-all ${
              timeframe === option.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            onClick={() => onTimeframeChange(option.id)}
          >
            {option.label}
          </button>
        ))}
        
        <button
          className="px-3 py-1 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Меньше' : 'Ещё'}
        </button>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {timeframe === '1m' ? 'Обновляется каждую минуту' :
          timeframe === '3m' ? 'Обновляется каждые 3 минуты' :
          timeframe === '5m' ? 'Обновляется каждые 5 минут' :
          timeframe === '15m' ? 'Обновляется каждые 15 минут' :
          timeframe === '30m' ? 'Обновляется каждые 30 минут' :
          timeframe === '1h' ? 'Обновляется каждый час' :
          timeframe === '4h' ? 'Обновляется каждые 4 часа' :
          timeframe === '12h' ? 'Обновляется каждые 12 часов' :
          timeframe === '1d' ? 'Обновляется каждый день' :
          timeframe === '1w' ? 'Обновляется каждую неделю' :
          timeframe === '1M' ? 'Обновляется каждый месяц' :
          timeframe === '1y' ? 'Обновляется каждый год' :
          timeframe === 'all' ? 'Исторические данные' :
          'Выберите таймфрейм для отображения данных'}
      </div>
    </div>
  );
};

export default TimeframeSelector;
